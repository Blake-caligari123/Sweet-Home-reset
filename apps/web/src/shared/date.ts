/** Today's date on this device as YYYY-MM-DD (real-world days: chores, saves). */
export function localDate(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
