# report-media-reference-compatibility Specification

## Purpose

Move report images from stored public URLs to stable storage references safely.

## Requirements

### Requirement: Dual-Compatible Media References

The system MUST transition from legacy `publicUrl` references to canonical bucket/path references using dual-read/dual-write or equivalent compatibility. Security criteria: media access MUST follow bucket policy enforcement, not assumed permanent public URLs. Non-regression criteria: legacy report images MUST continue rendering during rollout.

#### Scenario: New image is stored safely

- GIVEN a report image is uploaded during the transition
- WHEN persistence completes
- THEN bucket/path is the canonical reference
- AND compatibility data is still available for legacy readers

#### Scenario: Legacy image still renders

- GIVEN a report only has the legacy image reference
- WHEN an existing page reads it
- THEN the image resolves without breaking the flow

### Requirement: Incremental Backfill Safety

The transition MUST be backward-compatible, resumable, and reversible by phase. Performance criteria: image reads SHOULD avoid extra per-record lookups. Maintainability criteria: parsing and URL generation MUST live in typed shared helpers/constants.

#### Scenario: Backfill is partial

- GIVEN legacy image rows still exist
- WHEN backfill or read-repair is only partly complete
- THEN both migrated and unmigrated rows continue working
