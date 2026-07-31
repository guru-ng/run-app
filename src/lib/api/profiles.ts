import { supabase } from "@/lib/supabase";
import type { ApiResult } from "@/lib/api/types";

export async function updateDisplayName(
	userId: string,
	name: string,
): Promise<{ error: ApiResult<never>["error"] }> {
	const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", userId);
	return { error };
}
