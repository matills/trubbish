import {
  bigserial,
  bigint,
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const accountStatusEnum = pgEnum('account_status', ['TO_REVIEW', 'KEEP', 'IN_PROGRESS', 'DELETED'])
export const accountSourceEnum = pgEnum('account_source', [
  'CATALOG',
  'BROWSER',
  'CONNECTED_APPS',
  'BREACH',
  'GUIDED',
  'MANUAL',
])
export const difficultyEnum = pgEnum('difficulty', ['EASY', 'MEDIUM', 'HARD', 'IMPOSSIBLE'])
export const categoryEnum = pgEnum('category', [
  'SOCIAL',
  'MESSAGING',
  'SHOPPING',
  'STREAMING',
  'GAMING',
  'TRAVEL',
  'FOOD',
  'PRODUCTIVITY',
  'FINANCE',
  'WORK',
  'DATING',
  'EDUCATION',
  'HEALTH',
  'GOVERNMENT',
  'OTHER',
])
export const lawEnum = pgEnum('law', ['AR_25326', 'GDPR'])
export const requestStatusEnum = pgEnum('request_status', ['DRAFT', 'SENT', 'ANSWERED', 'IGNORED'])
export const scanStatusEnum = pgEnum('scan_status', ['QUEUED', 'RUNNING', 'DONE', 'FAILED'])

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

export const users = pgTable('users', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: createdAt(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
})

export const catalogServices = pgTable(
  'catalog_services',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    domain: text('domain').notNull().unique(),
    /** Otros dominios que identifican al mismo servicio (ej. youtube.com → google). */
    aliases: text('aliases').array().notNull().default([]),
    category: categoryEnum('category').notNull(),
    difficulty: difficultyEnum('difficulty').notNull(),
    deleteUrl: text('delete_url'),
    recoveryUrl: text('recovery_url'),
    privacyEmail: text('privacy_email'),
    steps: text('steps'),
  },
  (t) => [index('catalog_services_category_idx').on(t.category)],
)

/**
 * El mapa de cuentas es el dato más sensible del producto: nombre, dominio,
 * servicio del catálogo y notas viajan cifrados en `payload`. `domainHash`
 * (HMAC por usuario) solo sirve para deduplicar sin revelar el dominio.
 */
export const trackedAccounts = pgTable(
  'tracked_accounts',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    domainHash: text('domain_hash').notNull(),
    payload: text('payload').notNull(),
    status: accountStatusEnum('status').notNull().default('TO_REVIEW'),
    source: accountSourceEnum('source').notNull(),
    createdAt: createdAt(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('tracked_accounts_user_domain_uq').on(t.userId, t.domainHash),
    index('tracked_accounts_user_status_idx').on(t.userId, t.status),
  ],
)

export const breachScans = pgTable(
  'breach_scans',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: scanStatusEnum('status').notNull().default('QUEUED'),
    demo: boolean('demo').notNull().default(false),
    /** Lista de brechas cifrada (JSON). */
    payload: text('payload'),
    createdAt: createdAt(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (t) => [index('breach_scans_user_created_idx').on(t.userId, t.createdAt)],
)

export const deletionRequests = pgTable(
  'deletion_requests',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: bigint('account_id', { mode: 'number' })
      .notNull()
      .references(() => trackedAccounts.id, { onDelete: 'cascade' }),
    law: lawEnum('law').notNull(),
    status: requestStatusEnum('status').notNull().default('DRAFT'),
    /** Destinatario, asunto y cuerpo de la carta, cifrados (contienen datos personales). */
    payload: text('payload').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    dueAt: timestamp('due_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index('deletion_requests_user_idx').on(t.userId), index('deletion_requests_account_idx').on(t.accountId)],
)
