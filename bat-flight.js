export function makeFlightEndpoints({ width, height, bar, padding, ascending }) {
  const right = { x: width + padding, y: bar.top + bar.height / 2 };
  const bottom = { x: bar.left + bar.width / 2, y: height + padding };
  return ascending ? { start: bottom, end: right } : { start: right, end: bottom };
}

// A smooth cubic curve keeps each flight continuous, even when a flock splits.
export function makeFlightFrames(start, end, {
  size,
  bend,
  departureVector,
  bounds,
  bank = 0,
  dash = 0.65,
  surge = 0.1,
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
  const pointAt = t => {
    const u = 1 - t;
    return {
      x: u ** 3 * start.x + 3 * u ** 2 * t * first.x + 3 * u * t ** 2 * second.x + t ** 3 * end.x,
      y: u ** 3 * start.y + 3 * u ** 2 * t * first.y + 3 * u * t ** 2 * second.y + t ** 3 * end.y,
    };
  };
  return Array.from({ length: 121 }, (_, index) => {
    const progress = index / 120;
    // Fast entry and exit, with a slower middle and a different surge per bat.
    const t = progress + dash * Math.sin(progress * Math.PI * 2) / (Math.PI * 2)
      + surge * Math.sin(progress * Math.PI * 4) / (Math.PI * 4);
    const u = 1 - t;
    const { x, y } = pointAt(t);
    const tangentX = 3 * u ** 2 * (first.x - start.x) + 6 * u * t * (second.x - first.x) + 3 * t ** 2 * (end.x - second.x);
    const tangentY = 3 * u ** 2 * (first.y - start.y) + 6 * u * t * (second.y - first.y) + 3 * t ** 2 * (end.y - second.y);
    const heading = Math.atan2(tangentY, Math.abs(tangentX)) * 180 / Math.PI;
    const tilt = Math.max(-38, Math.min(38, heading * 0.35 + Math.sin(t * Math.PI * 2) * bank));
    return {
      offset: progress,
      // Never fade into the scene: both endpoints are fully offscreen.
      opacity: 1,
      transform: `translate3d(${x - size / 2}px, ${y - size * 0.225}px, 0) rotate(${tilt}deg)`,
    };
  });
}
