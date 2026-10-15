import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../context/AuthProvider';
import { DEV_LOGIN_TOKEN, LoginPage } from '../../pages/LoginPage';
import type { ApiClient } from '../../services/api';
import { createFakeApi, createMemorySessionStore, testSession } from '../helpers';

interface FakeGoogleLoginProps {
  onSuccess(response: { credential?: string }): void;
  onError(): void;
}

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess, onError }: FakeGoogleLoginProps) => (
    <>
      <button onClick={() => onSuccess({ credential: 'google-credential' })}>Google</button>
      <button onClick={() => onSuccess({})}>Google sem credencial</button>
      <button onClick={onError}>Google com erro</button>
    </>
  ),
}));

type Config = { googleClientId: string; useMockApi: boolean };

function renderLogin(config: Config, api: ApiClient = createFakeApi(), session = createMemorySessionStore()) {
  return render(
    <AuthProvider api={api} sessionStore={session}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage config={config} />} />
          <Route path="/editor" element={<p>Editor aberto</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('LoginPage', () => {
  it('shows the development login only when the mock is active and there is no client ID', async () => {
    const user = userEvent.setup();
    const api = createFakeApi();
    renderLogin({ googleClientId: '', useMockApi: true }, api);

    expect(screen.queryByRole('button', { name: 'Google' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Entrar (modo desenvolvimento)' }));

    expect(await screen.findByText('Editor aberto')).toBeInTheDocument();
    expect(api.loginWithGoogle).toHaveBeenCalledWith(DEV_LOGIN_TOKEN);
  });

  it('does not offer the development login with the real API', () => {
    renderLogin({ googleClientId: '', useMockApi: false });

    expect(screen.queryByRole('button', { name: /modo desenvolvimento/i })).not.toBeInTheDocument();
    expect(screen.getByText(/VITE_GOOGLE_CLIENT_ID/)).toBeInTheDocument();
  });

  it('logs in with the Google credential when a client ID is configured', async () => {
    const user = userEvent.setup();
    const api = createFakeApi();
    renderLogin({ googleClientId: 'client-id', useMockApi: true }, api);

    expect(screen.queryByRole('button', { name: /modo desenvolvimento/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Google' }));

    expect(await screen.findByText('Editor aberto')).toBeInTheDocument();
    expect(api.loginWithGoogle).toHaveBeenCalledWith('google-credential');
  });

  it('shows an error when Google fails or returns no credential', async () => {
    const user = userEvent.setup();
    renderLogin({ googleClientId: 'client-id', useMockApi: false });

    await user.click(screen.getByRole('button', { name: 'Google com erro' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao entrar com o Google.');

    await user.click(screen.getByRole('button', { name: 'Google sem credencial' }));
    expect(screen.getByRole('alert')).toHaveTextContent('O Google não retornou as credenciais.');
  });

  it('shows an error when the API refuses the login', async () => {
    const user = userEvent.setup();
    const api = createFakeApi({ loginWithGoogle: vi.fn().mockRejectedValue(new Error('403')) });
    renderLogin({ googleClientId: '', useMockApi: true }, api);

    await user.click(screen.getByRole('button', { name: 'Entrar (modo desenvolvimento)' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível entrar.');
    expect(screen.getByRole('button', { name: 'Entrar (modo desenvolvimento)' })).toBeEnabled();
  });

  it('sends an already authenticated user to the editor', async () => {
    renderLogin({ googleClientId: '', useMockApi: true }, createFakeApi(), createMemorySessionStore(testSession));

    expect(await screen.findByText('Editor aberto')).toBeInTheDocument();
  });
});
