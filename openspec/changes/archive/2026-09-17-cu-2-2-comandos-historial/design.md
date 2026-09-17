## Context

CU-2.1 supplies immutable deterministic `ProjectDocument` values whose
canonical model, layout, profile, and validator are separate. This change adds
the local mutation boundary specified in `uml-command-history`; see
[proposal.md](proposal.md) and [specification](specs/uml-command-history/spec.md).

## Goals / Non-Goals

**Goals:**

- Expose one closed, typed command boundary with public stable results and
  precondition codes.
- Build isolated immutable candidates and commit only `currentDocument` after
  all required checks pass in block 3.
- Add the complete private history tuple and preserve the existing exact
  100-snapshot Undo/Redo decisions only in block 4.

**Non-Goals:**

- No UI, canvas, persistence, network, XMI, generation, AI, dependencies, or
  indirect document mutation API.
- No generic patch language, extensibility point, implicit cascade, or cleanup
  of layout/profile references.

## Decisions

### Closed contracts and public failures

`UmlCommand` is an exhaustive 27-member discriminated union. Each variant is a
dedicated readonly payload. Every Create/Add has exactly `{kind,
<external context IDs>, value: IntrinsicValue}`: `CreatePackage` has required
`parentPackageId: string | null` (`null` for root), `CreateClass` and
`CreateEnumeration` each have required `packageId: string`, and their values
contain only intrinsic fields plus the caller-supplied ID. Other Create/Add
commands follow the same external-context rule; `value` never duplicates
ownership. Rename contains target ID plus name only. Updates
replace all declared editable fields: attribute and parameter values with their
full ownership chain; operation values and complete parameter collection;
association `name?` and both complete ends; and the profile's three complete
collections. No `Partial`, record/map, path, field/value, callback, spread of
unknown properties, or generic patch crosses the public boundary.

Every Create/Add is exactly `{kind, <parent/context IDs>, value: CompleteValue}`.
The full intrinsic domain value, including its caller-provided stable ID, resides
in `value`; all parent/context IDs remain outside it. Runtime shape validation
rejects legacy embedded context, a missing required external context, flat,
extra, or unknown shapes before candidate construction. The executor combines
the envelope context only internally and generates no IDs, timestamps, or random
values. `DUPLICATE_NAME` is limited to root/sibling
packages, the shared Class/Enumeration namespace per package, attributes and
non-overloaded operations per Class, parameters per Operation, literals per
Enumeration, and nonempty association names globally. Unnamed associations are
permitted; generalization, layout, and profile have no name namespace, and a
duplicate generalization remains a structural case under its existing code.

Expected errors return `{ kind: "precondition-failed", code }`, where the code
comes from the public closed catalogue including `TARGET_NOT_FOUND`,
`PARENT_NOT_FOUND`, `PARENT_MISMATCH`, `DUPLICATE_ID`, `DUPLICATE_NAME`,
`DEPENDENCIES_EXIST`, and `INCOMPATIBLE_REFERENCE`; invalid runtime shapes return
`unsupported-command`; validation returns stable diagnostics. This avoids
throwing or UI text as a programmatic contract.

Alternative: generic patches and ad-hoc errors. Rejected because they make the
command surface unbounded and push ownership semantics to consumers.

### Reject-only dependency policy

The executor performs no cascade. It enumerates the precise dependents specified
in the delta spec for package, classifier, operation, association,
generalization, attribute, parameter, and enumeration-literal deletion/removal.
Any such dependency returns `DEPENDENCIES_EXIST`. Layout nodes and profile
entries are dependencies where applicable; neither structure is ever silently
cleared. `MoveNode` modifies only a node that already exists. Profile replacement
changes only profile data and preserves model/layout; semantic commands preserve
profile/layout unless their requested mutation is that part.

Alternative: delete owned descendants or clean dangling layout/profile values.
Rejected because it hides destructive state changes and makes Undo boundaries
ambiguous.

### Block 3: Atomic current-document transition

`submit` performs, in order: closed-shape validation; precondition/dependency
resolution; isolated candidate construction; exactly one `edit` validation;
next-document derivation with preserved timestamps and `revision + 1`; and one
replacement commit of `currentDocument`. Block 3 private bus state is only
`currentDocument`: it has no stacks, history accessor, availability state,
Undo/Redo operation, or capacity behavior. No mutation precedes the final
commit. Every failure leaves `currentDocument`, its revision, and its timestamps
exact.

The validator is invoked once only for a complete candidate, with CU-2.1 `edit`
and its blocking rules. The executor is deterministic and reads no clock, UUID,
random source, or external state.

Early shape and precondition checks retain CU-2.1 types, serialization, and
validator semantics; they never replace the exact single `edit` validation of
the complete candidate.

Alternative: mutate then roll back or validate individual fields. Rejected:
rollback is another failure path, and field validation cannot establish complete
canonical invariants.

### Block 4: Snapshot-history state and transactions

Only block 4 expands private state to
`{currentDocument, undoStack, redoStack}`. Each snapshot is an immutable full
`ProjectDocument`, including canonical UML, layout, generation profile,
`createdAt`, `updatedAt`, and captured revision. A block-4 accepted submit
derives and atomically commits the tuple by pushing the prior current document
onto undo (discarding its oldest entry if it exceeds 100), setting the accepted
next current document, and clearing redo. A rejected submit preserves the exact
tuple and neither enters history nor clears redo.

Undo is unavailable when `undoStack` is empty and then leaves the full tuple
unchanged. Otherwise it atomically moves the newest undo snapshot to current,
pushes the prior current snapshot to redo (discarding its oldest entry if it
exceeds 100), and removes that undo snapshot. Redo mirrors this transaction:
when unavailable because `redoStack` is empty it leaves the full tuple
unchanged; otherwise it restores the newest redo snapshot, pushes the prior
current snapshot to bounded undo, and removes that redo snapshot. Undo and redo
restore captured timestamps and revision, do not create commands, and do not
increment revision. These exact 100-entry decisions remain unchanged.

The final public bus surface is deliberately small and synchronous:
`readonly currentDocument: ProjectDocument`, `readonly canUndo: boolean`,
`readonly canRedo: boolean`, `submit(command: unknown): UmlCommandResult`,
`undo(): UmlHistoryResult`, and `redo(): UmlHistoryResult`. The exported
`UmlHistoryResult` is exactly `{kind:'restored'; operation:'undo'|'redo';
document:ProjectDocument} | {kind:'unavailable'; operation:'undo'|'redo'}`.
There are no nullable, optional, exceptional, or alternate history results.
`canUndo` is true exactly when the private undo stack is nonempty; `canRedo` is
true exactly when the private redo stack is nonempty. They are derived from the
committed tuple, not stored as separate state. No stack, tuple, capacity, or
history accessor is public.

`submit` receives `unknown` so its runtime boundary is closed as well as its
TypeScript union. It synchronously returns `UmlCommandResult` for every input;
an unrecognized shape returns `unsupported-command`, never throws. The existing
executor and its exactly one CU-2.1 `edit` validation remain wholly before an
accepted tuple commit. Rejected submissions preserve the tuple and do not
perform a history transition. `undo` and `redo` restore snapshots directly and
never invoke the executor or validator.

Alternative: inverse commands. Rejected because exact reverse logic per command
is fragile and cannot guarantee restoration of all document parts.

### Module boundaries and test matrix

Public contracts and bus live in `packages/uml-domain/src`; executor and stacks
remain private. Tests cover the complete acceptance matrix named by the delta,
including the exact public bus members, synchronous unknown submission,
availability iff the corresponding stack is nonempty, the exported two-member
history-result union, and absence of nullable or throwing unavailable paths:
all delete blockers, every update success/failure, complete association ends,
complete profile replacement/preservation, MoveNode missing-node failure,
partial-mutation prevention, state tuple invariants, all command kinds and
history boundaries. No external integration tests or adapters are added.

The test matrix also exercises missing external context, legacy embedded context,
flat/partial/extra/unknown Create/Add envelopes, every declared name collision
and isolated duplicate namespace, nonempty association-name collision,
serializable/parseable accepted documents, explicit delete blockers, unknown
values submitted to `submit`, and exact tuple preservation at every error point.

## Risks / Trade-offs

- [Explicit payloads increase type volume] -> They retain exhaustive ownership
  and edit semantics.
- [100 snapshots retain bounded memory] -> Exact restoration has priority over
  bespoke inverses at this approved fixed capacity.
- [Runtime payloads can evade TypeScript] -> Closed shape validation rejects
  them before candidate construction or state mutation.
- [A public `unknown` submit input is broader than the command union] -> It
  makes runtime boundary behavior explicit while preserving the closed command
  catalogue through its synchronous `UmlCommandResult`.

## Migration Plan

This is additive and in-memory. There is no persisted document, transport, or
consumer migration. Rollback removes the new domain exports before adoption.
