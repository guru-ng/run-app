import type { DayAvailability, Run } from "@/lib/types";
import { addDaysIso, shortDateLabel, startOfWeekIso, todayIso } from "@/lib/dates";
import SwipeStack from "@/components/SwipeStack";

function thisWeekStats(runs: Run[] | null) {
	const start = startOfWeekIso();
	const weekRuns = (runs ?? []).filter((r) => r.run_date >= start);
	const totalKm = weekRuns.reduce((sum, r) => sum + r.distance_km, 0);
	return { totalKm, count: weekRuns.length };
}

function last7Days(runs: Run[] | null) {
	const today = todayIso();
	return Array.from({ length: 7 }, (_, i) => {
		const iso = addDaysIso(today, i - 6);
		const totalKm = (runs ?? [])
			.filter((r) => r.run_date === iso)
			.reduce((sum, r) => sum + r.distance_km, 0);
		return { iso, totalKm };
	});
}

export default function InsightsDeck({
	userId,
	runs,
	allPlans,
}: {
	userId: string;
	runs: Run[] | null;
	allPlans: DayAvailability[] | null;
}) {
	const week = thisWeekStats(runs);
	const trend = last7Days(runs);
	const maxKm = Math.max(1, ...trend.map((d) => d.totalKm));

	const today = todayIso();
	const nextPlan = (allPlans ?? [])
		.filter((p) => p.user_id === userId && p.planned_date >= today)
		.sort((a, b) => a.planned_date.localeCompare(b.planned_date))[0];

	return (
		<SwipeStack loop showDots>
			<div className="panel deck-card" key="this-week">
				<span className="deck-card-label">This Week</span>
				<span className="deck-card-metric">{week.totalKm.toFixed(1)} km</span>
				<span className="muted">
					{week.count} {week.count === 1 ? "run" : "runs"} logged
				</span>
			</div>

			<div className="panel deck-card" key="availability-preview">
				<span className="deck-card-label">Availability</span>
				{nextPlan ? (
					<>
						<span className="deck-card-metric" style={{ fontSize: "1.4rem" }}>
							{shortDateLabel(nextPlan.planned_date)}
						</span>
						<span className="muted">
							{nextPlan.time_of_day}, {nextPlan.run_type}
						</span>
					</>
				) : (
					<span className="muted">No runs scheduled — plan one in the Schedule tab.</span>
				)}
			</div>

			<div className="panel deck-card" key="distance-trend">
				<span className="deck-card-label">Distance Trend</span>
				<svg
					viewBox="0 0 140 40"
					width="100%"
					height="40"
					role="img"
					aria-label={`7-day distance trend: ${trend
						.map((d) => `${d.totalKm.toFixed(1)} km`)
						.join(", ")}`}
				>
					{trend.map((d, i) => {
						const barWidth = 14;
						const gap = 6;
						const x = i * (barWidth + gap);
						const h = Math.max(2, (d.totalKm / maxKm) * 34);
						return (
							<rect
								key={d.iso}
								x={x}
								y={40 - h}
								width={barWidth}
								height={h}
								rx={4}
								fill="var(--accent)"
							/>
						);
					})}
				</svg>
				<span className="muted">Last 7 days</span>
			</div>
		</SwipeStack>
	);
}
