import { useCallback, useEffect, useRef, useState } from "react";
import { haversineMeters, MIN_MOVEMENT_METERS } from "@/lib/geo";

export type TrackerStatus = "idle" | "tracking" | "paused" | "unsupported" | "denied" | "error";

const WATCH_OPTS: PositionOptions = { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 };

/**
 * GPS stopwatch (tracking tier A — see PLAN.md): accumulates distance via
 * Haversine between accepted fixes, jitter-filtered by `MIN_MOVEMENT_METERS`,
 * with a 1s timer running alongside. No map, no stored path, no persistence —
 * this is purely a live in-memory session that hands a final distance off to
 * the caller.
 */
export function useGpsTracker() {
	const [status, setStatus] = useState<TrackerStatus>("idle");
	const [distanceMeters, setDistanceMeters] = useState(0);
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const watchIdRef = useRef<number | null>(null);
	const lastFixRef = useRef<{ lat: number; lon: number } | null>(null);
	const timerRef = useRef<number | null>(null);

	const stopWatching = useCallback(() => {
		if (watchIdRef.current !== null) {
			navigator.geolocation.clearWatch(watchIdRef.current);
			watchIdRef.current = null;
		}
		if (timerRef.current !== null) {
			window.clearInterval(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	// Shared by start() and resume() — resets the jitter baseline (not the
	// accumulated distance/time) so a pause doesn't add distance for however
	// far you walked while paused.
	const beginWatching = useCallback(() => {
		lastFixRef.current = null;
		watchIdRef.current = navigator.geolocation.watchPosition(
			(pos) => {
				const { latitude, longitude } = pos.coords;
				const last = lastFixRef.current;
				if (!last) {
					lastFixRef.current = { lat: latitude, lon: longitude };
					return;
				}
				const moved = haversineMeters(last.lat, last.lon, latitude, longitude);
				if (moved >= MIN_MOVEMENT_METERS) {
					setDistanceMeters((d) => d + moved);
					lastFixRef.current = { lat: latitude, lon: longitude };
				}
			},
			(err) => {
				stopWatching();
				if (err.code === err.PERMISSION_DENIED) {
					setStatus("denied");
				} else {
					setStatus("error");
					setErrorMessage(err.message);
				}
			},
			WATCH_OPTS,
		);
		timerRef.current = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
	}, [stopWatching]);

	const start = useCallback(() => {
		if (!("geolocation" in navigator)) {
			setStatus("unsupported");
			return;
		}
		setErrorMessage(null);
		setDistanceMeters(0);
		setElapsedSeconds(0);
		beginWatching();
		setStatus("tracking");
	}, [beginWatching]);

	const pause = useCallback(() => {
		stopWatching();
		setStatus("paused");
	}, [stopWatching]);

	const resume = useCallback(() => {
		beginWatching();
		setStatus("tracking");
	}, [beginWatching]);

	const reset = useCallback(() => {
		stopWatching();
		setDistanceMeters(0);
		setElapsedSeconds(0);
		setErrorMessage(null);
		setStatus("idle");
	}, [stopWatching]);

	// Release the GPS lock and timer if the component unmounts mid-session
	// (e.g. the user navigates away without hitting Stop).
	useEffect(() => stopWatching, [stopWatching]);

	return {
		status,
		distanceKm: distanceMeters / 1000,
		elapsedSeconds,
		errorMessage,
		start,
		pause,
		resume,
		reset,
	};
}
