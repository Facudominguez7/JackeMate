# supabase-security-boundaries Specification

## Purpose

Harden Supabase boundaries without changing intended UX.

## Requirements

### Requirement: Access Matrix and Trusted Mutations

The system MUST define a table/bucket access matrix and SHALL execute sensitive writes from trusted server entrypoints, not browser-owned table writes. Security criteria: RLS, storage policies, and notification routes MUST authorize with server-validated identity/roles, never `user_metadata`. Non-regression criteria: authorized report creation, voting, comments, admin state changes, and notifications MUST keep working.

#### Scenario: Sensitive write stays server-owned

- GIVEN an authenticated user starts a sensitive mutation
- WHEN persistence or side effects occur
- THEN a trusted server boundary authorizes and executes the operation

#### Scenario: Unauthorized caller is denied

- GIVEN a caller lacks required auth, role, or origin
- WHEN it targets a protected table, bucket action, or notification route
- THEN the operation is rejected without partial side effects

### Requirement: Baseline Migrations and Measured Queries

The system MUST adopt one tracked migration baseline before further schema or policy changes and SHALL add later changes as backward-compatible incremental migrations. Performance criteria: reads SHOULD reduce payload and round-trips first; indexes MAY be added only from measured evidence. Maintainability criteria: shared query helpers MUST expose explicit typed shapes.

#### Scenario: Schema change is prepared safely

- GIVEN a schema, RLS, or storage change is needed
- WHEN it is prepared for delivery
- THEN it is represented as a tracked migration after the baseline exists

#### Scenario: Query tuning is evidence-based

- GIVEN a hot-path read is heavy or slow
- WHEN it is optimized
- THEN payload shaping happens before indexing
- AND any index is justified by observed query behavior
