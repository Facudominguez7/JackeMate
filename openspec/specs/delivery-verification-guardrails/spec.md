# delivery-verification-guardrails Specification

## Purpose

Define release guardrails for reliability, hygiene, and fragile-flow control without a test runner.

## Requirements

### Requirement: Required Validation and Smoke Gates

The system MUST require `npm run lint` and `npx tsc --noEmit`, and SHALL pair them with a serious manual/smoke plan for auth, report creation, voting, comments, admin transitions, dashboard, map/list views, notifications, and image rendering. Reliability criteria: checks MUST use real observable app or database results. Non-regression criteria: fragile routes and critical flows MUST pass before release.

#### Scenario: Change is release-ready

- GIVEN code, schema, or policy changes are complete
- WHEN release readiness is evaluated
- THEN lint and type validation pass
- AND manual/smoke results exist for critical flows

#### Scenario: Fragile flow regresses

- GIVEN a fragile route or critical path fails smoke verification
- WHEN the release is assessed
- THEN the change is not ready

### Requirement: Typed Hygiene Boundaries

The system SHOULD replace repeated `any`, magic catalog IDs, and overloaded helpers with typed boundaries, shared constants, and single-purpose modules. Maintainability criteria: business rules, auth checks, and data shaping SHOULD be isolated by responsibility. Performance criteria: hygiene work MUST NOT add unjustified round-trips or payload growth.

#### Scenario: Shared rule is normalized

- GIVEN a role, state, or access rule appears in multiple flows
- WHEN it is normalized
- THEN a typed shared helper or constant becomes the source of truth
