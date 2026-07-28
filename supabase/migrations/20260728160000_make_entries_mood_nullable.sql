-- Part 1 of the photo-links-in-Strapi change. Photos-only entries (no text/mood
-- picked yet) are now a legitimate state — a photo upload does find-or-create on
-- the Strapi entry, and there's no sensible default numeric mood to fake. This
-- must land before any journal-ops.ts code path can write mood: null into this
-- mirror table's after() background embedding-sync callback, or that write throws
-- against the still-NOT NULL column.
--
-- The existing check (mood between 1 and 5) constraint is already NULL-safe —
-- Postgres CHECK constraints pass when the expression evaluates to NULL — so no
-- constraint change is needed here.

alter table entries alter column mood drop not null;
