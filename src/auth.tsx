import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from './models';

const key = 'roomly.session';
function readSession(): Session | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || 'null') as Session | null;
    return value &&
      typeof value.token === 'string' &&
      typeof value.email === 'string' &&
      typeof value.userId === 'string' &&
      Date.parse(value.expiresAtUtc) > Date.now()
      ? value
      : null;
  } catch {
    return null;
  }
}
const AuthContext = createContext<{
  session: Session | null;
  setSession: (value: Session | null) => void;
}>({ session: null, setSession: () => {} });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, update] = useState(readSession);
  const setSession = (value: Session | null) => {
    try {
      if (value) sessionStorage.setItem(key, JSON.stringify(value));
      else sessionStorage.removeItem(key);
    } catch {
      /* Session stays in memory if storage is blocked. */
    }
    update(value);
  };
  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(
      () => setSession(null),
      Math.max(0, Date.parse(session.expiresAtUtc) - Date.now()),
    );
    const expired = (event: Event) => {
      if ((event as CustomEvent).detail === session.token) setSession(null);
    };
    window.addEventListener('booking:unauthorized', expired);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('booking:unauthorized', expired);
    };
  }, [session]);
  return <AuthContext.Provider value={{ session, setSession }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
