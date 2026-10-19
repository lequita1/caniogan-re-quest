export const REQUEST_CATEGORIES = [
  { value: 'cleanup', label: 'Paglilinis' },
  { value: 'lostItem', label: 'Nawawalang gamit' },
  { value: 'errand', label: 'Pabili o pag-asikaso' },
  { value: 'other', label: 'Iba pa' },
];

export const REQUEST_STATUSES = {
  draft: 'Burador', submitted: 'Naisumite', needsChanges: 'May kailangang baguhin',
  rejected: 'Hindi naaprubahan', open: 'Bukas', cancelled: 'Kinansela',
};

export function validateRequest(input = {}) {
  const errors = {};
  for (const [key, min, max] of [['title', 5, 100], ['description', 20, 2000], ['areaLabel', 3, 120]]) {
    if (typeof input[key] !== 'string' || input[key].trim().length < min || input[key].trim().length > max) errors[key] = `Gumamit ng ${min} hanggang ${max} na character.`;
  }
  if (!REQUEST_CATEGORIES.some(({ value }) => value === input.category)) errors.category = 'Pumili ng uri ng kahilingan.';
  if (!['none', 'cash', 'gift', 'coupon'].includes(input.rewardType)) errors.rewardType = 'Pumili ng uri ng pabuya.';
  for (const [key, max] of [['meetingDetails', 300], ['rewardDetails', 200]]) {
    if (input[key] != null && (typeof input[key] !== 'string' || input[key].length > max)) errors[key] = `Gumamit ng hanggang ${max} na character.`;
  }
  if (input.rewardType && input.rewardType !== 'none' && !input.rewardDetails?.trim()) errors.rewardDetails = 'Ilagay ang detalye ng pabuya.';
  if (input.location != null && (!Number.isFinite(input.location.lat) || !Number.isFinite(input.location.lng) || Math.abs(input.location.lat) > 90 || Math.abs(input.location.lng) > 180)) errors.location = 'Pumili ng wastong lokasyon.';
  return errors;
}

export function toPublicRequest(record, publishedAt) {
  const result = { status: 'open', publishedAt };
  for (const key of ['ownerUid', 'title', 'category', 'description', 'areaLabel', 'rewardType', 'rewardDetails', 'images']) {
    if (record[key] != null && record[key] !== '') result[key] = record[key];
  }
  if (record.location) result.location = { latE3: Math.round(record.location.lat * 1000), lngE3: Math.round(record.location.lng * 1000) };
  return result;
}
