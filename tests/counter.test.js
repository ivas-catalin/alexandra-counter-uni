import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSchedule, getProgress, midnightInZone, percentageParts } from '../counter.js';
import { ACADEMIC_YEARS, GRADUATION_DATE, TIME_ZONE } from '../config.js';

const schedule = makeSchedule(ACADEMIC_YEARS, GRADUATION_DATE, TIME_ZONE);
const at = timestamp => getProgress(Date.parse(timestamp), schedule);

test('Bucharest midnight uses the correct summer and winter offsets', () => {
  assert.equal(new Date(midnightInZone('2026-09-28', TIME_ZONE)).toISOString(), '2026-09-27T21:00:00.000Z');
  assert.equal(new Date(midnightInZone('2027-03-01', TIME_ZONE)).toISOString(), '2027-02-28T22:00:00.000Z');
});
test('before enrollment and at the exact start, all counters are zero', () => {
  for (const timestamp of ['2026-01-01T00:00:00Z', '2026-09-28T00:00:00+03:00']) {
    const state = at(timestamp);
    assert.equal(state.overall, 0);
    assert.equal(state.year, 0);
    assert.equal(state.period, 0);
    assert.equal(state.yearRoman, 'I');
    assert.equal(state.semesterRoman, 'I');
  }
});
test('1 March starts semester II exactly at Bucharest midnight', () => {
  const before = at('2027-02-28T23:59:59.999+02:00');
  const after = at('2027-03-01T00:00:00+02:00');
  assert.equal(before.semesterRoman, 'I');
  assert.ok(before.period > .999);
  assert.equal(after.semesterRoman, 'II');
  assert.equal(after.period, 0);
  assert.ok(after.overall > before.overall);
});
test('July starts summer break with its own progress', () => {
  const before = at('2027-06-30T23:59:59.999+03:00');
  const after = at('2027-07-01T00:00:00+03:00');
  assert.equal(before.summerBreak, false);
  assert.equal(after.summerBreak, true);
  assert.equal(after.period, 0);
  assert.equal(after.yearRoman, 'I');
  assert.ok(after.year < 1);
});
test('degree and year continue increasing throughout the summer', () => {
  const july = at('2027-07-01T00:00:00+03:00');
  const august = at('2027-08-15T12:00:00+03:00');
  assert.ok(august.overall > july.overall);
  assert.ok(august.year > july.year);
  assert.ok(august.period > 0 && august.period < 1);
  assert.equal(august.summerBreak, true);
  assert.equal(august.yearRoman, 'I');
});
test('every new year resets the year and semester, with the correct Roman numeral', () => {
  for (let i = 1; i < 4; i++) {
    const before = getProgress(schedule[i].start - 1, schedule);
    const after = getProgress(schedule[i].start, schedule);
    assert.equal(before.summerBreak, true);
    assert.ok(before.year > .999);
    assert.equal(after.yearRoman, ['I', 'II', 'III', 'IV'][i]);
    assert.equal(after.year, 0);
    assert.equal(after.semesterRoman, 'I');
    assert.equal(after.period, 0);
    assert.equal(after.summerBreak, false);
    assert.ok(after.overall >= before.overall);
  }
});
test('leap day and daylight-saving transitions are continuous', () => {
  for (const stamp of ['2028-02-29T00:00:00+02:00', '2027-03-28T04:00:00+03:00', '2026-10-25T04:00:00+02:00']) {
    const now = Date.parse(stamp);
    const before = getProgress(now - 1, schedule);
    const after = getProgress(now, schedule);
    assert.ok(after.overall > before.overall);
    assert.ok(after.year > before.year);
    assert.ok(after.period > before.period);
  }
});
test('graduation clamps all counters to 100%, with no phantom summer or year V', () => {
  for (const stamp of ['2030-07-01T00:00:00+03:00', '2040-01-01T00:00:00Z']) {
    const state = at(stamp);
    assert.equal(state.overall, 1);
    assert.equal(state.year, 1);
    assert.equal(state.period, 1);
    assert.equal(state.yearRoman, 'IV');
    assert.equal(state.semesterRoman, 'II');
    assert.equal(state.summerBreak, false);
    assert.equal(state.complete, true);
  }
});
test('six decimals split into two large and four small digits without rounding up early', () => {
  assert.deepEqual(percentageParts(.123456789), { main: '12.34', extra: '5678' });
  assert.deepEqual(percentageParts(.9999999999), { main: '99.99', extra: '9999' });
  assert.deepEqual(percentageParts(1), { main: '100.00', extra: '0000' });
  assert.deepEqual(percentageParts(0), { main: '0.00', extra: '0000' });
});
test('invalid and unordered manually edited dates fail clearly', () => {
  assert.throws(() => midnightInZone('2027-02-30', TIME_ZONE), /Invalid calendar/);
  assert.throws(() => midnightInZone('28-09-2026', TIME_ZONE), /Invalid date/);
  const years = structuredClone(ACADEMIC_YEARS);
  years[0].semesterTwo = '2026-08-01';
  assert.throws(() => makeSchedule(years, GRADUATION_DATE, TIME_ZONE), /Dates must follow/);
  assert.throws(() => getProgress(NaN, schedule), /date is invalid/);
});
