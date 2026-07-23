/**
 * A small React island: a softly "breathing" dot.
 * Demonstrates the React integration and adds one calm, mindful accent
 * without the weight of a 3D engine.
 */
export default function BreathingDot() {
	return (
		<span className="breathing-dot" aria-hidden="true">
			<span className="breathing-dot__core" />
		</span>
	);
}
