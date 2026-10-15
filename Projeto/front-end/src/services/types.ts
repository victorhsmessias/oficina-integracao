export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface ApiClient {
  loginWithGoogle(idToken: string): Promise<AuthSession>;
  getCurrentUser(token: string): Promise<User>;
  logout(token: string): Promise<void>;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
