import test from 'node:test';
import assert from 'node:assert/strict';
import { makeFlightEndpoints, makeFlightFrames } from '../bat-flight.js';

test('every route begins and ends beyond the two marked edges, in both directions', () => {
  for (const [width, height, size] of [[390, 844, 81], [1440, 900, 106]]) {
    const bar = { left: width * .2, width: width * .5, top: height * .55, height: 28 };
    const padding = size * 1.5;
    for (const ascending of [false, true]) {
      const { start, end } = makeFlightEndpoints({ width, height, bar, padding, ascending });
      const right = ascending ? end : start;
      const bottom = ascending ? start : end;
      assert.equal(right.y, bar.top + bar.height / 2);
      assert.equal(bottom.x, bar.left + bar.width / 2);
      // A bounding circle includes the entire bat even when it banks.
      assert(right.x - Math.hypot(size, size * .45) / 2 > width);
      assert(bottom.y - Math.hypot(size, size * .45) / 2 > height);
      for (const bend of [-100, 100]) {
        const frames = makeFlightFrames(start, end, {
          size, bend, bank: 9, dash: .8, surge: .15,
          bounds: { left: bottom.x, right: right.x, top: right.y, bottom: bottom.y },
          departureVector: { x: (end.x - start.x) * .32, y: (end.y - start.y) * .32 },
        });
        assert(frames.every(frame => frame.opacity === 1 && !frame.transform.includes('NaN')));
        const centers = frames.map(frame => {
          const [, x, y] = frame.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
          return { x: Number(x) + size / 2, y: Number(y) + size * .225 };
        });
        assert(Math.hypot(centers[0].x - start.x, centers[0].y - start.y) < 1e-6);
        assert(Math.hypot(centers.at(-1).x - end.x, centers.at(-1).y - end.y) < 1e-6);
        const step = i => Math.hypot(centers[i + 1].x - centers[i].x, centers[i + 1].y - centers[i].y);
        assert(step(0) > step(60) * 2, 'entry retains its dash');
        assert(step(119) > step(60) * 2, 'exit retains its dash');
      }
    }
  }
});
