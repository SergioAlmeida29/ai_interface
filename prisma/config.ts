import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  schema: "schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL!,
  },
  migrate: {
    adapter: () => new PrismaPg({ connectionString: process.env.DIRECT_URL! }),
  },
});
