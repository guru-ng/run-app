import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile, Run } from "@/lib/types";
import LogRunForm from "@/components/LogRunForm";
import RunsList from "@/components/RunsList";
import MatchesFeed from "@/components/MatchesFeed";

export default function Dashboard({ profile }: { profile: Profile }) {
	const [runs, setRuns] = useState<Run[] | null>(null);

	useEffect(() => {
		supabase
			.from("runs")
			.select("id, distance_km, run_date, notes")
			.eq("user_id", profile.id)
			.order("run_date", { ascending: false })
			.order("created_at", { ascending: false })
			.then(({ data }) => setRuns((data as Run[]) ?? []));
	}, [profile.id]);

	const myLatestDistance = runs && runs.length > 0 ? runs[0].distance_km : null;

	async function signOut() {
		await supabase.auth.signOut();
	}

	return (
		<div className="panel">
			<h1 className="brand-title">Welcome, {profile.display_name}.</h1>

			<LogRunForm
				userId={profile.id}
				onLogged={(run) => setRuns((prev) => [run, ...(prev ?? [])])}
			/>

			<RunsList runs={runs} />

			<MatchesFeed userId={profile.id} myLatestDistance={myLatestDistance} />

			<button className="link" onClick={signOut}>
				Sign out
			</button>
		</div>
	);
}
