import { useWorkspace } from "./WorkspaceContext";
import type { WorkspaceError } from "./workspace-controller";

function ErrorDetails({ error }: { readonly error: WorkspaceError }) {
  if (error.kind === "unsupported-command") {
    return (
      <>
        <p class="uml-workspace__feedback-line">
          <strong>unsupported-command:</strong> El workspace no reconoce este comando y no
          modificó el modelo.
        </p>
      </>
    );
  }

  if (error.kind === "precondition-failed") {
    return (
      <p class="uml-workspace__feedback-line">
        <strong>precondition-failed:</strong> {error.code}. La operación no cumple una
        precondición del modelo y no se aplicó ningún cambio.
      </p>
    );
  }

  return (
    <>
      <p class="uml-workspace__feedback-line">
        <strong>validation-failed:</strong> El documento resultante no supera la validación y
        el cambio fue rechazado.
      </p>
      <ul class="uml-workspace__feedback-diagnostics" data-testid="feedback-diagnostics">
        {error.diagnostics.map((diagnostic, index) => (
          <li key={`${diagnostic.code}-${index}`}>
            <span>{diagnostic.severity}</span> <span>{diagnostic.code}</span>:{" "}
            {diagnostic.message}
            {diagnostic.elementId ? ` (elemento ${diagnostic.elementId})` : ""}
          </li>
        ))}
      </ul>
    </>
  );
}

export function WorkspaceFeedback() {
  const { controller, requestUpdate } = useWorkspace();
  const { error } = controller.state;

  return (
    <section
      class="uml-workspace__feedback-region"
      aria-label="Feedback del modelo"
      role="alert"
      aria-live="polite"
    >
      {error !== null && (
        <div
          class="uml-workspace__feedback"
          data-testid="workspace-feedback"
          data-error-kind={error.kind}
        >
          <ErrorDetails error={error} />
          <button
            type="button"
            class="uml-workspace__feedback-dismiss"
            onClick={() => {
              controller.dismissError();
              requestUpdate();
            }}
          >
            Descartar
          </button>
        </div>
      )}
    </section>
  );
}
