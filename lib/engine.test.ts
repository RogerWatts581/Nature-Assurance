import { describe, expect, it } from "vitest";
import { accountV1, defaultDecision, initialEvidence, voiceV1 } from "./data";
import {
  admitEvidence,
  canAssess,
  runAcceptanceTests,
  validateHumanDecision,
  voiceRespectsPacket,
} from "./engine";

describe("Nature Assurance constitutional transaction", () => {
  it("does not treat upload as admission", () => {
    expect(canAssess(initialEvidence)).toBe(false);
    const admitted = admitEvidence(initialEvidence, "Roger Watts", "15 July 2026");
    expect(canAssess(admitted)).toBe(true);
    expect(admitted.every((item) => item.admissionActor === "Roger Watts")).toBe(true);
  });

  it("rejects unchanged causal wording", () => {
    expect(validateHumanDecision({ ...defaultDecision, approvedWording: defaultDecision.refusedWording })).toContain(
      "Refused wording cannot be re-authorised unchanged.",
    );
  });

  it("accepts the narrower purpose-limited decision", () => {
    expect(validateHumanDecision(defaultDecision)).toEqual([]);
  });

  it("constrains the Voice to the authorisation packet", () => {
    expect(voiceRespectsPacket(voiceV1, accountV1.packet)).toBe(true);
    expect(voiceRespectsPacket(accountV1.submittedClaim, accountV1.packet)).toBe(false);
  });

  it("passes all seven MVP acceptance tests", () => {
    const results = runAcceptanceTests();
    expect(results).toHaveLength(7);
    expect(results.every((result) => result.passed)).toBe(true);
  });
});
