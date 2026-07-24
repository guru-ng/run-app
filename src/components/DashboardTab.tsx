import type { DayAvailability, Run } from "@/lib/types";
import InsightsDeck from "@/components/InsightsDeck";
import RecentActivityDeck from "@/components/RecentActivityDeck";
import MatchesDeck from "@/components/MatchesDeck";

export default function DashboardTab({
	userId,
	runs,
	allPlans,
	myLatestDistance,
}: {
	userId: string;
	runs: Run[] | null;
	allPlans: DayAvailability[] | null;
	myLatestDistance: number | null;
}) {
	return (
		<div className="deck-stack-group">
			<InsightsDeck userId={userId} runs={runs} allPlans={allPlans} />
			<RecentActivityDeck />
			<MatchesDeck userId={userId} myLatestDistance={myLatestDistance} />
		</div>
	);
}
