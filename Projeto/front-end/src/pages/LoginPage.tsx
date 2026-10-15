import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ROUTES } from '../routes';
import { appConfig, type AppConfig } from '../services/config';

export const DEV_LOGIN_TOKEN = 'dev-mode-login';

interface LoginPageProps {
  config?: Pick<AppConfig, 'googleClientId' | 'useMockApi'>;
}

interface LocationState {
  from?: string;
}

export function LoginPage({ config = appConfig }: LoginPageProps) {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (location.state as LocationState | null)?.from ?? ROUTES.editor;

  if (user) return <Navigate to={redirectTo} replace />;

  async function handleLogin(idToken: string) {
    setError(null);
    setSubmitting(true);
    try {
      await login(idToken);
      navigate(redirectTo, { replace: true });
    } catch {
      setError('Não foi possível entrar. Tente novamente.');
      setSubmitting(false);
    }
  }

  const hasGoogleLogin = config.googleClientId !== '';
  const showDevLogin = !hasGoogleLogin && config.useMockApi;

  return (
    <main className="login-page">
      <div className="login-card">
        <img className="login-card__logo" src="/robot.svg" alt="" width={72} height={72} />
        <h1>ELLP Blocos</h1>
        <p className="login-card__subtitle">Monte algoritmos com blocos e veja o código do robô!</p>

        {hasGoogleLogin && (
          <div className="login-card__google">
            <GoogleLogin
              onSuccess={(response) => {
                if (response.credential) void handleLogin(response.credential);
                else setError('O Google não retornou as credenciais.');
              }}
              onError={() => setError('Falha ao entrar com o Google.')}
              text="signin_with"
            />
          </div>
        )}

        {showDevLogin && (
          <button
            type="button"
            className="button button--primary"
            onClick={() => handleLogin(DEV_LOGIN_TOKEN)}
            disabled={submitting}
          >
            Entrar (modo desenvolvimento)
          </button>
        )}

        {!hasGoogleLogin && !config.useMockApi && (
          <p className="login-card__warning">
            Login indisponível: configure a variável <code>VITE_GOOGLE_CLIENT_ID</code>.
          </p>
        )}

        {error && (
          <p className="login-card__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
