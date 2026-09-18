import { useState } from "preact/hooks";

import type { UmlCommand } from "@primer-parcial/uml-domain";

import { useWorkspace } from "./WorkspaceContext";

export function WorkspaceToolbox() {
  const { controller, requestUpdate } = useWorkspace();
  const { activePackageId } = controller.state;
  const [name, setName] = useState("");

  const trimmedName = name.trim();
  const hasName = trimmedName.length > 0;
  const packageDisabled = !hasName;
  const classifierDisabled = !hasName || activePackageId === null;

  const classifierContextReason =
    activePackageId === null
      ? "requiere seleccionar un paquete"
      : !hasName
        ? "requiere un nombre"
        : null;

  const create = (command: UmlCommand): void => {
    const accepted = controller.submit(command);
    requestUpdate();
    if (accepted) {
      setName("");
    }
  };

  const createPackage = (): void => {
    if (packageDisabled) {
      return;
    }
    create({
      kind: "CreatePackage",
      parentPackageId: null,
      value: { id: controller.createElementId(), name: trimmedName },
    });
  };

  const createClass = (): void => {
    if (classifierDisabled || activePackageId === null) {
      return;
    }
    create({
      kind: "CreateClass",
      packageId: activePackageId,
      value: { id: controller.createElementId(), name: trimmedName },
    });
  };

  const createEnumeration = (): void => {
    if (classifierDisabled || activePackageId === null) {
      return;
    }
    create({
      kind: "CreateEnumeration",
      packageId: activePackageId,
      value: { id: controller.createElementId(), name: trimmedName },
    });
  };

  return (
    <nav class="uml-workspace__toolbox" aria-label="Herramientas de diagrama">
      <p class="uml-workspace__toolbox-title">Herramientas</p>
      <label class="uml-workspace__toolbox-label" for="uml-workspace-new-name">
        Nombre del nuevo elemento
      </label>
      <input
        id="uml-workspace-new-name"
        class="uml-workspace__toolbox-input"
        type="text"
        value={name}
        onInput={(event) => setName(event.currentTarget.value)}
      />
      <button
        type="button"
        disabled={packageDisabled}
        title={packageDisabled ? "Ingrese un nombre para crear un paquete" : "Crear paquete"}
        aria-label="Crear paquete"
        onClick={createPackage}
      >
        Package
      </button>
      <button
        type="button"
        disabled={classifierDisabled}
        title={
          classifierDisabled
            ? `No se puede crear una clase: ${classifierContextReason}`
            : "Crear clase"
        }
        aria-label={
          classifierDisabled
            ? `Crear clase (${classifierContextReason})`
            : "Crear clase"
        }
        onClick={createClass}
      >
        Class
      </button>
      <button
        type="button"
        disabled={classifierDisabled}
        title={
          classifierDisabled
            ? `No se puede crear una enumeración: ${classifierContextReason}`
            : "Crear enumeración"
        }
        aria-label={
          classifierDisabled
            ? `Crear enumeración (${classifierContextReason})`
            : "Crear enumeración"
        }
        onClick={createEnumeration}
      >
        Enumeration
      </button>
    </nav>
  );
}
