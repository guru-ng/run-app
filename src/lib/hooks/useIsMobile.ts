import { useEffect, useState } from "react";
import { STACK_BREAKPOINT } from "@/components/ui/SwipeStack";

/**
 * True below the mobile breakpoint. Seeded during the first render — every
 * caller is inside a `client:only` island, so `window` is available and the
 * layout doesn't flip after mount.
 */
export function useIsMobile() {
	const [isMobile, setIsMobile] = useState(() => window.matchMedia(STACK_BREAKPOINT).matches);

	useEffect(() => {
		const mql = window.matchMedia(STACK_BREAKPOINT);
		setIsMobile(mql.matches);
		const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, []);

	return isMobile;
}
