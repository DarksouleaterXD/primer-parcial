## Purpose

Define a deterministic local command boundary and bounded in-memory history for
editing a UML project document without user interface, persistence, or external
collaboration behavior.

## ADDED Requirements

### Requirement: Closed command and payload contracts
The system SHALL expose local edits only through a closed typed `UmlCommand`
catalogue submitted to the command bus. The catalogue SHALL contain exactly
these 27 kinds and no others: `CreatePackage`, `RenamePackage`,
`DeletePackage`; `CreateClass`, `RenameClass`, `DeleteClass`; `AddAttribute`,
`UpdateAttribute`, `RemoveAttribute`; `AddOperation`, `UpdateOperation`,
`RemoveOperation`; `AddParameter`, `UpdateParameter`, `RemoveParameter`;
`CreateEnumeration`, `RenameEnumeration`, `DeleteEnumeration`,
`AddEnumerationLiteral`, `RemoveEnumerationLiteral`; `CreateAssociation`,
`UpdateAssociation`, `DeleteAssociation`; `CreateGeneralization`,
`DeleteGeneralization`; `MoveNode`; and `UpdateGenerationProfile`.

Every Create/Add command SHALL receive caller-supplied IDs, a complete intrinsic
`value`, and every expected owner/context ID in the envelope. `CreatePackage`
SHALL be exactly `{kind:'CreatePackage', parentPackageId: string | null,
value:{id,name}}`, where `null` means root. `CreateClass` SHALL be exactly
`{kind:'CreateClass', packageId:string, value:{id,name}}`, and
`CreateEnumeration` SHALL be exactly `{kind:'CreateEnumeration', packageId:string,
value:{id,name}}`. Their `value` objects SHALL NOT contain ownership/context
properties. Attribute value `{id,name,visibility,type,multiplicity}` has external
`classId`; operation value `{id,name,visibility,parameters,returnType?}` has
external `classId` and caller-supplied IDs for all initial parameters; parameter
value `{id,name,type,multiplicity}` has external `classId,operationId`; literal
value `{id,name}` has external `enumerationId`; association value `{id,name?,ends}`
has complete two ends and caller-supplied end IDs; and generalization value
`{id,specificId,generalId}` has no ownership duplicated in a value.

`RenamePackage`, `RenameClass`, and `RenameEnumeration` SHALL contain only the
target ID and replacement `name`. `UpdateAttribute` SHALL contain
`classId,attributeId,name,visibility,type,multiplicity`; `UpdateOperation`
SHALL contain `classId,operationId,name,visibility,parameters,returnType?`;
and `UpdateParameter` SHALL contain
`classId,operationId,parameterId,name,type,multiplicity`. These ownership IDs
are mandatory and SHALL be checked. `UpdateAssociation` SHALL contain
`associationId,name?,ends`, replacing every editable association property and
both complete ends. `UpdateGenerationProfile` SHALL contain a complete
replacement `{classes,attributes,defaultSort}`, never a merge. `MoveNode` SHALL
contain only `elementId,x,y`, replace an already extant layout-node position,
and reject a nonexistent node. No command SHALL accept `Partial`, maps, paths,
field/value pairs, callbacks, unknown spreads, generic patches, mutable domain
objects, timestamps, UUID/random requests, or external state.

For avoidance of doubt, every `Create*` and `Add*` SHALL use exactly the closed
nested envelope `{kind, <parent/context IDs>, value: CompleteValue}`. `value`
contains the complete intrinsic new domain value including its caller-supplied
stable ID, and all parent/context IDs remain outside `value`. Runtime validation
SHALL reject legacy embedded context, a missing required external context, flat,
extra, or unknown shapes, as well as partial values, maps, paths, field/value
pairs, callbacks, and spreads. The executor SHALL combine envelope context only
internally and SHALL generate no IDs, timestamps, or random values.

#### Scenario: Caller supplies a complete update
- **WHEN** a caller submits an attribute, operation, parameter, association, or profile update
- **THEN** the bus accepts only its complete declared payload and expected ownership IDs, rather than a partial or generic patch

#### Scenario: Rename has no hidden editable fields
- **WHEN** a caller submits a rename command
- **THEN** the command can change only the named target's `name`

#### Scenario: Create or add rejects a malformed envelope
- **WHEN** a caller submits a Create/Add payload with a missing required external
  context, legacy ownership embedded in `value`, missing `value`, flat value
  fields, a partial value, extra fields, or unknown properties
- **THEN** the bus returns `unsupported-command` before candidate construction
  and does not generate or infer any domain value

### Requirement: Exact duplicate-name namespaces
The bus SHALL reject a conflicting name with `DUPLICATE_NAME` only in these
exact scopes: packages among root packages or among siblings with the same
parent; classes and enumerations together in the shared classifier namespace of
one package; attributes within one class; operations within one class, with no
overloads; parameters within one operation; enumeration literals within one
enumeration; and nonempty association names across the entire
`CanonicalUmlModel`. Unnamed associations are allowed and are not members of a
name namespace. Generalizations, layout, and generation profile SHALL have no
`DUPLICATE_NAME` namespace. A structurally duplicate generalization SHALL use
the existing appropriate structural duplicate code, not a new name namespace.

#### Scenario: Same name is independent outside its declared namespace
- **WHEN** equal names occur in different package sibling sets, different
  classes, different operations, different enumerations, or between an unnamed
  association and another association
- **THEN** the bus does not report `DUPLICATE_NAME` solely because the names
  are equal

#### Scenario: Association name collides globally only when nonempty
- **WHEN** a caller creates or updates an association with a nonempty name that
  already belongs to another association in the canonical model
- **THEN** the bus returns `DUPLICATE_NAME`; unnamed associations remain allowed

### Requirement: Public preconditions and reject-only deletions
The bus SHALL report expected precondition failures through public closed codes
including at least `TARGET_NOT_FOUND`, `PARENT_NOT_FOUND`, `PARENT_MISMATCH`,
`DUPLICATE_ID`, `DUPLICATE_NAME`, `DEPENDENCIES_EXIST`, and
`INCOMPATIBLE_REFERENCE`. Handlers SHALL NOT expose ad-hoc text or UI-specific
messages as the precondition contract.

Deletion and removal SHALL reject with `DEPENDENCIES_EXIST`, never cascade. The
dependents are: `DeletePackage`: child packages, classes, and enumerations with
its package ID; `DeleteClass`: its attributes and operations, association ends,
generalizations, classifier type references from attributes, parameters and
operation returns, its layout node, and all class/attribute/default-sort profile
entries referencing it or its attributes; `DeleteEnumeration`: its literals,
association ends, generalizations, classifier type references, its layout node,
and profile references; `RemoveOperation`: its parameters; `DeleteAssociation`:
its layout node; `DeleteGeneralization`: its layout node; `RemoveAttribute`: its
attribute-profile and default-sort entries; `RemoveParameter` and
`RemoveEnumerationLiteral`: any extant layout or profile reference to the
target. Layout and generation profile SHALL never be auto-cleared by any
deletion or removal.

#### Scenario: Delete is blocked by a dependent
- **WHEN** a caller deletes a class referenced by an association, layout node, or generation profile
- **THEN** the bus returns `precondition-failed` with `DEPENDENCIES_EXIST` and removes nothing

#### Scenario: Missing or mismatched ownership is public
- **WHEN** a caller updates or removes a parameter using a missing class, missing operation, or a parent that does not own it
- **THEN** the bus returns respectively `PARENT_NOT_FOUND`, `TARGET_NOT_FOUND`, or `PARENT_MISMATCH` without a handler-specific message

### Requirement: Block 3 atomic deterministic current-document transition
For each submit, the system SHALL apply this order: validate closed command
shape; resolve and check preconditions and dependencies; build an isolated
complete candidate; validate that candidate exactly once using only CU-2.1
`edit`; derive the next document with exactly `current.revision + 1` while
preserving `createdAt` and `updatedAt`; then atomically commit only
`currentDocument`. In block 3, private bus state SHALL be only
`currentDocument`; it SHALL NOT expose or retain stacks, history accessors,
availability state, Undo/Redo operations, or capacity behavior. The executor
SHALL not read a clock, random value, UUID source, or external state.

At every failure point, including malformed shape, precondition, candidate, or
validation failure, `currentDocument`, its revision, and its timestamps SHALL
remain exact. Direct public mutation of semantic model, layout, or profile SHALL
NOT be supported.

All early shape, ownership, dependency, duplicate, and compatibility checks
SHALL preserve CU-2.1 types, serialization, and validator semantics. They are
not a substitute for candidate validation: every candidate SHALL receive
exactly one validation using only the CU-2.1 `edit` policy.

#### Scenario: Rejection preserves the current document
- **WHEN** any command fails shape, preconditions, candidate construction, or `edit` validation
- **THEN** current document, timestamps, and revision are exactly unchanged

#### Scenario: Accepted command commits once
- **WHEN** a complete candidate passes `edit`
- **THEN** the next document commits once and revision increases exactly once

### Requirement: Block 4 complete local snapshot history
Only block 4 SHALL expand the private bus state to the tuple
`{currentDocument, undoStack, redoStack}`. The stacks SHALL retain immutable
complete `ProjectDocument` snapshots, including canonical UML, layout, profile,
`createdAt`, `updatedAt`, and captured revision. An accepted submit SHALL
atomically commit the tuple by pushing the previous current document to bounded
undo, setting the accepted next document as current, and clearing redo. Pushing
past the exact capacity of 100 snapshots SHALL discard the oldest entry.

A rejected submit SHALL preserve the exact complete tuple, revision,
timestamps, stack availability, and redo contents; it SHALL neither enter
history nor clear redo. Undo when unavailable because undo is empty SHALL leave
the tuple unchanged. When available, Undo SHALL atomically restore the newest
undo snapshot as current, push the previous current snapshot to bounded redo,
and remove the restored undo snapshot. Redo when unavailable because redo is
empty SHALL leave the tuple unchanged. When available, Redo SHALL atomically
restore the newest redo snapshot as current, push the previous current snapshot
to bounded undo, and remove the restored redo snapshot. Undo and redo SHALL
restore the captured document including timestamps and revision, SHALL NOT
create a command, and SHALL NOT increment a revision.

The final public `UmlCommandBus` surface SHALL expose exactly `readonly
currentDocument: ProjectDocument`, `readonly canUndo: boolean`, `readonly
canRedo: boolean`, synchronous `submit(command: unknown): UmlCommandResult`,
`undo(): UmlHistoryResult`, and `redo(): UmlHistoryResult`. `UmlHistoryResult`
SHALL be exported exactly as
`{kind:'restored'; operation:'undo'|'redo'; document:ProjectDocument} |
{kind:'unavailable'; operation:'undo'|'redo'}`. Undo and redo SHALL never
return `null`, `undefined`, another result shape, or throw for unavailable
history. `canUndo` SHALL be `true` if and only if `undoStack` is nonempty, and
`canRedo` SHALL be `true` if and only if `redoStack` is nonempty; both values
SHALL reflect the committed private tuple without a separate availability state.
The stacks, tuple, and fixed capacity of 100 SHALL remain private and SHALL
have no public accessor.

`submit` SHALL remain the synchronous command path: an unknown runtime input
SHALL return `UmlCommandResult`, including `unsupported-command` for a shape
outside the closed catalogue, and SHALL not throw. For an accepted submit, the
existing executor and exactly one CU-2.1 `edit` validation SHALL finish before
the one history-tuple commit. A rejected submit SHALL not invoke any
history-transition behavior beyond preserving the exact tuple. `undo` and
`redo` SHALL not invoke the command executor or validator.

#### Scenario: Undo and redo restore exact states
- **WHEN** a caller undoes and then redoes an accepted command
- **THEN** each restored document exactly equals its captured snapshot, including profile, layout, timestamps, and revision

#### Scenario: Public availability and unavailable results are exact
- **WHEN** `undoStack` or `redoStack` is empty after a committed tuple transition
- **THEN** its corresponding readonly availability property is `false` and the
  corresponding navigation method returns exactly `{kind:'unavailable', operation:'undo'}`
  or `{kind:'unavailable', operation:'redo'}` without changing the tuple

#### Scenario: Public restoration result is exact
- **WHEN** Undo or Redo restores an available newest snapshot
- **THEN** it returns exactly `{kind:'restored', operation:'undo'|'redo', document:ProjectDocument}`
  with the same snapshot committed as `currentDocument`

#### Scenario: Unknown submit is synchronous and closed
- **WHEN** a runtime caller passes an unknown value to `submit`
- **THEN** it synchronously returns `UmlCommandResult`, returning
  `unsupported-command` for a non-catalogue shape, without throwing or changing
  the tuple

#### Scenario: Capacity remains exactly 100
- **WHEN** more than 100 preceding accepted states have been retained and undo is exhausted
- **THEN** no more than 100 snapshots are recoverable and the oldest excess state is unavailable

#### Scenario: Rejected submit preserves a branch
- **GIVEN** undo and redo are both available
- **WHEN** a command fails shape, preconditions, candidate construction, or `edit` validation
- **THEN** current document, timestamps, revision, undo stack, redo stack, and availability are exactly unchanged

### Requirement: Focused acceptance and exclusions
The implementation SHALL have focused tests for every deletion/removal blocker,
all update success and failure paths, association complete-end replacement,
profile complete replacement and preservation of semantic/layout data,
nonexistent-node rejection, no partial mutation, and the full state-tuple
invariant at each rejection point. It SHALL additionally test all 27 command
kinds, explicit IDs, public precondition codes, deterministic outcomes, the
exact 100-snapshot boundary, Undo/Redo branching, and validator diagnostics.

The focused tests SHALL additionally cover malformed Create/Add envelopes
(missing external context, legacy embedded context, missing, flat, partial,
extra, and unknown properties), each duplicate-name collision and isolated
independent namespace, nonempty association-name collision, every listed delete
blocker, unknown values submitted to `submit`, serializable and parseable accepted
documents, and exact tuple preservation on every error.

The capability SHALL NOT render a canvas; introduce D3, SVG, ELK, toolbox,
inspector, or UI Undo/Redo; persist or reopen projects; use PostgreSQL,
autosave, HTTP, WebSocket, realtime, presence, XMI, generation, AI, new
dependencies, or another external effect.

#### Scenario: Local execution remains isolated
- **WHEN** an accepted command is executed
- **THEN** its observable effect is limited to local returned state and in-memory history
