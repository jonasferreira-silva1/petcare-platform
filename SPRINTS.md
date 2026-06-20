# 🏃 Sprints de Melhoria — PetCare

Cada sprint tem escopo fechado, pode ser feito de forma independente e termina com algo funcional e testável. A ordem foi pensada para: primeiro fechar buracos de CRUD (mais fácil, mais impacto em avaliação técnica), depois adicionar features de comunicação, depois enriquecer o mapa.

---

## Sprint 1 — CRUD completo de Pets

**Objetivo:** o tutor consegue criar, editar e excluir seus pets com confirmação.

**Estado atual no código:**
- `createPet` ✅ existe em `app/actions/pets.ts`
- `deletePet` ✅ existe, mas sem confirmação na UI
- `updatePet` ❌ não existe

**Tarefas:**

- [x] Criar `updatePet(id, formData)` em `app/actions/pets.ts`
  - Validar que o pet pertence ao usuário autenticado (`eq(pets.userId, user.id)`)
  - Campos editáveis: `name`, `species`, `breed`, `birthdate`, `notes`
- [x] Adicionar botão "Editar" no card do pet em `components/pets-manager.tsx`
  - Reutilizar o mesmo `Dialog` de criação, passando os valores atuais como `defaultValue`
  - Estado local `editingPet: Pet | null` para controlar qual está sendo editado
- [x] Adicionar `Dialog` de confirmação antes de `deletePet`
  - "Tem certeza que deseja remover **Rex**? Esta ação não pode ser desfeita."
  - Botões: Cancelar / Confirmar (vermelho)
- [x] Tratar agendamentos vinculados ao deletar pet
  - Opção mais segura: bloquear delete se houver agendamentos com `status = pending | confirmed`
  - Mensagem: "Este pet tem agendamentos ativos. Cancele-os antes de remover."

**Arquivos a tocar:**
- `app/actions/pets.ts`
- `components/pets-manager.tsx`

**Critério de aceite:** tutor consegue editar nome/raça/notas de um pet existente e excluir com confirmação, sem quebrar agendamentos ativos.

---

## Sprint 2 — CRUD completo de Serviços do Pet Shop

**Objetivo:** pet shop consegue editar serviços existentes além de criar/excluir.

**Estado atual no código:**
- `createService` ✅ existe em `app/actions/petshops.ts`
- `deleteService` ✅ existe, sem confirmação na UI
- `updateService` ❌ não existe

**Tarefas:**

- [x] Criar `updateService(id, formData)` em `app/actions/petshops.ts`
  - Campos: `name`, `description`, `priceCents`, `durationMin`
  - Verificar `eq(services.userId, user.id)` antes de atualizar
- [x] Adicionar botão "Editar" no card do serviço em `components/petshop-manager.tsx`
  - Reutilizar o `Dialog` de criação com `defaultValue`
- [x] Adicionar confirmação antes de `deleteService`
  - Bloquear se houver agendamentos `pending | confirmed` usando aquele `serviceId`
  - Mensagem: "Este serviço tem agendamentos ativos."
- [x] Adicionar flag `active` (boolean, default true) na tabela `services` no schema
  - Soft delete: `deleteService` apenas marca `active = false`
  - Agendamentos históricos mantêm a referência — o nome do serviço fica preservado
  - Filtrar `eq(services.active, true)` nas queries de listagem e booking

**Arquivos a tocar:**
- `lib/db/schema.ts` (adicionar coluna `active`)
- `app/actions/petshops.ts`
- `components/petshop-manager.tsx`
- Rodar `pnpm db:push` após alterar o schema

**Critério de aceite:** pet shop edita preço/duração de serviço existente. Ao "excluir", o serviço some da listagem e do diálogo de booking, mas agendamentos antigos continuam mostrando o nome correto.

---

## Sprint 3 — Edição de perfil do Tutor

**Objetivo:** tutor consegue editar nome, telefone e excluir a própria conta.

**Estado atual no código:**
- Não existe nenhuma página/action de edição de perfil para o tutor
- A tabela `user` tem os campos `name`, `phone` que podem ser editados

**Tarefas:**

- [x] Criar `updateMyProfile(formData)` em nova action `app/actions/profile.ts`
  - Campos: `name`, `phone`
  - Usar `db.update(user).set(...).where(eq(user.id, me.id))`
- [x] Criar `deleteMyAccount()` em `app/actions/profile.ts`
  - Dialog de confirmação forte: campo de texto onde o usuário digita "EXCLUIR" para habilitar o botão
  - Ao confirmar: cancelar agendamentos futuros (`status = cancelled`) do tutor, depois deletar o usuário
  - O cascade do banco (`ON DELETE CASCADE` nas sessões e accounts) limpa os dados relacionados
- [x] Criar página `app/dashboard/profile/page.tsx` com o formulário
- [x] Adicionar link "Meu Perfil" no `components/dashboard-nav.tsx` para tutores

**Arquivos a tocar:**
- criar `app/actions/profile.ts`
- criar `app/dashboard/profile/page.tsx`
- `components/dashboard-nav.tsx`

**Critério de aceite:** tutor atualiza seu nome e telefone. Ao excluir a conta, é redirecionado para `/sign-in` e não consegue mais logar.

---

## Sprint 4 — Observações visíveis e destacadas no agendamento

**Objetivo:** pet shop adiciona uma observação ao confirmar/concluir, e o tutor vê em destaque no card.

**Estado atual no código:**
- O campo `notes` já existe na tabela `appointments`, mas é preenchido apenas pelo tutor no momento do booking
- Não há campo separado para observação do pet shop

**Tarefas:**

- [ ] Adicionar coluna `petshopNotes` (text, nullable) na tabela `appointments` em `lib/db/schema.ts`
- [ ] Atualizar `updateAppointmentStatus` em `app/actions/appointments.ts` para aceitar `petshopNotes` opcional
- [ ] No componente `components/petshop-appointments.tsx`, adicionar campo `<Textarea>` nas ações de confirmar e concluir
  - Placeholder: "Observação para o tutor (opcional) — ex: traga carteira de vacinação"
- [ ] No componente `components/tutor-appointments.tsx`, exibir `petshopNotes` em destaque quando preenchida
  - Visual: bloco com fundo levemente colorido, ícone de mensagem, texto "Observação do pet shop:"
- [ ] Incluir `petshopNotes` na query de `getTutorAppointments`

**Arquivos a tocar:**
- `lib/db/schema.ts`
- `app/actions/appointments.ts`
- `components/petshop-appointments.tsx`
- `components/tutor-appointments.tsx`
- Rodar `pnpm db:push`

**Critério de aceite:** pet shop confirma um agendamento com a mensagem "Traga a carteirinha". O tutor vê essa mensagem em destaque no card, diferenciada das suas próprias notas.

---

## Sprint 5 — Chat por agendamento

**Objetivo:** tutor e pet shop trocam mensagens dentro de um agendamento específico.

**Estado atual no código:**
- Não existe. Nenhuma tabela, action ou componente de mensagens.

**Tarefas:**

**Schema — `lib/db/schema.ts`:**
- [ ] Adicionar tabela `messages`:
  ```ts
  export const messages = pgTable("messages", {
    id: serial("id").primaryKey(),
    appointmentId: integer("appointmentId").notNull(),
    senderId: text("senderId").notNull(),
    senderRole: text("senderRole").notNull(), // "tutor" | "petshop"
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    readAt: timestamp("readAt"),
  })
  ```

**Actions — criar `app/actions/messages.ts`:**
- [ ] `sendMessage(appointmentId, content)` — valida que o usuário autenticado é parte do agendamento
- [ ] `getMessages(appointmentId)` — retorna histórico ordenado por `createdAt asc`
- [ ] `markMessagesAsRead(appointmentId)` — atualiza `readAt` das mensagens do outro lado

**Componente — criar `components/appointment-chat.tsx`:**
- [ ] Lista de mensagens com bolhas diferenciadas por lado (direita = eu, esquerda = outro)
- [ ] Campo de texto + botão enviar
- [ ] Atualização via `router.refresh()` ao enviar (polling pode ser adicionado depois)
- [ ] Exibir horário de cada mensagem

**Integração na UI:**
- [ ] Botão "Mensagens" no card de agendamento em `tutor-appointments.tsx` e `petshop-appointments.tsx`
  - Abre um `Dialog` ou `Sheet` lateral com o `AppointmentChat`
- [ ] Badge de não lidas no botão: `(2)` quando há mensagens sem `readAt`

**Arquivos a tocar:**
- `lib/db/schema.ts`
- criar `app/actions/messages.ts`
- criar `components/appointment-chat.tsx`
- `components/tutor-appointments.tsx`
- `components/petshop-appointments.tsx`
- Rodar `pnpm db:push`

**Critério de aceite:** tutor envia "Meu cachorro morde, fique atento" no agendamento. Pet shop vê a mensagem com badge de não lida, responde "Ok, obrigado pelo aviso", e o tutor vê a resposta.

---

## Sprint 6 — Pet shops reais no mapa via Overpass API

**Objetivo:** o mapa mostra pet shops reais do OpenStreetMap mesclados com os cadastrados no PetCare, com diferenciação visual.

**Estado atual no código:**
- `getNearbyPetshops` em `app/actions/discover.ts` busca apenas a base local
- O mapa já usa Leaflet/OSM — stack 100% alinhada

**Tarefas:**

- [ ] Criar `getRealPetshops(lat, lng, radiusMeters)` em `app/actions/discover.ts`
  ```ts
  // Query Overpass QL
  const query = `[out:json];node["shop"="pet"](around:${radius},${lat},${lng});out;`
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
  })
  ```
  - Normalizar resultado para o tipo `NearbyPetshop` com `ownerUserId = null` e `distanceKm` calculado
  - Marcar com `source: "osm"` vs `source: "petcare"`

- [ ] Atualizar `DiscoverClient` para chamar ambas as fontes em paralelo (`Promise.all`)
  - Mesclar resultados, desduplicar por proximidade (se houver um cadastrado no PetCare a menos de 50m de um do OSM, mostrar só o do PetCare)

- [ ] Atualizar `components/petshop-map.tsx` para dois tipos de pin:
  - Pin colorido (teal) = cadastrado no PetCare, pode agendar
  - Pin outline/cinza = apenas no OSM, não pode agendar

- [ ] No card do pet shop OSM, ao clicar em "Agendar":
  - Mostrar mensagem "Este estabelecimento ainda não está no PetCare"
  - Botão "Convidar para o PetCare" → copia link de cadastro pré-preenchido com nome do pet shop

- [ ] Tratar erros da Overpass (timeout, rate limit) com fallback silencioso — se a API falhar, mostra só os cadastrados sem quebrar a UI

**Arquivos a tocar:**
- `app/actions/discover.ts`
- `components/discover-client.tsx`
- `components/petshop-map.tsx`

**Critério de aceite:** abrindo o mapa em Recife, aparecem pins cinzas de pet shops reais do OSM além dos cadastrados. Clicar num pin cinza mostra a mensagem de convite, não o diálogo de booking.

---

## Sprint 7 — Avaliações pós-atendimento

**Objetivo:** tutor avalia o pet shop após agendamento concluído, pet shop vê a média no painel.

**Estado atual no código:**
- Não existe. Listado no roadmap do `BACKLOG.md`.

**Tarefas:**

**Schema — `lib/db/schema.ts`:**
- [ ] Adicionar tabela `reviews`:
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

**Actions — criar `app/actions/reviews.ts`:**
- [ ] `createReview(appointmentId, rating, comment)`
  - Verificar que o agendamento pertence ao tutor e `status = completed`
  - Verificar que ainda não existe review para aquele `appointmentId` (unique garante no banco, mas dar mensagem amigável na action)
- [ ] `getPetshopReviews(petshopId)` — retorna lista com rating, comment, createdAt
- [ ] `getMyReviewForAppointment(appointmentId)` — retorna review existente ou null

**UI:**
- [ ] Criar `components/review-form.tsx` — seletor de estrelas (1-5) + textarea para comentário
- [ ] Em `components/tutor-appointments.tsx`: exibir botão "Avaliar" nos agendamentos `status = completed` sem review ainda
- [ ] Em `components/discover-client.tsx`: exibir média de avaliações (ex: ⭐ 4.2 · 12 avaliações) no card do pet shop
- [ ] Em `components/petshop-appointments.tsx`: exibir a avaliação recebida nos agendamentos concluídos que já têm review

**Arquivos a tocar:**
- `lib/db/schema.ts`
- criar `app/actions/reviews.ts`
- criar `components/review-form.tsx`
- `components/tutor-appointments.tsx`
- `components/discover-client.tsx`
- `components/petshop-appointments.tsx`
- Rodar `pnpm db:push`

**Critério de aceite:** tutor avalia com 5 estrelas um atendimento concluído. O pet shop de 4.8 na média exibida no mapa. O botão "Avaliar" some após submeter.

---

## Sprint 8 — Notificações in-app

**Objetivo:** badge de notificações no dashboard indicando eventos não vistos (novo agendamento, mudança de status, nova mensagem).

**Dependência:** Sprint 5 (chat) concluída para notificações de mensagem.

**Tarefas:**

**Schema — `lib/db/schema.ts`:**
- [ ] Adicionar tabela `notifications`:
  ```ts
  export const notifications = pgTable("notifications", {
    id: serial("id").primaryKey(),
    userId: text("userId").notNull(),
    type: text("type").notNull(), // "new_appointment" | "status_changed" | "new_message"
    referenceId: integer("referenceId"), // appointmentId
    message: text("message").notNull(),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  })
  ```

**Actions — criar `app/actions/notifications.ts`:**
- [ ] `getUnreadCount()` — retorna contagem de notificações com `readAt = null`
- [ ] `getNotifications()` — retorna lista das últimas 20
- [ ] `markAllAsRead()` — atualiza `readAt` de todas as não lidas

**Disparar notificações nas actions existentes:**
- [ ] `createAppointment` → notifica o pet shop (`new_appointment`)
- [ ] `updateAppointmentStatus` → notifica o tutor (`status_changed`)
- [ ] `sendMessage` (Sprint 5) → notifica o outro lado (`new_message`)

**UI:**
- [ ] Badge numérico no item de menu de "Agendamentos" e "Agenda" no `dashboard-nav.tsx`
- [ ] Dropdown de notificações abrindo ao clicar no badge, listando as recentes com link para o agendamento

**Arquivos a tocar:**
- `lib/db/schema.ts`
- criar `app/actions/notifications.ts`
- `app/actions/appointments.ts` (disparar notificações)
- `app/actions/messages.ts` (Sprint 5, disparar notificações)
- `components/dashboard-nav.tsx`
- Rodar `pnpm db:push`

**Critério de aceite:** tutor agenda um serviço. O pet shop vê `(1)` no menu de Agenda sem precisar recarregar a página (polling simples com `setInterval` ou `router.refresh` a cada 30s).

---

## Resumo dos sprints

| Sprint | Descrição | Depende de | Esforço |
|--------|-----------|------------|---------|
| 1 | CRUD completo de Pets | — | Baixo |
| 2 | CRUD completo de Serviços (soft delete) | — | Baixo |
| 3 | Edição de perfil do Tutor + exclusão de conta | — | Baixo |
| 4 | Observações do Pet Shop destacadas | — | Baixo |
| 5 | Chat por agendamento | — | Médio |
| 6 | Pet shops reais no mapa (Overpass API) | — | Médio |
| 7 | Avaliações pós-atendimento | — | Médio |
| 8 | Notificações in-app | Sprint 5 | Médio-Alto |

Os sprints 1–4 são independentes entre si e podem rodar em paralelo se quiser. Os sprints 5, 6 e 7 também são independentes. O sprint 8 depende do 5 para as notificações de mensagem, mas pode começar antes considerando só os eventos de agendamento.

---

## Convenção de status das tarefas

```
- [ ] não iniciada
- [x] concluída
- [~] em andamento
```

Mova as tarefas conforme for avançando para ter visibilidade rápida do que falta em cada sprint.
