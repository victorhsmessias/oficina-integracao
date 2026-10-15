import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ROUTES } from '../routes';

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate(ROUTES.login, { replace: true });
  }

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <img src="/robot.svg" alt="" width={32} height={32} />
        <span>ELLP Blocos</span>
      </div>
      {user && (
        <div className="app-header__user">
          {user.avatarUrl && (
            <img className="app-header__avatar" src={user.avatarUrl} alt="" width={32} height={32} />
          )}
          <span className="app-header__name">Olá, {user.name}</span>
          <button type="button" className="button" onClick={handleLogout}>
            Sair
          </button>
        </div>
      )}
    </header>
  );
}
