import { equalTo, get, limitToFirst, limitToLast, onValue, orderByChild, push, query, ref, runTransaction, serverTimestamp, set, update } from 'firebase/database';
import { auth, database } from '../../lib/firebase';
import { toPublicRequest, validateRequest } from './requestModel';

function currentUid() {
  if (!auth.currentUser) throw new Error('auth/required');
  return auth.currentUser.uid;
}

function requestRef(id) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error('requests/invalid-id');
  return ref(database, `requests/${id}`);
}

async function loadRequest(id, owned = false) {
  const uid = currentUid();
  const snapshot = await get(requestRef(id));
  if (!snapshot.exists()) throw new Error('requests/not-found');
  const record = snapshot.val();
  if (owned && record.ownerUid !== uid) throw new Error('requests/not-owner');
  return record;
}

function editableInput(input) {
  const errors = validateRequest(input);
  if (Object.keys(errors).length) throw Object.assign(new Error('requests/invalid-input'), { fields: errors });
  const result = {};
  for (const key of ['title', 'category', 'description', 'areaLabel', 'rewardType']) result[key] = input[key].trim();
  if (input.photoVisibility != null) result.photoVisibility = input.photoVisibility;
  for (const key of ['meetingDetails', 'rewardDetails']) result[key] = input[key]?.trim() || null;
  result.location = input.location ? { lat: input.location.lat, lng: input.location.lng } : null;
  return result;
}

function requireEditable(record) {
  if (!['draft', 'needsChanges'].includes(record.status)) throw new Error('requests/not-editable');
}

export async function createRequestDraft(input) {
  const ownerUid = currentUid();
  const target = push(ref(database, 'requests'));
  const values = editableInput(input);
  // set() omits empty optional values, while save uses null to remove old values.
  await set(target, { ...values, ownerUid, status: 'draft', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return target.key;
}

export async function saveRequestDraft(id, input) {
  const record = await loadRequest(id, true);
  requireEditable(record);
  await update(requestRef(id), { ...editableInput(input), updatedAt: serverTimestamp() });
}

export async function submitRequest(id) {
  const record = await loadRequest(id, true);
  requireEditable(record);
  if (record.pendingImageDeletion) throw new Error('requests/image-deletion-pending');
  if (record.pendingImageUpload) throw new Error('requests/image-upload-pending');
  editableInput(record);
  await update(requestRef(id), { status: 'submitted', updatedAt: serverTimestamp() });
}

export async function cancelRequest(id) {
  const record = await loadRequest(id, true);
  if (record.status !== 'open') throw new Error('requests/not-open');
  const assignment = (await get(ref(database, `requestAssignments/${id}`))).val();
  const changes = { [`requests/${id}/status`]: 'cancelled', [`requests/${id}/updatedAt`]: serverTimestamp(), [`requestBoard/${id}`]: null };
  if (assignment && ['offered', 'inProgress'].includes(assignment.state)) Object.assign(changes, {
    [`requestAssignments/${id}/state`]: 'cancelled', [`requestAssignments/${id}/updatedAt`]: serverTimestamp(),
    [`requestAssignments/${id}/actorUid`]: currentUid(), [`activeVolunteers/${assignment.volunteerUid}`]: null,
    [`volunteerApplications/${id}/${assignment.volunteerUid}/status`]: 'cancelled',
    [`volunteerApplications/${id}/${assignment.volunteerUid}/updatedAt`]: serverTimestamp(),
  });
  await update(ref(database), changes);
}

export async function deleteRequestDraft(id) {
  const record = await loadRequest(id, true);
  if (record.status !== 'draft' || Object.keys(record.images || {}).length || record.pendingImageDeletion || record.pendingImageUpload) throw new Error('requests/delete-photos-first');
  await set(requestRef(id), null);
}

function imagePath(id, imageId) {
  requestRef(id);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(imageId)) throw new Error('requests/invalid-image-id');
  return `requests/${id}/images/${imageId}`;
}

export async function addRequestImage(id, imageId, metadata) {
  imagePath(id, imageId);
  const clean = {};
  for (const key of ['publicId', 'format', 'version', 'width', 'height', 'bytes']) clean[key] = metadata[key];
  await changeImages(id, imageId, clean);
}

export async function beginRequestImageUpload(id) {
  const record = await loadRequest(id, true);
  requireEditable(record);
  if (record.pendingImageUpload) throw new Error('requests/image-upload-pending');
  if (record.pendingImageDeletion) throw new Error('requests/image-deletion-pending');
  if (Object.keys(record.images || {}).length >= 3) throw new Error('requests/too-many-images');
  const imageId = crypto.randomUUID();
  await update(requestRef(id), { pendingImageUpload: imageId, updatedAt: serverTimestamp() });
  return imageId;
}

export async function removeRequestImage(id, imageId) {
  imagePath(id, imageId);
  await changeImages(id, imageId, null);
}

async function changeImages(id, imageId, metadata) {
  const record = await loadRequest(id, true);
  requireEditable(record);
  if (metadata && record.pendingImageUpload !== imageId) throw new Error('requests/image-upload-not-reserved');
  if (!metadata && record.pendingImageUpload && record.pendingImageUpload !== imageId) throw new Error('requests/image-upload-pending');
  if (metadata && record.removedImages?.[imageId]) throw new Error('requests/image-removed');
  if (!metadata && record.pendingImageDeletion && record.pendingImageDeletion !== imageId) throw new Error('requests/image-deletion-pending');
  const ids = Object.keys(record.images || {}).filter(key => key !== imageId);
  if (metadata) ids.push(imageId);
  if (ids.length > 3) throw new Error('requests/too-many-images');
  const changes = { [`images/${imageId}`]: metadata, imageIds: ids.length ? ids : null, updatedAt: serverTimestamp() };
  if (!metadata) {
    changes[`removedImages/${imageId}`] = true;
    changes.pendingImageDeletion = imageId;
  }
  if (metadata || record.pendingImageUpload === imageId) changes.pendingImageUpload = null;
  // Leaf writes preserve concurrent photos; rules reject a stale manifest.
  await update(requestRef(id), changes);
}

export async function completeRequestImageDeletion(id, imageId) {
  imagePath(id, imageId);
  const uid = currentUid();
  const target = requestRef(id);
  let stop;
  try {
    // Retain a listener: get() alone discards the cache before a transaction starts.
    const record = await new Promise((resolve, reject) => {
      stop = onValue(target, snapshot => resolve(snapshot.val()), reject);
    });
    if (!record || record.ownerUid !== uid) throw new Error('requests/not-owner');
    requireEditable(record);
    const result = await runTransaction(ref(database, `requests/${id}/pendingImageDeletion`), value => value === imageId ? null : undefined, { applyLocally: false });
    if (!result.committed) throw new Error('requests/changed');
  } finally {
    stop?.();
  }
}

export async function reviewRequest(id, { decision, reason, expectedUpdatedAt }) {
  const record = await loadRequest(id);
  if (record.status !== 'submitted') throw new Error('requests/already-reviewed');
  if (!Number.isFinite(expectedUpdatedAt) || expectedUpdatedAt !== record.updatedAt) throw new Error('requests/changed');
  if (!['open', 'needsChanges', 'rejected'].includes(decision) || typeof reason !== 'string' || reason.trim().length < 10 || reason.trim().length > 500) throw new Error('requests/invalid-review');
  const review = { decision, reason: reason.trim(), reviewerUid: currentUid(), reviewedAt: serverTimestamp(), sourceUpdatedAt: expectedUpdatedAt };
  const changes = { [`requests/${id}/status`]: decision, [`requests/${id}/review`]: review, [`requests/${id}/updatedAt`]: serverTimestamp() };
  if (decision === 'open') changes[`requestBoard/${id}`] = toPublicRequest(record, serverTimestamp());
  // Rules check the current submitted state and the entire matching projection atomically.
  await update(ref(database), changes);
}

function subscribe(target, onData, onError, list = false) {
  return onValue(target, snapshot => {
    if (!list) return onData(snapshot.exists() ? { ...snapshot.val(), id: snapshot.key } : null);
    const items = [];
    snapshot.forEach(child => { items.push({ ...child.val(), id: child.key }); });
    onData(items.sort((a, b) => (b.publishedAt || b.updatedAt || 0) - (a.publishedAt || a.updatedAt || 0)));
  }, onError);
}

export function subscribeOwnRequests(uid, onData, onError) {
  if (uid !== currentUid()) throw new Error('requests/not-owner');
  return subscribe(query(ref(database, 'requests'), orderByChild('ownerUid'), equalTo(uid), limitToLast(50)), onData, onError, true);
}
export const subscribeRequest = (id, onData, onError) => subscribe(requestRef(id), onData, onError);
export const subscribeBoard = (onData, onError) => subscribe(query(ref(database, 'requestBoard'), orderByChild('publishedAt'), limitToLast(100)), onData, onError, true);
export const subscribeBoardRequest = (id, onData, onError) => {
  requestRef(id);
  return subscribe(ref(database, `requestBoard/${id}`), onData, onError);
};
export const subscribeRequestQueue = (onData, onError) => subscribe(query(ref(database, 'requests'), orderByChild('status'), equalTo('submitted'), limitToFirst(50)), onData, onError, true);
