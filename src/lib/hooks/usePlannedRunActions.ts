import { deletePlannedRun } from "@/lib/api/plannedRuns";

export function usePlannedRunActions(onCanceled: (id: string) => void) {
	async function cancelPlan(id: string) {
		const { error } = await deletePlannedRun(id);
		if (error) {
			alert(error.message);
			return;
		}
		onCanceled(id);
	}

	return { cancelPlan };
}
