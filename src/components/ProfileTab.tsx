import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

export default function ProfileTab({
	profile,
	onNameChanged,
	onSignOut,
}: {
	profile: Profile;
	onNameChanged: (name: string) => void;
	onSignOut: () => void;
}) {
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
		const { error } = await supabase
			.from("profiles")
			.update({ display_name: trimmed })
			.eq("id", profile.id);
		setSaving(false);
		if (error) {
			setError(error.message);
			return;
		}
		onNameChanged(trimmed);
		setSaved(true);
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
		</div>
	);
}
