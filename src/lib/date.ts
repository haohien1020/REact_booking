export const timeZone = 'Asia/Ho_Chi_Minh';
export const formatTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
export const formatDateTime = (value: string) => `${formatTime(value)} · ${formatDate(value)}`;
export function today() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function addDays(day: string, amount: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function dayRange(day: string) {
  return {
    from: new Date(`${day}T00:00:00+07:00`).toISOString(),
    to: new Date(`${addDays(day, 1)}T00:00:00+07:00`).toISOString(),
  };
}
