import type { ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

interface OptionalGoogleProviderProps {
  clientId: string;
  children: ReactNode;
}

export function OptionalGoogleProvider({ clientId, children }: OptionalGoogleProviderProps) {
  if (!clientId) return <>{children}</>;
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
