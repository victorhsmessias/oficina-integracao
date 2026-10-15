import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { AuthProvider } from '../../context/AuthProvider';
import type { ApiClient } from '../../services/api';
import type { SessionStore } from '../../services/sessionStorage';
import { createFakeApi, createMemorySessionStore, testSession } from '../helpers';

function LoginStub() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return <p>Página de login (voltar para {from})</p>;
}

function renderAt(path: string, api: ApiClient, sessionStore: SessionStore) {
  return render(
    <AuthProvider api={api} sessionStore={sessionStore}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginStub />} />
          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <p>Conteúdo protegido</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('ProtectedRoute', () => {
  it('redirects to /login when there is no session', () => {
    renderAt('/editor', createFakeApi(), createMemorySessionStore());

    expect(screen.getByText('Página de login (voltar para /editor)')).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument();
  });

  it('shows a loading state while the saved session is validated, then the content', async () => {
    renderAt('/editor', createFakeApi(), createMemorySessionStore(testSession));

    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
    expect(await screen.findByText('Conteúdo protegido')).toBeInTheDocument();
  });

  it('redirects to /login when the saved session has expired', async () => {
    const api = createFakeApi({
      getCurrentUser: async () => {
        throw new Error('401');
      },
    });
    renderAt('/editor', api, createMemorySessionStore(testSession));

    expect(await screen.findByText(/Página de login/)).toBeInTheDocument();
  });
});
