import { describe, expect, it } from 'vitest';
import { createApiClient, mockApi } from '../../services/api';
import { readConfig } from '../../services/config';

describe('readConfig', () => {
  it('uses the mock API by default', () => {
    expect(readConfig({})).toEqual({ useMockApi: true, apiUrl: '', googleClientId: '' });
  });

  it('only disables the mock with an explicit "false"', () => {
    expect(readConfig({ VITE_USE_MOCK_API: 'FALSE ' }).useMockApi).toBe(false);
    expect(readConfig({ VITE_USE_MOCK_API: 'true' }).useMockApi).toBe(true);
    expect(readConfig({ VITE_USE_MOCK_API: '' }).useMockApi).toBe(true);
  });

  it('normalizes the API URL and the Google client ID', () => {
    const config = readConfig({
      VITE_API_URL: ' http://localhost:3000/ ',
      VITE_GOOGLE_CLIENT_ID: ' abc.apps.googleusercontent.com ',
    });

    expect(config.apiUrl).toBe('http://localhost:3000');
    expect(config.googleClientId).toBe('abc.apps.googleusercontent.com');
  });
});

describe('createApiClient', () => {
  it('chooses the implementation from the configuration', () => {
    const base = { apiUrl: 'http://api.test', googleClientId: '' };

    expect(createApiClient({ ...base, useMockApi: true })).toBe(mockApi);
    expect(createApiClient({ ...base, useMockApi: false })).not.toBe(mockApi);
  });
});
