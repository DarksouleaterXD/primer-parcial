## Context

See `proposal.md` for the motivation. The authorized `/workspace` route currently
mounts `PrivateArea`, which confirms the CU-1 session and renders a placeholder.
`@primer-parcial/uml-domain` already supplies `createProjectDocument`, the closed
command types, and `UmlCommandBus` with synchronous `submit`, `undo`, and `redo`.
The bus alone owns accepted document transitions and private history.

The visual delta requires diagrammable packages, classes, and enumerations to be
visible even without a layout entry and to become movable. The currently completed
`uml-command-history` specification instead says that `MoveNode` only replaces an
existing layout entry. That is a real contract contradiction, not an implementation
detail: the fallback-move scenario in `uml-visual-workspace` cannot be met by the
current command contract without directly mutating layout, which is prohibited.

The active change includes a modified `uml-command-history` delta. It does not
alter archived changes. That delta changes `MoveNode` as follows:

- An existing diagrammable `Package`, `Class`, or `Enumeration` with an existing
  layout node updates only that node's `x` and `y`.
- An existing diagrammable `Package`, `Class`, or `Enumeration` with no layout node
  creates exactly `{ elementId, x, y }` in `DiagramLayout`.
- A nonexistent or non-diagrammable target rejects with `TARGET_NOT_FOUND`.

The closed payload remains exactly `{ kind: "MoveNode", elementId, x, y }`; finite
coordinates, accepted-command revision/history behavior, and rejected-command
atomicity remain unchanged. This design documents the required resolution but does
not create or update that delta specification.

## Goals / Non-Goals

**Goals:**

- Replace the authorized placeholder with one in-memory Preact workspace island
  whose accepted projection comes only from `UmlCommandBus.currentDocument`.
- Keep confirmed UML, layout, revision, and history inside the domain bus while
  keeping selection, forms, drag preview, focus, and feedback as transient UI
  state.
- Provide the closed toolbox, inspector, diagram projection, typed feedback, and
  accessible Undo/Redo required by `uml-visual-workspace` without a graphic
  dependency.
- Resolve the command-history prerequisite in the same active CU-2.3 change before
  implementation planning.

**Non-Goals:**

- No direct UI mutation of `ProjectDocument`, `CanonicalUmlModel`,
  `DiagramLayout`, generation profile, executor, or history internals; no alternate
  command path or local authoritative copy.
- No nested packages, package rename/delete, member/literal/relation/profile
  editing, auto-layout, pan/zoom, persistence, HTTP document traffic, realtime,
  XMI, generation, AI, or added D3, ELK, Shoelace, or state-management dependency.
- Relations remain SVG projections only. They never become editable, selectable,
  movable, or a source of semantic mutations in this increment.

## Decisions

### 1. Mount one local workspace after existing authorization

authorized branch mounts a dedicated workspace component with the authenticated
`account.id`. On that component's initial mount, create exactly one empty document
through the existing domain factory with `primer-parcial-workspace` as the required
internal transient `ProjectDocument.name`, and exactly one `UmlCommandBus`. The
workspace never renders, edits, exposes as a feature/title, changes through
commands, or persists that value. Store the bus in stable component-local state/ref
so rerenders do not recreate it. Reload or unmount intentionally loses all edits.

The shell may render only the static `Modelo UML` label. It is shell-only, not a
`ProjectDocument` or model-metadata property: it is neither editable nor persisted
and creates no command, revision, or Undo/Redo entry. The workspace does not add a
domain field or `UmlCommand` for a title/name, and it does not render `Sin titulo`,
`Untitled`, generated names, project/model name inputs, or editable title
placeholders.

The production document and element ID factories use `globalThis.crypto.randomUUID`.
Tests inject deterministic factories at the creation seam, matching the existing
domain factory convention. The workspace never asks the bus or executor to create,
replace, or infer an ID.

Alternative rejected: module singleton, browser storage, or Nanostore. Each would
extend document lifetime or introduce shared state contrary to local session scope.

### 2. Use a narrow, typed UI-to-bus boundary and direct bus history

The workspace may place the following exact structural surface in its local adapter
module, with names and file placement adjusted to existing web conventions:

```ts
interface UmlWorkspaceAdapter {
  readonly currentDocument: ProjectDocument;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  submit(command: UmlCommand): UmlCommandResult;
  undo(): UmlHistoryResult;
  redo(): UmlHistoryResult;
}
```

The adapter delegates directly to the one `UmlCommandBus`; it does not clone or
retain a document, expose the executor, stack, capacity, or a custom history model.
The UI constructs only the five in-scope command variants with their precise closed
envelopes: `CreatePackage`, `CreateClass`, `CreateEnumeration`, `RenameClass`,
`RenameEnumeration`, and `MoveNode`. After every accepted submit or restored
history result, it reads `adapter.currentDocument` anew and derives the entire
confirmed projection. Rejection retains that projection.

Alternative rejected: reducer-owned document plus action synchronization. Two
authoritative copies would permit drift, optimistic residue, or an accidental bypass
of the command bus.

### 3. Keep toolbox and inspector intentionally small

The shell has a header/history strip with only the static `Modelo UML` label,
toolbox, diagram region, inspector, and a visible `aria-live` feedback region. The
toolbox exposes only `Package`, `Class`, and `Enumeration` with a required name
input. Package always submits
`{ kind: "CreatePackage", parentPackageId: null, value: { id, name } }`; root-only
is an explicit UI rule, not a hidden postcondition. `Class` and `Enumeration` are
disabled unless `activePackageId` resolves to a currently projected package. Their
commands put only `{ id, name }` in `value` and the selected package ID in the
external `packageId`. They must not submit when that context is absent.

Selection is a single transient node ID. Selecting a package sets `activePackageId`;
selecting a class or enumeration clears it, so classifier creation cannot use stale
package context. No package tree, nested-package UI, or package node management is
introduced. Packages are ordinary selectable diagram nodes, not containers with a
separate visual hierarchy.

The inspector derives the selected element on each projection. It shows type, ID,
name, and package context. Only class and enumeration names have a confirmation
control; package data, class attributes/operations, and enumeration literals are
read-only lists. Class and enumeration node dimensions are content-independent
fixed CSS/SVG dimensions, with members clipped or vertically listed inside the
card; this prevents member content from changing coordinate semantics. A package
uses its own fixed node size.

Alternative rejected: a generic property editor. It would expose command catalogue
operations that the visual specification explicitly excludes.

### 4. Project with native SVG and deterministic geometry

The diagram is a scrollable, focusable native SVG region rendered from a pure
projection function. Diagrammable IDs are the union of packages, classes, and
enumerations. A confirmed `layout.nodes` entry wins exactly. For a diagrammable ID
without a layout entry, calculate fallback coordinates from diagrammable IDs sorted
lexically using this exact formula:

```text
origin = (80, 80)
cell = (240, 180)
columns = 3
index = index of the ID in lexically sorted diagrammable IDs
x = 80 + (index % 3) * 240
y = 80 + floor(index / 3) * 180
```

Fallback is a render-only result: it is nonpersistent, creates no command, does not
change revision or history, and never completes `DiagramLayout` during projection.
The SVG coordinate space is also the command coordinate space. Pointer coordinates
are converted once from the SVG bounding rectangle and viewBox scale into that
space; keyboard movement uses a documented fixed delta in the same space.

Associations draw a line between projected endpoint card centers, with labels for
name, multiplicities, and aggregation markers. Generalizations draw a directed
specific-to-general line with an SVG marker. If an endpoint is missing from the
diagrammable projection, the relation is omitted rather than inventing a position or
mutating model/layout. This is a defensive visual fallback for invalid imported or
historical state, not validation repair.

Alternative rejected: D3/ELK. Native SVG has sufficient deterministic geometry for
this fixed, non-auto-layout scope and adds no dependency or hidden layout state.

### 5. Commit one move per completed interaction

A pointer drag changes only a transient preview position. On pointer release, it
submits exactly one `MoveNode`; no commands are submitted during move events. A
rejection removes the preview and leaves the confirmed fallback/layout projection
unchanged. Keyboard movement submits the same command once per explicit key action
for a selected diagrammable node. Both mechanisms use finite diagram-space values.

Under the active command-history delta, dragging a fallback node is valid: the
accepted command creates its layout entry through the bus. There is no UI-side
layout insertion. A nonexistent/non-diagrammable target yields `TARGET_NOT_FOUND`.

Alternative rejected: disabling fallback-node movement. It would contradict the
explicit visual fallback move scenario and would leave a required workspace action
unusable.

### 6. Reconcile selection and feedback after every public result

After an accepted submit or `{ kind: "restored" }` history result, reproject from
`currentDocument`, then retain selection only if its ID still belongs to a
diagrammable node; otherwise clear selection, inspector state, and `activePackageId`.
Undo/Redo availability reads `canUndo`/`canRedo` directly. No unavailable history
call changes projection.

Feedback stores only the last typed rejection. It maps `unsupported-command`,
precondition code, and validation diagnostics to comprehensible text while retaining
the required kind/code/severity/message/element ID. It never displays exceptions,
stacks, private objects, or secrets. A successful accepted command and restored
history both clear feedback; a rejected command retains it until the next accepted
command, restored history, or an explicit dismiss action. The live region announces
changes without stealing focus.

Alternative rejected: clearing feedback at the start of every interaction. That
would hide a rejected result before the user has an accepted action or a chance to
dismiss it.

### 7. Responsive and accessible structure follows the existing web language

Preserve the existing CSS visual language and focus treatment. At widths below the
current desktop layout breakpoint, shell regions stack; at 320 CSS px, page-level
horizontal overflow is prohibited while the diagram maintains its own scrollable
region. Buttons, text fields, nodes, feedback dismissal, and Undo/Redo have names
and visible focus. Nodes expose type plus name, support keyboard selection, and
use the keyboard MoveNode alternative where applicable.

Alternative rejected: canvas. It would require separate accessibility semantics and
would make the required native keyboard-node interaction unnecessarily complex.

## Test Strategy and Future Task Blocks

The subsequent `tasks.md` must contain exactly these five implementation blocks:

1. Update and test `uml-command-history` MoveNode behavior for existing
   diagrammable layouts, missing layouts, and nonexistent/non-diagrammable targets;
   preserve closed runtime validation, atomic rejection, revision, and history.
2. Add the web dependency/reference and local workspace bootstrap; test one bus and
   one empty document per authorized mount, owner propagation, deterministic test
   IDs, and intentional loss on remount.
3. Implement pure projection and native SVG; test exact fallback formula, confirmed
   layout precedence, read-only member rendering, relation visual fallbacks, and no
   projection-side document mutation.
4. Implement toolbox, inspector, selection, feedback, and direct bus history; test
   every closed envelope, root-only packages, active-package failure states,
   accepted/rejected lifecycle, selection reconciliation, and error retention.
5. Implement pointer/keyboard movement and responsive accessibility; test one
   command at drag completion, fallback layout creation through the bus, keyboard
   parity, accessible names/live feedback/focus, 320 px layout, and regression of
   authorization/logout behavior.

Focused domain tests belong with `packages/uml-domain`; Preact component tests use
the existing Testing Library/Vitest style in `apps/web`. Browser/manual verification
will cover native pointer drag, keyboard movement, Undo/Redo restoration, relation
visual-only behavior, and the 320 px responsive shell. No check is run while this
design artifact is being created.

## Risks / Trade-offs

- [The command-history delta must remain scoped to this active change] -> Never
  edit an archived change to obtain this behavior.
- [Fixed node sizes can clip unusually long member lists] -> Use explicit
  read-only overflow treatment in the node card rather than letting geometry drift.
- [SVG pointer conversion can be wrong after future zoom/pan] -> CU-2.3 has no
  zoom/pan; keep conversion limited to the explicit viewBox/rectangle mapping.
- [A corrupted document can reference invisible relation endpoints] -> Omit only
  that visual relation and do not repair domain state from the UI.
- [The workspace instructions JSON reports stale CU-2.2 context] -> The actual
  selected change, its proposal, visual spec, canonical CU-2.1/CU-2.2 specs, and
  source confirm CU-2.3. This stale generated context is not a product or contract
  contradiction and is not changed by this artifact.

## Migration Plan

No data migration or deployment migration exists: the document is local to an
island instance. Planning must create tasks only after the active change's
command-history delta is present. Rollback is removal of the web workspace and
its active change implementation; no persisted UML data exists to restore.
