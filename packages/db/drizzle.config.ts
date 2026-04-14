import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/collections-schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
} satisfies Config;
