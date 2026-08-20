import { useState } from "react";
import { updateDisplayName } from "@/lib/api/profiles";
import type { EarnedBadge, Profile } from "@/lib/types";
import { BADGES } from "@/lib/badges";

export default function ProfileTab({
	profile,
	onNameChanged,
	onSignOut,
	earnedBadges,
}: {
	profile: Profile;
	onNameChanged: (name: string) => void;
	onSignOut: () => void;
	earnedBadges: EarnedBadge[] | null;
}) {
	// A Set dedupes: the backfill sync and a fresh log can each notice the
	// same badge around the same time (see Dashboard.tsx), which can produce
	// two identical rows in local state before the next fetch settles.
	const earnedKeys = new Set((earnedBadges ?? []).map((b) => b.badge_key));
	const [name, setName] = useState(profile.display_name);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);

	const trimmed = name.trim();
	const dirty = trimmed !== "" && trimmed !== profile.display_name;

	async function save() {
		if (!dirty) return;
		setSaving(true);
		setError(null);
		try {
			const { error } = await updateDisplayName(profile.id, trimmed);
			if (error) {
				setError(error.message);
				return;
			}
			onNameChanged(trimmed);
			setSaved(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Couldn't save your name. Try again.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="panel tab-panel">
			<h1 className="brand-title" style={{ fontSize: "1.4rem" }}>
				Profile
			</h1>
			<div className="form">
				<label className="modal-label" htmlFor="profile-name">
					Display name
				</label>
				<input
					id="profile-name"
					className="input"
					maxLength={60}
					value={name}
					onChange={(e) => {
						setName(e.target.value);
						setSaved(false);
					}}
				/>
				{error && <p className="error">{error}</p>}
				{saved && !dirty && <p className="muted">Saved.</p>}
				<button className="btn" disabled={saving || !dirty} onClick={save}>
					{saving ? "Saving…" : "Save"}
				</button>
			</div>
			<button className="link" onClick={onSignOut}>
				Sign out
			</button>
			<div className="badges-section">
				<h2 className="brand-title" style={{ fontSize: "1.1rem" }}>
					Badges
				</h2>
				<div className="badges-grid">
					{BADGES.map((b) => (
						<span
							key={b.key}
							className={`badge-chip${earnedKeys.has(b.key) ? " earned" : " locked"}`}
							title={b.description}
						>
							<span aria-hidden="true">{b.icon}</span> {b.name}
						</span>
					))}
				</div>
			</div>
		</div>
	);
}
