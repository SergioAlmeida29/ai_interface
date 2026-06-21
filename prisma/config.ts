import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

loadEnv({ path: ".env.local" });

export default defineConfig({
  schema: "schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL!,
  },
  migrate: {
    adapter: () => new PrismaPg({ connectionString: process.env.DIRECT_URL! }),
  },
});
