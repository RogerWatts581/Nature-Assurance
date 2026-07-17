import {
  accountV1,
  accountV11,
  challengeReview,
  fallbackAssessment,
  initialClaim,
  initialEvidence,
  propositions,
  revisionV11,
  updateEvidence,
  voiceV1,
} from "./data";
import type { AuthorisationPacket, EvidenceItem, HumanDecision, Proposition } from "./types";

export function admitEvidence(
  evidence: EvidenceItem[],
  actor: string,
  at: string,
): EvidenceItem[] {
  if (!actor.trim()) throw new Error("An admission actor is required.");
  return evidence.map((item) => ({
    ...item,
    admissionStatus: "admitted" as const,
    admissionActor: actor,
    admissionAt: at,
    admissionReason: "Human-confirmed for this demonstrator assessment, subject to the recorded limitations and permitted proposition.",
  }));
}

export function canAssess(evidence: EvidenceItem[]): boolean {
  return evidence.length > 0 && evidence.every((item) => item.admissionStatus === "admitted");
}

export function substantivePropositionsHaveStatus(items: Proposition[]): boolean {
  return items.every((item) => Boolean(item.status && item.finding && item.missing));
}

export function hasUnsupportedCausalTransition(items: Proposition[]): boolean {
  return items.some(
    (item) => item.type === "causal-inference" && item.status === "red" && item.finding.toLowerCase().includes("not established"),
  );
}

export function challengeCanAuthorise(): boolean {
  return challengeReview.mayAuthorise;
}

export function validateHumanDecision(decision: HumanDecision): string[] {
  const errors: string[] = [];
  if (!decision.reviewer.trim()) errors.push("Reviewer identity is required.");
  if (!decision.role.trim()) errors.push("Reviewer role is required.");
  if (!decision.permittedUse.trim()) errors.push("Permitted use is required.");
  if (!decision.decidedAt.trim()) errors.push("Decision time is required.");
  if (decision.action === "revise-and-approve" && !decision.approvedWording.trim()) errors.push("Approved wording is required.");
  if (decision.action === "revise-and-approve" && decision.approvedWording === decision.refusedWording) {
    errors.push("Refused wording cannot be re-authorised unchanged.");
  }
  if (decision.approvedWording.toLowerCase().includes("caused the reported decline")) {
    errors.push("The unsupported causal wording cannot be authorised.");
  }
  return errors;
}

export function buildVoicePacket(): AuthorisationPacket {
  return structuredClone(accountV1.packet);
}

export function voiceRespectsPacket(voice: string, packet: AuthorisationPacket): boolean {
  const normalisedVoice = voice.toLowerCase();
  return packet.prohibitedClaims.every((claim) => !normalisedVoice.includes(claim.toLowerCase()));
}

export function revisionPreservesHistory(): boolean {
  return Boolean(
    revisionV11.priorAccountPreserved &&
      accountV11.supersedes === accountV1.id &&
      accountV11.evidenceIds.includes(updateEvidence.id) &&
      accountV1.evidenceIds.length === initialEvidence.length,
  );
}

export const acceptanceTests = [
  {
    id: "AT-01",
    title: "Every substantive proposition shows its evidence status",
    passes: () => substantivePropositionsHaveStatus(propositions),
  },
  {
    id: "AT-02",
    title: "The unsupported causal transition is visibly identified",
    passes: () => hasUnsupportedCausalTransition(propositions),
  },
  {
    id: "AT-03",
    title: "The original wording cannot be authorised for public use",
    passes: () =>
      validateHumanDecision({
        id: "test",
        action: "revise-and-approve",
        reviewer: "Reviewer",
        role: "Designated reviewer",
        decidedAt: "now",
        refusedWording: initialClaim.wording,
        approvedWording: initialClaim.wording,
        permittedUse: "Public education",
        consequence: "Medium",
        unresolvedQuestions: [],
        reviewTrigger: "New evidence",
      }).length > 0,
  },
  {
    id: "AT-04",
    title: "Challenge Review cannot approve or silently alter anything",
    passes: () => challengeCanAuthorise() === false && challengeReview.assessmentId === fallbackAssessment.id,
  },
  {
    id: "AT-05",
    title: "Human refusal and purpose-limited approval are recorded",
    passes: () =>
      accountV1.submittedClaimDecision.includes("Refused") &&
      accountV1.permittedUse === "Public education only" &&
      Boolean(accountV1.decisionId),
  },
  {
    id: "AT-06",
    title: "The Voice cannot repeat or strengthen the refused allegation",
    passes: () => voiceRespectsPacket(voiceV1, accountV1.packet),
  },
  {
    id: "AT-07",
    title: "New evidence creates a linked version while preserving the old one",
    passes: () => revisionPreservesHistory(),
  },
];

export function runAcceptanceTests() {
  return acceptanceTests.map((test) => ({ id: test.id, title: test.title, passed: test.passes() }));
}
