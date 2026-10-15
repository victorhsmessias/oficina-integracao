import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { OptionalGoogleProvider } from './components/OptionalGoogleProvider';
import { AuthProvider } from './context/AuthProvider';
import { appConfig } from './services/config';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OptionalGoogleProvider clientId={appConfig.googleClientId}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </OptionalGoogleProvider>
  </StrictMode>,
);
