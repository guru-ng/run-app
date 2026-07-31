import type { DayAvailability } from "@/lib/types";
import { shortDateLabel, todayIso } from "@/lib/dates";
import { usePlannedRunActions } from "@/lib/hooks/usePlannedRunActions";
import SwipeStack from "@/components/ui/SwipeStack";

export default function UpcomingRunsDeck({
	userId,
	allPlans,
	onCanceled,
}: {
	userId: string;
	allPlans: DayAvailability[] | null;
	onCanceled: (id: string) => void;
}) {
	const today = todayIso();
	const upcoming = (allPlans ?? [])
		.filter((p) => p.planned_date >= today)
		.sort((a, b) => a.planned_date.localeCompare(b.planned_date));

	const { cancelPlan } = usePlannedRunActions(onCanceled);

	return (
		<div className="deck-section">
			<h2 className="brand-title" style={{ fontSize: "1.1rem" }}>
				Upcoming
			</h2>
			{allPlans === null ? (
				<p className="muted">Loading…</p>
			) : upcoming.length === 0 ? (
				<p className="muted">Nothing scheduled yet.</p>
			) : (
				<SwipeStack loop showDots>
					{upcoming.map((plan) => (
						<div className="panel deck-card" key={plan.id}>
							<span className="deck-card-name">
								{plan.user_id === userId ? "You" : plan.display_name}
							</span>
							<span className="deck-card-metric" style={{ fontSize: "1.4rem" }}>
								{shortDateLabel(plan.planned_date)}
							</span>
							<span className="muted">
								{plan.time_of_day}, {plan.run_type}
							</span>
							{plan.user_id === userId && (
								<button className="link" onClick={() => cancelPlan(plan.id)}>
									Cancel
								</button>
							)}
						</div>
					))}
				</SwipeStack>
			)}
		</div>
	);
}
