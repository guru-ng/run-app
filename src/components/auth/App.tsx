import type { Session } from "@supabase/supabase-js";
import { Component, type ReactNode, useEffect, useState } from "react";
import { configError, supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import LoginScreen from "@/components/auth/LoginScreen";
import InviteScreen from "@/components/auth/InviteScreen";
import Dashboard from "@/components/dashboard/Dashboard";
import RunPage from "@/components/runs/RunPage";
import type { TabId } from "@/components/ui/navItems";

type Phase = "loading" | "signed-out" | "needs-invite" | "ready" | "error";

/**
 * Every signed-in page mounts this island: it owns the session/profile check
 * and then hands off to whatever the page is. `tab` says which destination the
 * URL stands for; `view: "run"` is the single-run detail page instead.
 */
export type AppProps = { tab?: TabId; view?: "app" | "run" };

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

export default function App({ tab = "dashboard", view = "app" }: AppProps) {
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
			<AppInner tab={tab} view={view} />
		</ErrorBoundary>
	);
}

function AppInner({ tab, view }: Required<AppProps>) {
	const [session, setSession] = useState<Session | null>(null);
	// `session === null` means both "not checked yet" and "signed out", so track
	// the check separately — otherwise the starting null reads as signed-out and
	// flashes LoginScreen at an already-authenticated user.
	const [sessionChecked, setSessionChecked] = useState(false);
	const [profile, setProfile] = useState<Profile | null>(null);
	const [phase, setPhase] = useState<Phase>("loading");
	const [loadError, setLoadError] = useState<string | null>(null);

	// Track auth session.
	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => {
			setSession(data.session);
			setSessionChecked(true);
		});
		const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
			setSession(s);
			setSessionChecked(true);
		});
		return () => sub.subscription.unsubscribe();
	}, []);

	// When the session changes, look up the user's profile.
	useEffect(() => {
		if (!sessionChecked) return;
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
			.then(({ data, error }) => {
				// A failed lookup is not the same as "no profile" — sending a real
				// member to the invite screen would be worse than showing the error.
				if (error) {
					setLoadError(error.message);
					setPhase("error");
					return;
				}
				if (data) {
					setProfile(data as Profile);
					setPhase("ready");
				} else {
					setPhase("needs-invite");
				}
			});
	}, [session, sessionChecked]);

	if (phase === "loading") return <Centered>Loading…</Centered>;
	if (phase === "error")
		return (
			<div className="panel">
				<h1 className="brand-title">Couldn't load your profile</h1>
				<p className="error">{loadError}</p>
			</div>
		);
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

	if (view === "run") return <RunPage userId={(profile as Profile).id} />;

	return (
		<Dashboard
			profile={profile as Profile}
			tab={tab}
			onProfileChanged={(name) =>
				setProfile((p) => (p ? { ...p, display_name: name } : p))
			}
		/>
	);
}

function Centered({ children }: { children: React.ReactNode }) {
	return <div className="panel">{children}</div>;
}
