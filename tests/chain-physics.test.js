import test from 'node:test';
import assert from 'node:assert/strict';
import { createChain, stepChain } from '../chain-physics.js';

test('dragging keeps both chain anchors fixed and release settles under gravity', () => {
  for (const target of [{ x: 280, y: 820 }, { x: 1000, y: 170 }, { x: 1000, y: 820 }]) {
    const chain = createChain();
    for (let frame = 0; frame < 2400; frame++) {
      stepChain(chain, 1 / 120, frame < 240 ? target : null);
      for (const rope of chain.ropes) {
        assert.equal(rope.nodes[0].x, rope.source[0][0]);
        assert.equal(rope.nodes[0].y, rope.source[0][1]);
      }
      for (const { a, b, length } of chain.links) {
        assert(Math.abs(Math.hypot(b.x - a.x, b.y - a.y) / length - 1) < .04);
      }
    }
    assert(Math.abs(chain.bob.x - 632) < 12);
    assert(chain.bob.y > 650 && chain.bob.y < 690);
    assert(Math.hypot(chain.bob.x - chain.bob.px, chain.bob.y - chain.bob.py) < .01);
  }
});
