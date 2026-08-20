export type Season = "winter" | "spring" | "summer" | "autumn";

/** Meteorological season (Northern Hemisphere) for the given date. */
export function getSeason(date: Date = new Date()): Season {
	const month = date.getMonth(); // 0-11
	if (month === 11 || month <= 1) return "winter"; // Dec, Jan, Feb
	if (month <= 4) return "spring"; // Mar, Apr, May
	if (month <= 7) return "summer"; // Jun, Jul, Aug
	return "autumn"; // Sep, Oct, Nov
}

/**
 * Palette for the pixel-firework burst (gamification #1) — cycles through by
 * particle index so the burst is never a single flat color. Rotates
 * automatically with the calendar; swapping a season's colors is a one-line
 * change here, not a rebuild of the animation.
 */
const SEASON_PALETTES: Record<Season, string[]> = {
	summer: ["#ff2e63", "#ffea00", "#00e5ff", "#7cff00"],
	autumn: ["#ff7b25", "#c1121f", "#ffb703", "#6a4c93"],
	winter: ["#00b4d8", "#e0fbfc", "#7209b7", "#f8f9fa"],
	spring: ["#ff70a6", "#70d6ff", "#a4de02", "#ffd670"],
};

export function seasonalFireworkPalette(date: Date = new Date()): string[] {
	return SEASON_PALETTES[getSeason(date)];
}
