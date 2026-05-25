import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  GATEWAY_PORT: z.coerce.number().default(8787),
  USE_HONO: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  CORS_ORIGINS: z.string().default('http://localhost:8080'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  JWT_SECRET: z.string().min(1),
  ALPACA_KEY_ID: z.string().default(''),
  ALPACA_SECRET_KEY: z.string().default(''),
  ALPACA_USE_PAPER: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  ALPACA_DATA_FEED: z.enum(['iex', 'sip']).default('iex'),
  ANTHROPIC_API_KEY: z.string().default(''),
  OPENAI_API_KEY: z.string().default(''),
  QUANTPILOT_LLM_PROVIDER: z.enum(['claude', 'openai', '']).default(''),
  QUANTPILOT_USE_MOCK_DATA: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type Env = z.infer<typeof envSchema>;

let parsed: Env | null = null;

export function getEnv(): Env {
  if (!parsed) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      const errors = result.error.issues
        .map((i) => `  ${i.path.join('.')}: ${i.message}`)
        .join('\n');
      console.error(`Environment validation failed:\n${errors}`);
      process.exit(1);
    }
    parsed = result.data;
  }
  return parsed;
}
