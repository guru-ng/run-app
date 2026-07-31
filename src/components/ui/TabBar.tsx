import { NAV_ITEMS, type TabId } from "@/components/ui/navItems";

export type { TabId };

/**
 * Mobile bottom navigation. Tabs switch in-place via local state (no page
 * load, so nothing refetches and no auth re-check flashes) — the desktop
 * SideNav is the one that uses the real page URLs.
 */
export default function TabBar({
	active,
	onChange,
}: {
	active: TabId;
	onChange: (tab: TabId) => void;
}) {
	return (
		<nav className="tab-bar" aria-label="Main">
			{NAV_ITEMS.map((tab) => (
				<button
					key={tab.id}
					type="button"
					className={"tab-bar-btn" + (active === tab.id ? " tab-bar-btn-active" : "")}
					onClick={() => onChange(tab.id)}
					aria-current={active === tab.id ? "page" : undefined}
				>
					<span className="tab-bar-icon" aria-hidden="true">
						{tab.icon}
					</span>
					<span className="tab-bar-label">{tab.label}</span>
				</button>
			))}
		</nav>
	);
}
