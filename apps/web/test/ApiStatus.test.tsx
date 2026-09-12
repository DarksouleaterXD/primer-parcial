import { cleanup, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiStatus } from "../src/components/ApiStatus";

const apiOrigin = "http://api.example.test";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("ApiStatus", () => {
  it("shows comprobando while the health request is pending", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));

    render(<ApiStatus apiOrigin={apiOrigin} />);

    expect(screen.getByText("comprobando")).toBeTruthy();
  });

  it("shows API disponible only for a valid 200 health response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "available" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<ApiStatus apiOrigin={`${apiOrigin}/`} />);

    expect(await screen.findByText("API disponible")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(`${apiOrigin}/api/health`, {
      signal: expect.any(AbortSignal),
    });
  });

  it("shows API no disponible for a 503 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    render(<ApiStatus apiOrigin={apiOrigin} />);

    expect(await screen.findByText("API no disponible")).toBeTruthy();
  });

  it("shows API no disponible for an invalid 200 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "stale" }), { status: 200 })),
    );

    render(<ApiStatus apiOrigin={apiOrigin} />);

    expect(await screen.findByText("API no disponible")).toBeTruthy();
  });

  it("shows API no disponible after a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Network failure")));

    render(<ApiStatus apiOrigin={apiOrigin} />);

    expect(await screen.findByText("API no disponible")).toBeTruthy();
  });

  it("aborts the request and shows API no disponible after the timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
      ),
    );

    render(<ApiStatus apiOrigin={apiOrigin} timeoutMs={50} />);
    await vi.advanceTimersByTimeAsync(50);

    expect(await screen.findByText("API no disponible")).toBeTruthy();
  });
});
