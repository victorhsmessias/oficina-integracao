import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../App';
import { AuthProvider } from '../../context/AuthProvider';
import type { SessionStore } from '../../services/sessionStorage';
import { createFakeApi, createMemorySessionStore, testSession } from '../helpers';

vi.mock('../../components/BlocklyEditor', () => ({
  BlocklyEditor: () => <div>editor de blocos</div>,
}));

function renderApp(path: string, sessionStore: SessionStore) {
  const api = createFakeApi();
  render(
    <AuthProvider api={api} sessionStore={sessionStore}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>,
  );
  return api;
}

describe('AppRoutes', () => {
  it('sends unauthenticated visitors to the login page', () => {
    renderApp('/', createMemorySessionStore());

    expect(screen.getByRole('heading', { name: 'ELLP Blocos' })).toBeInTheDocument();
    expect(screen.queryByText('editor de blocos')).not.toBeInTheDocument();
  });

  it('opens the editor for authenticated users and logs out back to /login', async () => {
    const user = userEvent.setup();
    const store = createMemorySessionStore(testSession);
    const api = renderApp('/editor', store);

    expect(await screen.findByText('editor de blocos')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sair' }));

    expect(screen.getByRole('heading', { name: 'ELLP Blocos' })).toBeInTheDocument();
    expect(screen.queryByText('editor de blocos')).not.toBeInTheDocument();
    expect(api.logout).toHaveBeenCalledWith(testSession.token);
    expect(store.load()).toBeNull();
  });
});
