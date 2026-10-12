// ✧ EDIT YOUR DATES HERE ✧
// YYYY-MM-DD. Every boundary is midnight in TIME_ZONE, even for visitors abroad.
// Summers count: each year continues until the next year's start.
// The final year ends on its graduation date (1 July by default).
export const TIME_ZONE = 'Europe/Bucharest';

export const ACADEMIC_YEARS = [
  { start: '2026-09-28', semesterTwo: '2027-03-01', summer: '2027-07-01' },
  { start: '2027-09-28', semesterTwo: '2028-03-01', summer: '2028-07-01' },
  { start: '2028-09-28', semesterTwo: '2029-03-01', summer: '2029-07-01' },
  { start: '2029-09-28', semesterTwo: '2030-03-01', summer: '2030-07-01' },
];
export const GRADUATION_DATE = '2030-07-01';

// Set an ISO timestamp with an offset to preview any date; keep null for live time.
// Example: '2027-07-15T12:00:00+03:00' previews the first summer break.
export const PREVIEW_NOW = null;
export const UPDATE_INTERVAL_MS = 100;
export const BAT_FIRST_VISIT_MS = 100;
export const BAT_INTERVAL_MS = { min: 35000, max: 65000 };
export const BAT_FLIGHT_MS = 6800;
export const BAT_FLOCK_SIZE = { min: 3, max: 3 };
export const BAT_DEPARTURE_GAP_MS = { min: 1000, max: 2100 };
export const BAT_VERTICAL_CHANCE = 0.3;
export const BAT_SPLIT_CHANCE = 0.65;

// Night sky: random positions, mostly small stars, with only some twinkling.
export const STARS = {
  perTenThousandPixels: 9,
  minCount: 220,
  maxCount: 1400,
  twinkleFraction: 0.46,
  minTwinkleSeconds: 1.8,
  maxTwinkleSeconds: 4.6,
};
