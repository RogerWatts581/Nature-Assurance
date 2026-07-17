# Nature Assurance

**A constitutionally governed route from contested ecological evidence to a human-authorised conclusion.**

Nature Assurance is an OpenAI Build Week demonstrator built around one contested River Barle claim:

> Signal crayfish caused the reported decline in fish in the River Barle.

The product does not optimise for producing a fluent answer. It moves the claim through a governed constitutional transaction in which evidence is admitted, propositions are separated, causal overreach is challenged, unsafe wording is stopped, a human makes a purpose-limited decision, and later evidence creates revision without erasure.

## The Build Contract

### Inputs

- One claim
- Six admitted evidence items

### Outputs

- One refused wording
- One authorised wording
- One Authorised Account
- One controlled Voice interpretation
- One preserved revision

### Required behaviour

- Every transition is visible
- Every conclusion is traceable
- Every refusal is explained
- Every approval is recorded
- Every revision preserves history

## Seven-screen transaction

1. Submit Claim
2. Evidence Record
3. Claim Decomposition
4. Assessment and Challenge Review
5. Stop Condition and Human Decision
6. Authorised Account and Controlled Voice
7. Revision History

## Constitutional safeguards implemented in code

- Uploading is not admission. Every evidence item requires an admission actor, time, reason, scope and limitation.
- GPT‑5.6 produces a preliminary assessment, not an authorised conclusion.
- Challenge Review may object, trigger a stop and recommend a route. It cannot approve or silently alter the preserved assessment.
- The original causal wording cannot be authorised unchanged.
- Human approval requires an identifiable reviewer, role, permitted use, consequence level and review trigger.
- The Voice receives a narrow Authorisation Packet rather than unrestricted evidence or allegations.
- New evidence creates a linked account version and leaves the earlier account intact.

## GPT‑5.6 integration

The typed reference adapter in `server/openai-assessor.ts` uses the OpenAI Responses API with GPT‑5.6 and Structured Outputs. The deployed server boundary in `server/sites-entry.js` applies the same admitted-packet restriction. The application, rather than the model, enforces authority boundaries and stopping rules.

The deployed route calls GPT‑5.6 when `OPENAI_API_KEY` is available server-side. Without a configured key it transparently returns the preserved GPT‑5.6 assessment packet used for the River Barle transaction; it never pretends that a new model call occurred. This keeps the demonstration reproducible while preventing a browser-side API key or unrestricted evidence archive from reaching the Voice.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Local development uses the preserved packet unless an API boundary is provided; the hosted worker owns the secure live/preserved routing decision.

## Verify

```bash
npm test
npm run lint
npm run build
```

The test suite encodes the seven Build Week acceptance tests. All seven must pass for the MVP to be constitutionally complete.

## Evidence and limitations

The six evidential roles and claim map were prepared before Build Week and recorded separately as pre-existing conceptual work. Exact source selection and all production implementation began during the Build Week submission period.

The demonstrator uses linked public-authority and agency materials, plus clearly labelled demonstrator records. It does not determine ecological truth, establish legal liability, provide professional scientific or legal advice, or replace accountable decision-makers. The later professional-survey item is explicitly a demonstrator update scenario until an underlying report is supplied and verified.

## Build Week chronology

- **Before submission period:** constitutional concepts, evidence-role schedule, claim map and storyboard prepared as rules-safe conceptual material.
- **15 July 2026:** production repository and working implementation begun with Codex and GPT‑5.6.
- Build Week code, tests, design decisions and later changes are preserved in dated commits and this Codex project thread.

## Product promise

> Refusal prevents overreach. Accountable next steps prevent paralysis.

**One claim. One refusal. One authorised conclusion. One controlled interpretation. One preserved revision.**
