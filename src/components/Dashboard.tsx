import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { DayAvailability, PlannedRun, Profile, Run } from "@/lib/types";
import LogRunForm from "@/components/LogRunForm";
import RunsList from "@/components/RunsList";
import MatchesFeed from "@/components/MatchesFeed";
import AvailabilityCard from "@/components/AvailabilityCard";
import LatestLogsCard from "@/components/LatestLogsCard";

type PlannedRunRow = {
	id: string;
	planned_date: string;
	time_of_day: DayAvailability["time_of_day"];
	run_type: DayAvailability["run_type"];
	user_id: string;
	profiles: { display_name: string } | null;
};

export default function Dashboard({ profile }: { profile: Profile }) {
	const [runs, setRuns] = useState<Run[] | null>(null);
	const [allPlans, setAllPlans] = useState<DayAvailability[] | null>(null);

	useEffect(() => {
		supabase
			.from("runs")
			.select("id, distance_km, run_date, notes")
			.eq("user_id", profile.id)
			.order("run_date", { ascending: false })
			.order("created_at", { ascending: false })
			.then(({ data }) => setRuns((data as Run[]) ?? []));

		// Everyone's availability is visible (see supabase/004_share_availability.sql).
		supabase
			.from("planned_runs")
			.select("id, planned_date, time_of_day, run_type, user_id, profiles(display_name)")
			.then(({ data }) => {
				const rows = (data as unknown as PlannedRunRow[]) ?? [];
				setAllPlans(
					rows.map((r) => ({
						id: r.id,
						planned_date: r.planned_date,
						time_of_day: r.time_of_day,
						run_type: r.run_type,
						user_id: r.user_id,
						display_name: r.profiles?.display_name ?? "Runner",
					})),
				);
			});
	}, [profile.id]);

	const myLatestDistance = runs && runs.length > 0 ? runs[0].distance_km : null;

	function addScheduled(p: PlannedRun) {
		setAllPlans((prev) => [
			...(prev ?? []),
			{
				id: p.id,
				planned_date: p.planned_date,
				time_of_day: p.time_of_day,
				run_type: p.run_type,
				user_id: profile.id,
				display_name: profile.display_name,
			},
		]);
	}

	function removeScheduled(id: string) {
		setAllPlans((prev) => (prev ?? []).filter((p) => p.id !== id));
	}

	async function signOut() {
		await supabase.auth.signOut();
	}

	return (
		<div className="dashboard-columns">
			<div className="panel">
				<h1 className="brand-title">Welcome, {profile.display_name}.</h1>

				<LogRunForm
					userId={profile.id}
					onLogged={(run) => setRuns((prev) => [run, ...(prev ?? [])])}
				/>

				<RunsList runs={runs} />

				<button className="link" onClick={signOut}>
					Sign out
				</button>
			</div>

			<div className="panel side-panel">
				<AvailabilityCard
					userId={profile.id}
					allPlans={allPlans}
					onScheduled={addScheduled}
					onCanceled={removeScheduled}
				/>

				<LatestLogsCard />

				<MatchesFeed userId={profile.id} myLatestDistance={myLatestDistance} />
			</div>
		</div>
	);
}
