import LogRunForm from "@/components/runs/LogRunForm";
import RunsList from "@/components/runs/RunsList";
import type { Run } from "@/lib/types";

export default function LogTab({
	userId,
	runs,
	onLogged,
}: {
	userId: string;
	runs: Run[] | null;
	onLogged: (run: Run) => void;
}) {
	return (
		<div className="panel tab-panel">
			<h1 className="brand-title" style={{ fontSize: "1.4rem" }}>
				Log a run
			</h1>
			<LogRunForm userId={userId} onLogged={onLogged} />
			<RunsList runs={runs} />
		</div>
	);
}
