import { supabase } from "@/lib/supabase";
import type { DayAvailability, PlannedRun, RunType, TimeOfDay } from "@/lib/types";
import type { ApiResult } from "@/lib/api/types";

type PlannedRunRow = {
	id: string;
	planned_date: string;
	time_of_day: DayAvailability["time_of_day"];
	run_type: DayAvailability["run_type"];
	user_id: string;
	profiles: { display_name: string } | null;
};

function mapPlannedRunRow(r: PlannedRunRow): DayAvailability {
	return {
		id: r.id,
		planned_date: r.planned_date,
		time_of_day: r.time_of_day,
		run_type: r.run_type,
		user_id: r.user_id,
		display_name: r.profiles?.display_name ?? "Runner",
	};
}

/** Everyone's availability (see supabase/004_share_availability.sql). */
export async function fetchAllPlans(): Promise<ApiResult<DayAvailability[]>> {
	const { data, error } = await supabase
		.from("planned_runs")
		.select("id, planned_date, time_of_day, run_type, user_id, profiles(display_name)");
	const rows = (data as unknown as PlannedRunRow[]) ?? [];
	return { data: error ? null : rows.map(mapPlannedRunRow), error };
}

export async function insertPlannedRun(input: {
	userId: string;
	plannedDate: string;
	timeOfDay: TimeOfDay;
	runType: RunType;
}): Promise<ApiResult<PlannedRun>> {
	const { data, error } = await supabase
		.from("planned_runs")
		.insert({
			user_id: input.userId,
			planned_date: input.plannedDate,
			time_of_day: input.timeOfDay,
			run_type: input.runType,
		})
		.select("id, planned_date, time_of_day, run_type")
		.single();
	return { data: (data as PlannedRun) ?? null, error };
}

export async function deletePlannedRun(id: string): Promise<{ error: ApiResult<never>["error"] }> {
	const { error } = await supabase.from("planned_runs").delete().eq("id", id);
	return { error };
}
