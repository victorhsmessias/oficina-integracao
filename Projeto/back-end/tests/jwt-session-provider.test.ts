import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

import { JwtSessionProvider } from '../src/infra/auth/jwt-session-provider.js';

const secret = 'segredo-de-testes-com-mais-de-32-caracteres';

describe('JwtSessionProvider', () => {
  it('assina e valida uma sessão com sub, iat e exp', () => {
    const provider = new JwtSessionProvider(secret, '8h');
    const token = provider.sign('usuario-1');
    const decoded = jwt.decode(token) as jwt.JwtPayload;

    expect(decoded.sub).toBe('usuario-1');
    expect(decoded.iat).toEqual(expect.any(Number));
    expect(decoded.exp).toEqual(expect.any(Number));
    expect(provider.verify(token)).toEqual({ valid: true, userId: 'usuario-1' });
  });

  it('distingue sessão expirada de sessão inválida', () => {
    const expired = new JwtSessionProvider(secret, '-1s').sign('usuario-1');
    const provider = new JwtSessionProvider(secret, '8h');

    expect(provider.verify(expired)).toEqual({ valid: false, reason: 'expired' });
    expect(provider.verify('não-é-jwt')).toEqual({ valid: false, reason: 'invalid' });
  });

  it('rejeita token assinado sem subject', () => {
    const token = jwt.sign({}, secret, { expiresIn: '1h' });
    expect(new JwtSessionProvider(secret, '8h').verify(token)).toEqual({
      valid: false,
      reason: 'invalid'
    });
  });
});
