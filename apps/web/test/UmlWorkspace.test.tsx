import { cleanup, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UmlWorkspace } from "../src/uml-workspace/UmlWorkspace";

const ownerId = "00000000-0000-4000-8000-000000000001";

afterEach(() => {
  cleanup();
});

describe("UmlWorkspace", () => {
  it("shows only the static Modelo UML label on the authorized mount", () => {
    render(<UmlWorkspace ownerId={ownerId} />);

    expect(screen.getByText("Modelo UML")).toBeTruthy();
    expect(screen.getByLabelText("Nombre del nuevo elemento")).toBeTruthy();
    expect(screen.getAllByRole("textbox").length).toBe(1);
    expect(screen.queryByText(/Sin titulo|Untitled/i)).toBeNull();
  });

  it("creates exactly one document and one bus per mount and rerenders do not recreate them", () => {
    const idFactory = vi.fn(() => "00000000-0000-4000-8000-000000000002");
    const { rerender } = render(<UmlWorkspace ownerId={ownerId} idFactory={idFactory} />);

    expect(idFactory).toHaveBeenCalledTimes(1);

    rerender(<UmlWorkspace ownerId={ownerId} idFactory={idFactory} />);
    expect(idFactory).toHaveBeenCalledTimes(1);

    rerender(<UmlWorkspace ownerId={ownerId} idFactory={idFactory} />);
    expect(idFactory).toHaveBeenCalledTimes(1);
  });

  it("a remount starts a fresh document/bus with deterministic injected IDs", () => {
    const documentIds = [
      "00000000-0000-4000-8000-000000000002",
      "00000000-0000-4000-8000-000000000003",
    ];
    const idFactory = vi.fn(() => documentIds.shift()!);

    const first = render(<UmlWorkspace ownerId={ownerId} idFactory={idFactory} />);
    expect(idFactory).toHaveBeenCalledTimes(1);

    first.unmount();

    render(<UmlWorkspace ownerId={ownerId} idFactory={idFactory} />);
    expect(idFactory).toHaveBeenCalledTimes(2);
  });
});