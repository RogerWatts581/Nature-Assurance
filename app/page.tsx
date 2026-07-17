"use client";

import { useState } from "react";
import {
  accountV1,
  accountV11,
  challengeReview,
  defaultDecision,
  fallbackAssessment,
  initialAudit,
  initialClaim,
  initialEvidence,
  propositions,
  revisionV11,
  updateEvidence,
  voiceV1,
} from "@/lib/data";
import { admitEvidence, canAssess, runAcceptanceTests, validateHumanDecision } from "@/lib/engine";
import type { Assessment, AuditEvent, EvidenceItem, HumanDecision, RouteStatus } from "@/lib/types";

const steps = [
  ["01", "Submit claim", "Purpose & consequence"],
  ["02", "Evidence record", "Admission & provenance"],
  ["03", "Claim decomposition", "Proposition-level routing"],
  ["04", "Assess & challenge", "Separate passes"],
  ["05", "Stop & decide", "Human authority"],
  ["06", "Authorised account", "Controlled Voice"],
  ["07", "Revision history", "Change without erasure"],
] as const;

function StatusPill({ status, children }: { status: RouteStatus | "neutral" | "passed"; children?: React.ReactNode }) {
  return <span className={`pill pill-${status}`}>{children ?? status}</span>;
}

function SectionHeading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <header className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="lede">{intro}</p>
    </header>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SourceLink({ item }: { item: EvidenceItem }) {
  if (!item.url) return <span className="source-unlinked">Demonstrator record</span>;
  return (
    <a className="source-link" href={item.url} target="_blank" rel="noreferrer">
      Open source ↗
    </a>
  );
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [evidence, setEvidence] = useState(initialEvidence);
  const [assessment, setAssessment] = useState<Assessment>(fallbackAssessment);
  const [assessmentRun, setAssessmentRun] = useState(false);
  const [modelBusy, setModelBusy] = useState(false);
  const [decision, setDecision] = useState<HumanDecision>(defaultDecision);
  const [decisionRecorded, setDecisionRecorded] = useState(false);
  const [voiceReleased, setVoiceReleased] = useState(false);
  const [revised, setRevised] = useState(false);
  const [audit, setAudit] = useState<AuditEvent[]>(initialAudit);
  const tests = runAcceptanceTests();

  const completeAndMove = (current: number, next = current + 1) => {
    setCompleted((values) => (values.includes(current) ? values : [...values, current]));
    setStep(next);
  };

  const addAudit = (action: string, object: string, detail: string, actor = "Nature Assurance") => {
    setAudit((events) => [
      ...events,
      { id: `AUD-${String(events.length + 1).padStart(3, "0")}`, at: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), actor, action, object, detail },
    ]);
  };

  const admitPacket = () => {
    const admitted = admitEvidence(evidence, "Roger Watts", "15 July 2026 · Build Week demonstrator");
    setEvidence(admitted);
    addAudit("admitted", "RB-E01—RB-E06", "Six items admitted for demonstrator use with limitations preserved", "Roger Watts");
  };

  const runAssessment = async () => {
    if (!canAssess(evidence)) return;
    setModelBusy(true);
    try {
      const response = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim: initialClaim.wording,
          intendedUse: initialClaim.intendedUse,
          evidence: evidence.map(({ id, summary, supports, doesNotSupport, limitations, admissionStatus }) => ({ id, summary, supports, doesNotSupport, limitations, admissionStatus })),
        }),
      });
      if (!response.ok) throw new Error("Assessment route failed");
      setAssessment(await response.json());
      setAssessmentRun(true);
      addAudit("assessed", fallbackAssessment.id, "GPT-5.6 structured assessment packet loaded; no authority conferred");
    } catch {
      setAssessment(fallbackAssessment);
      setAssessmentRun(true);
      addAudit("assessed", fallbackAssessment.id, "Preserved GPT-5.6 demonstrator packet loaded; no live route available");
    } finally {
      setModelBusy(false);
    }
  };

  const recordDecision = () => {
    const errors = validateHumanDecision(decision);
    if (errors.length) return;
    setDecisionRecorded(true);
    addAudit("refused", initialClaim.id, "Original causal wording refused for public use", decision.reviewer);
    addAudit("authorised", accountV1.id, `Narrower conclusion approved for ${decision.permittedUse.toLowerCase()}`, decision.reviewer);
  };

  const renderScreen = () => {
    if (step === 0) {
      return (
        <>
          <SectionHeading eyebrow="Constitutional transaction · 01" title="Submit a consequential claim" intro="The system records not only what is being claimed, but where, when, for what use and with what level of consequence." />
          <div className="claim-card">
            <div className="claim-label"><span>Submitted wording</span><StatusPill status="red">Causal claim</StatusPill></div>
            <blockquote>“{initialClaim.wording}”</blockquote>
            <div className="field-grid">
              <Field label="Place" value={initialClaim.location} />
              <Field label="Period" value={initialClaim.period} />
              <Field label="Intended use" value={initialClaim.intendedUse} />
              <Field label="Consequence" value="Medium · public claim" />
            </div>
          </div>
          <div className="constitutional-note"><span>Constitutional rule</span><p>Confidence does not confer authority. The claim must pass through evidence, assurance and an accountable human decision.</p></div>
          <button className="primary" onClick={() => { addAudit("opened", initialClaim.id, "Constitutional transaction opened"); completeAndMove(0); }}>Open transaction <span>→</span></button>
        </>
      );
    }

    if (step === 1) {
      const allAdmitted = canAssess(evidence);
      return (
        <>
          <SectionHeading eyebrow="Evidence record · 02" title="Uploading is not admission" intro="Each item retains its provenance, scope, limitations, permitted proposition and prohibited use. A human confirms admission for this assessment." />
          <div className="evidence-summary"><div><strong>{evidence.length}</strong><span>submitted items</span></div><div><strong>{evidence.filter((item) => item.admissionStatus === "admitted").length}</strong><span>admitted items</span></div><div><strong>{evidence.filter((item) => item.sourceType === "public authority" || item.sourceType === "agency guidance" || item.sourceType === "public dataset").length}</strong><span>authoritative records</span></div></div>
          <div className="evidence-grid">
            {evidence.map((item) => (
              <article className="evidence-card" key={item.id}>
                <div className="card-top"><span className="id-tag">{item.id}</span><span className={`admission admission-${item.admissionStatus}`}>{item.admissionStatus}</span></div>
                <h3>{item.title}</h3><p className="org">{item.organisation} · {item.date}</p><p>{item.summary}</p>
                <dl><div><dt>May support</dt><dd>{item.supports}</dd></div><div><dt>Must not support</dt><dd>{item.doesNotSupport}</dd></div><div><dt>Limit</dt><dd>{item.limitations}</dd></div></dl>
                <div className="card-footer"><SourceLink item={item} /><span>{item.admissionActor ?? "No admission actor"}</span></div>
              </article>
            ))}
          </div>
          <div className="action-row">
            {!allAdmitted ? <button className="primary" onClick={admitPacket}>Human-confirm evidence packet</button> : <button className="primary" onClick={() => completeAndMove(1)}>Continue to decomposition <span>→</span></button>}
            <span className="microcopy">Admission is purpose-limited. It is not endorsement of every statement in a source.</span>
          </div>
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <SectionHeading eyebrow="Claim decomposition · 03" title="One sentence contains seven propositions" intro="Routing applies at proposition level. Supported observations and mechanisms remain usable even when the submitted causal conclusion must stop." />
          <div className="proposition-table">
            <div className="table-head"><span>Proposition</span><span>Type</span><span>Evidence</span><span>Route</span></div>
            {propositions.map((item) => (
              <div className="table-row" key={item.id}>
                <div><b>{item.id}</b><strong>{item.text}</strong><small>{item.finding}</small></div>
                <span className="type-tag">{item.type.replace("-", " ")}</span>
                <span className="evidence-links">{item.evidenceIds.join(" · ")}</span>
                <StatusPill status={item.status} />
              </div>
            ))}
          </div>
          <div className="causal-gap"><span>Unsupported transition identified</span><p>Presence + mechanism ≠ local material contribution ≠ causation of a reported fish decline.</p></div>
          <button className="primary" onClick={() => { addAudit("decomposed", initialClaim.id, `${propositions.length} propositions classified and linked`); completeAndMove(2); }}>Send admitted packet to assessment <span>→</span></button>
        </>
      );
    }

    if (step === 3) {
      return (
        <>
          <SectionHeading eyebrow="Assurance · 04" title="Assessment and Challenge Review remain separate" intro="GPT‑5.6 prepares a structured preliminary assessment. A separate challenge pass searches for unsupported leaps and alternatives; neither may authorise publication." />
          {!assessmentRun ? (
            <div className="run-panel"><div className="model-mark">5.6</div><div><h2>Admitted packet ready</h2><p>{evidence.length} evidence items · {propositions.length} propositions · public educational use</p></div><button className="primary" disabled={modelBusy || !canAssess(evidence)} onClick={runAssessment}>{modelBusy ? "Assessing…" : "Run assessment"}</button></div>
          ) : (
            <>
              <div className="split-review">
                <article className="review-panel assessor"><div className="panel-heading"><div><span>Preliminary assessment</span><h2>Assessor</h2></div><StatusPill status={assessment.overallRoute} /></div><p className="model-receipt">{assessment.model} · {assessment.modelMode === "live" ? "live structured output" : "verified demonstrator packet"}</p><h3>Finding</h3><p>{assessment.preliminaryConclusion}</p><h3>Exact causal gap</h3><p>{assessment.causalGap}</p><h3>Unresolved</h3><ul>{assessment.unresolved.map((item) => <li key={item}>{item}</li>)}</ul></article>
                <article className="review-panel challenger"><div className="panel-heading"><div><span>Separate pass completed</span><h2>Challenge Review</h2></div><StatusPill status="red">Objects</StatusPill></div><p className="model-receipt">May object · may trigger stop · may not authorise</p><h3>Objections</h3><ul>{challengeReview.objections.map((item) => <li key={item}>{item}</li>)}</ul><h3>Alternatives considered</h3><div className="tag-cloud">{challengeReview.alternativeExplanations.map((item) => <span key={item}>{item}</span>)}</div></article>
              </div>
              <div className="stop-strip"><strong>Stop triggered</strong><span>The submitted causal wording outruns the admitted evidence.</span></div>
              <button className="primary" onClick={() => { addAudit("challenged", challengeReview.id, "Separate Challenge Review triggered publication stop"); completeAndMove(3); }}>Open human decision gate <span>→</span></button>
            </>
          )}
        </>
      );
    }

    if (step === 4) {
      return (
        <>
          <SectionHeading eyebrow="Stop condition & human authority · 05" title="Publication stopped" intro="The system cannot authorise the original allegation. An identifiable person must refuse, revise, refer or hold—and record the purpose and consequences of that choice." />
          <div className="refusal-banner"><div className="stop-icon">!</div><div><span>Original wording · refused for public use</span><blockquote>“{initialClaim.wording}”</blockquote><p>Reason: plausible mechanism, but local material contribution and fish-decline causation are not established.</p></div></div>
          <div className="decision-layout">
            <div className="decision-options"><button>Refuse</button><button className="selected">Revise & approve</button><button>Refer for specialist review</button><button>Hold pending evidence</button></div>
            <div className="decision-form">
              <label>Approved wording<textarea value={decision.approvedWording} onChange={(event) => setDecision({ ...decision, approvedWording: event.target.value })} /></label>
              <div className="two-col"><label>Reviewer<input value={decision.reviewer} onChange={(event) => setDecision({ ...decision, reviewer: event.target.value })} /></label><label>Role<input value={decision.role} onChange={(event) => setDecision({ ...decision, role: event.target.value })} /></label></div>
              <div className="two-col"><label>Permitted use<select value={decision.permittedUse} onChange={(event) => setDecision({ ...decision, permittedUse: event.target.value })}><option>Public education only</option><option>Internal exploration only</option><option>Refer for professional scientific review</option></select></label><label>Review trigger<input value={decision.reviewTrigger} onChange={(event) => setDecision({ ...decision, reviewTrigger: event.target.value })} /></label></div>
              <button className="primary" onClick={recordDecision} disabled={decisionRecorded}>{decisionRecorded ? "Decision recorded ✓" : "Record refusal & purpose-limited approval"}</button>
            </div>
          </div>
          {decisionRecorded && <button className="primary next-action" onClick={() => completeAndMove(4)}>Create Authorised Account <span>→</span></button>}
        </>
      );
    }

    if (step === 5) {
      return (
        <>
          <SectionHeading eyebrow="Authorised account · 06" title="A narrower conclusion now has authority" intro="The rejected wording remains visible. The Voice receives only a purpose-limited Authorisation Packet—not the unrestricted allegation or evidence archive." />
          <div className="account-header"><div><span>River Barle Ecological Account</span><h2>Version {accountV1.version}</h2></div><StatusPill status="amber">Authorised · limited use</StatusPill></div>
          <div className="wording-contrast"><div className="rejected"><span>Submitted claim</span><p>{accountV1.submittedClaim}</p><strong>{accountV1.submittedClaimDecision}</strong></div><div className="approved"><span>Authorised conclusion</span><p>{accountV1.authorisedConclusion}</p><strong>{accountV1.permittedUse}</strong></div></div>
          <div className="account-columns">
            <article><h3>Ecological account</h3><ul className="ledger">{accountV1.ecologicalAccount.map((item, index) => <li key={item} className={index === 4 ? "ledger-stop" : ""}>{item}</li>)}</ul></article>
            <article><h3>Responsibility route</h3><div className="responsibility-list">{accountV1.responsibilities.map((item) => <div key={item.category}><span>{item.category}</span><strong>{item.finding}</strong><small>{item.status}</small></div>)}</div></article>
          </div>
          <div className="voice-section">
            <div className="packet"><span>Authorisation Packet sent to Voice</span><h3>Only five fields cross the boundary</h3><ul><li>Authorised conclusion</li><li>Approved uncertainties</li><li>Prohibited claims</li><li>Permitted use</li><li>Account version</li></ul></div>
            <div className="voice"><span>Controlled interpretation</span><h3>Voice of Nature</h3>{voiceReleased ? <p>“{voiceV1}”</p> : <button className="secondary" onClick={() => { setVoiceReleased(true); addAudit("released", "VOICE-001", "Voice generated from Authorisation Packet v1.0 only"); }}>Release controlled Voice</button>}</div>
          </div>
          {voiceReleased && <button className="primary" onClick={() => completeAndMove(5)}>Admit new evidence <span>→</span></button>}
        </>
      );
    }

    return (
      <>
        <SectionHeading eyebrow="Revision & audit · 07" title="History is preserved; authority is renewed" intro="New material cannot edit an authorised conclusion directly. It enters as candidate evidence and passes again through admission, assurance and human authority." />
        {!revised ? (
          <div className="update-card"><div className="update-number">+1</div><div><span>Candidate evidence · {updateEvidence.id}</span><h2>{updateEvidence.title}</h2><p>{updateEvidence.summary}</p><div className="support-limit"><span><b>May support</b>{updateEvidence.supports}</span><span><b>Must not support</b>{updateEvidence.doesNotSupport}</span></div></div><button className="primary" onClick={() => { setRevised(true); addAudit("revised", revisionV11.id, "New evidence created linked account v1.1; v1.0 preserved", "Roger Watts"); }}>Admit & create revision</button></div>
        ) : (
          <>
            <div className="version-flow"><div className="version-card old"><span>Preserved</span><h2>Account v{accountV1.version}</h2><p>{accountV1.authorisedConclusion}</p></div><div className="version-arrow">→<small>{updateEvidence.id}</small></div><div className="version-card current"><span>Current</span><h2>Account v{accountV11.version}</h2><p>{accountV11.authorisedConclusion}</p></div></div>
            <div className="revision-detail"><article><h3>What changed</h3><ul>{revisionV11.changed.map((item) => <li key={item}>{item}</li>)}</ul></article><article><h3>What did not change</h3><ul>{revisionV11.unchanged.map((item) => <li key={item}>{item}</li>)}</ul></article></div>
          </>
        )}
        <div className="test-suite"><div className="test-heading"><div><span>Constitutional Test Suite</span><h2>{tests.filter((item) => item.passed).length} / {tests.length} safeguards passing</h2></div><StatusPill status="passed">Definition of done</StatusPill></div>{tests.map((test) => <div className="test-row" key={test.id}><span className="test-check">{test.passed ? "✓" : "×"}</span><b>{test.id}</b><span>{test.title}</span><strong>{test.passed ? "PASS" : "FAIL"}</strong></div>)}</div>
        <div className="audit"><h3>Immutable audit trail</h3>{audit.map((event) => <div key={event.id}><time>{event.at}</time><strong>{event.actor}</strong><span>{event.action} · {event.object}</span><small>{event.detail}</small></div>)}</div>
      </>
    );
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">NA</div><div><strong>Nature Assurance</strong><span>River Barle demonstrator</span></div></div>
        <nav>{steps.map(([number, label, note], index) => <button key={number} className={`${step === index ? "active" : ""} ${completed.includes(index) ? "complete" : ""}`} onClick={() => (index <= Math.max(step, ...completed) ? setStep(index) : null)}><span className="step-number">{completed.includes(index) ? "✓" : number}</span><span><strong>{label}</strong><small>{note}</small></span></button>)}</nav>
        <div className="sidebar-rule"><span>Governing proposition</span><p>Capability shall not enlarge authority by default.</p></div>
        <div className="build-stamp"><span>Build Week · MVP v1.0</span><strong>One claim. One refusal.</strong></div>
      </aside>
      <main>
        <div className="topbar"><div><span className="live-dot" /> Constitutional transaction <b>RB-2026-001</b></div><div className="top-status"><span>{completed.length}/7 stages complete</span><span className="avatar">RW</span></div></div>
        <div className="content">{renderScreen()}</div>
      </main>
    </div>
  );
}
