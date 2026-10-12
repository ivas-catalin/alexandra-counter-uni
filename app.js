import {
  TIME_ZONE, ACADEMIC_YEARS, GRADUATION_DATE, PREVIEW_NOW, UPDATE_INTERVAL_MS,
  BAT_FIRST_VISIT_MS, BAT_INTERVAL_MS, BAT_FLIGHT_MS, BAT_FLOCK_SIZE,
  BAT_DEPARTURE_GAP_MS, BAT_VERTICAL_CHANCE, BAT_SPLIT_CHANCE, STARS,
} from './config.js';
import { makeSchedule, getProgress, percentageParts } from './counter.js';
import { makeFlightFrames } from './bat-flight.js';

const byId = id => document.getElementById(id);
const toggle = byId('precision-toggle');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const batTemplate = byId('bat-template');
const batLayer = byId('bat-layer');
const activeBats = new Map();
let expanded = false;
let tickTimer;
let batTimer;

const starField = byId('star-field');
const starColors = ['#edf3ee', '#dcece1', '#c1dcd0', '#e6e8d2'];

function makeNightSky() {
  const count = Math.round(Math.min(STARS.maxCount, Math.max(STARS.minCount,
    window.innerWidth * window.innerHeight / 10000 * STARS.perTenThousandPixels)));
  const stars = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const star = document.createElement('span');
    const x = Math.random();
    const y = Math.random();
    const size = 0.65 + Math.pow(Math.random(), 3) * 2.5;
    // Keep the writing legible while letting the sky continue behind it.
    const behindText = x > 0.22 && x < 0.78 && y > 0.23 && y < 0.77;
    const brightness = (0.3 + Math.random() * 0.65) * (behindText ? 0.55 : 1);
    star.className = 'star';
    if (Math.random() < STARS.twinkleFraction) star.classList.add('star--twinkle');
    if (size > 2.2) star.classList.add('star--bright');
    star.style.left = `${x * 100}%`;
    star.style.top = `${y * 100}%`;
    star.style.setProperty('--size', `${size.toFixed(2)}px`);
    star.style.setProperty('--light', brightness.toFixed(2));
    star.style.setProperty('--dim', (brightness * 0.08).toFixed(2));
    star.style.setProperty('--peak', Math.min(1, brightness * 1.65).toFixed(2));
    star.style.setProperty('--star-color', starColors[Math.floor(Math.random() * starColors.length)]);
    star.style.setProperty('--twinkle-duration', `${STARS.minTwinkleSeconds + Math.random() * (STARS.maxTwinkleSeconds - STARS.minTwinkleSeconds)}s`);
    star.style.setProperty('--twinkle-delay', `${-Math.random() * STARS.maxTwinkleSeconds}s`);
    stars.append(star);
  }
  starField.replaceChildren(stars);
}

let skyResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(skyResizeTimer);
  skyResizeTimer = setTimeout(() => {
    makeNightSky();
    resetBats();
  }, 180);
});
function pauseSky() {
  starField.classList.toggle('is-paused', document.hidden);
}
document.addEventListener('visibilitychange', pauseSky);
makeNightSky();
pauseSky();

function setText(id, text) {
  const element = byId(id);
  if (element.textContent !== text) element.textContent = text;
}

function showPrecision(value) {
  expanded = value;
  byId('degree-extra').hidden = !value;
  toggle.setAttribute('aria-expanded', String(value));
  toggle.setAttribute('aria-label', value ? 'Hide the extra decimal places' : 'Show four more decimal places');
}

try { showPrecision(localStorage.getItem('moonshine-precision') === 'true'); } catch { showPrecision(false); }
toggle.addEventListener('click', () => {
  showPrecision(!expanded);
  try { localStorage.setItem('moonshine-precision', String(expanded)); } catch { /* Storage is optional. */ }
});

function renderPercent(prefix, value) {
  const { main, extra } = percentageParts(value);
  setText(`${prefix}-main`, main);
  setText(`${prefix}-extra`, extra);
  return { main, extra };
}

try {
  const schedule = makeSchedule(ACADEMIC_YEARS, GRADUATION_DATE, TIME_ZONE);
  const previewTime = PREVIEW_NOW === null ? null : Date.parse(PREVIEW_NOW);

  function render() {
    const progress = getProgress(previewTime ?? Date.now(), schedule);
    const degree = renderPercent('degree', progress.overall);
    byId('degree-fill').style.width = `${progress.overall * 100}%`;
    renderPercent('year', progress.year);
    renderPercent('period', progress.period);
    setText('year-roman', progress.yearRoman);
    const periodLabel = progress.summerBreak ? 'Summer break' : `Semestrul ${progress.semesterRoman}`;
    setText('period-label', periodLabel);
    byId('period-label').lang = progress.summerBreak ? 'en' : 'ro';
    const accessible = byId('degree-accessible');
    accessible.setAttribute('aria-valuenow', degree.main);
    accessible.setAttribute('aria-valuetext', `${degree.main}${degree.extra}% of your degree completed`);
  }

  function startClock() {
    clearInterval(tickTimer);
    render();
    if (!document.hidden && previewTime === null) tickTimer = setInterval(render, UPDATE_INTERVAL_MS);
  }
  document.addEventListener('visibilitychange', startClock);
  startClock();
} catch (error) {
  const notice = byId('error-notice');
  notice.textContent = `The counter is taking a little rest. Please check the dates in config.js. ${error.message}`;
  notice.hidden = false;
  console.error(error);
}

const randomBetween = (min, max) => min + Math.random() * (max - min);

function nextFlock(delay) {
  clearTimeout(batTimer);
  if (motion.matches || document.hidden) return;
  batTimer = setTimeout(flyFlock, delay);
}

function flyFlock() {
  if (motion.matches || document.hidden) return;
  const count = Math.floor(randomBetween(BAT_FLOCK_SIZE.min, BAT_FLOCK_SIZE.max + 1));
  const baseSize = window.innerWidth <= 700 ? 76 : 100;
  const bar = document.querySelector('.degree__track').getBoundingClientRect();
  // The flight area stretches from the middle of the bar to the lower-right edge.
  const bounds = {
    left: bar.left + bar.width / 2,
    right: window.innerWidth + baseSize * 0.6,
    top: bar.bottom + 12,
    bottom: window.innerHeight - Math.max(42, window.innerHeight * 0.1),
  };
  if (bounds.bottom <= bounds.top + baseSize) {
    nextFlock(randomBetween(BAT_INTERVAL_MS.min, BAT_INTERVAL_MS.max));
    return;
  }
  const areaWidth = bounds.right - bounds.left;
  const areaHeight = bounds.bottom - bounds.top;
  const ascending = Math.random() < 0.5;
  const vertical = Math.random() < BAT_VERTICAL_CHANCE;
  const split = count > 1 && Math.random() < BAT_SPLIT_CHANCE;
  const verticalX = bounds.left + areaWidth * randomBetween(0.35, 0.72);
  const upper = { x: vertical ? verticalX : bounds.left + baseSize * 0.3, y: bounds.top + baseSize * 0.28 };
  const lower = { x: vertical ? verticalX : bounds.right, y: bounds.bottom - baseSize * 0.2 };
  const commonStart = ascending ? lower : upper;
  const commonEnd = ascending ? upper : lower;
  const departureVector = {
    x: (commonEnd.x - commonStart.x) * 0.32,
    y: (commonEnd.y - commonStart.y) * 0.32,
  };
  const keepInside = point => ({
    x: Math.max(bounds.left, Math.min(bounds.right, point.x)),
    y: Math.max(bounds.top, Math.min(bounds.bottom, point.y)),
  });
  let departureDelay = 0;
  for (let i = 0; i < count; i++) {
    const bat = batTemplate.content.firstElementChild.cloneNode(true);
    const size = baseSize * randomBetween(.78, 1.06);
    const lane = (i - (count - 1) / 2) * baseSize * 0.6;
    const start = keepInside({
      x: commonStart.x + (vertical ? lane : randomBetween(-18, 18)),
      y: commonStart.y + (vertical ? randomBetween(-12, 12) : lane * 0.55),
    });
    const end = keepInside({
      x: split && i > 0
        ? bounds.left + areaWidth * (0.2 + 0.55 * i / (count - 1))
        : commonEnd.x + (vertical ? lane * 1.3 : randomBetween(-22, 22)),
      y: commonEnd.y + randomBetween(-18, 18),
    });
    const properties = {
      '--bat-size': `${size}px`,
      '--wingbeat': `${randomBetween(.18, .3)}s`,
      '--wingbeat-delay': `${-Math.random()}s`,
    };
    for (const [property, value] of Object.entries(properties)) bat.style.setProperty(property, value);
    bat.classList.add('is-flying');
    batLayer.append(bat);
    const frames = makeFlightFrames(start, end, {
      size, bounds, departureVector,
      bend: Math.min(areaWidth, areaHeight) * randomBetween(-0.32, 0.32),
      bank: randomBetween(3, 9),
    });
    const flight = bat.animate(frames, {
      duration: BAT_FLIGHT_MS * randomBetween(.95, 1.18),
      delay: departureDelay,
      easing: 'linear',
      fill: 'both',
    });
    activeBats.set(bat, flight);
    departureDelay += randomBetween(BAT_DEPARTURE_GAP_MS.min, BAT_DEPARTURE_GAP_MS.max);
    flight.finished.then(() => {
      if (!activeBats.has(bat)) return;
      bat.remove();
      activeBats.delete(bat);
      if (activeBats.size === 0) nextFlock(randomBetween(BAT_INTERVAL_MS.min, BAT_INTERVAL_MS.max));
    }).catch(() => { /* A hidden tab, resize, or reduced-motion change cancels the flight. */ });
  }
}

function resetBats() {
  for (const flight of activeBats.values()) flight.cancel();
  batLayer.replaceChildren();
  activeBats.clear();
  nextFlock(BAT_FIRST_VISIT_MS);
}
motion.addEventListener('change', resetBats);
document.addEventListener('visibilitychange', resetBats);
resetBats();
