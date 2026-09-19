## Why

CU-3 must make each user's UML work durable so a private project can be created, reopened, and safely managed across sessions. This is needed after the canonical UML model and command history are established, without expanding collaboration or generation scope.

This proposal is grounded in `docs/puds/use-cases/README.md`, the CU-3 use-case documentation, `docs/architecture/README.md`, `docs/decisions/ADR-0001-initial-technical-boundaries.md`, `docs/STATUS.md`, `docs/product/product-05-astro-nestjs.md`, and `AGENTS.md`.

## What Changes

- Introduce durable, private UML projects with create, list, get, reopen, rename, delete, and explicit save operations.
- Persist each project as one canonical `ProjectDocument`, including the UML model, diagram layout, generation profile, and document metadata; no second persisted UML model is introduced.
- Make the NestJS backend authoritative for project ownership and persistence through a TypeORM and PostgreSQL API.
- Require optimistic revision control for mutations and return explicit conflicts when a submitted revision is stale.
- Connect the frontend to project persistence only through the API.
- Keep realtime/WebSocket collaboration, undo/redo history changes, autosave, versioning, XMI, generation, AI, project sharing, and roles out of scope.
- Do not change CU-2 command behavior.

## Capabilities

### New Capabilities
- `uml-project-persistence`: Private, durable project lifecycle and canonical ProjectDocument persistence with authoritative ownership and optimistic revision conflicts.

### Modified Capabilities

## Impact

- Affected systems: NestJS API, TypeORM entities and explicit PostgreSQL migrations, authenticated project ownership checks, shared typed API contracts, and the API-only frontend project workflow.
- The canonical UML domain remains the semantic source of truth; persisted layout remains visual state only.
- No new WebSocket, realtime, XMI, generator, AI, sharing, role-management, autosave, versioning, or command-history behavior is introduced.
