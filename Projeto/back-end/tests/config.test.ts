import { describe, expect, it } from 'vitest';

import { loadConfig } from '../src/config/env.js';

const required = {
  DATABASE_URL: 'postgresql://localhost/test',
  GOOGLE_CLIENT_ID: 'client.apps.googleusercontent.com',
  JWT_SECRET: 's'.repeat(32)
};

describe('loadConfig', () => {
  it('aplica padrões e separa as origens CORS', () => {
    const config = loadConfig({
      ...required,
      CORS_ORIGIN: 'http://localhost:5173, https://app.example.com '
    });

    expect(config).toMatchObject({
      nodeEnv: 'development',
      port: 3000,
      jwtExpiresIn: '8h',
      corsOrigins: ['http://localhost:5173', 'https://app.example.com']
    });
  });

  it('aceita valores explícitos', () => {
    expect(
      loadConfig({
        ...required,
        NODE_ENV: 'production',
        PORT: '8080',
        JWT_EXPIRES_IN: '30m'
      })
    ).toMatchObject({ nodeEnv: 'production', port: 8080, jwtExpiresIn: '30m' });
  });

  it('explica todas as configurações inválidas', () => {
    expect(() => loadConfig({ JWT_SECRET: 'curto' })).toThrow(
      /DATABASE_URL.*GOOGLE_CLIENT_ID.*JWT_SECRET/s
    );
  });
});
