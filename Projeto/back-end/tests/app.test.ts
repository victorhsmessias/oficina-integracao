import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { AuthService } from '../src/services/auth-service.js';
import { ProjectService } from '../src/services/project-service.js';
import {
  FakeGoogleVerifier,
  FakeDatabaseHealthChecker,
  FakeProjectRepository,
  FakeSessionProvider,
  FakeUserRepository,
  userFixture
} from './fakes.js';

const token = `session:${userFixture.id}`;

describe('API ELLP Blocos', () => {
  const users = new FakeUserRepository();
  const projects = new FakeProjectRepository();
  const sessions = new FakeSessionProvider();
  const databaseHealth = new FakeDatabaseHealthChecker();
  const app = createApp({
    authService: new AuthService(users, new FakeGoogleVerifier(), sessions),
    projectService: new ProjectService(projects),
    sessions,
    databaseHealth,
    corsOrigins: ['http://localhost:5173']
  });

  beforeEach(() => {
    users.user = userFixture;
    projects.projects = [];
    databaseHealth.error = null;
  });

  it('informa que a API está saudável', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('confirma que a API e o PostgreSQL estão prontos', async () => {
    const response = await request(app).get('/ready');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ready', database: 'connected' });
  });

  it('não informa prontidão quando o PostgreSQL está indisponível', async () => {
    databaseHealth.error = new Error('database offline');
    const response = await request(app).get('/ready');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Erro interno do servidor' });
  });

  it('troca o token Google por uma sessão e usuário público', async () => {
    const response = await request(app).post('/auth/google').send({ idToken: 'google-token' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      token,
      user: {
        id: userFixture.id,
        name: 'Ana Souza',
        email: 'ana@gmail.com',
        avatarUrl: 'https://example.com/ana.png'
      }
    });
  });

  it('rejeita login sem idToken', async () => {
    const response = await request(app).post('/auth/google').send({});
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('idToken é obrigatório');
  });

  it('rejeita campos não previstos com mensagem em português', async () => {
    const response = await request(app)
      .post('/auth/google')
      .send({ idToken: 'google-token', campoExtra: true });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Campos não permitidos: campoExtra' });
  });

  it('retorna o usuário da sessão atual', async () => {
    const response = await request(app).get('/me').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.email).toBe('ana@gmail.com');
    expect(response.body.googleId).toBeUndefined();
  });

  it('retorna a mensagem prevista para sessão expirada', async () => {
    const response = await request(app).get('/me').set('Authorization', 'Bearer expired');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Sessão expirada' });
  });

  it('exige autenticação e encerra uma sessão JWT sem estado', async () => {
    expect((await request(app).post('/auth/logout')).status).toBe(401);
    expect(
      (await request(app).post('/auth/logout').set('Authorization', `Bearer ${token}`)).status
    ).toBe(204);
  });

  it('cria, lista, lê, atualiza e exclui somente o projeto do usuário', async () => {
    const workspace = { blocks: { languageVersion: 0, blocks: [] } };
    const created = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '  Meu robô  ', workspace });

    expect(created.status).toBe(201);
    expect(created.body.name).toBe('Meu robô');
    expect(created.body.workspace).toEqual(workspace);

    const id = created.body.id as string;
    const listed = await request(app)
      .get('/projects')
      .set('Authorization', `Bearer ${token}`);
    expect(listed.body).toEqual([
      { id, name: 'Meu robô', updatedAt: '2026-10-14T20:00:00.000Z' }
    ]);
    expect(listed.body[0].workspace).toBeUndefined();

    const found = await request(app)
      .get(`/projects/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(found.status).toBe(200);

    const updated = await request(app)
      .put(`/projects/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Versão 2' });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe('Versão 2');

    const removed = await request(app)
      .delete(`/projects/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(removed.status).toBe(204);

    const missing = await request(app)
      .get(`/projects/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(404);
  });

  it.each([
    [{ name: '', workspace: {} }, 'name não pode ser vazio'],
    [{ name: 'x'.repeat(101), workspace: {} }, 'name deve ter no máximo 100 caracteres'],
    [{ name: 'Projeto', workspace: [] }, 'workspace deve ser um objeto JSON']
  ])('valida o corpo de criação de projeto', async (body, message) => {
    const response = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(message);
  });

  it('rejeita atualização vazia', async () => {
    const response = await request(app)
      .put('/projects/22222222-2222-4222-8222-222222222222')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Informe name ou workspace para atualizar');
  });

  it('não revela projetos de outro usuário', async () => {
    await projects.create('outro-usuario', { name: 'Privado', workspace: {}, schemaVersion: 1 });
    const response = await request(app)
      .get('/projects/22222222-2222-4222-8222-222222222222')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Projeto não encontrado' });
  });

  it('retorna 413 quando o JSON ultrapassa 256 KB', async () => {
    const response = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Grande', workspace: { data: 'x'.repeat(270 * 1024) } });
    expect(response.status).toBe(413);
  });

  it('aplica a lista de origens permitidas do CORS', async () => {
    const allowed = await request(app).get('/health').set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const denied = await request(app).get('/health').set('Origin', 'https://malicioso.test');
    expect(denied.status).toBe(403);
    expect(denied.body).toEqual({ message: 'Origem não permitida pelo CORS' });
  });
});
