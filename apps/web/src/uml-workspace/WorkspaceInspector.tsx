import { useState } from "preact/hooks";

import type { ProjectDocument } from "@primer-parcial/uml-domain";

import { useWorkspace } from "./WorkspaceContext";

const visibilityLabel = (visibility: string): string => {
  switch (visibility) {
    case "public":
      return "+";
    case "protected":
      return "#";
    case "private":
      return "-";
    default:
      return "";
  }
};

const packageName = (
  document: ProjectDocument,
  packageId: string | undefined,
): string | null => {
  if (packageId === undefined) {
    return null;
  }
  return document.uml.packages.find(({ id }) => id === packageId)?.name ?? null;
};

interface ClassifierNameEditorProps {
  readonly kind: "class" | "enumeration";
  readonly elementId: string;
  readonly name: string;
}

function ClassifierNameEditor({ kind, elementId, name }: ClassifierNameEditorProps) {
  const { controller, requestUpdate } = useWorkspace();
  const [draft, setDraft] = useState<string | null>(null);

  const value = draft ?? name;
  const trimmed = value.trim();
  const canConfirm = trimmed.length > 0 && trimmed !== name;

  const confirm = (): void => {
    if (!canConfirm) {
      return;
    }
    const accepted =
      kind === "class"
        ? controller.submit({ kind: "RenameClass", classId: elementId, name: trimmed })
        : controller.submit({
            kind: "RenameEnumeration",
            enumerationId: elementId,
            name: trimmed,
          });
    requestUpdate();
    if (accepted) {
      setDraft(null);
    }
  };

  return (
    <div class="uml-workspace__inspector-editor">
      <label for={`uml-workspace-inspector-name-${elementId}`}>Nombre</label>
      <input
        id={`uml-workspace-inspector-name-${elementId}`}
        data-testid="inspector-name-input"
        type="text"
        value={value}
        onInput={(event) => setDraft(event.currentTarget.value)}
      />
      <button
        type="button"
        data-testid="inspector-rename-confirm"
        disabled={!canConfirm}
        onClick={confirm}
      >
        Confirmar nombre
      </button>
    </div>
  );
}

export function WorkspaceInspector() {
  const { controller } = useWorkspace();
  const { currentDocument, selectedElementId } = controller.state;

  if (selectedElementId === null) {
    return (
      <aside class="uml-workspace__inspector" aria-label="Inspector">
        <p class="uml-workspace__inspector-title">Inspector</p>
        <p class="uml-workspace__inspector-field" data-testid="inspector-empty">
          Sin selección
        </p>
      </aside>
    );
  }

  const cls = currentDocument.uml.classes.find(
    ({ id }) => id === selectedElementId,
  );
  if (cls !== undefined) {
    const ownerPackage = packageName(currentDocument, cls.packageId);
    return (
      <aside class="uml-workspace__inspector" aria-label="Inspector">
        <p class="uml-workspace__inspector-title">Inspector</p>
        <p class="uml-workspace__inspector-field">
          <strong>Tipo:</strong> Clase
        </p>
        <p class="uml-workspace__inspector-field">
          <strong>ID:</strong> {cls.id}
        </p>
        <p class="uml-workspace__inspector-field">
          <strong>Contexto:</strong> {ownerPackage ?? "Sin paquete"}
        </p>
        <ClassifierNameEditor key={cls.id} kind="class" elementId={cls.id} name={cls.name} />
        <p class="uml-workspace__inspector-field">
          <strong>Atributos:</strong>
        </p>
        {cls.attributes.length === 0 ? (
          <p class="uml-workspace__inspector-field">Sin atributos</p>
        ) : (
          <ul class="uml-workspace__member-list" data-testid="inspector-attributes">
            {cls.attributes.map((attribute) => (
              <li key={attribute.id}>
                {visibilityLabel(attribute.visibility)} {attribute.name}
              </li>
            ))}
          </ul>
        )}
        <p class="uml-workspace__inspector-field">
          <strong>Operaciones:</strong>
        </p>
        {cls.operations.length === 0 ? (
          <p class="uml-workspace__inspector-field">Sin operaciones</p>
        ) : (
          <ul class="uml-workspace__member-list" data-testid="inspector-operations">
            {cls.operations.map((operation) => (
              <li key={operation.id}>
                {visibilityLabel(operation.visibility)} {operation.name}()
              </li>
            ))}
          </ul>
        )}
      </aside>
    );
  }

  const enumeration = currentDocument.uml.enumerations.find(
    ({ id }) => id === selectedElementId,
  );
  if (enumeration !== undefined) {
    const ownerPackage = packageName(currentDocument, enumeration.packageId);
    return (
      <aside class="uml-workspace__inspector" aria-label="Inspector">
        <p class="uml-workspace__inspector-title">Inspector</p>
        <p class="uml-workspace__inspector-field">
          <strong>Tipo:</strong> Enumeración
        </p>
        <p class="uml-workspace__inspector-field">
          <strong>ID:</strong> {enumeration.id}
        </p>
        <p class="uml-workspace__inspector-field">
          <strong>Contexto:</strong> {ownerPackage ?? "Sin paquete"}
        </p>
        <ClassifierNameEditor
          key={enumeration.id}
          kind="enumeration"
          elementId={enumeration.id}
          name={enumeration.name}
        />
        <p class="uml-workspace__inspector-field">
          <strong>Literales:</strong>
        </p>
        {enumeration.literals.length === 0 ? (
          <p class="uml-workspace__inspector-field">Sin literales</p>
        ) : (
          <ul class="uml-workspace__member-list" data-testid="inspector-literals">
            {enumeration.literals.map((literal) => (
              <li key={literal.id}>{literal.name}</li>
            ))}
          </ul>
        )}
      </aside>
    );
  }

  const pkg = currentDocument.uml.packages.find(
    ({ id }) => id === selectedElementId,
  );
  if (pkg !== undefined) {
    return (
      <aside class="uml-workspace__inspector" aria-label="Inspector">
        <p class="uml-workspace__inspector-title">Inspector</p>
        <p class="uml-workspace__inspector-field">
          <strong>Tipo:</strong> Paquete
        </p>
        <p class="uml-workspace__inspector-field">
          <strong>ID:</strong> {pkg.id}
        </p>
        <p class="uml-workspace__inspector-field">
          <strong>Nombre:</strong> {pkg.name}
        </p>
      </aside>
    );
  }

  return (
    <aside class="uml-workspace__inspector" aria-label="Inspector">
      <p class="uml-workspace__inspector-title">Inspector</p>
      <p class="uml-workspace__inspector-field" data-testid="inspector-empty">
        Sin selección
      </p>
    </aside>
  );
}
