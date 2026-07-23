import type { Session } from "@supabase/supabase-js";
import { Component, type ReactNode, useEffect, useState } from "react";
import { configError, supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import LoginScreen from "@/components/LoginScreen";
import InviteScreen from "@/components/InviteScreen";
import Dashboard from "@/components/Dashboard";

type Phase = "loading" | "signed-out" | "needs-invite" | "ready";

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
