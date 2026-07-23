export type Profile = { id: string; display_name: string };

export type Run = {
	id: string;
	distance_km: number;
	run_date: string;
	notes: string | null;
};

export type Match = {
	distance_km: number;
	run_date: string;
	profiles: { display_name: string } | null;
};
