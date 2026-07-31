import type { PostgrestError } from "@supabase/supabase-js";

export type ApiResult<T> = { data: T | null; error: PostgrestError | null };
