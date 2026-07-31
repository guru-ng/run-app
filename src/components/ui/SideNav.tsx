import { NAV_ITEMS, type TabId } from "@/components/ui/navItems";

/**
 * Desktop-only left rail — the same four destinations as the mobile TabBar,
 * but as real links to real pages (`/`, `/log/`, `/schedule/`, `/profile/`).
 * Hidden below the mobile breakpoint, where TabBar takes over.
 */
export default function SideNav({
	active,
	exact = true,
}: {
	active: TabId;
	/** False when `active` is only the section we're under, not the current page
	    (the run-detail page highlights Log but isn't /log/) — the highlight stays,
	    the aria-current claim doesn't. */
	exact?: boolean;
}) {
	return (
		<nav className="side-nav" aria-label="Main">
			{NAV_ITEMS.map((item) => (
				<a
					key={item.id}
					href={item.href}
					className={"side-nav-link" + (active === item.id ? " side-nav-link-active" : "")}
					aria-current={active === item.id && exact ? "page" : undefined}
				>
					<span className="side-nav-icon" aria-hidden="true">
						{item.icon}
					</span>
					<span>{item.label}</span>
				</a>
			))}
		</nav>
	);
}
