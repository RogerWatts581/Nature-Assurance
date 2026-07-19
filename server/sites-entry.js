const preservedAssessment = {
  id: "RB-ASMT-001",
  version: "0.1",
  model: "GPT-5.6",
  modelMode: "preserved",
  generatedAt: "15 July 2026 · Build Week",
  overallRoute: "red",
  preliminaryConclusion: "The supplied evidence supports a plausible pressure pathway involving signal crayfish, bank disturbance and possible habitat effects, but it does not establish that signal crayfish caused the reported decline in fish.",
  safeConclusion: "Signal crayfish are present in a relevant River Barle stretch and provide a plausible contributor to bank pressure. Local material contribution and causation of the reported fish decline remain unresolved.",
  causalGap: "Presence plus a general mechanism does not establish local material contribution; local contribution does not establish causation of the reported fish decline.",
  alternatives: ["Low flow", "Elevated temperature", "Water quality", "Habitat condition", "Barriers to fish movement"],
  unresolved: ["Comparable fish monitoring", "Reach-specific crayfish pressure", "Material contribution", "Relative importance of alternative pressures"],
  note: "Preserved GPT-5.6 demonstrator packet: no server-side key is configured.",
};

const assessmentSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    overallRoute: { type: "string", enum: ["green", "amber", "red"] },
    preliminaryConclusion: { type: "string" },
    safeConclusion: { type: "string" },
    causalGap: { type: "string" },
    alternatives: { type: "array", items: { type: "string" } },
    unresolved: { type: "array", items: { type: "string" } },
  },
  required: ["overallRoute", "preliminaryConclusion", "safeConclusion", "causalGap", "alternatives", "unresolved"],
};

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}

function isNonEmptyString(value, minimumLength = 1) {
  return typeof value === "string" && value.trim().length >= minimumLength;
}

function isAdmittedPacket(packet) {
  return Boolean(
    packet &&
      isNonEmptyString(packet.claim, 10) &&
      isNonEmptyString(packet.intendedUse, 3) &&
      Array.isArray(packet.evidence) &&
      packet.evidence.length > 0 &&
      packet.evidence.every(
        (item) =>
          item?.admissionStatus === "admitted" &&
          isNonEmptyString(item.id) &&
          isNonEmptyString(item.summary) &&
          isNonEmptyString(item.supports) &&
          isNonEmptyString(item.doesNotSupport) &&
          isNonEmptyString(item.limitations),
      ),
  );
}

async function liveAssessment(packet, apiKey) {

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.6",
      reasoning: { effort: "medium" },
      instructions: "You are a preliminary assessor with no authority to approve or publish. Use only admitted evidence. Keep observation, mechanism, local inference and causation distinct. Return a proportionate assessment and never state that it is authorised.",
      input: JSON.stringify(packet),
      text: { format: { type: "json_schema", name: "nature_assurance_assessment", strict: true, schema: assessmentSchema } },
    }),
  });
  if (!response.ok) return json({ error: "GPT-5.6 assessment failed." }, 502);
  const result = await response.json();
  const text = result.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
  if (!text) return json({ error: "GPT-5.6 returned no structured packet." }, 502);
  return json({ id: result.id, version: "0.1", model: "GPT-5.6", modelMode: "live", generatedAt: new Date().toISOString(), ...JSON.parse(text) });
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/assess" && request.method === "POST") {
      let packet;
      try {
        packet = await request.json();
      } catch {
        return json({ error: "The assessment packet must be valid JSON." }, 400);
      }
      if (!isAdmittedPacket(packet)) {
        return json({ error: "Only a complete, fully admitted evidence packet may be assessed." }, 400);
      }
      if (env.OPENAI_API_KEY) return liveAssessment(packet, env.OPENAI_API_KEY);
      return json(preservedAssessment);
    }
    return env.ASSETS.fetch(request);
  },
};

export default worker;
