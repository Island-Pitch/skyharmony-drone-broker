/** Known venue locations with lat/lng and Haversine distance calculation. */

export interface Location {
  name: string;
  lat: number;
  lng: number;
}

export const KNOWN_LOCATIONS: Location[] = [
  { name: 'Los Angeles', lat: 34.05, lng: -118.24 },
  { name: 'San Diego', lat: 32.72, lng: -117.16 },
  { name: 'Las Vegas', lat: 36.17, lng: -115.14 },
  { name: 'Phoenix', lat: 33.45, lng: -112.07 },
  { name: 'San Francisco', lat: 37.77, lng: -122.42 },
  { name: 'Scottsdale', lat: 33.49, lng: -111.93 },
  { name: 'Anaheim', lat: 33.84, lng: -117.91 },
  { name: 'Sacramento', lat: 38.58, lng: -121.49 },
  { name: 'Long Beach', lat: 33.77, lng: -118.19 },
  { name: 'Seal Beach', lat: 33.74, lng: -118.10 },
];

const LOCATION_MAP = new Map(KNOWN_LOCATIONS.map((l) => [l.name.toLowerCase(), l]));

/** Look up a location by name (case-insensitive). */
export function findLocation(name: string): Location | undefined {
  return LOCATION_MAP.get(name.toLowerCase());
}

/** Earth radius in miles. */
const EARTH_RADIUS_MILES = 3958.8;

/** Convert degrees to radians. */
function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate Haversine distance between two lat/lng points.
 * Returns distance in miles.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

/** Calculate distance between two named locations. Returns null if either is unknown. */
export function distanceBetween(from: string, to: string): number | null {
  const a = findLocation(from);
  const b = findLocation(to);
  if (!a || !b) return null;
  return haversineDistance(a.lat, a.lng, b.lat, b.lng);
}
