import type { JSX } from "react";

export type TabId = "dashboard" | "log" | "schedule" | "profile";

// Stroke icons using currentColor so they pick up the button's color (var(--muted) /
// var(--accent) when active) and follow the light/dark theme automatically — same
// approach as the theme-toggle icons in SiteHeader.astro.
const ICON_PROPS = {
	width: 20,
	height: 20,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
};

const ICONS: Record<TabId, JSX.Element> = {
	dashboard: (
		<svg {...ICON_PROPS}>
			<path d="M3 11.5 12 4l9 7.5" />
			<path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
		</svg>
	),
	log: (
		<svg {...ICON_PROPS}>
			<line x1="12" y1="5" x2="12" y2="19" />
			<line x1="5" y1="12" x2="19" y2="12" />
		</svg>
	),
	schedule: (
		<svg {...ICON_PROPS}>
			<rect x="3" y="5" width="18" height="16" rx="2" />
			<line x1="3" y1="10" x2="21" y2="10" />
			<line x1="8" y1="3" x2="8" y2="7" />
			<line x1="16" y1="3" x2="16" y2="7" />
		</svg>
	),
	profile: (
		<svg {...ICON_PROPS}>
			<circle cx="12" cy="8" r="4" />
			<path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
		</svg>
	),
};

const TABS: { id: TabId; label: string }[] = [
	{ id: "dashboard", label: "Dashboard" },
	{ id: "log", label: "Log" },
	{ id: "schedule", label: "Schedule" },
	{ id: "profile", label: "Profile" },
];

export default function TabBar({
	active,
	onChange,
}: {
	active: TabId;
	onChange: (tab: TabId) => void;
}) {
	return (
		<nav className="tab-bar" aria-label="Main">
			{TABS.map((tab) => (
				<button
					key={tab.id}
					type="button"
					className={"tab-bar-btn" + (active === tab.id ? " tab-bar-btn-active" : "")}
					onClick={() => onChange(tab.id)}
					aria-current={active === tab.id ? "page" : undefined}
				>
					<span className="tab-bar-icon" aria-hidden="true">
						{ICONS[tab.id]}
					</span>
					<span className="tab-bar-label">{tab.label}</span>
				</button>
			))}
		</nav>
	);
}
