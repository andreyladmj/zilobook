// The platform's fake-UTC convention: appointment times are the pro's wall
// clock (Europe/Kyiv for now) labeled as UTC. Anything derived from the
// visitor's real "now" must be converted to Kyiv wall time first — the
// browser's local timezone is irrelevant.

const TZ = "Europe/Kyiv";

/** Today's date in Kyiv as YYYY-MM-DD (sv-SE locale formats exactly that). */
export function kyivToday(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
}

/** Current Kyiv wall-clock hours and minutes. */
export function kyivNow(): { hours: number; minutes: number } {
  const s = new Date().toLocaleTimeString("en-GB", { timeZone: TZ, hour12: false });
  const [h, m] = s.split(":");
  return { hours: Number(h), minutes: Number(m) };
}
