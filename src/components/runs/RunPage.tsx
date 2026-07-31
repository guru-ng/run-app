import { useIsMobile } from "@/lib/hooks/useIsMobile";
import SideNav from "@/components/ui/SideNav";
import RunDetail from "@/components/runs/RunDetail";

/**
 * Layout shell for `/run/`. Desktop keeps the left rail (with Log marked
 * current, since that's where run links live); mobile shows just the run and
 * its back link — the bottom TabBar switches local tabs on the main page, so
 * it has nothing to do here.
 */
export default function RunPage({ userId }: { userId: string }) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<div className="tab-content">
				<RunDetail userId={userId} />
			</div>
		);
	}

	return (
		<div className="app-shell">
			<SideNav active="log" exact={false} />
			<div className="app-main">
				<RunDetail userId={userId} />
			</div>
		</div>
	);
}
