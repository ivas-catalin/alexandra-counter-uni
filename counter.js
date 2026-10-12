const MS_PER_DAY = 86_400_000;
const ROMAN = ['I', 'II', 'III', 'IV'];

/** Convert a calendar date to midnight in an explicit IANA time zone. */
export function midnightInZone(date, timeZone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid date: ${date}`);
  const [year, month, day] = date.split('-').map(Number);
  const target = Date.UTC(year, month - 1, day);
  if (new Date(target).toISOString().slice(0, 10) !== date) {
    throw new Error(`Invalid calendar date: ${date}`);
  }
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  let guess = target;
  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(formatter.formatToParts(guess).map(p => [p.type, p.value]));
    const local = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    const adjustment = target - local;
    guess += adjustment;
    if (!adjustment) return guess;
  }
  throw new Error(`Could not resolve midnight for ${date} in ${timeZone}`);
}

export function makeSchedule(years, graduationDate, timeZone) {
  if (years.length !== 4) throw new Error('The degree must contain four academic years.');
  const graduation = midnightInZone(graduationDate, timeZone);
  const schedule = years.map((year, i) => ({
    start: midnightInZone(year.start, timeZone),
    semesterTwo: midnightInZone(year.semesterTwo, timeZone),
    summer: midnightInZone(year.summer, timeZone),
    end: i < years.length - 1 ? midnightInZone(years[i + 1].start, timeZone) : graduation,
    roman: ROMAN[i],
  }));
  for (const year of schedule) {
    if (!(year.start < year.semesterTwo && year.semesterTwo < year.summer && year.summer <= year.end)) {
      throw new Error('Dates must follow: start → semesterTwo → summer → next year / graduation.');
    }
  }
  return schedule;
}

const fraction = (now, start, end) => Math.min(1, Math.max(0, (now - start) / (end - start)));

export function getProgress(now, schedule) {
  if (!Number.isFinite(now)) throw new Error('The current or preview date is invalid.');
  const first = schedule[0];
  const last = schedule.at(-1);
  const complete = now >= last.end;
  let index = schedule.findIndex(year => now < year.end);
  if (index === -1) index = schedule.length - 1;
  const year = schedule[index];
  const summerBreak = !complete && now >= year.summer;
  const secondSemester = now >= year.semesterTwo;
  const periodStart = summerBreak ? year.summer : secondSemester ? year.semesterTwo : year.start;
  const periodEnd = summerBreak ? year.end : secondSemester ? year.summer : year.semesterTwo;
  return {
    overall: fraction(now, first.start, last.end),
    year: fraction(now, year.start, year.end),
    period: complete ? 1 : fraction(now, periodStart, periodEnd),
    yearRoman: year.roman,
    semesterRoman: secondSemester ? 'II' : 'I',
    summerBreak, complete, beforeStart: now < first.start,
    remainingDays: Math.max(0, Math.ceil((last.end - now) / MS_PER_DAY)),
  };
}

/** Truncate, so we never display 100% before the actual boundary. */
export function percentageParts(fractionValue) {
  const units = Math.min(100_000_000, Math.floor(Math.max(0, fractionValue) * 100_000_000));
  const whole = Math.floor(units / 1_000_000);
  const decimals = String(units % 1_000_000).padStart(6, '0');
  return { main: `${whole}.${decimals.slice(0, 2)}`, extra: decimals.slice(2) };
}
