/**
 * DepthScene — a cluster of slow CSS-3D objects (rings, slab, orb) that gives a
 * section real spatial depth. All motion is ambient, >9s, and runs through the
 * normal motion gates (disabled with data-motion="off" / anim-speed none).
 */
export default function DepthScene({ className = '' }) {
  return (
    <div className={`depth-scene ${className}`.trim()} aria-hidden="true">
      <span className="depth-obj depth-ring-a" />
      <span className="depth-obj depth-ring-b" />
      <span className="depth-obj depth-slab" />
      <span className="depth-obj depth-orb" />
    </div>
  );
}
