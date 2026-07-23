import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

// Don't throw at import time (that produces a blank page). Surface it instead.
export const configError =
	!url || !anonKey
		? "Supabase keys are missing. Check .env has PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY, then fully restart the dev server."
		: null;

export const supabase = createClient(
	url ?? "https://placeholder.supabase.co",
	anonKey ?? "placeholder-anon-key",
);
