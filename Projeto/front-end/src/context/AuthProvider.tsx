import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiClient, type ApiClient, type AuthSession } from '../services/api';
import { createLocalSessionStore, type SessionStore } from '../services/sessionStorage';
import { AuthContext, type AuthContextValue } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
  api?: ApiClient;
  sessionStore?: SessionStore;
}

const defaultSessionStore = createLocalSessionStore();

export function AuthProvider({
  children,
  api = apiClient,
  sessionStore = defaultSessionStore,
}: AuthProviderProps) {
  const [storedSession] = useState(() => sessionStore.load());
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(storedSession !== null);

  useEffect(() => {
    if (!storedSession) return;
    let active = true;

    api
      .getCurrentUser(storedSession.token)
      .then((user) => {
        if (!active) return;
        const refreshed = { token: storedSession.token, user };
        sessionStore.save(refreshed);
        setSession(refreshed);
      })
      .catch(() => {
        if (active) sessionStore.clear();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [api, sessionStore, storedSession]);

  const login = useCallback(
    async (idToken: string) => {
      const newSession = await api.loginWithGoogle(idToken);
      sessionStore.save(newSession);
      setSession(newSession);
    },
    [api, sessionStore],
  );

  const logout = useCallback(async () => {
    const token = session?.token;
    sessionStore.clear();
    setSession(null);
    if (!token) return;
    try {
      await api.logout(token);
    } catch {}
  }, [api, session, sessionStore]);

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user ?? null, loading, login, logout }),
    [session, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
