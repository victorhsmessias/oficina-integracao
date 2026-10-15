import 'dotenv/config';
import { defineConfig } from 'prisma/config';

process.env.DATABASE_URL ??= 'postgresql://ellp:ellp@localhost:5432/ellp_blocos';

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  }
});
