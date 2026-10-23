import { z } from 'zod'

const optional = z
  .string()
  .optional()
  .transform((v) => v || undefined)

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3010),
  FRONTEND_URL: z.string().url().default('http://localhost:5174'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  ENCRYPTION_KEY: z
    .string()
    .refine((v) => Buffer.from(v, 'base64').length === 32, 'ENCRYPTION_KEY debe ser 32 bytes en base64'),
  JWT_SECRET: z.string().min(32),
  SMTP_URL: optional,
  MAIL_FROM: z.string().default('Borrar mi vida digital <no-reply@localhost>'),
  HIBP_API_KEY: optional,
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`Variables de entorno inválidas:\n${issues}`)
  }
  return parsed.data
}
