import type { Session } from "@supabase/supabase-js";
import { Component, type ReactNode, useEffect, useState } from "react";
import { configError, supabase } from "@/lib/supabase";

type Profile = { id: string; display_name: string };
type Phase = "loading" | "signed-out" | "needs-invite" | "ready";
type Run = {
	id: string;
	distance_km: number;
	run_date: string;
	notes: string | null;
};

// Catches any render/runtime error and shows it on the page instead of a blank screen.
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
	state = { error: null as Error | null };
	static getDerivedStateFromError(error: Error) {
		return { error };
	}
	render() {
		if (this.state.error) {
			return (
				<div className="panel">
					<h1 className="brand-title">Something broke</h1>
					<p className="error">{this.state.error.message}</p>
				</div>
			);
		}
		return this.props.children;
	}
}

export default function App() {
	if (configError) {
		return (
			<div className="panel">
				<h1 className="brand-title">Setup needed</h1>
				<p className="error">{configError}</p>
			</div>
		);
	}
	return (
		<ErrorBoundary>
			<AppInner />
		</ErrorBoundary>
	);
}

function AppInner() {
	const [session, setSession] = useState<Session | null>(null);
	const [profile, setProfile] = useState<Profile | null>(null);
	const [phase, setPhase] = useState<Phase>("loading");

	// Track auth session.
	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => setSession(data.session));
		const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
			setSession(s);
		});
		return () => sub.subscription.unsubscribe();
	}, []);

	// When the session changes, look up the user's profile.
	useEffect(() => {
		if (!session) {
			setProfile(null);
			setPhase("signed-out");
			return;
		}
		setPhase("loading");
		supabase
			.from("profiles")
			.select("id, display_name")
			.eq("id", session.user.id)
			.maybeSingle()
			.then(({ data }) => {
				if (data) {
					setProfile(data as Profile);
					setPhase("ready");
				} else {
					setPhase("needs-invite");
				}
			});
	}, [session]);

	if (phase === "loading") return <Centered>Loading…</Centered>;
	if (phase === "signed-out") return <LoginScreen />;
	if (phase === "needs-invite")
		return (
			<InviteScreen
				onRedeemed={(p) => {
					setProfile(p);
					setPhase("ready");
				}}
			/>
		);

	return <Dashboard profile={profile as Profile} />;
}

function Centered({ children }: { children: React.ReactNode }) {
	return <div className="panel">{children}</div>;
}

function LoginScreen() {
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

function InviteScreen({ onRedeemed }: { onRedeemed: (p: Profile) => void }) {
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

function Dashboard({ profile }: { profile: Profile }) {
	const [runs, setRuns] = useState<Run[] | null>(null);
	const [distanceKm, setDistanceKm] = useState("");
	const [runDate, setRunDate] = useState(() => todayIso());
	const [notes, setNotes] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		supabase
			.from("runs")
			.select("id, distance_km, run_date, notes")
			.eq("user_id", profile.id)
			.order("run_date", { ascending: false })
			.order("created_at", { ascending: false })
			.then(({ data }) => setRuns((data as Run[]) ?? []));
	}, [profile.id]);

	async function logRun(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);

		const { data, error: insertError } = await supabase
			.from("runs")
			.insert({
				user_id: profile.id,
				distance_km: Number(distanceKm),
				run_date: runDate,
				notes: notes.trim() || null,
			})
			.select("id, distance_km, run_date, notes")
			.single();

		if (insertError) {
			setError(insertError.message);
			setBusy(false);
			return;
		}

		setRuns((prev) => [data as Run, ...(prev ?? [])]);
		setDistanceKm("");
		setNotes("");
		setBusy(false);
	}

	async function signOut() {
		await supabase.auth.signOut();
	}

	return (
		<div className="panel">
			<h1 className="brand-title">Welcome, {profile.display_name}.</h1>
			<form className="form" onSubmit={logRun}>
				<input
					className="input"
					type="number"
					inputMode="decimal"
					step="0.01"
					min="0.01"
					max="999.99"
					placeholder="Distance (km)"
					value={distanceKm}
					onChange={(e) => setDistanceKm(e.target.value)}
					required
				/>
				<input
					className="input"
					type="date"
					value={runDate}
					onChange={(e) => setRunDate(e.target.value)}
					required
				/>
				<input
					className="input"
					placeholder="Notes (optional)"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
				/>
				{error && <p className="error">{error}</p>}
				<button className="btn" type="submit" disabled={busy}>
					{busy ? "Logging…" : "Log run"}
				</button>
			</form>

			<div className="runs-list">
				{runs === null ? (
					<p className="muted">Loading your runs…</p>
				) : runs.length === 0 ? (
					<p className="muted">No runs logged yet.</p>
				) : (
					runs.map((run) => (
						<div className="run-item" key={run.id}>
							<span>{run.run_date}</span>
							<span>{run.distance_km} km</span>
							{run.notes && <span className="muted">{run.notes}</span>}
						</div>
					))
				)}
			</div>

			<button className="link" onClick={signOut}>
				Sign out
			</button>
		</div>
	);
}

function todayIso() {
	return new Date().toISOString().slice(0, 10);
}
