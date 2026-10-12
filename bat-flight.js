// A smooth cubic curve keeps each flight continuous, even when a flock splits.
export function makeFlightFrames(start, end, {
  size,
  bend,
  departureVector,
  bounds,
  bank = 0,
}) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const normal = { x: -dy / length, y: dx / length };
  const first = {
    x: start.x + departureVector.x + normal.x * bend * 0.25,
    y: start.y + departureVector.y + normal.y * bend * 0.25,
  };
  const second = {
    x: start.x + dx * 0.7 + normal.x * bend,
    y: start.y + dy * 0.7 + normal.y * bend,
  };
  for (const point of [first, second]) {
    point.x = Math.max(bounds.left, Math.min(bounds.right, point.x));
    point.y = Math.max(bounds.top, Math.min(bounds.bottom, point.y));
  }
  return Array.from({ length: 61 }, (_, index) => {
    const t = index / 60;
    const u = 1 - t;
    const x = u ** 3 * start.x + 3 * u ** 2 * t * first.x + 3 * u * t ** 2 * second.x + t ** 3 * end.x;
    const y = u ** 3 * start.y + 3 * u ** 2 * t * first.y + 3 * u * t ** 2 * second.y + t ** 3 * end.y;
    const tangentX = 3 * u ** 2 * (first.x - start.x) + 6 * u * t * (second.x - first.x) + 3 * t ** 2 * (end.x - second.x);
    const tangentY = 3 * u ** 2 * (first.y - start.y) + 6 * u * t * (second.y - first.y) + 3 * t ** 2 * (end.y - second.y);
    const heading = Math.atan2(tangentY, Math.abs(tangentX)) * 180 / Math.PI;
    const tilt = Math.max(-38, Math.min(38, heading * 0.35 + Math.sin(t * Math.PI * 2) * bank));
    return {
      offset: t,
      opacity: Math.min(1, t / 0.08, (1 - t) / 0.12),
      transform: `translate3d(${x - size / 2}px, ${y - size * 0.225}px, 0) rotate(${tilt}deg)`,
    };
  });
}
