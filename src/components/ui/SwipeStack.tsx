import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";

export const STACK_BREAKPOINT = "(max-width: 640px)";
const SWIPE_THRESHOLD = 60;
const EXIT_DURATION = 260;

/**
 * Mobile-only, touch-only swipe-to-dismiss card deck (see CLAUDE.md,
 * "Locked: swipe-to-dismiss card deck" / "Deck architecture"). Swiping a
 * card away in the drag direction removes it — purely local UI state,
 * nothing persisted, nothing called on the backend. On larger screens (or
 * if there's only ever one card) it renders children untouched so the
 * parent's own layout applies as normal.
 *
 * `loop`: when the last card is dismissed, reset and cycle back to the
 * first instead of leaving the deck empty (used by the Dashboard-tab
 * decks; posts-page cards stay one-way).
 * `showDots`: render a position indicator (`● ○ ○`) below the deck.
 */
export default function SwipeStack({
	children,
	loop = false,
	showDots = false,
}: {
	children: ReactNode;
	loop?: boolean;
	showDots?: boolean;
}) {
	const items = Children.toArray(children);
	const [isStack, setIsStack] = useState(false);
	const [dismissed, setDismissed] = useState<number[]>([]);
	const [dragX, setDragX] = useState(0);
	const [exiting, setExiting] = useState<{ index: number; direction: 1 | -1 } | null>(null);
	const dragStartX = useRef<number | null>(null);
	const dragStartY = useRef<number | null>(null);
	const dragAxis = useRef<"x" | "y" | null>(null);
	const dragging = useRef(false);
	// Mirrors dragX synchronously: pointerup can land in the same batch as the
	// last pointermove, where the dragX state this render closed over is stale.
	const dragXRef = useRef(0);
	const exitTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const mql = window.matchMedia(STACK_BREAKPOINT);
		setIsStack(mql.matches);
		const onChange = (e: MediaQueryListEvent) => setIsStack(e.matches);
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, []);

	useEffect(() => {
		return () => {
			if (exitTimeout.current) clearTimeout(exitTimeout.current);
		};
	}, []);

	const remaining = items
		.map((child, i) => ({ child, i }))
		.filter(({ i }) => !dismissed.includes(i));

	function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
		if (e.pointerType !== "touch" || exiting) return;
		dragStartX.current = e.clientX;
		dragStartY.current = e.clientY;
		dragAxis.current = null;
		dragging.current = true;
		dragXRef.current = 0;
	}

	function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
		if (!dragging.current || dragStartX.current === null || dragStartY.current === null) return;
		const dx = e.clientX - dragStartX.current;
		const dy = e.clientY - dragStartY.current;

		// Don't commit to an axis until the gesture clears a small jitter threshold,
		// then lock it — otherwise a mostly-vertical scroll gets hijacked as a swipe.
		if (dragAxis.current === null) {
			if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
			dragAxis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
			if (dragAxis.current === "x") {
				e.currentTarget.setPointerCapture(e.pointerId);
			}
		}

		if (dragAxis.current !== "x") return;
		e.preventDefault();
		dragXRef.current = dx;
		setDragX(dx);
	}

	function endDrag(e: React.PointerEvent<HTMLDivElement>) {
		if (!dragging.current) return;
		dragging.current = false;
		const wasHorizontal = dragAxis.current === "x";
		if (wasHorizontal) {
			try {
				e.currentTarget.releasePointerCapture(e.pointerId);
			} catch {
				// already released
			}
		}
		dragStartX.current = null;
		dragStartY.current = null;
		dragAxis.current = null;

		const finalX = dragXRef.current;
		if (wasHorizontal && Math.abs(finalX) >= SWIPE_THRESHOLD && remaining.length > 0) {
			flingOut(remaining[0].i, finalX < 0 ? -1 : 1);
		} else {
			dragXRef.current = 0;
			setDragX(0);
		}
	}

	/**
	 * The browser can revoke a pointer mid-gesture (system gesture, the touch
	 * turning into a scroll). That's an abort, not a swipe — snap back rather
	 * than dismissing, and clear the drag refs so the next gesture starts clean.
	 */
	function cancelDrag() {
		if (!dragging.current) return;
		dragging.current = false;
		dragStartX.current = null;
		dragStartY.current = null;
		dragAxis.current = null;
		dragXRef.current = 0;
		setDragX(0);
	}

	function flingOut(index: number, direction: 1 | -1) {
		setExiting({ index, direction });
		dragXRef.current = 0;
		setDragX(0);
		exitTimeout.current = setTimeout(() => {
			setDismissed((prev) => {
				const next = [...prev, index];
				return loop && next.length >= items.length ? [] : next;
			});
			setExiting(null);
		}, EXIT_DURATION);
	}

	function itemStyle(queueIndex: number, originalIndex: number): CSSProperties {
		if (exiting && exiting.index === originalIndex) {
			return {
				transform: `translateX(${exiting.direction * 130}vw) rotate(${exiting.direction * 14}deg)`,
				opacity: 0,
				zIndex: 20,
				pointerEvents: "none",
				transition: `transform ${EXIT_DURATION}ms cubic-bezier(0.36, 0, 0.66, -0.05), opacity ${EXIT_DURATION}ms ease`,
			};
		}
		const live = queueIndex === 0 && dragging.current && dragAxis.current === "x";
		const translateX = queueIndex === 0 ? dragX : 0;
		const translateY = queueIndex === 0 ? 0 : 10;
		const rotate = queueIndex === 0 ? dragX * 0.04 : 0;
		const scale = queueIndex === 0 ? 1 : 0.94;
		return {
			transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
			opacity: 1,
			zIndex: 10 - queueIndex,
			pointerEvents: queueIndex === 0 ? "auto" : "none",
			transition: live
				? "none"
				: "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
		};
	}

	if (!isStack || items.length <= 1) return <>{items}</>;
	if (remaining.length === 0) return null;

	return (
		<div
			className="swipe-stack"
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={endDrag}
			onPointerLeave={endDrag}
			onPointerCancel={cancelDrag}
		>
			<div className="swipe-hint" aria-hidden="true">
				<span className="swipe-arrow swipe-arrow-left">‹</span>
				<span>swipe away</span>
				<span className="swipe-arrow swipe-arrow-right">›</span>
			</div>
			{remaining.slice(0, 2).map(({ child, i }, queueIndex) => {
				if (!isValidElement(child)) return child;
				const el = child as ReactElement<{ className?: string; style?: CSSProperties }>;
				const mergedClassName = [el.props.className, "swipe-stack-item"].filter(Boolean).join(" ");
				return cloneElement(el, {
					key: el.key ?? i,
					className: mergedClassName,
					style: { ...el.props.style, ...itemStyle(queueIndex, i) },
				});
			})}
			{showDots && (
				<div className="swipe-dots" aria-hidden="true">
					{items.map((_, i) => (
						<span
							key={i}
							className={"swipe-dot" + (remaining[0]?.i === i ? " swipe-dot-active" : "")}
						/>
					))}
				</div>
			)}
		</div>
	);
}
