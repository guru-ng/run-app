import type { DayAvailability, PlannedRun } from "@/lib/types";
import AvailabilityCard from "@/components/AvailabilityCard";
import UpcomingRunsDeck from "@/components/UpcomingRunsDeck";

export default function ScheduleTab({
	userId,
	allPlans,
	onScheduled,
	onCanceled,
}: {
	userId: string;
	allPlans: DayAvailability[] | null;
	onScheduled: (planned: PlannedRun) => void;
	onCanceled: (id: string) => void;
}) {
	return (
		<div className="panel side-panel tab-panel">
			<AvailabilityCard
				userId={userId}
				allPlans={allPlans}
				onScheduled={onScheduled}
				onCanceled={onCanceled}
			/>
			<UpcomingRunsDeck userId={userId} allPlans={allPlans} onCanceled={onCanceled} />
		</div>
	);
}
