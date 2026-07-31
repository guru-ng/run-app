import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
	const [busy, setBusy] = useState(false);

	async function signInWithGoogle() {
		setBusy(true);
		const { error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: { redirectTo: window.location.origin },
		});
		if (error) {
			alert(error.message);
			setBusy(false);
		}
	}

	return (
		<div className="panel">
			<h1 className="brand-title">Find your pace.</h1>
			<p className="muted">
				A quiet running community — log your runs, match distances, run together.
				Invite only, for now.
			</p>
			<button className="btn" onClick={signInWithGoogle} disabled={busy}>
				{busy ? "Redirecting…" : "Continue with Google"}
			</button>
		</div>
	);
}
