/**
 * Aplica o schema no banco automaticamente ao iniciar o servidor.
 * Usa CREATE TABLE IF NOT EXISTS + ALTER TABLE ADD COLUMN IF NOT EXISTS
 * para ser idempotente — pode rodar múltiplas vezes sem erro.
 */
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

const tables = [
  // better-auth
  `CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "emailVerified" boolean NOT NULL DEFAULT false,
    "image" text,
    "role" text NOT NULL DEFAULT 'tutor',
    "phone" text,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY,
    "expiresAt" timestamp NOT NULL,
    "token" text NOT NULL UNIQUE,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now(),
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp,
    "refreshTokenExpiresAt" timestamp,
    "scope" text,
    "password" text,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expiresAt" timestamp NOT NULL,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
  )`,
  // app tables
  `CREATE TABLE IF NOT EXISTS "petshops" (
    "id" serial PRIMARY KEY,
    "userId" text NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "address" text NOT NULL,
    "city" text,
    "phone" text,
    "lat" double precision NOT NULL,
    "lng" double precision NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "pets" (
    "id" serial PRIMARY KEY,
    "userId" text NOT NULL,
    "name" text NOT NULL,
    "species" text NOT NULL,
    "breed" text,
    "birthdate" text,
    "notes" text,
    "createdAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "services" (
    "id" serial PRIMARY KEY,
    "petshopId" integer NOT NULL,
    "userId" text NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "priceCents" integer NOT NULL DEFAULT 0,
    "durationMin" integer NOT NULL DEFAULT 30,
    "createdAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "appointments" (
    "id" serial PRIMARY KEY,
    "tutorId" text NOT NULL,
    "petshopUserId" text NOT NULL,
    "petshopId" integer NOT NULL,
    "petId" integer NOT NULL,
    "serviceId" integer NOT NULL,
    "scheduledAt" timestamp NOT NULL,
    "status" text NOT NULL DEFAULT 'pending',
    "notes" text,
    "createdAt" timestamp NOT NULL DEFAULT now()
  )`,
]

// Colunas adicionadas após a criação inicial das tabelas (migrations incrementais)
const alterations = [
  // Sprint 2 — soft delete de serviços
  `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true`,
  // Sprint 4 — observações do pet shop nos agendamentos
  `ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "petshopNotes" text`,
]

export async function runMigrations() {
  for (const ddl of tables) {
    await db.execute(sql.raw(ddl))
  }
  for (const ddl of alterations) {
    await db.execute(sql.raw(ddl))
  }
  console.log("✅ Banco de dados pronto")
}
