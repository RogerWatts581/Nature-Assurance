export type RouteStatus = "green" | "amber" | "red";
export type AdmissionStatus = "submitted" | "pending" | "admitted" | "not-admitted";
export type EvidenceKind =
  | "reported-observation"
  | "local-observation"
  | "presence"
  | "mechanism"
  | "alternative"
  | "institutional";

export interface Claim {
  id: string;
  wording: string;
  location: string;
  period: string;
  intendedUse: string;
  consequence: "low" | "medium" | "high";
}

export interface EvidenceItem {
  id: string;
  title: string;
  organisation: string;
  date: string;
  url?: string;
  kind: EvidenceKind;
  sourceType: "submitted testimony" | "public authority" | "agency guidance" | "public dataset";
  summary: string;
  geographicScope: string;
  temporalScope: string;
  supports: string;
  doesNotSupport: string;
  limitations: string;
  rights: string;
  admissionStatus: AdmissionStatus;
  admissionActor?: string;
  admissionAt?: string;
  admissionReason?: string;
}

export interface Proposition {
  id: string;
  text: string;
  type: "observation" | "presence" | "mechanism" | "local-inference" | "causal-inference" | "responsibility";
  evidenceIds: string[];
  status: RouteStatus;
  finding: string;
  missing: string;
}

export interface Assessment {
  id: string;
  version: string;
  model: string;
  generatedAt: string;
  overallRoute: RouteStatus;
  preliminaryConclusion: string;
  safeConclusion: string;
  causalGap: string;
  alternatives: string[];
  unresolved: string[];
  propositionIds: string[];
  modelMode: "live" | "verified-demonstrator-packet";
}

export interface ChallengeReview {
  id: string;
  assessmentId: string;
  createdAt: string;
  objections: string[];
  missingEvidence: string[];
  alternativeExplanations: string[];
  stopTriggered: boolean;
  recommendation: "revise" | "refer" | "hold";
  mayAuthorise: false;
}

export interface HumanDecision {
  id: string;
  action: "refuse" | "revise-and-approve" | "refer" | "hold";
  reviewer: string;
  role: string;
  decidedAt: string;
  refusedWording: string;
  approvedWording: string;
  permittedUse: string;
  consequence: string;
  unresolvedQuestions: string[];
  reviewTrigger: string;
}

export interface ResponsibilityFinding {
  category: string;
  finding: string;
  status: "identified" | "candidate" | "unresolved" | "outside-scope";
}

export interface AuthorisationPacket {
  accountVersion: string;
  authorisedConclusion: string;
  approvedUncertainties: string[];
  prohibitedClaims: string[];
  permittedUse: string;
  disclosureConstraints: string[];
}

export interface AuthorisedAccount {
  id: string;
  version: string;
  createdAt: string;
  submittedClaim: string;
  submittedClaimDecision: string;
  authorisedConclusion: string;
  permittedUse: string;
  evidenceIds: string[];
  assessmentId: string;
  challengeReviewId: string;
  decisionId: string;
  ecologicalAccount: string[];
  responsibilities: ResponsibilityFinding[];
  packet: AuthorisationPacket;
  supersedes?: string;
}

export interface RevisionRecord {
  id: string;
  fromVersion: string;
  toVersion: string;
  createdAt: string;
  newEvidenceId: string;
  changed: string[];
  unchanged: string[];
  priorAccountPreserved: true;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  object: string;
  detail: string;
}
