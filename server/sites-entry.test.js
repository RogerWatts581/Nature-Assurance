import { describe, expect, it, vi } from "vitest";
import worker from "./sites-entry.js";

const admittedPacket = {
  claim: "Signal crayfish caused the reported decline in fish.",
  intendedUse: "Public education",
  evidence: [
    {
      id: "EV-001",
      admissionStatus: "admitted",
      summary: "Signal crayfish were recorded in a relevant River Barle stretch.",
      supports: "Presence in the relevant area.",
      doesNotSupport: "Causation of the reported fish decline.",
      limitations: "No reach-specific causal study.",
    },
  ],
};

describe("production assessment boundary", () => {
  it("rejects submitted or unadmitted evidence before using the preserved fallback", async () => {
    const packet = structuredClone(admittedPacket);
    packet.evidence[0].admissionStatus = "submitted";
    const response = await worker.fetch(
      new Request("https://example.test/api/assess", { method: "POST", body: JSON.stringify(packet) }),
      { ASSETS: { fetch: vi.fn() } },
    );
    expect(response.status).toBe(400);
  });

  it("labels the no-key response as a preserved GPT-5.6 packet", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/api/assess", { method: "POST", body: JSON.stringify(admittedPacket) }),
      { ASSETS: { fetch: vi.fn() } },
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.modelMode).toBe("preserved");
    expect(body.note).toContain("no server-side key");
  });

  it("delegates non-API requests to the static asset binding", async () => {
    const assetResponse = new Response("client", { status: 200 });
    const fetchAsset = vi.fn().mockResolvedValue(assetResponse);
    const response = await worker.fetch(new Request("https://example.test/"), { ASSETS: { fetch: fetchAsset } });
    expect(response).toBe(assetResponse);
    expect(fetchAsset).toHaveBeenCalledOnce();
  });
});
