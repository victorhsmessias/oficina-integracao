import 'dotenv/config';

import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { GoogleIdentityTokenVerifier } from './infra/auth/google-token-verifier.js';
import { JwtSessionProvider } from './infra/auth/jwt-session-provider.js';
import { PrismaProjectRepository } from './infra/database/prisma-project-repository.js';
import { PrismaDatabaseHealthChecker } from './infra/database/prisma-database-health-checker.js';
import { PrismaUserRepository } from './infra/database/prisma-user-repository.js';
import { createPrismaClient } from './infra/database/prisma.js';
import { AuthService } from './services/auth-service.js';
import { ProjectService } from './services/project-service.js';

const config = loadConfig();
const prisma = createPrismaClient(config.databaseUrl);
const users = new PrismaUserRepository(prisma);
const projects = new PrismaProjectRepository(prisma);
const sessions = new JwtSessionProvider(config.jwtSecret, config.jwtExpiresIn);
const authService = new AuthService(
  users,
  new GoogleIdentityTokenVerifier(config.googleClientId),
  sessions
);
const projectService = new ProjectService(projects);
const databaseHealth = new PrismaDatabaseHealthChecker(prisma);
const app = createApp({
  authService,
  projectService,
  sessions,
  databaseHealth,
  corsOrigins: config.corsOrigins
});

async function start(): Promise<void> {
  await prisma.$connect();
  console.log('Conexão com o PostgreSQL estabelecida');

  const server = app.listen(config.port, () => {
    console.log(`API ELLP Blocos disponível em http://localhost:${config.port}`);
  });

  async function shutdown(signal: string): Promise<void> {
    console.log(`${signal} recebido; encerrando a API...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

start().catch(async (error: unknown) => {
  console.error('Não foi possível iniciar a API:', error);
  await prisma.$disconnect();
  process.exit(1);
});
