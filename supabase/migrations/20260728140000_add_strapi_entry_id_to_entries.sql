-- Prepares Supabase for the Strapi content migration. Purely additive and does not
-- change the behavior of any existing function or query — title/body stay untouched
-- through the whole soak period, which is what makes the cutover reversible. See the
-- Strapi migration plan for the full staged-cutover sequence.
--
-- match_entries_by_vector's signature changes to consume this column in a separate
-- migration applied together with the journal-ops.ts code that switches to it — not
-- here, so this migration never breaks the currently-live hybrid search.

alter table entries add column if not exists strapi_entry_id text;
create unique index if not exists entries_strapi_entry_id_idx on entries (strapi_entry_id);
