import { defineConfig } from '@prisma/config';

export default defineConfig({
  migrations: {
    // Le indicamos a Prisma 7 el comando exacto para ejecutar tu seed
    seed: 'node ./prisma/seed.js', 
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});