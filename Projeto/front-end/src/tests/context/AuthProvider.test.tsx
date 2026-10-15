import { render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../context/AuthProvider';
import { useAuth } from '../../context/useAuth';
import type { ApiClient } from '../../services/api';
import type { SessionStore } from '../../services/sessionStorage';
import { createFakeApi, createMemorySessionStore, testSession, testUser } from '../helpers';

function AuthConsumer() {
  const { user, loading, login, logout } = useAuth();
  if (loading) return <p>carregando</p>;
  return (
    <div>
      <p>{user ? `logado como ${user.name}` : 'deslogado'}</p>
      <button onClick={() => login('google-id-token').catch(() => {})}>entrar</button>
      <button onClick={() => logout()}>sair</button>
    </div>
  );
}

function renderWithAuth(api: ApiClient, sessionStore: SessionStore) {
  return render(
    <AuthProvider api={api} sessionStore={sessionStore}>
      <AuthConsumer />
    </AuthProvider>,
  );
}

describe('AuthContext', () => {
  it('starts logged out when there is no saved session', () => {
    const api = createFakeApi();
    renderWithAuth(api, createMemorySessionStore());

    expect(screen.getByText('deslogado')).toBeInTheDocument();
    expect(api.getCurrentUser).not.toHaveBeenCalled();
  });

  it('logs in with the Google token and saves the session', async () => {
    const user = userEvent.setup();
    const api = createFakeApi();
    const store = createMemorySessionStore();
    renderWithAuth(api, store);

    await user.click(screen.getByRole('button', { name: 'entrar' }));

    expect(await screen.findByText(`logado como ${testUser.name}`)).toBeInTheDocument();
    expect(api.loginWithGoogle).toHaveBeenCalledWith('google-id-token');
    expect(store.save).toHaveBeenCalledWith(testSession);
  });

  it('stays logged out when the API rejects the login', async () => {
    const user = userEvent.setup();
    const api = createFakeApi({ loginWithGoogle: vi.fn().mockRejectedValue(new Error('403')) });
    const store = createMemorySessionStore();
    renderWithAuth(api, store);

    await user.click(screen.getByRole('button', { name: 'entrar' }));

    await waitFor(() => expect(api.loginWithGoogle).toHaveBeenCalled());
    expect(screen.getByText('deslogado')).toBeInTheDocument();
    expect(store.save).not.toHaveBeenCalled();
  });

  it('logs out, clears the saved session and notifies the API', async () => {
    const user = userEvent.setup();
    const api = createFakeApi();
    const store = createMemorySessionStore(testSession);
    renderWithAuth(api, store);
    await screen.findByText(`logado como ${testUser.name}`);

    await user.click(screen.getByRole('button', { name: 'sair' }));

    expect(screen.getByText('deslogado')).toBeInTheDocument();
    expect(store.clear).toHaveBeenCalled();
    expect(api.logout).toHaveBeenCalledWith(testSession.token);
  });

  it('logs out locally even if the API fails', async () => {
    const user = userEvent.setup();
    const api = createFakeApi({ logout: vi.fn().mockRejectedValue(new Error('offline')) });
    renderWithAuth(api, createMemorySessionStore(testSession));
    await screen.findByText(`logado como ${testUser.name}`);

    await user.click(screen.getByRole('button', { name: 'sair' }));

    expect(screen.getByText('deslogado')).toBeInTheDocument();
  });

  it('restores a saved session after validating it with the API', async () => {
    const api = createFakeApi();
    renderWithAuth(api, createMemorySessionStore(testSession));

    expect(screen.getByText('carregando')).toBeInTheDocument();
    expect(await screen.findByText(`logado como ${testUser.name}`)).toBeInTheDocument();
    expect(api.getCurrentUser).toHaveBeenCalledWith(testSession.token);
  });

  it('discards a saved session the API no longer accepts', async () => {
    const api = createFakeApi({ getCurrentUser: vi.fn().mockRejectedValue(new Error('401')) });
    const store = createMemorySessionStore(testSession);
    renderWithAuth(api, store);

    expect(await screen.findByText('deslogado')).toBeInTheDocument();
    expect(store.clear).toHaveBeenCalled();
  });

  it('throws a clear error when used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow('useAuth deve ser usado dentro de <AuthProvider>.');
  });
});
