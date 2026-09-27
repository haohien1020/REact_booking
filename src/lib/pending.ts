// Keep the same key after an ambiguous network error, navigation or page refresh.
const memory = new Map<string, string>();
const storageKey = (userId: string, slotId: string) => `roomly.pending.${userId}.${slotId}`;
export function bookingKey(userId: string, slotId: string) {
  const key = storageKey(userId, slotId);
  let value = memory.get(key);
  try {
    value ||= sessionStorage.getItem(key) || undefined;
  } catch {
    /* In-memory fallback. */
  }
  value ||= crypto.randomUUID();
  memory.set(key, value);
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* In-memory fallback. */
  }
  return value;
}
export function finishBooking(userId: string, slotId: string) {
  const key = storageKey(userId, slotId);
  memory.delete(key);
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* Storage may be disabled. */
  }
}
