import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

export default function InviteScreen({
	onRedeemed,
}: {
	onRedeemed: (p: Profile) => void;
}) {
	const [name, setName] = useState("");
	const [code, setCode] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function redeem(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);

		const { error: rpcError } = await supabase.rpc("redeem_invite", {
			invite_code: code.trim(),
			name: name.trim(),
		});

		if (rpcError) {
			const msg =
				rpcError.message.includes("invalid_invite")
					? "That invite code isn't valid."
					: rpcError.message.includes("invite_exhausted")
						? "That invite code has been used up."
						: rpcError.message;
			setError(msg);
			setBusy(false);
			return;
		}

		const { data: userData } = await supabase.auth.getUser();
		const id = userData.user?.id as string;
		onRedeemed({ id, display_name: name.trim() || "Runner" });
	}

	async function signOut() {
		await supabase.auth.signOut();
	}

	return (
		<div className="panel">
			<h1 className="brand-title">One step to join</h1>
			<p className="muted">Enter your name and the invite code you were given.</p>
			<form className="form" onSubmit={redeem}>
				<input
					className="input"
					placeholder="Your name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>
				<input
					className="input"
					placeholder="Invite code"
					value={code}
					onChange={(e) => setCode(e.target.value)}
					required
				/>
				{error && <p className="error">{error}</p>}
				<button className="btn" type="submit" disabled={busy}>
					{busy ? "Joining…" : "Join"}
				</button>
			</form>
			<button className="link" onClick={signOut}>
				Sign out
			</button>
		</div>
	);
}
