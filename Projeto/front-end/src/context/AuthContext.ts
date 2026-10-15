import { createContext } from 'react';
import type { User } from '../services/api';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login(idToken: string): Promise<void>;
  logout(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
