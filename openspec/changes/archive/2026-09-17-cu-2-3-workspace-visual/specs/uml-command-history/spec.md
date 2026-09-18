## MODIFIED Requirements

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
contain only `elementId,x,y`. No command SHALL accept `Partial`, maps, paths,
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

`MoveNode` SHALL target only an existing diagrammable `Package`, `Class`, or
`Enumeration`. When that target already has a `DiagramLayout` node, the command
SHALL replace only that node's `x` and `y`, preserving its `elementId`, the
semantic model, generation profile, and every other layout entry. When that
target has no layout node, the command SHALL create exactly
`{elementId, x, y}` in `DiagramLayout`, preserving the semantic model,
generation profile, and all existing layout entries. A nonexistent target, or an
`Attribute`, `Operation`, `Parameter`, `EnumerationLiteral`, `Association`, or
`Generalization`, SHALL reject through the existing public precondition contract
with `TARGET_NOT_FOUND`.

`MoveNode` SHALL use the normal closed runtime-envelope validation and executor,
then exactly one CU-2.1 `edit` validation. An accepted command SHALL preserve
`createdAt` and `updatedAt`, advance revision by exactly one, and atomically
commit the existing bounded history tuple: push the prior current document to
Undo, clear Redo, and retain the exact capacity and branching behavior. A
rejection SHALL preserve the complete current document, timestamps, revision,
Undo/Redo availability, and both history branches. All other canonical
requirements, including public precondition codes, the closed catalogue and
Create/Add contracts, and the public `UmlCommandBus` API, remain unchanged.

#### Scenario: Caller supplies a complete update
- **WHEN** a caller submits an attribute, operation, parameter, association, or profile update
- **THEN** the bus accepts only its complete declared payload and expected ownership IDs, rather than a partial or generic patch

#### Scenario: Rename has no hidden editable fields
- **WHEN** a caller submits a rename command
- **THEN** the command can change only the named target's `name`

#### Scenario: Create or add rejects a malformed envelope
- **WHEN** a caller submits a Create/Add payload with a missing required external context, legacy ownership embedded in `value`, missing `value`, flat value fields, a partial value, extra fields, or unknown properties
- **THEN** the bus returns `unsupported-command` before candidate construction and does not generate or infer any domain value

#### Scenario: Existing diagrammable layout changes coordinates only
- **GIVEN** an existing Package, Class, or Enumeration with a layout node and unrelated semantic, profile, and layout data
- **WHEN** `MoveNode` is accepted for that target
- **THEN** only that layout node's `x` and `y` change and its `elementId` and all unrelated data are exact

#### Scenario: Missing diagrammable layout is materialized through the bus
- **GIVEN** an existing Package, Class, or Enumeration without a layout node
- **WHEN** `MoveNode` is accepted for that target
- **THEN** `DiagramLayout` gains exactly `{elementId, x, y}` without direct UI or caller mutation and preserves all preexisting layout entries

#### Scenario: Nonexistent target is rejected publicly
- **WHEN** `MoveNode` names no existing element
- **THEN** the bus returns `precondition-failed` with `TARGET_NOT_FOUND`

#### Scenario: Member targets are not diagrammable
- **WHEN** `MoveNode` targets an Attribute, Operation, or Parameter
- **THEN** the bus returns `precondition-failed` with `TARGET_NOT_FOUND`

#### Scenario: Other non-node targets are not diagrammable
- **WHEN** `MoveNode` targets an EnumerationLiteral, Association, or Generalization
- **THEN** the bus returns `precondition-failed` with `TARGET_NOT_FOUND`

#### Scenario: Accepted movement uses the normal atomic transition
- **WHEN** a valid `MoveNode` candidate passes the existing executor and exactly one `edit` validation
- **THEN** it commits atomically with revision increased exactly once, preserved timestamps, and the existing Undo/Redo history behavior

#### Scenario: Rejected movement preserves history branches
- **GIVEN** a current document with Undo and Redo branches available
- **WHEN** `MoveNode` fails shape, target, or validation checks
- **THEN** the document, timestamps, revision, availability, Undo branch, and Redo branch remain exactly unchanged
