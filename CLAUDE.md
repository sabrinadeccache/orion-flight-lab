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
