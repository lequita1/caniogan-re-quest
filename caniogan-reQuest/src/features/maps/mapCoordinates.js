export const MALOLOS_CENTER = [14.8433, 120.8114];

export function validPoint(point) {
  return (
    !!point &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lng) <= 180
  );
}

// Public maps deliberately reject the private location schema.
export function boardPoint(item) {
  const location = item?.location;
  if (!Number.isInteger(location?.latE3) || !Number.isInteger(location?.lngE3))
    return null;
  const point = { lat: location.latE3 / 1000, lng: location.lngE3 / 1000 };
  return validPoint(point) ? point : null;
}
