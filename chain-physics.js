const point = (x, y, mass = 1) => ({ x, y, px: x, py: y, weight: 1 / mass });
export function createChain() {
  const left = [[55, 0], [120, 100], [190, 200], [262, 300], [345, 400], [435, 500], [540, 600], [632, 660]];
  const right = left.map(([x, y]) => [1280 - x, y]);
  right[right.length - 1] = left.at(-1);
  const bob = point(632, 660, 18);
  const ropes = [left, right].map(source => {
    const nodes = source.map(([x, y], i) => i === source.length - 1 ? bob : point(x, y));
    nodes[0].weight = 0;
    return { source, nodes };
  });
  const nodes = [...new Set(ropes.flatMap(rope => rope.nodes))];
  const links = ropes.flatMap(({ nodes }) => nodes.slice(1).map((b, i) => {
    const a = nodes[i];
    return { a, b, length: Math.hypot(b.x - a.x, b.y - a.y) };
  }));
  return { bob, ropes, nodes, links };
}
// Fixed-step Verlet integration: gravity, drag, and inextensible chain links.
export function stepChain(chain, dt, held = null) {
  const damping = Math.exp(-1.45 * dt);
  for (const node of chain.nodes) {
    if (!node.weight) continue;
    const vx = (node.x - node.px) * damping, vy = (node.y - node.py) * damping;
    node.px = node.x; node.py = node.y;
    node.x += vx; node.y += vy + 1700 * dt * dt;
  }
  if (held) {
    const dx = held.x - chain.bob.x, dy = held.y - chain.bob.y;
    const pull = Math.min(.45, 8 / Math.max(1, Math.hypot(dx, dy)));
    chain.bob.x += dx * pull; chain.bob.y += dy * pull;
  }
  for (let pass = 0; pass < 48; pass++) {
    for (const { a, b, length } of chain.links) {
      const dx = b.x - a.x, dy = b.y - a.y;
      const distance = Math.max(.001, Math.hypot(dx, dy));
      const correction = (distance - length) / distance;
      const weight = a.weight + b.weight;
      a.x += dx * correction * a.weight / weight; a.y += dy * correction * a.weight / weight;
      b.x -= dx * correction * b.weight / weight; b.y -= dy * correction * b.weight / weight;
    }
  }
  for (const node of chain.nodes) {
    const dx = node.x - node.px, dy = node.y - node.py, distance = Math.hypot(dx, dy);
    if (distance > 10) { node.px = node.x - dx * 10 / distance; node.py = node.y - dy * 10 / distance; }
  }
}
