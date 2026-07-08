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

- **RN-05** — Certificado só pode ser emitido se os requisitos do curso estiverem completos (frequência sempre + os exames que a `modality` do `Course` exigir: `TEORICO` pede exame teórico aprovado, `PRATICO` pede exame prático aprovado, `MISTO` — default, comportamento original — pede os dois). Quando o curso é `TEORICO`, emitir o certificado **cria automaticamente** a `Qualification` do aluno (`qualification_code` = código do curso, `certificate_id` vinculado). `PRATICO` não tem esse caminho automático — a qualificação correspondente é lançada manualmente via `POST /qualifications` (`AcademicService.createQualification`).
  - **Emissão automática**: `Course.min_passing_score` (opcional, 0-100) define o aproveitamento mínimo do curso. Quando um exame é registrado com `score` e sem `result` explícito, `AcademicService.registerExam` deriva `APROVADO`/`REPROVADO` comparando a nota com esse mínimo (sem `min_passing_score` configurado, cai no comportamento antigo: só `PENDENTE` até alguém informar `result` manualmente). Assim que um exame ou uma frequência é registrado e os requisitos da RN-05 passam a estar completos, o certificado (e, para `TEORICO`, a qualificação) é emitido **automaticamente** — não é mais preciso chamar `POST /certificates` manualmente. Esse endpoint continua existindo (emissão retroativa, cursos sem `min_passing_score`), mas agora **bloqueia emissão duplicada**: `BadRequestException` se o enrollment já tiver um certificado.
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
npm run lint                # eslint em todo o monorepo (builda @orion/shared antes)
npm run lint:fix            # eslint --fix em todo o monorepo
npm run typecheck           # tsc --noEmit em todos os apps/packages (builda @orion/shared antes)
npm run dev --workspace=apps/web
npm run dev --workspace=apps/api
npm run test --workspace=apps/api              # testes unitários (Prisma mockado)
npm run test:integration --workspace=apps/api  # testes de integração (precisa de DATABASE_URL efêmero — ver §17)
npx prisma validate         # valida prisma/schema.prisma
npx prisma generate         # gera o client
npx prisma migrate dev      # aplica migrações em ambiente local
docker compose up -d        # sobe Redis local para BullMQ
```

## 8. Regras de Git

- Commits em **inglês**, no padrão **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- Commits **granulares por módulo** — nunca um commit único gigante ao final.
- Nenhum commit pode ser criado com lint ou typecheck quebrado (**zero tolerância**).
- `main` é a branch padrão e protegida por convenção; push direto é permitido neste estágio do projeto, mas todo push deve ser precedido de lint+typecheck limpos. Desde que o CI existe (ver §17), o mesmo vale para ele — não empurrar código que quebre `.github/workflows/ci.yml`.
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
- **⚠️ Sessão de teste manual ativa (exceção temporária à regra de "banco sempre vazio")**: existe uma organização de demo real no Supabase — `c3000000-0000-0000-0000-000000000003` ("Orion Flight Lab - Demo"), com um usuário real `demo@orionflightlab.com.br` / senha `DemoOrion2026!` (role `ADMIN`), e dados de exemplo (turma PPL, aluno, instrutor, examinador, cliente, contrato, hazard, qualificação a vencer). Isso foi criado a pedido do usuário para ele testar o produto pelo navegador em `localhost:3000`, e **não foi limpo de propósito** — o usuário pode ainda estar testando quando uma nova sessão começar. **Não apague essa organização nem mate os processos `dev:api`/`dev:web` sem perguntar ao usuário primeiro.** Se o usuário confirmar que já terminou de testar, aí sim seguir a limpeza padrão do §15 (apagar linhas + `supabase.auth.admin.deleteUser`) e voltar a `organizations` count = 0.
  - Se os servidores locais não estiverem rodando quando a sessão começar, é só `npm run dev:api` e `npm run dev:web` de novo — os dados de demo continuam no Supabase entre sessões, só os processos Node é que não persistem.

## 12. Status de validação por módulo

Testado **ponta a ponta contra a infraestrutura real** (não é só `lint`/`typecheck` limpos — foi exercitado de verdade com dados reais e limpo depois):

- ✅ **academic** — RN-05 (certificado), RN-07 (quarentena de fraude), RN-11 (limite de turma). Fluxo completo: aluno → matrícula → frequência → exames aprovados → certificado real no bucket `certificates`.
- ✅ **personnel** — RN-15 (8h/24h), RN-16 (janela de 45 dias), RN-17/RN-18 (máx. 2 qualificações).
- ✅ **notifications** — BullMQ + Upstash real, cron de produção (`checkQualificationExpiry`) rodado de ponta a ponta.
- ✅ **auth** — guard JWKS, `/auth/me`, RBAC.
- ✅ **reports** — `/reports/dashboard-summary` (KPIs reais do dashboard).
- ✅ **frontend** — login, dashboard e todas as telas com CRUD (ver §18 para a tabela completa de cobertura por módulo) renderizados de verdade no Chromium headless (Playwright), zero erros de console, middleware de proteção de rota testado.
- ✅ **Clients/Contracts/Documents CRUD completo** — os três só tinham create/list (Documents também tinha versionamento). Adicionado backend (`GET :id`/`PATCH`/`DELETE` pros três; Contract nem `GET :id` tinha) e telas `new`/`[id]/edit` seguindo o padrão de Students/Courses. Documents ganhou também `POST /documents/:id/versions` (upload, com diff automático entre versões via `GET /documents/:id/versions`) exposto na UI e `GET /documents/:id/download` (`StorageService.createSignedUrl`, já que o bucket é privado e não dá pra linkar direto) com botão "Baixar documento"; `/documents/new` tem título/categoria/status/arquivo num formulário só. Validado ponta a ponta via HTTP real e Playwright: create → patch → get confirma mudança → IDOR (parent inexistente/de outra org) rejeitado com 404 → delete → get pós-delete confirma 404; upload real de arquivo → download retorna signed URL com conteúdo idêntico ao enviado.
- ✅ **Qualificação automática/manual (RN-05) + emissão automática de certificado** — `Course.modality` (`TEORICO`/`PRATICO`/`MISTO`), `Course.min_passing_score` (0-100) e `Qualification.certificate_id` adicionados ao schema (migrações reais aplicadas). Emitir certificado de um curso `TEORICO` cria a `Qualification` automaticamente; `PRATICO` usa entrada manual (`POST /qualifications`, tela `/qualifications/new`). Quando o curso tem `min_passing_score` configurado, `registerExam` deriva `APROVADO`/`REPROVADO` da nota automaticamente (sem precisar de `result` explícito), e assim que os requisitos da RN-05 ficam completos (após um exame ou uma frequência), o certificado é emitido **sozinho** — `POST /certificates` continua existindo pra emissão retroativa, mas agora rejeita com 400 se o enrollment já tiver certificado (trava de duplicidade, necessária depois que dois gatilhos independentes passaram a poder disparar a emissão). Validado ponta a ponta: curso `TEORICO` com `min_passing_score=70` → matrícula → frequência → exame com nota 85 e sem `result` → certificado e qualificação emitidos sozinhos, confirmado via `execute_sql`; segunda tentativa manual rejeitada; caso `PRATICO` completo emite certificado sem qualificação automática; duas tentativas de IDOR rejeitadas.
- ✅ **Ajustes de UX no frontend** — filtro Ativo/Inativo/Todos em `/personnel` (mesmo padrão de `/students`, cobre instrutores e examinadores com um só `?status=`); checkbox ativo/inativo exposto na criação (não só edição) de Student, Instructor, Examiner e Client; link "← Voltar para `<Módulo>`" em toda tela `new`/`[id]/edit` do app. Validado via Playwright real contra o Supabase (login do usuário demo, Chromium headless, zero erros de console).
- ✅ **Fix: flicker no `next dev` + download de Documentos travado** — `reactStrictMode: false` em `apps/web/next.config.js` (StrictMode remontava cada tela em dev, resetando o estado e disparando cada fetch duas vezes — confirmado via rede, `GET /students/:id` chegava 2x, e virou 1x depois do fix); `handleDownload` corrigido pra abrir a aba **antes** do `await fetch` da signed URL, não depois (popup blocker barrava silenciosamente quando `window.open` vinha depois de um `await`, de forma intermitente). Ver §14 para o detalhe técnico dos dois bugs.
- ✅ **segurança multi-tenant** — auditoria de IDOR completa (escrita e leitura) em todos os módulos; ver §13.
- ✅ **sgq / sgso** — RN-25 a RN-28 implementadas e testadas ponta a ponta via HTTP real (API local + token real do Supabase Auth + Postgres real), incluindo os dois casos negativos (bloqueio) e positivos (liberação) de cada regra. Migração real aplicada (`Risk.status`, `SafetyOccurrence.hazard_id`), advisor de segurança limpo depois.
- ✅ **sgq / sgso — frontend completo (Listar + Criar + ações de estado)** — os dois módulos de "gestão" propriamente ditos (SGQ = Sistema de Gestão da Qualidade, SGSO = Sistema de Gerenciamento da Segurança Operacional) não tinham nenhuma tela, só API. Adicionado backend mínimo (5 `GET :id` novos — `sgq/audit-programs/:id`, `sgq/audits/:id`, `sgq/non-conformities/:id`, `sgso/hazards/:id`, `sgso/risks/:id` — cada um com `include` dos filhos e campos derivados `canClose`/`isHighRisk`/`canChangeStatus` calculados no service, não duplicados no frontend) e telas de frontend seguindo a decisão de escopo desta rodada: **listar + criar + as ações de estado que a API já expunha** (fechar não conformidade, concluir ação corretiva, mudar status de risco), sem edição/exclusão genérica — essas entidades são trilha de auditoria/segurança e as RNs já as modelam como transições de estado controladas. Estrutura: `/sgq/audit-programs` → `/sgq/audits` → `/sgq/non-conformities` (com botão "Fechar", desabilitado até `canClose`) → `/sgq/corrective-actions` (botão "Concluir" inline); `/sgso/hazards` → `/sgso/risks` (com botões "Marcar aceito"/"Marcar mitigado", desabilitados até `canChangeStatus`, ocultos quando status já terminal — **comportamento revisto depois, ver entrada mais abaixo**: os botões passaram a ficar sempre visíveis) → `/sgso/mitigations`; `/sgso/safety-occurrences` independente (campo perigo vinculado vira obrigatório no client quando severidade é alta/crítica, RN-28). Sidebar (`SidebarNav`) e `middleware.ts` ganharam entradas `/sgq` (roles `ADMIN`, `GERENTE_QUALIDADE`) e `/sgso` (roles `ADMIN`, `GERENTE_SEGURANCA`). Validado ponta a ponta via HTTP real (RN-25 bloqueia com zero/ações pendentes e libera após concluir; RN-26 rejeita `due_date` no passado; RN-27 bloqueia mudança de status de risco alto sem mitigação e libera depois; RN-28 bloqueia ocorrência severidade alta sem `hazard_id` e libera com um vinculado) e via Playwright real (login do usuário demo, Chromium headless, zero erros de console, formulário de criação exercitado por clique real, não só a chamada HTTP). Um bug de UX pego nessa validação e corrigido na hora: o botão "Fechar não conformidade" continuava visível/habilitado numa não conformidade já fechada (só checava `canClose`, não o `status` atual) — agora o componente retorna `null` quando `status === 'fechada'`, espelhando o padrão já usado em `RiskStatusActions`.
- ✅ **sgq / sgso — vocabulário controlado nos formulários (listas suspensas)** — os campos de classificação que eram texto livre viraram `<select>` com vocabulário fechado: `NonConformity.severity` (Menor/Maior/Crítica, terminologia usual de auditoria de qualidade), `Hazard.source` (Auditoria interna/Relato voluntário/Investigação de ocorrência/Inspeção de rotina/Análise de dados de voo/Fiscalização ANAC), `Risk.probability`/`Risk.severity` (as mesmas escalas 1-5 já existentes, agora com o rótulo qualitativo da matriz ICAO Doc 9859 ao lado do número — Frequente/Ocasional/Remota/Improvável/Extremamente improvável e Catastrófica/Perigosa/Maior/Menor/Insignificante) e `SafetyOccurrence.severity` (Baixa/Média/Alta/Crítica, mantendo os valores minúsculos sem acento que a RN-28 já checava). **Importante**: RBAC 142/IS 142-001 não define esse schema de campos — cada CTAC define seu vocabulário no próprio MGSO; a matriz ICAO 5x5 foi usada por ser a referência internacional que a generalidade dos MGSOs reais adota, não por exigência textual do RBAC 142. Nenhuma migração de schema necessária (campos continuam `String` livre no Prisma, só ganharam controle na camada de UI); telas de listagem/detalhe que exibiam o valor bruto (`/sgq/audits/[id]`, `/sgq/non-conformities/[id]`, `/sgso/safety-occurrences`) ganharam uma função `severityLabel`/mapa local pra mostrar o rótulo acentuado em vez do valor salvo. Validado via Playwright real (zero erros de console nos 4 formulários) e lint/typecheck limpos.
- ✅ **sgq / sgso — edição habilitada (AuditProgram, Audit, Hazard, Risk) + formato de data corrigido** — a decisão original desta área (§ acima, "Listar + Criar + ações de estado") deliberadamente não incluía edição genérica; o usuário pediu explicitamente para habilitar edição nesses quatro registros específicos (não em NonConformity/CorrectiveAction/Mitigation/SafetyOccurrence, que continuam sem editar/excluir — trilha de auditoria/segurança intacta onde não foi pedido o contrário). Backend ganhou `PATCH /sgq/audit-programs/:id` (`year`/`description`), `PATCH /sgq/audits/:id` (`scheduled_at`/`auditor`/`scope` — `audit_program_id` não é editável, é vínculo estrutural), `PATCH /sgso/hazards/:id` (`description`/`source`) e `PATCH /sgso/risks/:id` (`probability`/`severity`, recalcula `risk_level` no service a partir do valor mesclado com o que já existia — `hazard_id` também não é editável). Frontend: telas `[id]/edit` seguindo o padrão exato de `clients/[id]/edit` (fetch-on-mount, PATCH, sem botão de excluir — só as 4 entidades listadas ganharam a tela), com link "Editar" nas respectivas páginas de detalhe. **Edição contínua do status do risco**: antes, `RiskStatusActions` desaparecia (`return null`) assim que o risco chegava a `aceito`/`mitigado`, sem volta; agora os dois botões continuam sempre visíveis, com o botão do status atual desabilitado (evita PATCH no-op) e o outro habilitado a qualquer momento — permite alternar `aceito` ↔ `mitigado` livremente, sempre respeitando o gate da RN-27 (`canChangeStatus`). **Formato de data da auditoria**: `Audit.scheduled_at` (e o mesmo campo na tabela de Audits dentro do detalhe do AuditProgram) aparecia como timestamp ISO cru (`2026-03-15T00:00:00.000Z`); as duas telas (`/sgq/audit-programs/[id]`, `/sgq/audits/[id]`) ganharam uma função local `formatDate` (`toLocaleDateString('pt-BR', { timeZone: 'UTC' })`) — exibe `15/03/2026`. O formulário de edição de Audit também precisou de um `toDateInputValue` (`slice(0, 10)`) para pré-popular o `<input type="date">` corretamente a partir do ISO completo que a API retorna (um `<input type="date">` não aceita timestamp com horário). Validado ponta a ponta via HTTP real (PATCH nos 4 endpoints, `risk_level` recomputado de 4→25 ao editar probabilidade/severidade, toggle `aceito→mitigado→aceito` bem-sucedido com RN-27 ainda bloqueando quando não há mitigação) e via Playwright real (edição disparada por clique real no formulário, toggle de status clicado na UI, zero erros de console). 8 novos testes unitários (100 no total). Dados de teste limpos ao final.
- ✅ **clients / crm / contracts / financial** — RN-29 a RN-32 implementadas e testadas ponta a ponta via HTTP real (RN-29/30/31) e via invocação direta do cron (RN-32, mesmo método do §16.1). Nenhuma migração de schema necessária (campos já existiam).
- ✅ **Sentry** — integração de código completa e testada (build real de `apps/api` e `apps/web` sem erros/avisos do Sentry; smoke test confirmando que `captureException` não quebra com DSN placeholder). Falta só o DSN real (ver §11).
- ✅ **CORS** — allowlist testada ponta a ponta via `curl` com preflight `OPTIONS`: origem em `CORS_ALLOWED_ORIGINS` recebe `Access-Control-Allow-Origin`, origem fora da lista não recebe o header.
- ✅ **Testes automatizados + CI** — 10 arquivos `*.spec.ts` cobrindo RN-05 a RN-32 (100 testes unitários, Prisma mockado) + 1 teste de integração multi-tenant contra Postgres real efêmero + pipeline de GitHub Actions com 5 jobs (lint, typecheck, test-unit, test-integration, build). Ver §17.
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
12. **`npm run lint`/`npm run typecheck` da raiz quebravam num checkout limpo**: dependiam de `packages/shared/dist` já existir, mas nenhum dos dois scripts compilava `@orion/shared` antes — só funcionava porque `dev:api`/`dev:web` sempre rodam `build:shared` primeiro, mascarando o problema em qualquer sessão que já tivesse rodado um desses. Reproduzido de propósito (apagando `dist/` e rodando `typecheck`) antes de confirmar e corrigir — ambos os scripts agora rodam `build:shared` como primeiro passo. Foi assim que o CI (ver §17) quase nasceu quebrado.
13. **Frontend era só leitura em quase tudo, e sem navegação nenhuma**: `/` era um placeholder (`<h1>Orion Flight Lab</h1>`) sem link pra nenhuma outra tela, e não existia nenhum componente de menu — cada página só era alcançável digitando a URL direto. Além disso, Students/Personnel/Courses só tinham listagem e detalhe, sem criar/editar/excluir (o backend também não tinha os endpoints correspondentes: `Student`/`Instructor` não tinham `PATCH`/`DELETE`, `Examiner` nem `GET :id` tinha, e o módulo `training` era um stub — só `GET /training/courses`, sem `POST` nem cadeia `TrainingProgram`→`Curriculum`). A lista de "Instrutores e examinadores" também só buscava instrutores (`/personnel/instructors`), examinadores nunca apareciam apesar do título. Tudo corrigido: `SidebarNav` (ver §18), CRUD completo (API + telas) pra Student, Instructor, Examiner, TrainingProgram/Curriculum (create+list) e Course (CRUD completo).

## 14. Armadilhas conhecidas (não redescobrir)

- **JWT de teste não pode ser assinado à mão** (`jwt.sign(payload, SUPABASE_JWT_SECRET)`) — desde o bug #5 acima, o guard só aceita tokens reais emitidos pelo Supabase Auth (ES256 via JWKS). Para testar endpoints protegidos, sempre: criar usuário real via `supabase.auth.admin.createUser({ app_metadata: { organization_id, roles } })` e depois `supabase.auth.signInWithPassword(...)` (client `anon`) para pegar um `access_token` de verdade.
- **`SUPABASE_URL`** deve ser só a URL base do projeto (`https://xxx.supabase.co`), nunca com `/rest/v1/` no final.
- **`DATABASE_URL`** (pooler, porta 6543) precisa de `?pgbouncer=true`. **`DIRECT_URL`** (porta 5432) não.
- Prisma bypassa RLS (conecta como owner) — a defesa multi-tenant real está 100% na camada de aplicação (`organization_id` explícito em todo `where`), não na RLS. RLS é defesa em profundidade para acesso direto via REST/anon key, não a linha de defesa principal do backend.
- `npm run dev:api` / `dev:web` fazem `npm run build:shared` antes (necessário — `@orion/shared` precisa estar compilado em `dist/`).
- **`service_role` do `supabase-js` não tem GRANT de `INSERT` em `user_profiles`** (`permission denied for table user_profiles`, código `42501`) — a API real nunca bate nesse problema porque o Prisma conecta como owner do banco, não como `service_role`. Mas se você for criar um `user_profile` de teste manualmente (§15, passo 2), **não use `admin.from('user_profiles').insert(...)` do client `service_role`** — insira via `execute_sql` (roda como owner) em vez disso.
- **`POST /exams` tem duas casing diferentes no mesmo DTO**: `type` valida contra o enum de `@orion/shared` (`teorico`/`pratico`, minúsculo), mas `result` valida contra o enum do Prisma (`APROVADO`/`REPROVADO`/`PENDENTE`, maiúsculo) — mandar `type: 'TEORICO'` retorna 400 ("must be one of the following values: teorico, pratico"). Não é bug, é só a convenção existente; ao escrever testes/scripts de exame, usar minúsculo em `type` e maiúsculo em `result`.
- **Não existe endpoint pra criar `Segment`/`Module`/`Unit`/`SubUnit`/`Lesson`** — só `TrainingProgram`, `Curriculum` e `Course` têm API (`training.controller.ts`). Pra testar `Attendance` (que exige um `lesson_id` real) ponta a ponta, a hierarquia inteira precisa ser inserida via `execute_sql` primeiro.
- **`storage.objects` do Supabase não aceita `DELETE` direto via `execute_sql`** (`ERROR: 42501: Direct deletion from storage tables is not allowed`) — é uma proteção deliberada do Supabase contra perda acidental de dado por objeto órfão. Pra apagar um arquivo de teste de um bucket privado, use a Storage API (client `supabase-js` com service role, `.storage.from(bucket).remove([path])`) — não há um MCP de Storage nesta sessão, então arquivos de teste às vezes ficam órfãos no bucket (inofensivo: são só bytes sem nenhuma linha de `DocumentVersion`/`Certificate` apontando pra eles, mas vale saber que `execute_sql` não é o caminho pra limpar isso).
- **`reactStrictMode` estava ligado (`apps/web/next.config.js`) e causava flicker visível em `next dev`**: o StrictMode do React remonta cada componente uma vez de propósito (mount → unmount → mount) só em dev, o que reseta o estado entre as duas passagens — qualquer tela que busca dado num `useEffect` (praticamente todo `new`/`[id]/edit` do app) mostrava "Carregando..." → conteúdo → "Carregando..." de novo → conteúdo, porque a requisição disparava duas vezes (confirmado via rede: `GET /students/:id` chegava 2x ao abrir a edição). Desligado (`reactStrictMode: false`) — não afeta build de produção, que nunca faz esse duplo-disparo independente da flag.
- **"Cannot find the middleware module" / "missing required error components, refreshing..."** — sintoma de cache de build (`apps/web/.next`) corrompido/desatualizado, tipicamente depois de reiniciar o `next dev` várias vezes numa sessão longa (`middleware-manifest.json` fica com `"middleware": {}` vazio mesmo com `src/middleware.ts` existindo). Uma tentativa de mitigação automática (`apps/web/scripts/check-next-cache.js` como `predev`) foi adicionada e depois **revertida a pedido do usuário** — o script não resolveu o problema de verdade (o processo antigo do `next dev` continuava rodando com o cache já carregado em memória, então apagar a pasta não bastava) e o usuário preferiu voltar ao comportamento original, sem "mágica" escondida no `predev`. Fix manual (o único caminho agora): **matar o processo do `next dev`** (`lsof -nP -iTCP:3000 -sTCP:LISTEN` pra achar o PID, `kill <PID>`), apagar `apps/web/.next` (`rm -rf apps/web/.next`), e só então subir `dev:web` de novo. Apagar só a pasta sem matar o processo não resolve — o processo antigo mantém o cache errado em memória e regenera o mesmo estado quebrado.
- **`window.open(url)` chamado depois de um `await` não é confiável** — o botão de download de Documentos fazia `await fetch(...)` pra pegar a signed URL e só então chamava `window.open`; como isso já não conta mais como parte do clique original do usuário, o bloqueador de popup do navegador barra silenciosamente (de forma intermitente, dependendo da velocidade da resposta). O padrão correto é abrir a aba **antes** do `await` (síncrono, dentro do handler de clique) e só setar `location.href` dela depois que a URL chegar — ver `handleDownload` em `apps/web/src/app/documents/[id]/edit/page.tsx`.

## 15. Metodologia de teste ponta a ponta (replicar em sessões futuras)

Para validar qualquer endpoint/regra de negócio contra a infra real:

1. Criar organização de teste via `mcp__claude_ai_Supabase__execute_sql` (sempre incluir `updated_at` nos inserts manuais — não tem default no banco).
2. Criar usuário real: `supabase.auth.admin.createUser({ app_metadata: { organization_id, roles: [...] } })` + inserir `user_profiles` com o mesmo `id` **via `execute_sql`** (o client `service_role` do `supabase-js` não tem GRANT de `INSERT` nessa tabela — ver §14).
3. Pegar token real: `supabase.auth.signInWithPassword(...)` com o client `anon`.
4. Subir API/web (`npm run dev:api` / `dev:web`), testar via `curl` com `Authorization: Bearer <token>` ou via Playwright (`chromium.launch`) para o frontend.
5. **Sempre limpar ao final**: apagar as linhas criadas (ordem inversa das FKs) e `supabase.auth.admin.deleteUser(...)`. Confirmar `select count(*) from organizations` = 0 antes de encerrar.
6. Rodar `npm run lint && npm run typecheck` antes de qualquer commit.

## 16. Próximos passos sugeridos (em ordem de valor)

Todas as RNs numeradas (§5), os itens de infraestrutura (Sentry, CORS) e a rede de testes automatizados (§17) estão implementados e testados (§12). O que resta é principalmente **completar a cobertura de CRUD do frontend** (ver §18) e itens que dependem de decisões/contas externas:

1. ⏳ **CRUD de frontend restante** (ver §18 para o mapa completo): Certificates ainda é só leitura (listagem/detalhe, sem criar/editar/excluir — emissão só via `issueCertificate`/RN-05). CRM (Accounts/Proposals/Pipelines) e Financial ainda não têm tela nenhuma no frontend — só existem via API. **Clients/Contracts/Documents já têm CRUD completo, Qualifications já tem entrada manual** (`/qualifications/new`, ver §18), **e SGQ/SGSO já têm frontend completo no modelo Listar + Criar + ações de estado, com edição habilitada especificamente em AuditProgram/Audit/Hazard/Risk** (ver §12 e §18 — NonConformity/CorrectiveAction/Mitigation/SafetyOccurrence continuam sem editar/excluir, decisão de escopo mantida onde não foi pedido o contrário). Sugestão de ordem: Certificates (depende de Enrollment já existente, escopo pequeno) → CRM/Financial (módulos inteiros sem UI ainda, maior escopo cada um — e hoje majoritariamente só POST + GET-lista no backend, sem `GET :id`/PATCH/DELETE na maioria das entidades, então também vão precisar de backend mínimo antes da UI, como foi feito para SGQ/SGSO).
2. Domínio: decidido — **`www.orionflightlab.com.br`** (raiz `orionflightlab.com.br`). Plano de subdomínio: `www.orionflightlab.com.br` (ou raiz) para `apps/web`, `api.orionflightlab.com.br` para `apps/api`. Ainda **não registrado/configurado em DNS** — quando o registro e a hospedagem estiverem prontos, setar `CORS_ALLOWED_ORIGINS=https://www.orionflightlab.com.br` (e o subdomínio de staging, se houver) antes de ir para produção (ver §11).
3. Smoke test E2E do `apps/web` (Playwright) no CI — deliberadamente fora de escopo até agora (ver §17).
4. Definir regras de negócio adicionais conforme o produto evoluir (novos módulos, novos requisitos ANAC) fica como próximo item de valor depois disso.

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

## 17. Testes automatizados e CI

A validação manual ponta a ponta (§15) prova que uma RN funciona *no momento em que foi testada* — não protege contra uma mudança futura quebrá-la silenciosamente. Esta seção existe para isso: uma rede de segurança automática, que roda sozinha a cada push/PR via GitHub Actions (`.github/workflows/ci.yml`), sem depender de infraestrutura real compartilhada.

### Duas camadas de teste, dois bancos diferentes

- **Unit (`apps/api/src/**/*.spec.ts`, rodado com `npm run test --workspace=apps/api`)** — um arquivo por service/cron que implementa alguma RN, `PrismaService` **mockado** (`jest.fn()` por model/método usado). Cobre cada RN nos dois sentidos: o cenário que ela **bloqueia** (deve lançar `BadRequestException`/`NotFoundException` citando o número da RN) e o que ela **libera**. Hoje são 10 arquivos, 100 testes, cobrindo RN-05 até RN-32 inteiras (mapa completo: `academic`, `personnel`, `sgq`, `sgso`, `contracts`, `crm`, `financial` (+ seu cron), `notifications.cron`, `audit-log.interceptor`) — `sgq`/`sgso` ganharam casos extras para os `find*` com campos derivados (`canClose`, `isHighRisk`/`canChangeStatus`) e para os `update*` novos (`updateAuditProgram`, `updateAudit`, `updateHazard`, `updateRisk` — este último cobre o recálculo de `risk_level`).
- **Integration (`apps/api/test/*.integration.spec.ts`, rodado com `npm run test:integration --workspace=apps/api`)** — usa o `PrismaClient` **real** (não mockado) contra um **Postgres efêmero**: no CI, um container `postgres:16-alpine` subido só para aquele job, com `prisma migrate deploy` aplicado; localmente, só roda se `DATABASE_URL` estiver setado (senão o describe inteiro é pulado via `describe.skip`) — **nunca aponte isso para o Supabase real do `.env`**, que deve continuar sempre vazio (§11). Hoje cobre a classe de bug do IDOR sistêmico (§13.9): criar uma entidade na organização B apontando para um recurso pai que pertence à organização A deve ser rejeitado, testado de verdade contra constraints reais do Postgres, não assumido.

Isso **não substitui** a validação manual ponta a ponta contra o Supabase real (§15) para mudanças grandes — são complementares. O CI garante que nada regride silenciosamente; a validação manual prova que a peça nova funciona de verdade contra a infra real na primeira vez.

### Pipeline (`.github/workflows/ci.yml`)

Gatilho: `push`/`pull_request` para `main`. 5 jobs, todos independentes entre si (rodam em paralelo): `lint`, `typecheck`, `test-unit`, `test-integration` (com o serviço Postgres efêmero acima), `build` (compila `apps/api` e `apps/web`; usa variáveis `NEXT_PUBLIC_*` placeholder já que o build do Next faz prerender e o client do Supabase lança erro se a URL vier vazia — nenhuma delas precisa ser real, o build nunca faz uma chamada de rede de verdade).

### Rodando localmente

```bash
npm run test --workspace=apps/api              # unit — sempre roda, sem dependências externas
DATABASE_URL=postgresql://user:pass@localhost:5432/postgres \
DIRECT_URL=postgresql://user:pass@localhost:5432/postgres \
  npx prisma migrate deploy && \
  npm run test:integration --workspace=apps/api  # integration — precisa de um Postgres real (local/container), nunca o do .env
```

Docker não está disponível neste sandbox (§11), então o teste de integração não pôde ser exercitado localmente nesta sessão — foi validado por checagem de tipos isolada (`tsc --noEmit` no arquivo) e a prova real de que funciona é o próprio job `test-integration` passando no GitHub Actions.

## 18. Frontend (`apps/web`) — navegação e cobertura de CRUD por módulo

O frontend deixou de ser um conjunto de telas soltas sem navegação — agora tem menu lateral e CRUD real nas áreas principais do dia a dia (aluno/curso/pessoal). O resto ainda é só leitura ou não tem tela nenhuma; a tabela abaixo é a fonte da verdade de onde cada módulo está.

### Navegação

- `apps/web/src/components/nav/sidebar-nav.tsx` (`SidebarNav`) — menu lateral fixo, renderizado em `apps/web/src/app/layout.tsx` sempre que existe uma sessão (então some sozinho em `/login`). Lê `roles` do `session.user.app_metadata.roles` (vem direto do JWT do Supabase, sem round-trip extra à API) e esconde os links de Clientes/Contratos/SGQ/SGSO/Relatórios pra quem não tem o role, espelhando exatamente as mesmas restrições que o `middleware.ts` já aplicava — então não é só cosmético, é redundante de propósito com a proteção real de rota. O item "SGQ" aponta pra `/sgq/audit-programs` e "SGSO" pra `/sgso/hazards` (pontos de entrada, não existe hub `/sgq`/`/sgso`) — o destaque de "ativo" no menu só acende exatamente nesses dois prefixos, não em `/sgq/audits/*`/`/sgq/non-conformities/*`/etc. (gap cosmético aceito, a proteção real de rota do `middleware.ts` usa prefix-match em `/sgq`/`/sgso` inteiros, então isso não é um problema de segurança).
- `/` (raiz) redireciona direto pra `/dashboard` (`apps/web/src/app/page.tsx`, `redirect('/dashboard')`) — antes era um placeholder sem função.

### Cobertura de CRUD por módulo

| Módulo | Listagem/Detalhe | Criar | Editar | Excluir | Observação |
|---|---|---|---|---|---|
| **Students** (`/students`) | ✅ | ✅ `/students/new` | ✅ `/students/[id]/edit` | ✅ (soft-delete, mesmo botão do edit) | — |
| **Personnel — Instructors** (`/personnel`) | ✅ `/personnel/instructors/[id]` | ✅ `/personnel/instructors/new` | ✅ `/personnel/instructors/[id]/edit` | ✅ | Filtro Ativo/Inativo/Todos (`?status=`), mesmo padrão de Students |
| **Personnel — Examiners** (`/personnel`) | ✅ `/personnel/examiners/[id]` | ✅ `/personnel/examiners/new` | ✅ `/personnel/examiners/[id]/edit` | ✅ | Antes nem aparecia na listagem (§13.13); mesmo filtro Ativo/Inativo/Todos (compartilhado com Instructors, um só `?status=` filtra as duas tabelas) |
| **Courses** (`/courses`) | ✅ | ✅ `/courses/new` | ✅ `/courses/[id]/edit` | ✅ | Exige um Currículo existente — se não houver, o form manda pra `/courses/setup` |
| **TrainingProgram / Curriculum** (`/courses/setup`) | ✅ (lista simples) | ✅ (form simples) | ❌ | ❌ | Minimalista de propósito — só o suficiente pra desbloquear criar Curso (ver §16 item 1 se precisar de mais) |
| **Enrollments / Exams** | — | ✅ `/enrollments/new`, `/exams/new` | ❌ | ❌ | Já existiam antes desta rodada; RN-11/RN-07 são exercitadas de verdade nesses forms |
| **Documents** (`/documents`) | ✅ | ✅ `/documents/new` | ✅ `/documents/[id]/edit` | ✅ | `/documents/new` já tem título/categoria/status/arquivo num formulário só (cria o `Document` e, se um arquivo foi escolhido, sobe a v1 na sequência); edição permite enviar novas versões e baixar a atual (signed URL, botão "Baixar documento") |
| **Certificates** (`/certificates`) | ✅ | ❌ | ❌ | ❌ | Emissão só via `issueCertificate` (RN-05), sem tela própria ainda |
| **Qualifications** (`/qualifications`) | ✅ | ✅ `/qualifications/new` (manual) | ❌ | ❌ | Criação automática também existe fora desta tela: emitir certificado de um curso `TEORICO` cria a qualificação sozinho (RN-05, ver §5/§12) |
| **Clients** (`/clients`) | ✅ | ✅ `/clients/new` | ✅ `/clients/[id]/edit` | ✅ | — |
| **Contracts** (`/contracts`) | ✅ | ✅ `/contracts/new` | ✅ `/contracts/[id]/edit` | ✅ | Exige um Cliente existente — se não houver, o form manda pra `/clients/new` |
| **SGQ — AuditProgram** (`/sgq/audit-programs`) | ✅ (lista + `[id]` com Audits filhos) | ✅ `/sgq/audit-programs/new` | ✅ `/sgq/audit-programs/[id]/edit` | ❌ | Ponto de entrada do módulo (item "SGQ" no menu) |
| **SGQ — Audit** | ✅ `/sgq/audits/[id]` (com NonConformities filhas, data formatada `dd/mm/yyyy`) | ✅ `/sgq/audits/new` (exige AuditProgram, aviso âmbar se vazio) | ✅ `/sgq/audits/[id]/edit` (`audit_program_id` não editável) | ❌ | — |
| **SGQ — NonConformity** | ✅ `/sgq/non-conformities/[id]` (com CorrectiveActions filhas) | ✅ `/sgq/non-conformities/new` (exige Audit) | ❌ | ❌ | Botão "Fechar não conformidade" (RN-25) — desabilitado/some conforme `canClose`/`status`, ver §12 |
| **SGQ — CorrectiveAction** | — (só embutida no detalhe da NonConformity, sem GET próprio) | ✅ `/sgq/corrective-actions/new` (exige NonConformity) | ❌ | ❌ | Botão "Concluir" inline na tabela da NonConformity; RN-26 valida `due_date` |
| **SGSO — Hazard** (`/sgso/hazards`) | ✅ (lista + `[id]` com Risks filhos) | ✅ `/sgso/hazards/new` | ✅ `/sgso/hazards/[id]/edit` | ❌ | Ponto de entrada do módulo (item "SGSO" no menu) |
| **SGSO — Risk** | ✅ `/sgso/risks/[id]` (com Mitigations filhas) | ✅ `/sgso/risks/new` (exige Hazard; probabilidade/severidade em `<select>` 1-5) | ✅ `/sgso/risks/[id]/edit` (`hazard_id` não editável, recalcula `risk_level`) | ❌ | Botões "Marcar aceito"/"Marcar mitigado" (RN-27) — sempre visíveis, editáveis a qualquer momento (botão do status atual desabilitado), gate `canChangeStatus` continua valendo, ver §12 |
| **SGSO — Mitigation** | — (só embutida no detalhe do Risk, sem GET próprio) | ✅ `/sgso/mitigations/new` (exige Risk) | ❌ | ❌ | — |
| **SGSO — SafetyOccurrence** (`/sgso/safety-occurrences`) | ✅ (lista flat, sem `[id]`) | ✅ `/sgso/safety-occurrences/new` | ❌ | ❌ | Campo "Perigo vinculado" vira obrigatório no client quando severidade digitada é alta/crítica (RN-28) |
| **CRM (Accounts/Proposals/Pipelines), Financial** | ❌ | ❌ | ❌ | ❌ | Sem tela nenhuma — só existem via API (RN-29 a RN-32, testadas via `curl`, ver §12); backend hoje é majoritariamente só POST + GET-lista, vai precisar do mesmo tipo de `GET :id` mínimo que SGQ/SGSO ganharam antes de ter UI |

### Convenções das telas novas (seguir esse padrão ao adicionar mais)

- Toda tela de criação/edição é `'use client'`, com `fetch` direto pro `NEXT_PUBLIC_API_URL` (não usa `apiFetch` de `lib/api.ts`, que é só server-side) — mesmo padrão de `enrollments/new` e `exams/new`, que já existiam antes.
- Erro de validação: lê `body.errors[0].message` da resposta `{ data, meta, errors }` e mostra num `<p className="text-sm text-red-600">`.
- Exclusão sempre usa `confirm('Excluir ...? Essa ação não pode ser desfeita.')` antes de disparar o `DELETE` — não existe modal de confirmação customizado no projeto ainda, é o `confirm()` nativo do browser mesmo.
- Toda entidade "filha" que depende de uma "pai" que ainda não existe (ex.: Course sem Curriculum) mostra um aviso inline com link pra onde criar a dependência, em vez de deixar o formulário quebrar ou esconder o botão sem explicação.
- Toda tela `new`/`[id]/edit` tem um link `← Voltar para <Módulo>` (`text-sm text-slate-600 hover:underline`) logo acima do `<h1>`, apontando pra listagem do próprio módulo — não para `router.back()`, sempre um caminho fixo conhecido.
