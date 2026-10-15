import { ApiError, type ApiClient, type AuthSession, type User } from './types';

interface ErrorBody {
  message?: string;
}

type Fetch = typeof fetch;

export function createHttpApi(baseUrl: string, fetchFn: Fetch = (...args) => fetch(...args)): ApiClient {
  async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    let response: Response;
    try {
      response = await fetchFn(`${baseUrl}${path}`, { ...init, headers });
    } catch {
      throw new ApiError(0, 'Não foi possível conectar ao servidor.');
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as ErrorBody;
      throw new ApiError(response.status, body.message ?? `Erro ${response.status} na requisição.`);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  return {
    loginWithGoogle: (idToken) =>
      request<AuthSession>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      }),

    getCurrentUser: (token) => request<User>('/me', { method: 'GET' }, token),

    logout: (token) => request<void>('/auth/logout', { method: 'POST' }, token),
  };
}
