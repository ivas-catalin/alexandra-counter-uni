import { createChain, stepChain } from './chain-physics.js';
export function initPendant(element, motion) {
  const ns = 'http://www.w3.org/2000/svg';
  const artwork = element.querySelector('img').getAttribute('src');
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 1280 1280');
  svg.setAttribute('aria-hidden', 'true');
  const defs = document.createElementNS(ns, 'defs');
  svg.append(defs);
  let chain = createChain();
  const links = [];
  // Whole metal rings stay intact when neighboring segments fold.
  const metal = document.createElementNS(ns, 'linearGradient');
  metal.id = 'chain-metal';
  metal.setAttribute('x2', '100%'); metal.setAttribute('y2', '70%');
  for (const [offset, color] of [[0, '#1d1c1b'], [.18, '#c6c2ba'], [.32, '#686560'], [.55, '#302e2c'], [.76, '#b3afa8'], [1, '#3c3a37']]) {
    const stop = document.createElementNS(ns, 'stop');
    stop.setAttribute('offset', offset); stop.setAttribute('stop-color', color); metal.append(stop);
  }
  defs.append(metal);
  function piece(id, x, y, width, height) {
    const clip = document.createElementNS(ns, 'clipPath');
    clip.id = id; clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    const rect = document.createElementNS(ns, 'rect');
    for (const [key, value] of Object.entries({ x, y, width, height })) rect.setAttribute(key, value);
    clip.append(rect); defs.append(clip);
    const group = document.createElementNS(ns, 'g');
    const image = document.createElementNS(ns, 'image');
    image.setAttribute('href', artwork); image.setAttribute('width', '1280'); image.setAttribute('height', '1280');
    image.setAttribute('clip-path', `url(#${id})`);
    group.append(image); svg.append(group);
    return group;
  }
  chain.ropes.forEach((rope, side) => {
    rope.source.slice(1).forEach((b, i) => {
      const a = rope.source[i];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const group = document.createElementNS(ns, 'g');
      for (let ring = 0; ring < 2; ring++) {
        for (const [width, stroke] of [[18, '#151413'], [14, 'url(#chain-metal)'], [1.7, '#e5e0d780']]) {
          const ellipse = document.createElementNS(ns, 'ellipse');
          const attributes = { cx: 0, cy: length * (.25 + ring * .5), rx: ring ? 12 : 27, ry: length * .35, fill: 'none', stroke, 'stroke-width': width };
          for (const [key, value] of Object.entries(attributes)) ellipse.setAttribute(key, value);
          group.append(ellipse);
        }
      }
      svg.append(group);
      links.push({ side, i, group });
    });
  });
  const charm = piece('chain-charm', 375, 662, 520, 550);
  // Keep the bail and pendant, excluding the old photograph's V-shaped chain remnant.
  const charmOutline = document.createElementNS(ns, 'path');
  charmOutline.setAttribute('d', 'M612 662H655V684Q686 688 681 735H895V1212H375V735H584Q578 688 612 684Z');
  defs.querySelector('#chain-charm').replaceChildren(charmOutline);
  element.replaceChildren(svg);
  let drag = null, frame = 0, lastTime = 0, accumulator = 0;
  let angle = 0, spin = 0, oldVX = 0;
  const fixedStep = 1 / 120;
  function paint() {
    for (const { side, i, group } of links) {
      const from = chain.ropes[side].nodes[i], to = chain.ropes[side].nodes[i + 1];
      const dx = to.x - from.x, dy = to.y - from.y, length = Math.max(.001, Math.hypot(dx, dy));
      group.setAttribute('transform', `matrix(${dy / length} ${-dx / length} ${dx / length} ${dy / length} ${from.x} ${from.y})`);
    }
    charm.setAttribute('transform', `translate(${chain.bob.x} ${chain.bob.y}) rotate(${angle * 180 / Math.PI}) translate(-632 -660)`);
  }
  function tick(time) {
    frame = 0;
    accumulator += Math.min((time - (lastTime || time)) / 1000, .05); lastTime = time;
    while (accumulator >= fixedStep) {
      stepChain(chain, fixedStep, drag?.target);
      const vx = (chain.bob.x - chain.bob.px) / fixedStep;
      const acceleration = (vx - oldVX) / fixedStep; oldVX = vx;
      spin += (-8 * Math.sin(angle) - acceleration / 310) * fixedStep;
      spin *= Math.exp(-1.25 * fixedStep); spin = Math.max(-4, Math.min(4, spin));
      angle = Math.max(-.7, Math.min(.7, angle + spin * fixedStep));
      accumulator -= fixedStep;
    }
    paint(); start();
  }
  function start() { if (!frame && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick); }
  function local(event) {
    const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  }
  element.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault(); const point = local(event);
    drag = { id: event.pointerId, dx: chain.bob.x - point.x, dy: chain.bob.y - point.y, target: { x: chain.bob.x, y: chain.bob.y } };
    element.setPointerCapture(event.pointerId); element.classList.add('is-dragging'); start();
  });
  element.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    const point = local(event);
    drag.target = { x: Math.max(280, Math.min(1000, point.x + drag.dx)), y: Math.max(170, Math.min(820, point.y + drag.dy)) };
    if (motion.matches) { for (let i = 0; i < 8; i++) stepChain(chain, fixedStep, drag.target); paint(); }
  });
  function release(event) {
    if (drag?.id !== event.pointerId) return;
    drag = null; element.classList.remove('is-dragging');
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    if (motion.matches || event.type === 'pointercancel') reset(); else start();
  }
  element.addEventListener('pointerup', release);
  element.addEventListener('pointercancel', release);
  element.addEventListener('lostpointercapture', release);
  element.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home' || motion.matches) reset();
    else { chain.bob.px += event.key === 'ArrowRight' ? -12 : 12; start(); }
  });
  function reset() {
    const heldId = drag?.id; drag = null;
    if (heldId !== undefined && element.hasPointerCapture(heldId)) element.releasePointerCapture(heldId);
    element.classList.remove('is-dragging'); cancelAnimationFrame(frame);
    frame = 0; lastTime = 0; accumulator = 0; angle = 0; spin = 0; oldVX = 0;
    chain = createChain(); paint(); start();
  }
  document.addEventListener('visibilitychange', reset);
  motion.addEventListener('change', reset); window.addEventListener('resize', reset);
  chain.bob.px -= 2;
  paint(); start();
}
