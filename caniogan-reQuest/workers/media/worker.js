// This file runs on Cloudflare, never inside the React bundle.
const PROJECT = 'caniogan-request';
const DATABASE = 'https://caniogan-request-default-rtdb.asia-southeast1.firebasedatabase.app';
const CLOUD = 'b2n0ms1f';
const PRESET = 'caniogan_request_images';
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_BODY_BYTES = MAX_FILE_BYTES + 64 * 1024;

class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
  }
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      Vary: 'Origin',
      ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
      ...(status === 429 ? { 'Retry-After': '60' } : {}),
    },
  });
}

async function upstream(fetcher, url, options) {
  // Workers does not implement redirect:'error'; reject manual redirects explicitly.
  const response = await fetcher(url, { ...options, redirect: 'manual', signal: AbortSignal.timeout(20000) });
  if (response.status >= 300 && response.status < 400) throw new HttpError(502, 'upstream_redirect_rejected');
  return response;
}

async function identity(token, env, fetcher) {
  // Google validates the ID token; decoding alone never establishes identity.
  const response = await upstream(fetcher,
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_WEB_API_KEY)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }) });
  if (!response.ok) throw new HttpError(response.status >= 500 ? 502 : 401, 'authentication_failed');
  const user = (await response.json()).users?.[0];
  if (!user || user.disabled || !/^[A-Za-z0-9_-]{1,128}$/.test(user.localId)) {
    throw new HttpError(401, 'authentication_failed');
  }
  let claims;
  try {
    const payload = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
    claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
  } catch {
    throw new HttpError(401, 'authentication_failed');
  }
  const now = Math.floor(Date.now() / 1000);
  if (claims.sub !== user.localId || claims.aud !== PROJECT ||
      claims.iss !== `https://securetoken.google.com/${PROJECT}` ||
      !Number.isFinite(claims.exp) || claims.exp <= now ||
      !Number.isFinite(claims.auth_time) || claims.auth_time > now ||
      claims.auth_time < Number(user.validSince || 0)) {
    throw new HttpError(401, 'authentication_failed');
  }
  if (user.emailVerified !== true || claims.email_verified !== true) {
    throw new HttpError(403, 'email_verification_required');
  }
  return user.localId;
}

async function authorize(uid, token, fetcher) {
  // Same user token and published rules; no service account or rules bypass.
  // Never log this URL: Firebase's documented REST auth parameter contains a token.
  const response = await upstream(fetcher,
    `${DATABASE}/accounts/${encodeURIComponent(uid)}.json?auth=${encodeURIComponent(token)}`);
  if (!response.ok) throw new HttpError(response.status >= 500 ? 502 : 403, 'account_access_failed');
  const account = await response.json();
  if (account?.standing !== 'active' || !(isResident(account) || isReviewer(account))) {
    throw new HttpError(403, 'approved_resident_required');
  }
  return account;
}

function isResident(account) {
  return account?.role === 'resident' && account.verification?.status === 'approved';
}
function isReviewer(account) {
  return account?.role === 'staff' && account.capabilities?.reviewRequests === true;
}
const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;
const IMAGE_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
async function recordAt(path, token, fetcher, optional = false) {
  const response = await upstream(fetcher, `${DATABASE}/${path}.json?auth=${encodeURIComponent(token)}`);
  if (optional && response.status === 403) return null;
  if (!response.ok) throw new HttpError(response.status >= 500 ? 502 : 403, 'request_access_failed');
  return response.json();
}
function mutableParent(parent, uid, account) {
  if (!isResident(account) || !parent || parent.ownerUid !== uid || !['draft', 'needsChanges'].includes(parent.status)) {
    throw new HttpError(403, 'request_not_editable');
  }
}
function assetPath(uid, requestId, imageId) {
  return `requests/${uid}/${requestId}/${imageId}`;
}
async function signature(parameters, secret) {
  const canonical = Object.keys(parameters).sort().map(key => `${key}=${parameters[key]}`).join('&');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical + secret));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
async function signedBody(parameters, env) {
  const body = new FormData();
  for (const [key, value] of Object.entries(parameters)) body.set(key, value);
  body.set('api_key', env.CLOUDINARY_API_KEY);
  body.set('signature', await signature(parameters, env.CLOUDINARY_API_SECRET));
  return body;
}

async function imageFile(request) {
  if (!request.headers.get('Content-Type')?.startsWith('multipart/form-data;')) {
    throw new HttpError(415, 'multipart_image_required');
  }
  if (Number(request.headers.get('Content-Length')) > MAX_BODY_BYTES) {
    throw new HttpError(413, 'image_too_large');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'image_required');
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new HttpError(413, 'image_too_large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let form;
  try {
    form = await new Response(new Blob(chunks), { headers: { 'Content-Type': request.headers.get('Content-Type') } }).formData();
  } catch {
    throw new HttpError(400, 'invalid_upload');
  }
  const entries = [...form.entries()];
  const file = form.get('file');
  if (entries.length !== 3 || form.getAll('file').length !== 1 || form.getAll('requestId').length !== 1 ||
      form.getAll('imageId').length !== 1 || !IMAGE_ID.test(form.get('imageId')) ||
      !SAFE_ID.test(form.get('requestId')) || !(file instanceof Blob) || !file.size) {
    throw new HttpError(400, 'one_image_required');
  }
  if (file.size > MAX_FILE_BYTES) throw new HttpError(413, 'image_too_large');
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = [137,80,78,71,13,10,26,10].every((byte, i) => head[i] === byte);
  const jpg = head[0] === 255 && head[1] === 216 && head[2] === 255;
  const webp = String.fromCharCode(...head.slice(0,4)) === 'RIFF' && String.fromCharCode(...head.slice(8,12)) === 'WEBP';
  if (!(png && file.type === 'image/png') && !(jpg && file.type === 'image/jpeg') && !(webp && file.type === 'image/webp')) {
    throw new HttpError(415, 'unsupported_image');
  }
  // Cloudinary must also successfully decode the image; magic bytes alone are insufficient.
  return { file, requestId: form.get('requestId'), imageId: form.get('imageId') };
}

async function upload(file, uid, requestId, imageId, env, fetcher) {
  const parameters = {
    allowed_formats: 'jpg,png,webp',
    overwrite: 'false',
    public_id: assetPath(uid, requestId, imageId),
    timestamp: String(Math.floor(Date.now() / 1000)),
    type: 'authenticated',
    transformation: 'fl_force_strip',
    upload_preset: PRESET,
  };
  const body = await signedBody(parameters, env);
  // Discard the original filename, which can contain personal information.
  body.set('file', file, 'image');
  const response = await upstream(fetcher, `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body });
  if (!response.ok) throw new HttpError(502, 'image_upload_failed');
  const asset = await response.json();
  if (asset.public_id !== parameters.public_id || asset.type !== 'authenticated' ||
      asset.resource_type !== 'image' || !['jpg','png','webp'].includes(asset.format) ||
      !['bytes', 'width', 'height', 'version'].every(key => Number.isSafeInteger(asset[key]) && asset[key] > 0) || asset.bytes > MAX_FILE_BYTES) {
    throw new HttpError(502, 'invalid_upload_response');
  }
  // No public URL, API signature or secret is returned. Attachment/retrieval is a separate workflow.
  return { imageId, publicId: asset.public_id,
    format: asset.format, bytes: asset.bytes, width: asset.width, height: asset.height, version: asset.version };
}

async function readImage(parent, requestId, imageId, env, fetcher, origin) {
  const image = parent?.images?.[imageId];
  if (!parent || typeof parent.ownerUid !== 'string' || !SAFE_ID.test(parent.ownerUid) || !image ||
      image.publicId !== assetPath(parent.ownerUid, requestId, imageId) || !['jpg', 'png', 'webp'].includes(image.format)) {
    throw new HttpError(404, 'image_not_found');
  }
  // Matches Cloudinary SDK private_download_url, using the signed download API.
  const now = Math.floor(Date.now() / 1000);
  const parameters = { timestamp: String(now), public_id: image.publicId, format: image.format,
    type: 'authenticated', expires_at: String(now + 60) };
  const query = new URLSearchParams({ ...parameters, api_key: env.CLOUDINARY_API_KEY,
    signature: await signature(parameters, env.CLOUDINARY_API_SECRET) });
  const response = await upstream(fetcher, `https://api.cloudinary.com/v1_1/${CLOUD}/image/download?${query}`);
  if (!response.ok) throw new HttpError(response.status === 404 ? 404 : 502, 'image_read_failed');
  if (response.headers.get('Content-Type')?.split(';')[0] !== `image/${image.format === 'jpg' ? 'jpeg' : image.format}`) {
    throw new HttpError(502, 'invalid_image_response');
  }
  return new Response(response.body, { headers: {
    'Content-Type': `image/${image.format === 'jpg' ? 'jpeg' : image.format}`,
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': origin, Vary: 'Origin',
  } });
}
async function deleteImage(uid, requestId, imageId, env, fetcher) {
  // Derive the exact owner path even when attaching its metadata failed.
  const body = await signedBody({ public_id: assetPath(uid, requestId, imageId), type: 'authenticated',
    invalidate: 'true', timestamp: String(Math.floor(Date.now() / 1000)) }, env);
  const response = await upstream(fetcher, `https://api.cloudinary.com/v1_1/${CLOUD}/image/destroy`, { method: 'POST', body });
  if (!response.ok || !['ok', 'not found'].includes((await response.json()).result)) {
    throw new HttpError(502, 'image_delete_failed');
  }
  return { deleted: true };
}
export default {
  async fetch(request, env, _ctx, fetcher = fetch) {
    const path = new URL(request.url).pathname;
    if (path === '/health' && request.method === 'GET') return json({ status: 'ok', service: 'caniogan-request-media' }, 200);
    const route = /^\/v1\/request-images\/([A-Za-z0-9_-]{1,128})\/([a-f0-9-]{36})$/.exec(path);
    const collection = path === '/v1/request-images';
    if (!collection && (!route || !IMAGE_ID.test(route[2]))) return json({ error: 'not_found' }, 404);
    const methods = collection ? ['POST'] : ['GET', 'DELETE'];
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
    if (!origin || origin === 'null' || !allowed.includes(origin)) return json({ error: 'origin_not_allowed' }, 403);
    if (request.method === 'OPTIONS') {
      const headers = (request.headers.get('Access-Control-Request-Headers') || '').toLowerCase().split(',').map(value => value.trim()).filter(Boolean);
      if (!methods.includes(request.headers.get('Access-Control-Request-Method')) || headers.some(value => !['authorization','content-type'].includes(value))) {
        return json({ error: 'preflight_not_allowed' }, 403, origin);
      }
      return new Response(null, { status: 204, headers: {
        'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': methods.join(', '),
        'Access-Control-Allow-Headers': 'Authorization, Content-Type', Vary: 'Origin', 'Cache-Control': 'no-store',
      } });
    }
    if (!methods.includes(request.method)) return json({ error: 'method_not_allowed' }, 405, origin);
    const match = /^Bearer ([A-Za-z0-9_.-]{1,8192})$/.exec(request.headers.get('Authorization') || '');
    if (!match) return json({ error: 'sign_in_required' }, 401, origin);
    const limiter = collection ? env.UPLOAD_LIMITER : env.MEDIA_LIMITER;
    if (!env.FIREBASE_WEB_API_KEY || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET || !limiter?.limit) {
      return json({ error: collection ? 'uploads_not_configured' : 'media_not_configured' }, 503, origin);
    }
    let stage = 'rate-limit';
    try {
      // Separate method buckets keep browsing from exhausting uploads or cleanup.
      const attempt = await limiter.limit({ key: `attempt:${request.method}:${request.headers.get('CF-Connecting-IP') || 'unknown'}` });
      if (!attempt.success) throw new HttpError(429, 'too_many_uploads');
      stage = 'authentication';
      const uid = await identity(match[1], env, fetcher);
      stage = 'account';
      const account = await authorize(uid, match[1], fetcher);
      if (!(await limiter.limit({ key: `resident:${request.method}:${uid}` })).success) throw new HttpError(429, 'too_many_uploads');
      if (collection) {
        if (!isResident(account)) throw new HttpError(403, 'approved_resident_required');
        stage = 'image-validation';
        const { file, requestId, imageId } = await imageFile(request);
        stage = 'parent';
        const parent = await recordAt(`requests/${requestId}`, match[1], fetcher);
        mutableParent(parent, uid, account);
        if (Object.keys(parent.images || {}).length >= 3) throw new HttpError(403, 'image_limit_reached');
        if (parent.pendingImageUpload !== imageId || parent.pendingImageDeletion != null ||
            parent.images?.[imageId] != null || parent.removedImages?.[imageId] != null) {
          throw new HttpError(403, 'image_upload_not_reserved');
        }
        stage = 'cloudinary';
        return json(await upload(file, uid, requestId, imageId, env, fetcher), 201, origin);
      }
      const [, requestId, imageId] = route;
      stage = 'parent';
      if (request.method === 'DELETE') {
        const parent = await recordAt(`requests/${requestId}`, match[1], fetcher);
        mutableParent(parent, uid, account);
        // Rules reserve cleanup before deletion, blocking submission and reattachment races.
        if (parent.pendingImageDeletion !== imageId || parent.removedImages?.[imageId] !== true ||
            parent.images?.[imageId] != null) throw new HttpError(403, 'image_deletion_not_reserved');
        stage = 'cloudinary';
        return json(await deleteImage(uid, requestId, imageId, env, fetcher), 200, origin);
      }
      let parent = await recordAt(`requests/${requestId}`, match[1], fetcher, true);
      if (parent && parent.ownerUid !== uid && !isReviewer(account)) parent = null;
      if (!parent) {
        parent = await recordAt(`requestBoard/${requestId}`, match[1], fetcher);
        if (parent?.status !== 'open') throw new HttpError(404, 'image_not_found');
      }
      stage = 'cloudinary';
      return await readImage(parent, requestId, imageId, env, fetcher, origin);
    } catch (error) {
      const kind = error instanceof TypeError && error.message.startsWith('Illegal invocation') ? 'illegal_invocation' : 'runtime_error';
      if (!(error instanceof HttpError)) console.error({ code: 'media_worker_error', stage, kind });
      return json({ error: error instanceof HttpError ? error.message : 'upload_service_unavailable' }, error instanceof HttpError ? error.status : 502, origin);
    }
  },
};
