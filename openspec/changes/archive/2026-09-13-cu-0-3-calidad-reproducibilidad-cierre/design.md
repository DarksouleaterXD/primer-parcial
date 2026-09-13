## Context

See `proposal.md` for motivation and `specs/base-executable-assurance/spec.md` for the observable guarantees. CU-0.2 already provides the workspaces, root commands, PostgreSQL Compose service, health contract and web status behavior. This increment adds confidence and evidence around that path without changing it.

## Goals / Non-Goals

**Goals:**

- Make the existing root quality commands and build repeatable in CI from the root lockfile.
- Prove a clean preparation path without destructive cleanup of a developer checkout.
- Exercise the already implemented browser flow against the real API and PostgreSQL in both availability states.
- Record only results actually executed before closing CU-0.

**Non-Goals:**

- No deployment workflow, package publication, remote repository creation, application behavior change or new runtime service.
- No full cross-browser matrix, visual regression system, general browser-test framework, new build pipeline or replacement of the historical CU-0.1 validator.

## Decisions

### CI reuses the current root contract and Compose service

Add one versioned CI workflow fixed to Node `24.11.1` and npm `11.6.2`, the approved and locally verified toolchain. It prints `node --version` and `npm --version` before installing strictly with `npm ci`, starts the existing PostgreSQL Compose service only because API and E2E verification require the real health dependency, then runs root lint, typecheck, test, E2E and build commands. The workflow contains no deployment or publication steps and uses no secret values.

The workflow definition alone is not CI evidence. A real result requires a repository and runner authorized by the user; creating a remote, pushing, publishing or configuring external access is outside this change and OpenCode does none of those actions. If no authorized runner exists at closure, documentation records the blocker and CU-0 remains open.

The observed CI failure is toolchain drift: the range `node-version: 24` resolved Node `24.21.0` and npm `11.19.0`, while the current root lockfile successfully executed `npm ci` in isolated Linux with Node `24.11.1` and npm `11.6.2`. The optional chain `jest-resolve` -> `unrs-resolver` -> WASI binding -> `@napi-rs/wasm-runtime` exposes the `@emnapi/*` peers, but does not make them direct project dependencies. The lockfile therefore remains unchanged; adding those packages directly, regenerating a lockfile without need, running `npm audit fix`, or changing functional dependencies would mask rather than fix the cause.

Alternatives discarded: a separate CI-only database configuration would duplicate the local contract; a mock PostgreSQL health check would not prove the current readiness behavior; a deployment workflow exceeds CU-0.3.

### Clean reproduction uses an isolated copy, never destructive cleanup

Document and automate a bounded clean reproduction procedure in a temporary directory outside `D:\project-planning`, made only from the versioned snapshot being verified. It excludes `node_modules`, `dist`, `.astro`, coverage and generated outputs; it never reads `.env` files from the developer checkout. It runs `npm ci`, starts the existing Compose service, exports the documented synthetic origins and performs the same base checks. The procedure requires the fixed local PostgreSQL port to be available and restores only resources it started; it never uses `git clean`, removes or modifies checkout files, or modifies the historical CU-0.1 validator. It may remove only its own temporary directory.

The CI runner is the independent clean-environment evidence. The local procedure provides a reproducible manual counterpart and records a blocked port or unavailable Docker engine as an observable failure rather than bypassing it. If the intended changes are absent from the selected versioned snapshot, it records no clean-reproduction evidence.

Alternatives discarded: deleting the developer checkout's `node_modules` or `dist` is destructive; relying on the existing checkout cannot demonstrate clean preparation; a second lockfile would violate CU-0.2.

### Chromium E2E is the minimum browser evidence

Add `@playwright/test` as the only new development dependency and run a single Chromium project. This dependency is justified by the requirement to observe the browser-rendered `ApiStatus` lifecycle; component tests cannot establish that the loaded web, CORS, API and PostgreSQL path work together.

Block 1 configures this tooling only: package, Chromium project, Playwright configuration, root `test:e2e` command and CI browser installation. Block 3 adds the actual available, unavailable and recovery scenarios.

The configuration starts the existing API and web development servers with explicit environment origins. In CI, it installs Chromium explicitly after `npm ci`; the PostgreSQL service lifecycle belongs to that job. For local E2E, the suite records whether only the project Compose `postgres` service was initially started or stopped before touching it. It first observes availability, then stops only that service, reloads a new browser page to observe unavailability, and in `finally` restores the original state: started and healthy if initially started, or stopped if initially stopped. It never invokes `docker compose down -v`, deletes a container or volume, or touches PostgreSQL outside this Compose project. It uses no polling or retry logic beyond existing service readiness boundaries.

Alternatives discarded: asserting static HTML does not execute the island; browser mocks cannot prove the integrated path; a multi-browser matrix and visual snapshots exceed the minimum requirement.

### CU closure is evidence-driven

The implementation updates CU-0 and status documentation only after CI, clean reproduction, browser/manual checks and final scope review have real results. CU-0 can be marked terminated only when all CU-0.3 acceptance criteria pass; otherwise documentation records the unresolved blocker and CU-1 remains untouched.

Alternatives discarded: closing from planned commands or mocked tests would contradict the project evidence rules; changing the product or advancing CU-1 is outside this increment.

## Risks / Trade-offs

- [Docker Engine or port 5432 unavailable in a clean run] → Record the observable blocker, stop the verification and do not claim reproduction success.
- [Stopping PostgreSQL leaves the E2E environment unavailable] → Capture the initial Compose-service state, restore it in `finally`, verify readiness only when it was initially started, and never remove containers, volumes or external instances.
- [Playwright browser download is unavailable] → CI and local setup report the failed browser prerequisite; no fallback browser or silent skip is accepted as E2E evidence.
- [CI environment differs from local Windows] → CI proves an isolated supported runner while the documented Windows clean procedure remains separately executed and recorded.
- [A Node major alias resolves a newer npm] → Pin Node `24.11.1`, verify npm `11.6.2` before `npm ci` and keep the lockfile unchanged when the approved Linux toolchain accepts it.
- [No authorized CI runner exists] → Keep the workflow versioned, record the missing evidence as a closure blocker and do not mark CU-0 terminated.
- [A quality check is mistaken for CU-0.3 completion] → Keep check evidence, manual evidence, scope review and documentation closure as distinct tasks.

## Migration Plan

No data migration is required. Apply in four reviewable blocks: CI and repeatable commands; isolated clean reproduction; bounded browser E2E and manual validation; then evidence/documentation/scope closure. If any block fails, retain earlier evidence, restore only services started by the block, document the blocker and do not start the next block or CU-1.
