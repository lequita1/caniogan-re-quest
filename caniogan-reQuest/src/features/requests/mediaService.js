import { auth } from '../../lib/firebase';

function mediaError(code) {
  return Object.assign(new Error(code), { code });
}
function endpoint(path) {
  let url;
  try { url = new URL(import.meta.env.VITE_MEDIA_API_URL); }
  catch { throw mediaError('media_not_configured'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password ||
      (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' && !local)) {
    throw mediaError('media_not_configured');
  }
  return new URL(path, url).href;
}
function imagePath(requestId, imageId) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(requestId) ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(imageId)) {
    throw mediaError('image_not_found');
  }
  return `/v1/request-images/${requestId}/${imageId}`;
}
async function call(path, { method = 'GET', body, signal } = {}) {
  const url = endpoint(path);
  const user = auth.currentUser;
  if (!user) throw mediaError('sign_in_required');
  const token = await user.getIdToken();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (auth.currentUser !== user) throw mediaError('sign_in_required');
  let response;
  try {
    response = await fetch(url, { method, body, signal, cache: 'no-store', credentials: 'omit',
      redirect: 'error', headers: { Authorization: `Bearer ${token}` } });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw mediaError('media_unavailable');
  }
  if (auth.currentUser !== user) throw mediaError('sign_in_required');
  if (!response.ok) {
    let data;
    try { data = await response.json(); } catch { /* Safe fallback for non-JSON upstream failures. */ }
    throw mediaError(typeof data?.error === 'string' ? data.error : 'media_unavailable');
  }
  return { response, user };
}
export async function uploadRequestImage(requestId, file, { signal, imageId } = {}) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(requestId)) throw mediaError('request_not_editable');
  if (typeof imageId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(imageId)) {
    throw mediaError('image_upload_not_reserved');
  }
  if (!(file instanceof Blob) || !file.size) throw mediaError('image_required');
  if (file.size > 5 * 1024 * 1024) throw mediaError('image_too_large');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw mediaError('unsupported_image');
  const body = new FormData();
  body.set('requestId', requestId);
  body.set('imageId', imageId);
  body.set('file', file, 'image');
  const { response, user } = await call('/v1/request-images', { method: 'POST', body, signal });
  const data = await response.json();
  if (auth.currentUser !== user) throw mediaError('sign_in_required');
  return data;
}
export async function deleteRequestImage(requestId, imageId, { signal } = {}) {
  const { response } = await call(imagePath(requestId, imageId), { method: 'DELETE', signal });
  return response.json();
}
export async function getRequestImageBlob(requestId, imageId, { signal } = {}) {
  const { response, user } = await call(imagePath(requestId, imageId), { signal });
  const blob = await response.blob();
  if (auth.currentUser !== user) throw mediaError('sign_in_required');
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(blob.type)) throw mediaError('image_read_failed');
  return blob;
}
export function mediaErrorMessage(error) {
  switch (error?.code) {
    case 'media_not_configured': case 'uploads_not_configured': return 'Hindi pa available ang mga larawan. Subukan muli mamaya.';
    case 'sign_in_required': case 'authentication_failed': return 'Mag-sign in muli para makita ang mga larawan.';
    case 'image_too_large': return 'Hanggang 5 MB lamang ang bawat larawan.';
    case 'unsupported_image': return 'Pumili ng JPEG, PNG, o WebP na larawan.';
    case 'image_limit_reached': return 'Hanggang tatlong larawan lamang ang bawat kahilingan.';
    case 'image_upload_not_reserved': case 'image_deletion_not_reserved':
      return 'Nagbago na ang kahilingan. Buksan muli ito bago magpatuloy.';
    case 'request_not_editable': return 'Hindi na maaaring baguhin ang mga larawan ng kahilingang ito.';
    case 'image_delete_failed': return 'Hindi nabura ang larawan. Subukan muli bago magpatuloy.';
    case 'too_many_uploads': return 'Masyadong maraming pagsubok. Maghintay ng isang minuto at subukan muli.';
    case 'image_not_found': return 'Hindi makita ang larawang ito.';
    case 'approved_resident_required': case 'request_access_failed': case 'account_access_failed': case 'email_verification_required':
      return 'Wala kang pahintulot na gamitin ang larawang ito.';
    default: return 'Hindi makuha ang larawan. Tingnan ang koneksiyon at subukan muli.';
  }
}
