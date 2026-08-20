import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PlannedRun, Profile, Run } from "@/lib/types";
import { useOwnRuns } from "@/lib/hooks/useOwnRuns";
import { useAllPlans } from "@/lib/hooks/useAllPlans";
import { useEarnedBadges } from "@/lib/hooks/useEarnedBadges";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { computeQualifyingBadges } from "@/lib/badges";
import { insertEarnedBadges } from "@/lib/api/badges";
import MatchesDeck from "@/components/matches/MatchesDeck";
import InsightsDeck from "@/components/dashboard/InsightsDeck";
import LatestLogsCard from "@/components/runs/LatestLogsCard";
import TabBar from "@/components/ui/TabBar";
import SideNav from "@/components/ui/SideNav";
import type { TabId } from "@/components/ui/navItems";
import DashboardTab from "@/components/dashboard/DashboardTab";
import LogTab from "@/components/dashboard/LogTab";
import ScheduleTab from "@/components/dashboard/ScheduleTab";
import ProfileTab from "@/components/profile/ProfileTab";

/**
 * `tab` is the destination the current page URL stands for. Desktop treats it
 * as fixed — each tab is its own page (`/`, `/log/`, `/schedule/`,
 * `/profile/`) and the SideNav navigates between them. Mobile only uses it as
 * the starting tab and then switches locally via the bottom TabBar, so the URL
 * stays put and nothing refetches mid-session.
 */
export default function Dashboard({
	profile,
	onProfileChanged,
	tab = "dashboard",
}: {
	profile: Profile;
	onProfileChanged: (name: string) => void;
	tab?: TabId;
}) {
	// Knowing the viewport from the first render keeps the data-gating below from
	// firing a second round of queries after mount.
	const isMobile = useIsMobile();
	const [activeTab, setActiveTab] = useState<TabId>(tab);

	// The island is persisted across client-side navigations, so `tab` can change
	// without a remount and mobile's local tab state has to follow it. Mobile
	// never navigates between rail pages, so in practice this is a no-op there.
	useEffect(() => {
		setActiveTab(tab);
	}, [tab]);

	// Mobile holds every tab in one page, so it needs both queries. Desktop only
	// loads what the current page actually renders.
	const needsRuns = isMobile || tab === "dashboard" || tab === "log";
	const needsPlans = isMobile || tab === "dashboard" || tab === "schedule";
	// Badges piggyback on needsRuns (the backfill sync below needs `runs` to
	// compute totals) plus Profile, which shows the badge shelf on its own.
	const needsBadges = needsRuns || tab === "profile";

	const { runs, error: runsError, setRuns } = useOwnRuns(profile.id, needsRuns);
	const { allPlans, error: plansError, setAllPlans } = useAllPlans(needsPlans);
	const {
		earnedBadges,
		error: badgesError,
		setEarnedBadges,
	} = useEarnedBadges(profile.id, needsBadges);

	const myLatestDistance = runs && runs.length > 0 ? runs[0].distance_km : null;

	// Gamification #4 (see PLAN.md): silently backfills any badge the user
	// already qualifies for but doesn't have on record — covers both someone
	// who already had a big run history before this feature shipped, and the
	// ordinary "just logged a run" case (runs changing re-triggers this too).
	// No celebration UI here on purpose; that's LogRunForm's job for badges
	// earned *at the moment* of logging. Self-terminating: once a badge is
	// recorded, the next run of this effect no longer finds it "qualifying."
	useEffect(() => {
		if (!runs || !earnedBadges) return;
		const earnedKeys = new Set(earnedBadges.map((b) => b.badge_key));
		const qualifying = computeQualifyingBadges(runs, earnedKeys);
		if (qualifying.length === 0) return;
		insertEarnedBadges(
			profile.id,
			qualifying.map((b) => b.key),
		).then(({ error }) => {
			if (error) return;
			setEarnedBadges((prev) => [
				...(prev ?? []),
				...qualifying.map((b) => ({ badge_key: b.key, earned_at: new Date().toISOString() })),
			]);
		});
	}, [runs, earnedBadges, profile.id, setEarnedBadges]);

	function addScheduled(p: PlannedRun) {
		const entry = {
			id: p.id,
			planned_date: p.planned_date,
			time_of_day: p.time_of_day,
			run_type: p.run_type,
			user_id: profile.id,
			display_name: profile.display_name,
		};
		setAllPlans((prev) => {
			const list = prev ?? [];
			// Editing a plan returns the same row id — replace it in place rather
			// than appending a second copy of the same run.
			return list.some((x) => x.id === entry.id)
				? list.map((x) => (x.id === entry.id ? entry : x))
				: [...list, entry];
		});
	}

	function removeScheduled(id: string) {
		setAllPlans((prev) => (prev ?? []).filter((p) => p.id !== id));
	}

	async function signOut() {
		await supabase.auth.signOut();
	}

	function logRun(run: Run) {
		setRuns((prev) => [run, ...(prev ?? [])]);
	}

	// badgesError deliberately isn't folded in here: badges are a bonus, not
	// core data, so a missing badges_earned table (e.g. before the migration
	// in supabase/005_badges.sql has been run) shouldn't cover the whole page
	// in a red error banner over runs/plans, which is what a shared loadError
	// would do. Logged to the console instead, for debugging.
	const loadError = runsError ?? plansError;

	useEffect(() => {
		if (badgesError) console.error("Failed to load badges:", badgesError.message);
	}, [badgesError]);

	if (isMobile) {
		return (
			<>
				<div className="tab-content">
					{loadError && <p className="error">{loadError.message}</p>}
					{activeTab === "dashboard" && (
						<DashboardTab
							userId={profile.id}
							runs={runs}
							allPlans={allPlans}
							myLatestDistance={myLatestDistance}
						/>
					)}
					{activeTab === "log" && (
						<LogTab
							userId={profile.id}
							runs={runs}
							earnedBadges={earnedBadges}
							onLogged={logRun}
						/>
					)}
					{activeTab === "schedule" && (
						<ScheduleTab
							userId={profile.id}
							allPlans={allPlans}
							onScheduled={addScheduled}
							onCanceled={removeScheduled}
						/>
					)}
					{activeTab === "profile" && (
						<ProfileTab
							profile={profile}
							onNameChanged={onProfileChanged}
							onSignOut={signOut}
							earnedBadges={earnedBadges}
						/>
					)}
				</div>
				<TabBar active={activeTab} onChange={setActiveTab} />
			</>
		);
	}

	// Desktop: left rail + one destination per page. The decks below render as
	// plain stacked cards here — SwipeStack passes its children straight through
	// above the mobile breakpoint.
	return (
		<div className="app-shell">
			<SideNav active={tab} />
			<div className="app-main">
				{loadError && <p className="error">{loadError.message}</p>}

				{tab === "dashboard" && (
					<div className="dashboard-grid">
						<h1 className="brand-title dashboard-greeting">
							Welcome, {profile.display_name}.
						</h1>
						<div className="insights-row">
							<InsightsDeck userId={profile.id} runs={runs} allPlans={allPlans} />
						</div>
						<div className="dashboard-grid-row">
							{/* Neither column is wrapped in a .panel: each match is already its
							    own card, and matching that keeps both headings and both card
							    edges on the same left line. */}
							<div className="dashboard-col">
								<LatestLogsCard />
							</div>
							<MatchesDeck userId={profile.id} myLatestDistance={myLatestDistance} />
						</div>
					</div>
				)}

				{tab === "log" && (
					<LogTab userId={profile.id} runs={runs} earnedBadges={earnedBadges} onLogged={logRun} />
				)}

				{tab === "schedule" && (
					<ScheduleTab
						userId={profile.id}
						allPlans={allPlans}
						onScheduled={addScheduled}
						onCanceled={removeScheduled}
					/>
				)}

				{tab === "profile" && (
					<ProfileTab
						profile={profile}
						onNameChanged={onProfileChanged}
						onSignOut={signOut}
						earnedBadges={earnedBadges}
					/>
				)}
			</div>
		</div>
	);
}
