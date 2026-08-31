/** Documented C3 clock: 816 ticks/month, 51-tick sixteenths, 15 ticks/tile at speed 6. */

export const TICKS_PER_TILE = 15;
export const TICKS_PER_SIXTEENTH = 51;
export const SIXTEENTHS_PER_MONTH = 16;
export const TICKS_PER_MONTH = TICKS_PER_SIXTEENTH * SIXTEENTHS_PER_MONTH;
export const MONTHS_PER_YEAR = 12;

export const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function isSixteenth(tick: number): boolean {
  return tick > 0 && tick % TICKS_PER_SIXTEENTH === 0;
}

export function isMonthStart(tick: number): boolean {
  return tick > 0 && tick % TICKS_PER_MONTH === 0;
}

export function calendarFromTick(tick: number): { year: number; month: number; name: string } {
  const months = Math.floor(tick / TICKS_PER_MONTH);
  const month = months % MONTHS_PER_YEAR;
  const year = 330 + Math.floor(months / MONTHS_PER_YEAR);
  return { year, month, name: MONTH_NAMES[month] };
}
