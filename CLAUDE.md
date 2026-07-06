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
- **Observabilidade** — Sentry (`@sentry/nestjs` na API, `@sentry/nextjs` no web; código real, ver §11)
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
- **RN-25** — Não-conformidade (SGQ) só pode ser fechada quando houver pelo menos uma ação corretiva vinculada e todas estiverem concluídas.
- **RN-26** — Ação corretiva (SGQ) não pode ser criada com `due_date` no passado.
- **RN-27** — Risco (SGSO) de nível alto (`probability × severity ≥ 15`, matriz 5×5) não pode ser aceito/mitigado sem ao menos uma mitigação registrada.
- **RN-28** — Ocorrência de segurança (SGSO) de severidade "alta"/"critica" exige um `Hazard` vinculado para investigação reativa do SGSO.
- **RN-29** — Subscription só pode ser criada contra um Contract com `status = "ativo"`.
- **RN-30** — Pipeline não pode ir para o estágio "ganho" se a Proposal vinculada estiver com `valid_until` vencido ou `status = "recusada"`.
- **RN-31** — Payment não pode fazer o total pago exceder o `amount` da Charge; Charge muda automaticamente para `status = "paga"` quando totalmente quitada.
- **RN-32** — Job diário marca Charges vencidas e ainda `"pendente"` como inadimplentes, criando/atualizando `Delinquency.days_overdue`.

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
- **Sentry**: integração de código real e completa (`apps/api/src/instrument.ts` + captura no `HttpExceptionFilter` para 5xx; `apps/web/instrumentation-client.ts` + `sentry.server.config.ts` + `sentry.edge.config.ts` + `global-error.tsx`), **e já ativa com DSNs reais** — `SENTRY_DSN` e `NEXT_PUBLIC_SENTRY_DSN` no `.env` apontam para dois projetos reais na região UE (`ingest.de.sentry.io`, Alemanha — confirmado, não é US). `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` continuam não configurados (opcional, só para upload de source maps no build do web).
  - **LGPD / residência de dados**: o Sentry SaaS só hospeda em US ou UE — não existe região Brasil, por isso a escolha consciente de região UE acima. Como o sistema lida com CPF, nomes, contatos e dados de ocorrência de segurança, isso seria uma transferência internacional de dado pessoal (art. 33 LGPD) se não fosse tratado. Mitigação implementada: `packages/shared/src/sentry-scrub.ts` exporta `scrubSentryEvent`, usado como `beforeSend` nos 4 pontos de `Sentry.init` (API + web server/edge/client) — remove recursivamente qualquer campo cujo nome contenha `cpf`, `cnpj`, `full_name`, `email`, `phone`, `birth_date`, `anac_record_number`, `address`, `authorization`, `access_token`, `password` (em `request.data`, `request.query_string`, `request.headers`, `extra` e `breadcrumbs`), e `sendDefaultPii: false` explícito. Só metadado técnico (stack trace, rota, status) sai do Brasil. Se novos campos sensíveis forem adicionados ao schema, adicionar o nome em `SENSITIVE_KEYS` nesse arquivo.
- **CORS**: `apps/api/src/main.ts` usa uma allowlist configurável via `CORS_ALLOWED_ORIGINS` (`.env`, comma-separated), não mais `app.enableCors()` aberto. Sem a env var, cai em `http://localhost:3000` (dev) e loga um warning se `NODE_ENV=production`. Antes de produção: setar `CORS_ALLOWED_ORIGINS` para o domínio real, `https://www.orionflightlab.com.br` (ver §16).
- **Domínio de produção decidido**: `orionflightlab.com.br` (o `apps/web` vai em `www.orionflightlab.com.br`, o `apps/api` em `api.orionflightlab.com.br` — subdomínios do mesmo domínio registrado, não domínios separados). Ainda não registrado/hospedado — ver §16.

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
- ✅ **sgq / sgso** — RN-25 a RN-28 implementadas e testadas ponta a ponta via HTTP real (API local + token real do Supabase Auth + Postgres real), incluindo os dois casos negativos (bloqueio) e positivos (liberação) de cada regra. Migração real aplicada (`Risk.status`, `SafetyOccurrence.hazard_id`), advisor de segurança limpo depois.
- ✅ **clients / crm / contracts / financial** — RN-29 a RN-32 implementadas e testadas ponta a ponta via HTTP real (RN-29/30/31) e via invocação direta do cron (RN-32, mesmo método do §16.1). Nenhuma migração de schema necessária (campos já existiam).
- ✅ **Sentry** — integração de código completa e testada (build real de `apps/api` e `apps/web` sem erros/avisos do Sentry; smoke test confirmando que `captureException` não quebra com DSN placeholder). Falta só o DSN real (ver §11).
- ✅ **CORS** — allowlist testada ponta a ponta via `curl` com preflight `OPTIONS`: origem em `CORS_ALLOWED_ORIGINS` recebe `Access-Control-Allow-Origin`, origem fora da lista não recebe o header.
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
10. **`CrmService.createProposal` exigia uma `Account` mesmo com `account_id` opcional no DTO** — qualquer proposta sem conta vinculada (o caso comum) sempre retornava 404 "Account not found". Corrigido para só validar quando `account_id` é informado.
11. **CORS estava totalmente aberto** (`app.enableCors()` sem opções, reflete qualquer origem) — trocado por allowlist configurável via `CORS_ALLOWED_ORIGINS` (ver §11).

## 14. Armadilhas conhecidas (não redescobrir)

- **JWT de teste não pode ser assinado à mão** (`jwt.sign(payload, SUPABASE_JWT_SECRET)`) — desde o bug #5 acima, o guard só aceita tokens reais emitidos pelo Supabase Auth (ES256 via JWKS). Para testar endpoints protegidos, sempre: criar usuário real via `supabase.auth.admin.createUser({ app_metadata: { organization_id, roles } })` e depois `supabase.auth.signInWithPassword(...)` (client `anon`) para pegar um `access_token` de verdade.
- **`SUPABASE_URL`** deve ser só a URL base do projeto (`https://xxx.supabase.co`), nunca com `/rest/v1/` no final.
- **`DATABASE_URL`** (pooler, porta 6543) precisa de `?pgbouncer=true`. **`DIRECT_URL`** (porta 5432) não.
- Prisma bypassa RLS (conecta como owner) — a defesa multi-tenant real está 100% na camada de aplicação (`organization_id` explícito em todo `where`), não na RLS. RLS é defesa em profundidade para acesso direto via REST/anon key, não a linha de defesa principal do backend.
- `npm run dev:api` / `dev:web` fazem `npm run build:shared` antes (necessário — `@orion/shared` precisa estar compilado em `dist/`).
- **`service_role` do `supabase-js` não tem GRANT de `INSERT` em `user_profiles`** (`permission denied for table user_profiles`, código `42501`) — a API real nunca bate nesse problema porque o Prisma conecta como owner do banco, não como `service_role`. Mas se você for criar um `user_profile` de teste manualmente (§15, passo 2), **não use `admin.from('user_profiles').insert(...)` do client `service_role`** — insira via `execute_sql` (roda como owner) em vez disso.

## 15. Metodologia de teste ponta a ponta (replicar em sessões futuras)

Para validar qualquer endpoint/regra de negócio contra a infra real:

1. Criar organização de teste via `mcp__claude_ai_Supabase__execute_sql` (sempre incluir `updated_at` nos inserts manuais — não tem default no banco).
2. Criar usuário real: `supabase.auth.admin.createUser({ app_metadata: { organization_id, roles: [...] } })` + inserir `user_profiles` com o mesmo `id` **via `execute_sql`** (o client `service_role` do `supabase-js` não tem GRANT de `INSERT` nessa tabela — ver §14).
3. Pegar token real: `supabase.auth.signInWithPassword(...)` com o client `anon`.
4. Subir API/web (`npm run dev:api` / `dev:web`), testar via `curl` com `Authorization: Bearer <token>` ou via Playwright (`chromium.launch`) para o frontend.
5. **Sempre limpar ao final**: apagar as linhas criadas (ordem inversa das FKs) e `supabase.auth.admin.deleteUser(...)`. Confirmar `select count(*) from organizations` = 0 antes de encerrar.
6. Rodar `npm run lint && npm run typecheck` antes de qualquer commit.

## 16. Próximos passos sugeridos (em ordem de valor)

Não há próximos passos técnicos pendentes conhecidos no momento — todas as RNs numeradas (§5) e os itens de infraestrutura (Sentry, CORS) estão implementados e testados (§12).

- ✅ **Sentry**: DSNs reais já configurados (`SENTRY_DSN` e `NEXT_PUBLIC_SENTRY_DSN`), ambos os projetos na região UE (`ingest.de.sentry.io`, confirma Alemanha). Scrubbing de PII (ver §11) já está ativo.
- ⏳ **Domínio**: decidido — **`www.orionflightlab.com.br`** (raiz `orionflightlab.com.br`). Plano de subdomínio: `www.orionflightlab.com.br` (ou raiz) para `apps/web`, `api.orionflightlab.com.br` para `apps/api`. Ainda **não registrado/configurado em DNS** — quando o registro e a hospedagem estiverem prontos, setar `CORS_ALLOWED_ORIGINS=https://www.orionflightlab.com.br` (e o subdomínio de staging, se houver) antes de ir para produção (ver §11).
- Definir regras de negócio adicionais conforme o produto evoluir (novos módulos, novos requisitos ANAC) fica como próximo item de valor depois disso.

### 16.1. Como testar crons/jobs agendados ponta a ponta (sem esperar o schedule)

Os handlers de `@Cron(...)` (`academic.cron.ts`, `notifications.cron.ts`, `financial.cron.ts`) não são endpoints HTTP — para exercitá-los de verdade sem esperar `EVERY_DAY_AT_*AM`:

1. `npm run build:shared && npm run build --workspace=apps/api` (gera `apps/api/dist/`).
2. Criar um script Node temporário em `apps/api/` (fora de `apps/api/`, os `require()` de pacotes do workspace não resolvem — precisa rodar de dentro do diretório do app) que:
   - Carrega `.env` manualmente (parse simples de `KEY=VALUE`, não há `dotenv` como dependência do projeto).
   - `const app = await NestFactory.createApplicationContext(AppModule)`.
   - Pega o serviço/cron via `app.get(...)` e chama o método do handler diretamente (ex.: `academicService.updateExpiredStatuses()`, `notificationsCron.checkCourseInactivity()`).
   - Para inspecionar jobs do BullMQ sem que o `NotificationsProcessor` já consuma: `app.get(getQueueToken(NOTIFICATIONS_QUEUE))`, `queue.pause()` antes de rodar os crons, depois `queue.getJobs(['waiting','delayed','paused'])`.
3. Apagar o script ao final (não commitar) — foi só instrumentação de teste, não faz parte do produto.
4. Fixtures de banco via `execute_sql` direto, com os valores exatamente nos limiares das RNs (ex.: `last_activity_at = now() - interval '190 days'` para RN-20 suspender, `'160 days'` para só alertar).
