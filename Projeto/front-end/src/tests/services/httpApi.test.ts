import { describe, expect, it, vi } from 'vitest';
import { createHttpApi } from '../../services/httpApi';
import { testSession, testUser } from '../helpers';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const BASE_URL = 'http://api.test';

function setup(response: Response | Error) {
  const fetchFn = vi.fn<typeof fetch>(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  return { api: createHttpApi(BASE_URL, fetchFn), fetchFn };
}

function lastRequest(fetchFn: ReturnType<typeof setup>['fetchFn']) {
  const [url, init] = fetchFn.mock.calls[0];
  return { url, init: init ?? {}, headers: new Headers(init?.headers) };
}

describe('httpApi', () => {
  it('POST /auth/google sends the Google ID token', async () => {
    const { api, fetchFn } = setup(jsonResponse(testSession));

    await expect(api.loginWithGoogle('google-token')).resolves.toEqual(testSession);

    const { url, init, headers } = lastRequest(fetchFn);
    expect(url).toBe(`${BASE_URL}/auth/google`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ idToken: 'google-token' }));
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Authorization')).toBeNull();
  });

  it('GET /me sends the bearer token', async () => {
    const { api, fetchFn } = setup(jsonResponse(testUser));

    await expect(api.getCurrentUser('session-token')).resolves.toEqual(testUser);

    const { url, init, headers } = lastRequest(fetchFn);
    expect(url).toBe(`${BASE_URL}/me`);
    expect(init.method).toBe('GET');
    expect(headers.get('Authorization')).toBe('Bearer session-token');
  });

  it('POST /auth/logout accepts 204 No Content', async () => {
    const { api, fetchFn } = setup(new Response(null, { status: 204 }));

    await expect(api.logout('session-token')).resolves.toBeUndefined();
    expect(lastRequest(fetchFn).url).toBe(`${BASE_URL}/auth/logout`);
  });

  it('turns error responses into ApiError with the server message', async () => {
    const { api } = setup(jsonResponse({ message: 'Token inválido' }, 401));

    await expect(api.getCurrentUser('expired')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Token inválido',
    });
  });

  it('uses a generic message when the error body is not JSON', async () => {
    const { api } = setup(new Response('Internal error', { status: 500 }));

    await expect(api.loginWithGoogle('x')).rejects.toMatchObject({
      status: 500,
      message: 'Erro 500 na requisição.',
    });
  });

  it('reports network failures with status 0', async () => {
    const { api } = setup(new TypeError('Failed to fetch'));

    await expect(api.loginWithGoogle('x')).rejects.toMatchObject({
      status: 0,
      message: 'Não foi possível conectar ao servidor.',
    });
  });
});
