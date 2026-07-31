import type { DayAvailability, Run } from "@/lib/types";
import InsightsDeck from "@/components/dashboard/InsightsDeck";
import RecentActivityDeck from "@/components/runs/RecentActivityDeck";
import MatchesDeck from "@/components/matches/MatchesDeck";

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
