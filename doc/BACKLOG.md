# Backlog de implementação — PetCare

O que está mapeado aqui são lacunas reais identificadas no código atual. Cada item descreve o estado hoje, o que precisa mudar e onde mexer.

---

## 1. Validação de input com Zod

### Estado atual
As Server Actions validam entrada manualmente, com verificações explícitas do tipo:

```ts
// app/actions/appointments.ts
if (!petshopId || !petId || !serviceId || !scheduledAtRaw) {
  throw new Error("Preencha todos os campos do agendamento")
}

// app/actions/petshops.ts
if (!name || !address) throw new Error("Nome e endereço são obrigatórios")
if (Number.isNaN(lat) || Number.isNaN(lng)) throw new Error("Localização inválida")
```

Não há validação de formato (e-mail, telefone, tamanho mínimo/máximo de strings), nenhuma mensagem por campo individual e nenhuma proteção contra valores negativos em preço/duração.

### O que implementar
Instalar Zod e criar schemas de validação para cada action que recebe `FormData`:

```bash
pnpm add zod
```

Criar `lib/validations.ts` com os schemas:

```ts
import { z } from "zod"

export const createPetSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  species: z.string().min(1, "Espécie é obrigatória"),
  breed: z.string().max(100).optional(),
  birthdate: z.string().optional(),
  notes: z.string().max(500).optional(),
})

export const upsertPetshopSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  address: z.string().min(1).max(300),
  city: z.string().max(100).optional(),
  phone: z.string().regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, "Telefone inválido").optional().or(z.literal("")),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export const createServiceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  durationMin: z.number().min(5).max(480),
})

export const createAppointmentSchema = z.object({
  petshopId: z.number().positive(),
  petId: z.number().positive(),
  serviceId: z.number().positive(),
  scheduledAt: z.string().datetime({ local: true }),
  notes: z.string().max(500).optional(),
})
```

Nas actions, substituir as verificações manuais por `schema.parse(data)` — o Zod lança `ZodError` com mensagens por campo se algo falhar.

### Arquivos a alterar
- `app/actions/pets.ts` — `createPet`
- `app/actions/petshops.ts` — `upsertMyPetshop`, `createService`
- `app/actions/appointments.ts` — `createAppointment`
- criar `lib/validations.ts`

---

## 2. Constraint de concorrência de horários (double-booking)

### Estado atual
A tabela `appointments` no schema não tem nenhum constraint de unicidade por slot:

```ts
// lib/db/schema.ts — appointments
export const appointments = pgTable("appointments", {
  // ... sem uniqueIndex aqui
  scheduledAt: timestamp("scheduledAt").notNull(),
  status: text("status").notNull().default("pending"),
})
```

Dois tutores podem criar agendamentos para o mesmo `petshopId + serviceId + scheduledAt` simultaneamente — o banco aceita os dois inserts sem reclamar.

### O que implementar

**Opção A — Constraint no banco (recomendado para começar)**

Adicionar um índice único parcial no schema, excluindo agendamentos cancelados:

```ts
import { uniqueIndex, sql } from "drizzle-orm/pg-core"

export const appointments = pgTable(
  "appointments",
  {
    // ... colunas existentes
  },
  (t) => [
    // Apenas um agendamento ativo por serviço/slot
    uniqueIndex("appointments_petshop_service_slot_unique")
      .on(t.petshopId, t.serviceId, t.scheduledAt)
      .where(sql`${t.status} != 'cancelled'`),
  ]
)
```

Depois rodar `pnpm dlx drizzle-kit generate` e `pnpm dlx drizzle-kit migrate`.

**Opção B — Verificação transacional na action** (mais flexível, necessário se quiser mensagem de erro amigável)

```ts
// app/actions/appointments.ts — dentro de createAppointment
const conflict = await db
  .select({ id: appointments.id })
  .from(appointments)
  .where(
    and(
      eq(appointments.petshopId, petshopId),
      eq(appointments.serviceId, serviceId),
      eq(appointments.scheduledAt, new Date(scheduledAtRaw)),
      sql`${appointments.status} != 'cancelled'`
    )
  )
  .limit(1)

if (conflict[0]) throw new Error("Este horário já está reservado. Escolha outro.")
```

O ideal é combinar as duas: a verificação na action dá mensagem amigável, e o constraint no banco é a última linha de defesa contra race conditions.

### Arquivos a alterar
- `lib/db/schema.ts` — adicionar `uniqueIndex` na tabela `appointments`
- `app/actions/appointments.ts` — adicionar verificação antes do insert em `createAppointment`
- rodar migration após alterar o schema

---

## 3. Sistema de avaliações e reviews

### Estado atual
Não existe. Nenhuma tabela, nenhuma action, nenhum componente.

### O que implementar

**Schema — nova tabela em `lib/db/schema.ts`:**

```ts
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointmentId").notNull().unique(), // 1 review por agendamento
  tutorId: text("tutorId").notNull(),
  petshopId: integer("petshopId").notNull(),
  rating: integer("rating").notNull(), // 1 a 5
  comment: text("comment"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})
```

O `unique()` em `appointmentId` impede que o tutor avalie o mesmo agendamento duas vezes.

**Nova action — `app/actions/reviews.ts`:**

```ts
export async function createReview(formData: FormData) {
  const me = await requireUser()
  if (me.role !== "tutor") throw new Error("Apenas tutores podem avaliar")

  const appointmentId = Number(formData.get("appointmentId"))
  const rating = Number(formData.get("rating"))
  const comment = String(formData.get("comment") ?? "").trim() || null

  // Verificar que o agendamento pertence ao tutor e está concluído
  const apt = await db.select().from(appointments)
    .where(and(
      eq(appointments.id, appointmentId),
      eq(appointments.tutorId, me.id),
      eq(appointments.status, "completed")
    )).limit(1)

  if (!apt[0]) throw new Error("Agendamento não encontrado ou ainda não concluído")

  await db.insert(reviews).values({
    appointmentId,
    tutorId: me.id,
    petshopId: apt[0].petshopId,
    rating,
    comment,
  })
  revalidatePath("/dashboard/appointments")
}

export async function getPetshopReviews(petshopId: number) {
  await requireUser()
  return db.select().from(reviews).where(eq(reviews.petshopId, petshopId))
    .orderBy(desc(reviews.createdAt))
}
```

**Componentes a criar:**
- `components/review-form.tsx` — formulário com estrelas (1-5) e campo de comentário, aparece em `tutor-appointments.tsx` quando `status === "completed"` e o agendamento ainda não tem review
- `components/petshop-reviews.tsx` — lista de avaliações com média, exibida na página de discover e no card do pet shop

**Arquivos a alterar:**
- `lib/db/schema.ts` — adicionar tabela `reviews`
- criar `app/actions/reviews.ts`
- criar `components/review-form.tsx`
- criar `components/petshop-reviews.tsx`
- `components/tutor-appointments.tsx` — adicionar botão/form de avaliação nos agendamentos concluídos
- `components/discover-client.tsx` — exibir média de avaliações no card do pet shop
- rodar migration

---

## 4. Notificações por e-mail

### Estado atual
Nenhuma notificação é enviada em nenhum momento. O tutor agenda e não recebe confirmação. O pet shop recebe agendamentos sem ser avisado.

### O que implementar

**Instalar o Resend** (biblioteca de envio de e-mail mais simples de integrar com Next.js/Vercel):

```bash
pnpm add resend
```

Criar conta em [resend.com](https://resend.com) e adicionar a variável de ambiente:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
```

**Criar `lib/email.ts`:**

```ts
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendAppointmentRequestEmail(to: string, tutorName: string, petName: string, serviceName: string, scheduledAt: Date) {
  await resend.emails.send({
    from: "PetCare <noreply@seudominio.com>",
    to,
    subject: "Novo agendamento solicitado",
    html: `<p>Olá! ${tutorName} solicitou um agendamento para <strong>${petName}</strong> — ${serviceName} em ${scheduledAt.toLocaleString("pt-BR")}.</p>`,
  })
}

export async function sendAppointmentConfirmedEmail(to: string, petshopName: string, serviceName: string, scheduledAt: Date) {
  await resend.emails.send({
    from: "PetCare <noreply@seudominio.com>",
    to,
    subject: `Agendamento confirmado — ${petshopName}`,
    html: `<p>Seu agendamento de <strong>${serviceName}</strong> em ${petshopName} foi confirmado para ${scheduledAt.toLocaleString("pt-BR")}.</p>`,
  })
}
```

**Onde chamar:**
- `app/actions/appointments.ts` — `createAppointment`: enviar e-mail para o dono do pet shop após o insert
- `app/actions/appointments.ts` — `updateAppointmentStatus`: quando `status === "confirmed"`, enviar e-mail para o tutor

Os e-mails devem ser disparados de forma assíncrona (sem `await` bloqueante ou usando `Promise.allSettled`) para não atrasar a resposta ao usuário.

**Arquivos a alterar:**
- criar `lib/email.ts`
- `app/actions/appointments.ts` — `createAppointment` e `updateAppointmentStatus`
- `.env.local` — adicionar `RESEND_API_KEY`
- Vercel dashboard — adicionar `RESEND_API_KEY` nas env vars de produção

---

## 5. Testes automatizados

### Estado atual
Nenhum arquivo de teste existe no projeto. Sem framework configurado.

### O que implementar

**Instalar Vitest:**

```bash
pnpm add -D vitest @vitejs/plugin-react vite-tsconfig-paths
```

Criar `vitest.config.ts` na raiz:

```ts
import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
  },
})
```

Adicionar script no `package.json`:

```json
"test": "vitest --run",
"test:watch": "vitest"
```

**Casos de teste prioritários** (criar em `__tests__/actions/`):

`appointments.test.ts`:
- tutor consegue criar agendamento com dados válidos
- tutor não consegue criar agendamento com pet que não é dele
- tutor consegue cancelar seu próprio agendamento
- tutor não consegue cancelar agendamento alheio
- petshop consegue confirmar agendamento seu
- petshop não consegue confirmar agendamento de outro petshop
- dois tutores tentando o mesmo slot retornam erro no segundo

`petshops.test.ts`:
- petshop consegue criar/atualizar seu perfil
- petshop não consegue deletar serviço de outro petshop

`pets.test.ts`:
- tutor consegue criar e deletar seus próprios pets
- tutor não consegue deletar pet alheio

Para os testes das Server Actions, o banco pode ser mockado com `vi.mock("@/lib/db")` ou usando um banco PostgreSQL de teste separado (mais robusto, mas exige mais setup).

**Arquivos a criar:**
- `vitest.config.ts`
- `__tests__/actions/appointments.test.ts`
- `__tests__/actions/petshops.test.ts`
- `__tests__/actions/pets.test.ts`
- atualizar `package.json` com os scripts de teste

---

## 6. CI com GitHub Actions

### Estado atual
Nenhum workflow configurado. Sem verificação automática em pull requests.

### O que implementar

Criar `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: petcare_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: latest

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Instalar dependências
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Build
        run: pnpm build
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/petcare_test
          BETTER_AUTH_SECRET: ci-secret-placeholder-32-chars-min
          BETTER_AUTH_URL: http://localhost:3000

      - name: Testes
        run: pnpm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/petcare_test
          BETTER_AUTH_SECRET: ci-secret-placeholder-32-chars-min
```

O job do PostgreSQL no `services` só faz sentido quando os testes existirem (item 5). Até lá, o workflow sem o step de `pnpm test` já fecha a régua de lint + build.

**Arquivos a criar:**
- `.github/workflows/ci.yml`

---

## Ordem de implementação sugerida

A sequência abaixo prioriza o que tem maior impacto com menor risco de quebrar o que já funciona:

| # | Item | Dependência |
|---|---|---|
| 1 | **CI básico** (lint + build) | nenhuma |
| 2 | **Validação com Zod** | nenhuma |
| 3 | **Constraint de double-booking** | nenhuma |
| 4 | **Testes unitários nas actions** | Zod (item 2) já instalado |
| 5 | **CI com testes** | Testes (item 4) prontos |
| 6 | **Notificações por e-mail** | nenhuma (feature independente) |
| 7 | **Reviews e avaliações** | nenhuma (feature independente) |

Os itens 1, 2 e 3 são melhorias de qualidade e segurança no código existente — sem UI nova, sem tabelas novas. Os itens 6 e 7 são features novas que podem entrar em paralelo depois que a base estiver mais sólida.
