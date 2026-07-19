# supabase/rls

Estes arquivos SQL (RLS, policies, triggers, buckets de Storage) pressupõem que as
tabelas de negócio já existem — elas são criadas pelas migrations do **Prisma**
(`prisma/migrations/`), não pelo Supabase CLI.

Por isso este diretório **não se chama `supabase/migrations`**: o `supabase start`/
`supabase db reset` aplicaria automaticamente qualquer coisa em `supabase/migrations/`
contra um Postgres recém-criado, *antes* do Prisma ter chance de criar as tabelas —
e todo `alter table ... enable row level security` / `create policy` aqui falharia
(tabela inexistente).

**Ordem correta, sempre**:

1. Subir o Postgres (local: `supabase start`; produção: já existe).
2. `npx prisma migrate deploy` — cria as tabelas.
3. Aplicar estes arquivos em ordem numérica, manualmente:
   ```bash
   for f in supabase/rls/*.sql; do
     psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f "$f"
   done
   ```

Isso é exatamente o que o job `test-e2e` do CI faz (`.github/workflows/ci.yml`) e é o
mesmo passo que qualquer sessão local precisa rodar manualmente depois de
`supabase start` — não existe automação de "rodar tudo sozinho" aqui de propósito,
pra essa dependência de ordem ficar visível em vez de escondida.
