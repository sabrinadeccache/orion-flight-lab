# Orion Flight Lab

Plataforma proprietária de sistema de registro (system-of-record) para um **CTAC — Centro de
Treinamento de Aviação Civil**, certificado pela **ANAC** sob o regulamento **RBAC 142 / IS
142-001**. Veja [`CLAUDE.md`](./CLAUDE.md) para as convenções completas do projeto, regras de
negócio (RN-05 … RN-24) e referências regulatórias.

## Stack

- **apps/web** — Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **apps/api** — NestJS (monólito modular), módulos em `apps/api/src/modules`
- **Banco de dados** — Supabase (Postgres + Auth + Storage + RLS) via Prisma ORM
- **Filas/Jobs** — BullMQ + Redis (Upstash/Railway em produção, `docker-compose` local)
- **Observabilidade** — Sentry
- **Monorepo** — npm workspaces

## Estrutura

```
apps/
  web/            # Next.js 14 + Tailwind
  api/
    src/modules/  # auth, organization, personnel, training, academic, documents,
                  # sgq, sgso, clients, crm, contracts, financial, notifications, reports
packages/
  shared/         # tipos e enums TypeScript compartilhados (roles, status, etc.)
prisma/
  schema.prisma   # modelo de domínio completo
supabase/
  migrations/     # RLS, triggers, buckets de Storage
  seed.sql        # seed mínimo de desenvolvimento local
docker-compose.yml  # Redis local para BullMQ (Postgres/Auth/Storage são geridos pelo Supabase)
```

## Pré-requisitos

- Node.js 20+
- npm 10+
- Docker (para o Redis local)
- Uma conta/projeto Supabase (para desenvolvimento com banco real — opcional para apenas rodar o
  scaffold e os testes de tipo/lint)

## Configuração

1. Clone o repositório e instale as dependências de todos os workspaces:

   ```bash
   npm install
   ```

2. Copie o arquivo de variáveis de ambiente e preencha com as credenciais do seu projeto Supabase
   (nunca use credenciais reais em `.env.example`, apenas no seu `.env` local, que é ignorado pelo
   Git):

   ```bash
   cp .env.example .env
   ```

3. Suba o Redis local (necessário para o `apps/api` processar filas do BullMQ):

   ```bash
   docker compose up -d
   ```

4. Gere o Prisma Client e aplique as migrações no seu banco Supabase (ou em um Postgres local
   configurado nas variáveis `DATABASE_URL` / `DIRECT_URL`):

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

   As migrações de RLS, triggers e Storage buckets ficam em `supabase/migrations` e devem ser
   aplicadas via Supabase CLI/Dashboard além (ou no lugar) do `prisma migrate`, dependendo do seu
   fluxo de trabalho com Supabase.

5. (Opcional) Popule dados mínimos de desenvolvimento:

   ```bash
   psql "$DATABASE_URL" -f supabase/seed.sql
   ```

## Rodando localmente

```bash
npm run dev:api   # NestJS em http://localhost:3001 (Swagger em /api/docs)
npm run dev:web   # Next.js em http://localhost:3000
```

## Qualidade

```bash
npm run lint        # ESLint em todo o monorepo
npm run lint:fix     # ESLint --fix
npm run typecheck    # tsc --noEmit em todos os workspaces
npx prisma validate  # valida prisma/schema.prisma
```

Zero tolerância: nenhum commit deve ser feito com lint ou typecheck quebrados.

## Autenticação

O login acontece inteiramente client-side via `supabase-js`/`@supabase/ssr` (`apps/web`). A API
(`apps/api`) nunca implementa um endpoint de login — ela apenas valida o JWT emitido pelo Supabase
Auth (`SupabaseAuthGuard`) e aplica RBAC (`@Roles`, `RolesGuard`) e isolamento por organização
(`OrganizationGuard`), com todas as ações relevantes registradas em um audit log imutável
(`AuditLogInterceptor`).

## Documentação da API

Com a API rodando, a documentação OpenAPI/Swagger fica disponível em
[`http://localhost:3001/api/docs`](http://localhost:3001/api/docs). Todos os endpoints retornam o
formato padronizado `{ data, meta, errors }` e validam entrada via `class-validator`.

## Convenções

Consulte [`CLAUDE.md`](./CLAUDE.md) para: lista completa de módulos, regras de negócio (RN),
política de multi-tenant/RLS, convenções de commit e regras de lint.
