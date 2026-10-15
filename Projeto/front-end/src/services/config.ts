export interface AppConfig {
  useMockApi: boolean;
  apiUrl: string;
  googleClientId: string;
}

type EnvVariables = Partial<
  Pick<ImportMetaEnv, 'VITE_USE_MOCK_API' | 'VITE_API_URL' | 'VITE_GOOGLE_CLIENT_ID'>
>;

export function readConfig(env: EnvVariables): AppConfig {
  return {
    useMockApi: env.VITE_USE_MOCK_API?.trim().toLowerCase() !== 'false',
    apiUrl: (env.VITE_API_URL ?? '').trim().replace(/\/+$/, ''),
    googleClientId: (env.VITE_GOOGLE_CLIENT_ID ?? '').trim(),
  };
}

export const appConfig: AppConfig = readConfig(import.meta.env);
