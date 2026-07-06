# CLAUDE.md — Orion Flight Lab

Este arquivo é a documentação normativa do projeto para qualquer agente (humano ou IA) que trabalhe neste repositório. Ele deve ser lido e respeitado integralmente antes de qualquer alteração.

## 1. Visão geral do projeto

**Orion Flight Lab** é uma plataforma proprietária de sistema de registro (system-of-record) para um **CTAC — Centro de Treinamento de Aviação Civil**, certificado pela **ANAC** (Agência Nacional de Aviação Civil) sob o regulamento **RBAC 142** e a **IS 142-001**.

O sistema cobre todo o ciclo de vida de um CTAC: organização e satélites/remotos, corpo docente (instrutores e examinadores), grade curricular, matrícula e histórico acadêmico de alunos, exames teóricos/práticos, emissão de certificados, controle de qualificações e vencimentos, repositório de documentos regulatórios com versionamento, Sistema de Gestão da Qualidade (SGQ), Sistema de Gerenciamento da Segurança Operacional (SGSO), CRM/comercial, contratos e financeiro.

Trata-se de um sistema **auditável**: toda ação relevante deve deixar rastro (audit log imutável), todo prazo regulatório deve ser monitorado ativamente, e nenhuma regra de negócio (RN) pode ser contornada por composição de chamadas de API.

## 2. Stack técnica

- **apps/web** — Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **apps/api** — NestJS (monólito modular) + TypeScript, módulos em `apps/api/src/modules`
- **Banco de dados** — Supabase (Postgres + Auth + Storage + Row Level Security), acessado via **Prisma ORM**
- **Filas/Jobs** — BullMQ + Redis (Upstash/Railway em produção; `docker-compose` com Redis local apenas para desenvolvimento)
- **Observabilidade** — Sentry
- **Monorepo** — npm workspaces (sem Turborepo/Nx nesta fase)

## 3. Estrutura de módulos (apps/api/src/modules)

- `auth` — guards de JWT do Supabase, RBAC, decorators, audit log
- `organization` — Organization (CTAC), CTACSatellite, CTACRemote, TrainingSpec
- `personnel` — Instructor, Examiner, AircraftQualification, CMA, Proficiency, CourseAssignment
- `training` — TrainingProgram, Curriculum, Course, Segment, Module, Unit, SubUnit, Lesson, Material, TrainingDevice
- `academic` — Student, Enrollment, Attendance, TheoryExam, PracticalExam, Grade, Certificate, Qualification, QualificationExpiry
- `documents` — Document, DocumentVersion, DocumentApproval
- `sgq` — AuditProgram, Audit, NonConformity, CorrectiveAction, QualityReport
- `sgso` — Hazard, Risk, Mitigation, MGSO, PRE, SafetyOccurrence, SemestralReport, IDSO
- `clients` / `crm` — Client, ClientUnit, Contact, Account, Proposal, Pipeline
- `contracts` — Contract, ContractAmendment, Subscription, Plan
- `financial` — Charge, Payment, Delinquency
- `notifications` — jobs assíncronos (BullMQ) de vencimento e comunicação ANAC
- `reports` — relatórios consolidados (qualidade, segurança, acadêmico)

## 4. Multi-tenant e RLS

- Toda tabela (exceto `Organization` e tabelas de junção/auditoria puras) possui `organization_id`.
- RLS habilitado em **todas** as tabelas de negócio.
- Política padrão `organization_isolation`: `auth.jwt()->>'organization_id' = organization_id::text`.
- `audit_log` é **somente inserção**: política `audit_log_insert_only` permite `INSERT`, bloqueia `UPDATE`/`DELETE` via RLS (`USING (false)`) e `REVOKE` de privilégios de update/delete do papel autenticado.
- Todo bucket de Storage é privado e as policies escopam acesso por `organization_id` embutido no path do objeto.

## 5. Regras de negócio (RN) — não negociáveis

- **RN-05** — Certificado só pode ser emitido se **todos** os requisitos do curso (frequência, exames teóricos e práticos, notas mínimas) estiverem completos.
- **RN-07** — Aluno em quarentena de fraude (12 meses) não pode ter novos exames registrados.
- **RN-11** — Turma não pode ultrapassar 25 alunos matriculados simultaneamente.
- **RN-13** — Job diário atualiza status de qualificações/matrículas vencidas.
- **RN-15** — Instrutor não pode ministrar mais de 8h de aula em uma janela de 24h.
- **RN-16** — Proficiência anual do instrutor segue a regra dos 45 dias (renovação até 45 dias antes/depois do vencimento).
- **RN-17** — Instrutor pode ter no máximo 2 qualificações de tipo de aeronave simultâneas.
- **RN-18** — Examinador pode ter no máximo 2 credenciamentos ANAC de tipo simultâneos.
- **RN-20** — Curso inativo é alertado aos 150 dias e suspenso automaticamente aos 180 dias.
- **RN-22** — Comunicações obrigatórias à ANAC devem ser sinalizadas com 60 dias de antecedência.
- **RN-24** — Toda ação de escrita relevante gera registro em `audit_log` (imutável).

## 6. Referências regulatórias

- **RBAC 142** — Requisitos para Centros de Treinamento de Aviação Civil.
- **IS 142-001** — Instrução Suplementar de implementação do RBAC 142.
- **Seção 142.71** — Registro e histórico de alunos (ficha ANAC).
- **Seção 142.71a6** — Registro de exames teóricos e práticos com instrutor/examinador responsável.

## 7. Comandos

```bash
npm install                 # instala dependências de todos os workspaces
npm run lint                # eslint em todo o monorepo
npm run lint:fix            # eslint --fix em todo o monorepo
npm run typecheck           # tsc --noEmit em todos os apps/packages
npm run dev --workspace=apps/web
npm run dev --workspace=apps/api
npx prisma validate         # valida prisma/schema.prisma
npx prisma generate         # gera o client
npx prisma migrate dev      # aplica migrações em ambiente local
docker compose up -d        # sobe Redis local para BullMQ
```

## 8. Regras de Git

- Commits em **inglês**, no padrão **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- Commits **granulares por módulo** — nunca um commit único gigante ao final.
- Nenhum commit pode ser criado com lint ou typecheck quebrado (**zero tolerância**).
- `main` é a branch padrão e protegida por convenção; push direto é permitido neste estágio do projeto, mas todo push deve ser precedido de lint+typecheck limpos.
- Nunca commitar `.env`, segredos, ou credenciais reais do Supabase/Sentry.

## 9. Regras de lint (obrigatórias)

- `@typescript-eslint/no-explicit-any`: **error**
- `@typescript-eslint/no-unused-vars`: **error**
- `no-console`: **warn**

## 10. Convenções gerais

- Toda entidade de negócio possui `id` (uuid, `gen_random_uuid()`), `created_at`, `updated_at`, `deleted_at` (soft-delete) e `organization_id` (exceto onde explicitamente não fizer sentido).
- Respostas de API seguem o formato padronizado `{ data, meta, errors }`.
- DTOs validados com `class-validator` em todos os endpoints.
- Documentação OpenAPI/Swagger disponível em `/api/docs`.
- Login é feito **client-side** via `supabase-js`; a API nunca implementa endpoint de login, apenas valida o JWT emitido pelo Supabase Auth.

## 11. Estado atual da infraestrutura (real, não placeholder)

O projeto **não está mais em estágio de scaffold**. Existe um projeto Supabase real provisionado e um Redis gerenciado real, ambos configurados em `.env` (nunca commitado). Qualquer sessão nova pode assumir que:

- **Supabase**: projeto `orion-flight-lab`, ref `oelepfnnnwchmubhazad`, região `sa-east-1`. Acessível via as tools MCP `mcp__claude_ai_Supabase__*` (já autenticado) — use esse `project_id` diretamente, não precisa rodar `list_projects` de novo.
  - Schema completo migrado (`npx prisma migrate dev`), ~62 tabelas, RLS habilitado em 100%, buckets de Storage criados (`regulatory-docs`, `certificates`, `contracts`, `student-docs`, `instructor-docs`, todos privados).
  - Advisor de segurança do Supabase (`get_advisors`) rodado e limpo (só resta 1 INFO esperado sobre `_prisma_migrations`).
- **Redis**: Upstash real configurado em `REDIS_URL` (`rediss://`, TLS). BullMQ testado ponta a ponta com jobs reais.
- **Banco de dados fica sempre vazio em repouso** — toda vez que uma sessão cria dados de teste (organização, alunos, etc.) para validar algo, eles devem ser **removidos ao final** (ver §15). Se você encontrar `organizations` com `count > 0`, isso é resíduo de uma sessão anterior que não limpou — pode apagar.
- Local: `npm run dev:api` e `npm run dev:web` (a partir da raiz) sobem API (porta 3001) e web (porta 3000) contra o Supabase/Redis reais. Não há Postgres/Redis local neste ambiente — não use `docker compose up`, ele não foi testado neste sandbox (Docker não está disponível aqui).

## 12. Status de validação por módulo

Testado **ponta a ponta contra a infraestrutura real** (não é só `lint`/`typecheck` limpos — foi exercitado de verdade com dados reais e limpo depois):

- ✅ **academic** — RN-05 (certificado), RN-07 (quarentena de fraude), RN-11 (limite de turma). Fluxo completo: aluno → matrícula → frequência → exames aprovados → certificado real no bucket `certificates`.
- ✅ **personnel** — RN-15 (8h/24h), RN-16 (janela de 45 dias), RN-17/RN-18 (máx. 2 qualificações).
- ✅ **documents** — versionamento (v1→v2), diff, upload real no bucket `regulatory-docs`.
- ✅ **notifications** — BullMQ + Upstash real, cron de produção (`checkQualificationExpiry`) rodado de ponta a ponta.
- ✅ **auth** — guard JWKS, `/auth/me`, RBAC.
- ✅ **reports** — `/reports/dashboard-summary` (KPIs reais do dashboard).
- ✅ **frontend** — login, dashboard, students, personnel, documents, qualifications renderizados de verdade no Chromium headless (Playwright), zero erros de console, middleware de proteção de rota testado.
- ✅ **segurança multi-tenant** — auditoria de IDOR completa (escrita e leitura) em todos os módulos; ver §13.
- ⚠️ **sgq / sgso / clients / crm / contracts / financial** — só CRUD base validado estruturalmente (lint/typecheck/IDOR), **sem** regras de negócio específicas testadas (porque não há RNs numeradas definidas para eles ainda além do isolamento multi-tenant).
- ✅ **RN-13, RN-20, RN-22** — testadas ponta a ponta contra a infra real (ver §16.1). `AcademicService.updateExpiredStatuses()` (RN-13), `NotificationsCron.checkCourseInactivity()` (RN-20) e `checkAnacCommunicationDeadlines()` (RN-22) invocados diretamente via `NestFactory.createApplicationContext(AppModule)` contra Supabase/Upstash reais. Fixtures cobriram os limiares exatos: qualificação vencida há 10 dias, curso inativo há 190 dias (→ deveria suspender) e há 160 dias (→ deveria só alertar), `SemestralReport` com deadline em 45 dias (dentro da janela de 60). Resultado: `{ qualifications: 1, enrollments: 1 }` atualizados por RN-13; os 2 jobs `course-inactive` (um `SUSPENSO`, um `ALERTA_INATIVIDADE`) e o job `anac-communication` foram enfileirados corretamente na fila BullMQ real; os status em banco confirmaram exatamente o esperado. **Nenhum bug encontrado** — a implementação já estava correta.

## 13. Bugs reais encontrados e corrigidos nesta rodada de validação

Todos com commit próprio (`git log` tem a mensagem completa e o racional). Resumo para orientação rápida:

1. `packages/shared` distribuía TS cru → Node 24 quebrava o boot da API (agora compila para `dist/`).
2. `DATABASE_URL` sem `pgbouncer=true` → erro "prepared statement already exists" no pooler do Supabase.
3. `AuditLogInterceptor` nunca registrado globalmente → RN-24 era um no-op silencioso.
4. `SUPABASE_URL` com sufixo `/rest/v1/` indevido → quebrava todo upload de Storage.
5. Auth guard usava HS256 com segredo compartilhado → Supabase real assina com ES256/JWKS; reescrito para verificar via `/auth/v1/.well-known/jwks.json` (**`SUPABASE_JWT_SECRET` não é mais lido pela API**).
6. BullMQ sem `tls` e sem `username` na conexão Redis → falhava contra Upstash (`rediss://`, ACL de 2 argumentos).
7. `moduleResolution` depreciado (`node`/`node10`) nos tsconfigs → migrado para `module: "node16"`.
8. **RN-05 era impossível de satisfazer**: `CreateExamDto` não tinha campo `result` (exame sempre ficava `PENDENTE`), e não existia nenhum endpoint para registrar `Attendance`. Ambos corrigidos.
9. **IDOR sistêmico**: toda criação de entidade "filha" (ex.: `ClientUnit.client_id`, `Enrollment.student_id`, `Risk.hazard_id`) confiava no ID vindo do cliente sem checar `organization_id`. Corrigido em `clients`, `contracts`, `crm`, `financial`, `sgq`, `sgso`, `academic`.

## 14. Armadilhas conhecidas (não redescobrir)

- **JWT de teste não pode ser assinado à mão** (`jwt.sign(payload, SUPABASE_JWT_SECRET)`) — desde o bug #5 acima, o guard só aceita tokens reais emitidos pelo Supabase Auth (ES256 via JWKS). Para testar endpoints protegidos, sempre: criar usuário real via `supabase.auth.admin.createUser({ app_metadata: { organization_id, roles } })` e depois `supabase.auth.signInWithPassword(...)` (client `anon`) para pegar um `access_token` de verdade.
- **`SUPABASE_URL`** deve ser só a URL base do projeto (`https://xxx.supabase.co`), nunca com `/rest/v1/` no final.
- **`DATABASE_URL`** (pooler, porta 6543) precisa de `?pgbouncer=true`. **`DIRECT_URL`** (porta 5432) não.
- Prisma bypassa RLS (conecta como owner) — a defesa multi-tenant real está 100% na camada de aplicação (`organization_id` explícito em todo `where`), não na RLS. RLS é defesa em profundidade para acesso direto via REST/anon key, não a linha de defesa principal do backend.
- `npm run dev:api` / `dev:web` fazem `npm run build:shared` antes (necessário — `@orion/shared` precisa estar compilado em `dist/`).

## 15. Metodologia de teste ponta a ponta (replicar em sessões futuras)

Para validar qualquer endpoint/regra de negócio contra a infra real:

1. Criar organização de teste via `mcp__claude_ai_Supabase__execute_sql` (sempre incluir `updated_at` nos inserts manuais — não tem default no banco).
2. Criar usuário real: `supabase.auth.admin.createUser({ app_metadata: { organization_id, roles: [...] } })` + inserir `user_profiles` com o mesmo `id`.
3. Pegar token real: `supabase.auth.signInWithPassword(...)` com o client `anon`.
4. Subir API/web (`npm run dev:api` / `dev:web`), testar via `curl` com `Authorization: Bearer <token>` ou via Playwright (`chromium.launch`) para o frontend.
5. **Sempre limpar ao final**: apagar as linhas criadas (ordem inversa das FKs) e `supabase.auth.admin.deleteUser(...)`. Confirmar `select count(*) from organizations` = 0 antes de encerrar.
6. Rodar `npm run lint && npm run typecheck` antes de qualquer commit.

## 16. Próximos passos sugeridos (em ordem de valor)

1. Definir e implementar regras de negócio específicas para SGQ/SGSO (hoje só têm CRUD genérico).
2. Considerar regras de negócio para clients/crm/contracts/financial (hoje sem RN numeradas).
3. Configurar Sentry de verdade (hoje é placeholder em `.env`).
4. Se for para produção: revisar CORS (`app.enableCors()` está aberto sem allowlist) e configurar domínio(s) permitido(s).

### 16.1. Como testar crons/jobs agendados ponta a ponta (sem esperar o schedule)

Os handlers de `@Cron(...)` (`academic.cron.ts`, `notifications.cron.ts`) não são endpoints HTTP — para exercitá-los de verdade sem esperar `EVERY_DAY_AT_*AM`:

1. `npm run build:shared && npm run build --workspace=apps/api` (gera `apps/api/dist/`).
2. Criar um script Node temporário em `apps/api/` (fora de `apps/api/`, os `require()` de pacotes do workspace não resolvem — precisa rodar de dentro do diretório do app) que:
   - Carrega `.env` manualmente (parse simples de `KEY=VALUE`, não há `dotenv` como dependência do projeto).
   - `const app = await NestFactory.createApplicationContext(AppModule)`.
   - Pega o serviço/cron via `app.get(...)` e chama o método do handler diretamente (ex.: `academicService.updateExpiredStatuses()`, `notificationsCron.checkCourseInactivity()`).
   - Para inspecionar jobs do BullMQ sem que o `NotificationsProcessor` já consuma: `app.get(getQueueToken(NOTIFICATIONS_QUEUE))`, `queue.pause()` antes de rodar os crons, depois `queue.getJobs(['waiting','delayed','paused'])`.
3. Apagar o script ao final (não commitar) — foi só instrumentação de teste, não faz parte do produto.
4. Fixtures de banco via `execute_sql` direto, com os valores exatamente nos limiares das RNs (ex.: `last_activity_at = now() - interval '190 days'` para RN-20 suspender, `'160 days'` para só alertar).
