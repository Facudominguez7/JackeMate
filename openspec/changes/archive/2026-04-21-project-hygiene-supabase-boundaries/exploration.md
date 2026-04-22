# Exploration: Project Hygiene Supabase Boundaries

## Findings

- The repository already uses a layered `database/queries/**` pattern, which makes the compatibility-first split practical.
- Supabase access hardening needs a staged rollout because current browser flows still depend on legacy reads.
- Media migration is safest with dual-read compatibility and a later backfill/tighten step.

## Notes

- Keep performance changes evidence-based; prefer payload shaping before indexes.
- Use server-fetched profile/role data rather than `user_metadata` for authz decisions.
