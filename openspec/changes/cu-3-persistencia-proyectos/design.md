## Context

See `proposal.md` for motivation. `@primer-parcial/uml-domain` already owns the
closed, versioned `ProjectDocument` contract, its deterministic serializer,
parser, and the single validator with the `save` policy. Its `UmlCommandBus` is
an in-memory boundary with private Undo/Redo snapshots. The API already obtains
the authenticated identity exclusively from the Bearer JWT and uses TypeORM with
explicit PostgreSQL migrations and `synchronize: false`; the web already uses an
API client boundary for session traffic.

CU-3 adds durability to that existing document without creating a relational
representation of UML elements or another semantic model. The API becomes the
authority for ownership, durable revision, and timestamps. The web remains a
client of that API and only creates a local bus after receiving a valid document.

## Goals / Non-Goals

**Goals:**

- Persist one canonical, valid `ProjectDocument` per private project with
  explicit TypeORM migration, ownership, audit timestamps, and revision.
- Define versionable, typed REST request and response envelopes for the complete
  project lifecycle, including an explicit safe conflict result.
- Make create, rename, save, and delete atomic against an expected revision
  without last-write-wins behavior.
- Preserve the domain as the only place that parses, serializes, and validates
  UML semantics, and leave the web with an API-only seam for later project UI.

**Non-Goals:**

- No persisted Undo/Redo, revision history, autosave, merge, conflict
  resolution, collaboration, WebSocket, presence, sharing, roles, XMI,
  generation, or AI.
- No second UML model, element-level relational tables, direct browser database
  access, or direct persistence from `UmlCommandBus`.
- No design of project-management screens beyond the client/repository seam;
  destructive-action confirmation remains a later UI concern.

## Decisions

### Layered project persistence boundary

The implementation has four one-way layers:

1. `@primer-parcial/uml-domain` owns `ProjectDocument`,
   `createProjectDocument`, `serializeProjectDocument`,
   `parseProjectDocument`, and `validateProjectDocument(..., "save")`. It has
   no NestJS, TypeORM, PostgreSQL, HTTP, or Preact dependency.
2. An API application service owns lifecycle use cases and translates between
   authenticated principal, domain document, repository result, and public
   contract. It never lets a controller or entity become a UML validator.
3. A TypeORM/PostgreSQL adapter owns entity mapping, transactions, conditional
   mutations, and migration-backed storage. It returns application-level
   outcomes, not raw TypeORM errors or entities.
4. The REST controller is guarded by `JwtAuthGuard`, accepts/returns contract
   DTOs through the existing Zod/`nestjs-zod` approach, and delegates only to
   the application service. The web calls this API client; it never imports a
   database adapter.

`UmlCommandBus` continues to mutate only its local document. A later explicit
Save action reads `bus.currentDocument` and sends that snapshot through the web
client. Reopen/get first validates the returned document with the domain parser,
then constructs a fresh local `UmlCommandBus`; the persisted history is never
reconstructed. This prevents a second persistence mutation path and guarantees
that a loaded document crosses the same domain boundary as every other input.

Alternative rejected: have the bus write through a repository or HTTP callback.
That would couple a portable local command/history primitive to transport,
ownership, and concurrency concerns, and would introduce autosave-like behavior
outside this change.

### Durable record and migration

Create a `uml_projects` TypeORM entity and an explicit migration. Its columns
are:

| Column | Purpose |
|---|---|
| `id uuid primary key` | Project/document identity generated for the canonical document. |
| `owner_id uuid not null` | Server-owned FK to `users.id`. |
| `name varchar not null` | Queryable project name, kept equal to `document.name`. |
| `revision integer not null` | Durable non-negative optimistic-concurrency revision, initially `0`. |
| `document jsonb not null` | Full canonical `ProjectDocument` JSON envelope. |
| `created_at timestamptz not null` | TypeORM principal-application audit timestamp. |
| `updated_at timestamptz not null` | TypeORM principal-application audit timestamp. |

The migration adds a foreign key from `owner_id` to `users.id` with `ON DELETE
CASCADE`, plus a `(owner_id, updated_at DESC, id)` index for private list/read
paths. The projects are owned data with no independent lifecycle once an account
is removed, so cascading account deletion avoids orphaned private documents.
Project deletion is a physical delete of this one row; there is intentionally no
soft-delete/recovery history in CU-3. The entity uses TypeORM audit columns, as
required for the main NestJS application, and `synchronize` remains false.

`document` is JSONB containing the serialized canonical document, not a
normalized set of UML tables. On every write the application serializes the
validated document, and on every read it parses it before exposing it. JSONB
keeps PostgreSQL durability and atomic row replacement while preserving the
existing versioned envelope and avoiding a divergent mapper. `name`, `revision`,
and timestamps are duplicated as operational metadata to query and conditionally
update the row; they must equal the authoritative document fields when the row
is assembled. The adapter does not inspect UML substructure.

Alternative rejected: normalize packages, classifiers, relations, layout, and
generation profile into relational tables. That creates a second UML persistence
model, requires a lossy/complex mapper, and expands the approved UML semantics.
Alternative rejected: a text JSON column. It would work for the current whole
document replacement, but JSONB gives PostgreSQL structural storage without
changing the canonical JSON envelope; neither representation is queried by UML
fields in this CU.

### Public REST contracts and identity

Add project contracts in `@primer-parcial/contracts`, versioned by their
exported names and API route namespace. They use strict Zod objects for envelope
and primitive fields, while the document value is typed as `ProjectDocument` and
is runtime-checked by the domain parser at the application/client boundary. This
does not duplicate the closed UML runtime schema in contracts. DTO classes use
`createZodDto`, and success responses use `ZodResponse`; response mapping occurs
only after domain parsing/validation, so entities and raw database JSON never
cross HTTP.

All endpoints are under `/api/projects`, use `JwtAuthGuard` and
`@ApiBearerAuth`, and derive `ownerId` only from `request.user.id`:

| Operation | REST operation | Request | Success response |
|---|---|---|---|
| Create | `POST /api/projects` | `{ name }` | `201 ProjectSnapshot` with complete initial document and revision `0`. |
| List | `GET /api/projects` | none | `200 { projects: ProjectSummary[] }`; summaries contain `id`, `name`, `revision`, `createdAt`, `updatedAt`, not document content. |
| Get | `GET /api/projects/:projectId` | none | `200 ProjectSnapshot` with complete document and current revision. |
| Reopen | web `reopenProject(projectId)` uses the same idempotent `GET /api/projects/:projectId` | none | The same `ProjectSnapshot`; reopening has no server-side state to mutate. |
| Rename | `PATCH /api/projects/:projectId/name` | `{ name, expectedRevision }` | `200 ProjectSnapshot` with the new revision. |
| Save | `PUT /api/projects/:projectId/document` | `{ document, expectedRevision }` | `200 ProjectSnapshot` with the persisted document and new revision. |
| Delete | `DELETE /api/projects/:projectId` | `{ expectedRevision }` | `204` with no body. |

`ProjectSnapshot` contains `id`, `name`, `revision`, `createdAt`, `updatedAt`,
and the full `document`; its metadata and document metadata are equal. The
client cannot provide `ownerId` for create. For save, the application rejects
document identity, owner, name, revision, or timestamps that disagree with the
current owned record as `400`; rename is the sole name-changing operation and
the server supplies the next revision/timestamps. This prevents a client from
forging audit or ownership fields while preserving the complete CU-2 document
on the wire.

Missing or foreign resources return the same public `404` body for get/reopen,
rename, save, and delete. Stale mutations return `409` with a strict, safe typed
body such as `{ code: "PROJECT_REVISION_CONFLICT" }`; it contains no current
revision, document, owner, timestamps, or existence hint beyond the fact that an
owned conditional mutation was not accepted. Invalid requests/documents return
typed `400` validation bodies without raw parser, SQL, entity, or stack detail.
Authentication remains the existing Bearer/JWT server-side mechanism; no owner
identifier, session token, or database detail is accepted in a project payload.

Alternative rejected: distinct `POST .../reopen` endpoint. Reopen has no durable
side effect, so a second endpoint would add surface area without a requirement.
Alternative rejected: list full documents. It unnecessarily exposes/transfers
large canonical payloads where the specification only needs private summaries
and their revision.

### Validation and canonical document handling

Create first builds an empty document via `createProjectDocument` using the
authenticated owner, a generated project ID, and the server clock. The service
validates its resulting document under `save` before insertion.

Save first validates the request envelope, then serializes the received JSON
value only as input to `parseProjectDocument`. A parser failure (unsupported
version or closed-structure error) is `400`. The parsed value then passes
`validateProjectDocument(document, "save")`; any blocked result is `400` and
nothing is written. The application also enforces immutable document metadata
against the owned current record before composing the replacement. Only then is
the canonical document serialized for storage. Read/reopen parses stored JSON
before response mapping; an unexpected corrupt row is an observable server
failure with a generic public error, never a raw document or database exception.

This sequencing makes format and semantic validity preconditions of a write,
not an effect of it. Warnings remain valid because the existing save policy only
blocks errors. Domain parser/validator diagnostics can be mapped to stable public
validation codes/paths where safe, but internal error messages and storage
details are not returned.

Alternative rejected: validate only DTO shape or trust JSONB. Both accept a
second/partial interpretation of UML and violate the existing single canonical
parser/validator boundary.

### Atomic optimistic concurrency and result classification

Rename, save, and delete use a TypeORM query builder inside a transaction with a
conditional predicate equivalent to:

```sql
WHERE id = :projectId
  AND owner_id = :ownerId
  AND revision = :expectedRevision
```

For rename/save, a single `UPDATE` sets the changed content, `revision =
revision + 1`, and `updated_at = now()` together. The application builds the
returned snapshot from the row read in the same transaction after the conditional
update, so its document revision and timestamp exactly match durable state.
Delete performs its conditional `DELETE` with the same predicate. No preliminary
read is used as authorization or conflict proof.

If a conditional mutation affects zero rows, the same transaction performs a
second owner-scoped lookup by `(id, owner_id)`: an extant owned row maps to the
safe `409` conflict; no owned row maps to the shared `404`. This is race-safe and
does not query a foreign row. A concurrent deletion can therefore make a stale
operation classify as `404`, because at classification time the private resource
no longer exists; it still reveals nothing about a foreign resource and never
applies a mutation. A database error rolls back the transaction and becomes a
generic service failure rather than a conflict or successful response.

Alternative rejected: read revision then call repository `save`, or last-write-
wins. Either allows two writers to pass a non-atomic check or overwrites a newer
document. Alternative rejected: returning the current snapshot in `409`; it
would leak state and would amount to an undeclared conflict-merge protocol.

### Web seam

Add a project API client/repository alongside the existing auth client. It owns
Bearer header construction from the existing session storage, request encoding,
strict envelope response parsing, and conversion of `401`, `404`, `409`, and
public validation failures into typed client outcomes. It has no database,
TypeORM, or domain mutation responsibility.

The later UI integration receives this repository. On create/reopen it parses
the returned `ProjectDocument`, constructs a new `UmlCommandBus`, and gives the
workspace its local adapter. On an explicit user Save it sends only the current
bus snapshot and the last server revision. It replaces the local durable revision
only from the accepted snapshot. There is no timer, effect, command callback, or
navigation hook that saves automatically. A `409` remains a typed outcome for a
future UI recovery decision; CU-3 does not merge or overwrite it.

Alternative rejected: add a global project state store now. The required seam is
one API repository; a new state mechanism is not needed before the corresponding
UI workflow is implemented.

## Risks / Trade-offs

- [Whole-document JSONB replacement can produce larger writes and cannot answer
  UML-element queries efficiently] -> CU-3 only requires durable round-trip;
  retain the canonical JSON envelope and consider a separately specified derived
  read model only if a future requirement proves it necessary.
- [Document metadata is duplicated in JSONB and columns] -> Assemble snapshots
  only in the application service, validate equality on save, and update all
  duplicated revision/timestamp/content fields in one conditional statement.
- [A corrupted stored JSONB row cannot be safely returned] -> Parse on every
  read, surface only a generic server error, and cover corrupt-row handling in
  repository/API tests; migrations never manufacture documents from partial UML
  data.
- [A `409` does not contain a mergeable server state] -> Preserve privacy and
  prevent accidental last-write-wins; a future collaboration/conflict UX can
  explicitly reload through GET.
- [Conditional update followed by classification has deletion races] -> Keep
  classification owner-scoped in the same transaction and accept `404` when the
  resource no longer exists, never an unauthorized disclosure.

## Migration Plan

1. Add the entity to the runtime and migration data sources, then add a forward
   migration creating `uml_projects`, its FK, check/constraints appropriate for
   non-negative revision, and the owner/list index. Existing `users` rows and
   data are untouched.
2. Deploy/run the explicit migration before enabling project endpoints. Runtime
   keeps `synchronize: false`; no schema synchronization or destructive reset is
   used.
3. Enable the guarded project module, contracts, and API-only web repository.
   Newly created projects use schema version 1 from the existing domain factory.
4. Roll back application code by disabling the endpoints if necessary; existing
   project rows remain intact. Reversing the migration is only safe before data
   is intentionally retained, because dropping `uml_projects` destroys user
   documents. Production rollback therefore favors a forward corrective
   migration over destructive `down` execution after projects exist.

## Testing Strategy

- Domain tests: canonical serialize/parse persistence round-trip, unsupported
  version/closed-structure failures, and save-policy blocked diagnostics. These
  remain independent of PostgreSQL and Internet.
- Repository integration tests against local PostgreSQL: migration schema/FK and
  cascade behavior, JSONB round-trip, owner-scoped list/get, conditional
  rename/save/delete success, stale revision conflicts, concurrent conditional
  writes, transaction rollback, and corrupt stored document handling.
- API Supertest tests: Bearer-required routes; two-account ownership isolation;
  create metadata; summaries; get/reopen; invalid create/rename/save payloads;
  `400`, indistinguishable `404`, safe `409`, and no mutation/timestamp/revision
  change after rejection. Responses are checked against the shared contract and
  document parser.
- Web client tests: request paths/methods, Bearer header, contract response
  validation, typed `401`/`404`/`409` handling, and reopen-to-local-bus plus
  explicit-save snapshot behavior without autosave. They use mocked fetch only;
  no test depends on Internet.
- Browser/E2E and manual project-management flows are deferred until the UI that
  consumes this seam exists. When that UI is added, it must verify create,
  reopen after browser restart, save, stale conflict, ownership isolation, and
  destructive confirmation against local services.
