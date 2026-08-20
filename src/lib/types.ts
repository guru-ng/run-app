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

export type TimeOfDay = "morning" | "afternoon" | "evening";
export type RunType = "Base Run" | "Long Run" | "Intervals" | "Recovery";

export type PlannedRun = {
	id: string;
	planned_date: string;
	time_of_day: TimeOfDay;
	run_type: RunType;
};

/** A planned run joined with who it belongs to — used to show everyone's availability. */
export type DayAvailability = {
	id: string;
	planned_date: string;
	time_of_day: TimeOfDay;
	run_type: RunType;
	user_id: string;
	display_name: string;
};

/** A logged run joined with who ran it — used for the site-wide activity feed. */
export type FeedRun = {
	id: string;
	distance_km: number;
	run_date: string;
	notes: string | null;
	user_id: string;
	display_name: string;
};

/** A row from `badges_earned` — gamification #4. Permanent once earned. */
export type EarnedBadge = {
	badge_key: string;
	earned_at: string;
};
