# 🐾 PetCare

> Encontre o pet shop certo, agende o serviço certo, no horário certo — tudo em um só lugar.

![Tela de Login do PetCare](public/login-screenshot.png)

PetCare é uma plataforma web que conecta **tutores de pets** com **pet shops e clínicas veterinárias**. De um lado, donos de animais que precisam de praticidade para agendar banhos, tosas e consultas. Do outro, estabelecimentos que querem uma agenda digital simples e organizada. A plataforma serve os dois.

---

## A história por trás do projeto

Imagine a cena: você tem um golden retriever que precisa de banho toda quinzena, mas sempre esquece de ligar pro pet shop, e quando lembra é fora do horário. O PetCare nasceu pra resolver exatamente isso.

A ideia é simples — tutores abrem o app, veem os pet shops mais próximos no mapa, escolhem um serviço, marcam o horário e pronto. O pet shop recebe o pedido, confirma ou recusa, e todos ficam na mesma página.

---

## O que você vai encontrar aqui

```
petcare/
├── app/
│   ├── actions/          # Server Actions (appointments, pets, petshops, discover)
│   ├── api/auth/         # Endpoint de autenticação (better-auth)
│   ├── dashboard/        # Páginas protegidas por sessão
│   │   ├── appointments/ # Agendamentos (tutor e petshop)
│   │   ├── discover/     # Mapa + busca de pet shops (tutor)
│   │   ├── pets/         # Gerenciar pets (tutor)
│   │   └── petshop/      # Perfil + serviços (petshop)
│   ├── sign-in/
│   └── sign-up/
├── components/
│   ├── ui/               # shadcn/ui (Button, Card, Dialog, Select...)
│   ├── auth-form.tsx
│   ├── discover-client.tsx
│   ├── location-picker.tsx
│   ├── petshop-map.tsx
│   ├── pets-manager.tsx
│   ├── petshop-manager.tsx
│   ├── tutor-appointments.tsx
│   └── petshop-appointments.tsx
└── lib/
    ├── auth.ts           # Configuração do better-auth
    ├── auth-client.ts    # Cliente de auth para o browser
    ├── session.ts        # Helpers de sessão (getSessionUser, requireUser)
    └── db/
        ├── index.ts      # Pool PostgreSQL + instância Drizzle
        └── schema.ts     # Todas as tabelas
```

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS v4 |
| Componentes | shadcn/ui + Base UI |
| Autenticação | better-auth |
| ORM | Drizzle ORM |
| Banco de dados | PostgreSQL |
| Mapas | Leaflet + React Leaflet |
| Deploy | Vercel |

---

## 🎨 Interface Visual e Experiência do Usuário (UX)

O PetCare se preocupa com uma experiência do usuário (UX) premium e visualmente impactante. A tela de login e cadastro (`/sign-in` e `/sign-up`) foi projetada com:
- **Painel em Glassmorphism Transparente**: Um painel central translúcido com desfoque de fundo (*backdrop-blur*) que se estende por toda a altura da tela, criando uma sensação moderna e limpa.
- **Slideshow Responsivo de Pets**: Slideshows de imagens em alta definição que se ajustam automaticamente ao tamanho da tela. No desktop, as carinhas dos pets aparecem perfeitamente enquadradas nas laterais. No mobile, as fotos cobrem o fundo inteiro com um overlay escuro para priorizar o contraste do formulário.
- **Prevenção de Autocompletar**: Técnicas de interceptação (*dummy hidden inputs*) combinadas com configurações de autocomplete para evitar que navegadores preencham automaticamente credenciais indesejadas no carregamento inicial da página.

---

## Pré-requisitos

Você tem duas formas de rodar o projeto. Escolha a que preferir:

| | Docker | Local |
|---|---|---|
| Pré-requisitos | Docker Desktop | Node.js 22 + PostgreSQL + pnpm |
| Banco de dados | Incluído automaticamente | Você cria manualmente |
| Ideal para | Rodar rápido, sem instalar nada | Desenvolvimento ativo |

---

## Opção 1 — Docker (recomendado para rodar rápido)

A forma mais simples. Um único comando sobe a aplicação e o banco PostgreSQL juntos, sem precisar instalar Node.js ou configurar banco.

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd petcare
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz (ou edite o `docker-compose.yml` diretamente):

```env
DATABASE_URL=postgresql://postgres:sua_senha@postgres:5432/petcare
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=um-segredo-longo-e-aleatorio-aqui
```

> Se quiser usar as credenciais padrão do `docker-compose.yml`, pode pular este passo — ele já vem configurado para funcionar do zero.

### 3. Suba tudo

```bash
docker compose up -d
```

Isso vai:
- Baixar a imagem do PostgreSQL 16
- Fazer o build da aplicação Next.js
- Criar o banco `petcare` com volume persistente
- Aguardar o banco ficar saudável antes de subir o app
- Criar todas as tabelas automaticamente na primeira inicialização

Acesse [http://localhost:3000](http://localhost:3000).

### Comandos úteis no Docker

```bash
# Ver logs da aplicação em tempo real
docker compose logs -f app

# Ver logs do banco
docker compose logs -f postgres

# Parar os containers (dados preservados)
docker compose down

# Parar e remover o volume do banco (⚠ apaga todos os dados)
docker compose down -v

# Rebuild após mudanças no código
docker compose up -d --build
```

---

## Opção 2 — Rodando localmente (para desenvolvimento)

### 1. Clone o repositório

```bash
git clone https://github.com/jonasferreira-silva1/petcare-platform
cd petcare
```

### 2. Instale as dependências

```bash
pnpm install
```

> Para instalar o pnpm caso ainda não tenha: `npm install -g pnpm`

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# URL de conexão com o banco PostgreSQL
DATABASE_URL=postgresql://usuario:senha@localhost:5432/petcare

# URL base da aplicação (usado pelo better-auth)
BETTER_AUTH_URL=http://localhost:3000

# Segredo para assinar os tokens de sessão
BETTER_AUTH_SECRET=um-segredo-longo-e-aleatorio-aqui
```

> **Dica:** para gerar um `BETTER_AUTH_SECRET` seguro, rode `openssl rand -base64 32` no terminal.

### 4. Crie o banco de dados

Com o PostgreSQL rodando, crie o banco:

```bash
createdb petcare
```

Ou pelo psql:

```sql
CREATE DATABASE petcare;
```

### 5. Aplique o schema no banco

O projeto usa Drizzle ORM. Para criar as tabelas, você pode usar o `drizzle-kit` para gerar e aplicar as migrations, ou simplesmente empurrar o schema diretamente (recomendado em desenvolvimento):

```bash
pnpm dlx drizzle-kit push
```

Isso vai criar todas as tabelas necessárias:
- `user`, `session`, `account`, `verification` — gerenciadas pelo better-auth
- `petshops`, `pets`, `services`, `appointments` — tabelas da aplicação

### 6. Inicie o servidor de desenvolvimento

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) e você vai ser redirecionado para a tela de login.

---

## Criando as primeiras contas

O cadastro diferencia dois tipos de usuário, e você vai precisar de um de cada para testar o fluxo completo.

**Conta de Pet Shop:**
1. Acesse `/sign-up`
2. Selecione o card **"Pet Shop"**
3. Preencha nome, e-mail, telefone e senha
4. Após o cadastro, você cai em `/dashboard/petshop`
5. Configure o perfil do estabelecimento, arraste o pin no mapa para a localização correta, e adicione alguns serviços

**Conta de Tutor:**
1. Em outro navegador (ou aba anônima), acesse `/sign-up`
2. Selecione **"Tutor"** (opção padrão)
3. Cadastre-se normalmente
4. Após o login, você cai em `/dashboard/pets`
5. Cadastre um pet e vá até **"Buscar Pet Shops"** para ver o estabelecimento que você criou antes

---

## Como o sistema funciona

### Visão do Tutor

O tutor tem três seções no dashboard:

**Meus Pets** — cadastre quantos animais quiser com nome, espécie, raça e data de nascimento. Esses pets vão aparecer como opção na hora de agendar.

**Buscar Pet Shops** — um mapa interativo (OpenStreetMap via Leaflet) mostra todos os estabelecimentos cadastrados. Se você permitir o acesso à sua localização, os pet shops são ordenados do mais próximo para o mais distante usando a fórmula de Haversine calculada direto no banco. Clique em "Agendar serviço" em qualquer card para abrir o diálogo de booking — escolha o pet, o serviço e a data/hora.

**Agendamentos** — lista todos os seus agendamentos com status em tempo real. Você pode cancelar qualquer agendamento que ainda não foi concluído.

### Visão do Pet Shop

**Meu Pet Shop** — configure o perfil completo do estabelecimento: nome, descrição, endereço, cidade, telefone e localização no mapa (clique em qualquer ponto do mapa para mover o pin). Na mesma página, gerencie os serviços oferecidos com nome, descrição, preço e duração.

**Agenda** — veja todos os agendamentos recebidos. Para cada pedido pendente, você pode confirmar ou recusar. Após confirmar, você pode marcar como concluído quando o serviço for realizado.

### Ciclo de vida de um agendamento

```
pending → confirmed → completed
       ↘            ↗
         cancelled
```

- **pending** — tutor solicitou, aguardando resposta do pet shop
- **confirmed** — pet shop confirmou o horário
- **completed** — serviço realizado
- **cancelled** — cancelado por qualquer uma das partes

---

## Deploy na Vercel

O projeto está pronto para deploy na Vercel sem nenhuma configuração adicional.

1. Faça push para o GitHub
2. Importe o repositório na Vercel
3. Configure as variáveis de ambiente no painel da Vercel:
   - `DATABASE_URL` — sua connection string do PostgreSQL em produção
   - `BETTER_AUTH_SECRET` — o mesmo segredo (ou um novo gerado para produção)
   - `BETTER_AUTH_URL` — a URL do seu domínio Vercel (ex: `https://petcare.vercel.app`)
4. Deploy

A Vercel detecta automaticamente que é um projeto Next.js. O `VERCEL_URL` e `VERCEL_PROJECT_PRODUCTION_URL` são injetados automaticamente e já estão configurados no `lib/auth.ts` como trusted origins.

> **Banco em produção:** recomendamos usar [Neon](https://neon.tech) ou [Railway](https://railway.app) para o PostgreSQL — ambos têm tier gratuito e se conectam facilmente com a Vercel.

---

## Variáveis de ambiente — referência completa

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string do PostgreSQL |
| `BETTER_AUTH_SECRET` | ✅ | Segredo para assinar sessões (mín. 32 chars) |
| `BETTER_AUTH_URL` | Em produção | URL base da aplicação |
| `VERCEL_URL` | Auto (Vercel) | Injetada automaticamente pela Vercel |
| `VERCEL_PROJECT_PRODUCTION_URL` | Auto (Vercel) | Injetada automaticamente pela Vercel |

---

## Decisões técnicas relevantes

**Por que Server Actions e não uma API REST?**
Com o App Router do Next.js, as Server Actions simplificam bastante o ciclo de dados — sem precisar criar rotas de API separadas para cada operação. As mutations (criar pet, agendar, atualizar status) são funções TypeScript normais que rodam no servidor.

**Por que o mapa é carregado com `dynamic` e `ssr: false`?**
O Leaflet manipula o DOM diretamente e não funciona durante o Server-Side Rendering. O `dynamic` import garante que os componentes de mapa só são carregados no browser.

**Como funciona o cálculo de distância?**
A fórmula de Haversine é executada via SQL bruto no PostgreSQL — isso significa que a ordenação por distância acontece no banco, sem precisar buscar todos os registros e ordenar em memória no servidor.

**Autorização nas Server Actions**
Toda action começa chamando `requireUser()`, que lança um erro se não houver sessão ativa. Operações sensíveis verificam adicionalmente se o recurso pertence ao usuário autenticado (ex: um tutor não consegue cancelar o agendamento de outro tutor).

**Validação de input**
As Server Actions validam os campos obrigatórios manualmente com verificações explícitas (campos vazios, tipos numéricos, ownership de recursos). Ainda não há uma biblioteca de schema validation como Zod — isso é reconhecido como uma lacuna e está no roadmap. Adicionar Zod nas actions críticas (`createAppointment`, `upsertMyPetshop`) tornaria os erros mais descritivos e o código mais defensivo.

**Concorrência de agendamentos**
O modelo atual não impede que dois tutores reservem o mesmo slot no mesmo pet shop ao mesmo tempo — não há unique constraint nem lock otimista na tabela `appointments`. Na prática, o fluxo de confirmação manual pelo pet shop serve como válvula de escape: o estabelecimento simplesmente recusa o segundo pedido. Uma solução mais robusta (constraint `UNIQUE (petshopId, serviceId, scheduledAt)` ou verificação transacional antes do insert) está listada no roadmap abaixo.

---

## Testes

O projeto ainda não tem cobertura de testes automatizados — e isso é deliberadamente assumido aqui em vez de escondido. As Server Actions críticas (`createAppointment`, `cancelMyAppointment`, `updateAppointmentStatus`) são as candidatas mais óbvias para uma primeira suite: elas concentram regras de negócio, verificações de ownership e mutações no banco.

O plano para quando os testes forem adicionados:

- **Unitários nas Server Actions** com [Vitest](https://vitest.dev) + banco em memória ou mocks do Drizzle, cobrindo pelo menos os casos de ownership (tutor tentando cancelar agendamento alheio, petshop atualizando status que não é seu) e validação de campos obrigatórios
- **E2E** com [Playwright](https://playwright.dev) para os dois fluxos principais: tutor criando pet → buscando pet shop → agendando serviço; e petshop confirmando/recusando o agendamento

Contribuições com testes são bem-vindas.

---

## CI

Ainda não há um workflow de CI configurado. O esqueleto abaixo pode ser adicionado em `.github/workflows/ci.yml` para rodar lint e build em todo pull request:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm build
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/petcare
          BETTER_AUTH_SECRET: ci-secret-placeholder
          BETTER_AUTH_URL: http://localhost:3000
```

---

## Roadmap

O que está planejado mas ainda não foi implementado:

- **Validação de schema com Zod** nas Server Actions — substituir as verificações manuais por schemas declarativos com mensagens de erro consistentes
- **Constraint de concorrência de horários** — unique constraint ou verificação transacional para evitar double-booking no mesmo slot
- **Avaliações e reviews** — tutores poderão avaliar o pet shop após um agendamento concluído, com nota e comentário
- **Notificações por e-mail** — confirmação de agendamento para o tutor e alerta de novo pedido para o pet shop (candidatos: Resend, Nodemailer)
- **Testes automatizados** — conforme detalhado na seção acima
- **CI/CD** — workflow de lint + build + testes em PRs

---

## Scripts disponíveis

```bash
pnpm dev        # Servidor de desenvolvimento em http://localhost:3000
pnpm build      # Build de produção
pnpm start      # Servidor em modo produção
pnpm lint       # ESLint
pnpm db:push    # Aplica o schema no banco (drizzle-kit push)
pnpm db:studio  # Abre o Drizzle Studio para inspecionar o banco
```

---

## Licença

MIT
