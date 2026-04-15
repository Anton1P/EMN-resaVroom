import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // Chemin vers le schéma Prisma
  schema: "prisma/schema.prisma",

  // Configuration des migrations et du seed
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },

  // URL de la base de données pour le CLI Prisma (migrations)
  datasource: {
    url: env("DATABASE_URL"),
  },
});
