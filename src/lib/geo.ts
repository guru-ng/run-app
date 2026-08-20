const EARTH_RADIUS_M = 6371000;

function toRad(deg: number) {
	return (deg * Math.PI) / 180;
}

/** Great-circle distance between two lat/lon points, in meters. */
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return EARTH_RADIUS_M * c;
}

/**
 * Raw GPS fixes drift even standing still. Two consecutive fixes closer
 * together than this are treated as jitter, not movement, and dropped
 * instead of accumulated — see KNOWLEDGE.md "GPS tracking (tier A)".
 */
export const MIN_MOVEMENT_METERS = 8;
