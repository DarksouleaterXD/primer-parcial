## Context

See `proposal.md` for motivation and `specs/` for the behavior contract. CU-0.1 supplies npm workspaces, Compose PostgreSQL and environment examples, but no applications, dependencies or lockfile. This increment must create the smallest real web-to-API-to-PostgreSQL path while preserving the approved separation between the principal NestJS API and the future generated Spring application.

## Goals / Non-Goals

**Goals:**

- Satisfy the requirements in `base-executable-workspaces`, `api-health` and `web-api-status` with three concrete workspaces and one root installation.
- Keep the health response and the availability states small, typed and testable across API and web.
- Make a database outage observable as `503` rather than preventing the health endpoint from reporting its dependency state.

**Non-Goals:**

- No shared application domain, generic HTTP client, configuration framework, entity, migration or package beyond the health contract.
- No CI, Playwright suite, clean-machine reproducibility closure or any CU-0.3 evidence. The commands introduced here support this increment; CU-0.3 remains responsible for quality closure and CI.
- No authentication, UML, canvas, WebSocket, collaboration, XMI, generation, IA, voz, imágenes, PWA/Android or offline behavior.

## Decisions

### Tres workspaces concretos y un solo lockfile

`apps/web`, `apps/api` and `packages/contracts` are the only workspaces created. The root package owns the sole `package-lock.json` and delegates development, test, lint, typecheck and build commands to those workspaces.

Node.js `24.11.1` remains the approved runtime. The root devDependencies pin `@nestjs/cli` to the exact version `11.0.24`; this Nest CLI 11 release resolves `@angular-devkit/core` and related DevKit packages at `19.2.27`, whose Node engine accepts Node 24.11.1. Dependencies are installed only from the root so npm produces the sole lockfile there. Before work continues, installation must complete without an Angular DevKit `EBADENGINE` error.

`packages/contracts` exports only the health representation `{ status: "available" | "unavailable" }` and has no import from Astro, Preact, NestJS or TypeORM. This directly supports [base-executable-workspaces: Los workspaces contienen solo los componentes de CU-0.2], [base-executable-workspaces: La raíz ofrece comandos verificables de CU-0.2], [base-executable-workspaces: La instalación usa un único lockfile raíz] and [api-health: La API expone su salud con dependencia verificada].

Alternatives discarded: duplicating response types in web and API would let the two consumers drift; a broader shared domain or utility package would create unneeded future abstractions; workspace-level lockfiles would violate the single-install requirement. Updating Node, using `latest` or a version range for the Nest CLI, or adding transitive dependency overrides would make the approved runtime or dependency resolution unstable and are excluded.

### API principal mínima con disponibilidad desacoplada del arranque

`apps/api` uses NestJS 11 over Express, TypeORM and the existing PostgreSQL Compose service. The NestJS bootstrap loads database configuration but SHALL NOT initialize a database connection or await TypeORM before listening. Each explicit `GET /api/health` creates a short-lived TypeORM `DataSource`, initializes it, executes a real connectivity query, and closes it after a successful check. An initialization or query error is caught by that same request and returns the shared `unavailable` representation with `503`; a successful initialization and query returns `available` with `200`.

This satisfies [api-health: La API expone su salud con dependencia verificada] and prevents a failed initial database connection from eliminating the endpoint that must report the outage. A later explicit health request performs a new independent check; there is no background reconnect loop, polling or retry mechanism. There are no entities or migrations because the health probe needs only a database connectivity check.

Alternatives discarded: treating process startup as database readiness cannot represent the required `503`; a mocked health value violates the real-dependency requirement; adding a generic readiness framework is unnecessary for one dependency.

### CORS and OpenAPI belong to the principal API boundary

The API reads one allowed web origin from environment configuration and rejects an empty or wildcard origin configuration rather than emitting `*`. Swagger for the principal NestJS API exposes `/api/docs` and `/api/docs-json`; its health operation is derived from the same response contract and status codes used at runtime.

This satisfies [api-health: El acceso cruzado usa un origen configurado] and [api-health: La salud se documenta como parte de la API principal]. `@nestjs/swagger` is justified only by that documentation requirement, and the PostgreSQL driver is justified only by the real TypeORM health check.

Alternatives discarded: a wildcard CORS policy violates the requirement; hardcoding the web origin prevents environment-specific execution; documenting health outside the runtime API allows contract drift.

### Web status isolates one finite request lifecycle

`apps/web` is an Astro application with one Preact island, `ApiStatus`. The island receives the API origin from public environment configuration, begins in `comprobando`, performs one health request, validates the shared `status` value and then renders `API disponible` or `API no disponible`. It cancels or abandons a request after a finite local timeout and handles rejected network requests as unavailable.

This directly implements [web-api-status: La web consulta el health configurado], [web-api-status: La web comunica el ciclo de disponibilidad] and [web-api-status: La web trata timeout y fallos de red como no disponibles]. No reusable API client, retry policy or state store is introduced because this increment has one request and three states.

Alternatives discarded: a hardcoded API URL prevents environment configuration; keeping the previous success after a failed check reports false health; polling and automatic retries add behavior not required by the scenarios.

### Tests follow each externally observable contract

Backend tests cover available and unavailable health results, CORS behavior, and the OpenAPI descriptions. Contract tests ensure the shared representation is accepted by each consumer. `ApiStatus` component tests cover pending, `200`, `503`, invalid response, timeout and network-error states. Root lint, typecheck, test and build commands aggregate the relevant workspace checks, and an integrated execution confirms the browser request reaches the API under configured origins.

This is the minimum verification path for every scenario in `api-health`, `web-api-status` and [base-executable-workspaces: La raíz ofrece comandos verificables de CU-0.2]. Jest with Nest testing and Supertest, plus Vitest and Testing Library for Preact, are justified by the approved test stack and these requirements. Playwright is excluded because its full suite belongs to CU-0.3.

Alternatives discarded: only unit-mocking the API would not verify PostgreSQL readiness or OpenAPI; browser E2E infrastructure would enlarge the increment beyond its required smoke path.

## Risks / Trade-offs

- [Docker engine remains unavailable or port 5432 is occupied] → Revalidate both before apply; identify an existing listener without stopping or reconfiguring it, and record the blocker rather than fabricating integration evidence.
- [Database unavailable during API bootstrap] → Do not initialize TypeORM during bootstrap; create, check and close the short-lived `DataSource` only within an explicit health request so it can return `503`.
- [CORS configuration blocks the web] → Use explicit web/API origins in environment examples and test allowed and disallowed origins; never relax the policy to `*`.
- [The web receives a malformed or stale health payload] → Validate the two allowed status values and render unavailable on any invalid response.
- [Basic checks are mistaken for CU-0.3 closure] → Document results as CU-0.2 evidence only; CI, clean-environment reproducibility and the CU closure remain pending.

## Migration Plan

No persisted application data or prior applications exist, so no data migration is required. Apply in the four task blocks: establish workspaces and the contract, make the API and database check executable, add the web status path, then run the bounded checks and update CU-0.2 documentation. If a block fails, stop at that block, retain the prior verified block, correct only the documented task or update this change if a new requirement is discovered; do not proceed to later blocks.
