import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { propositions } from "../lib/data";

const AssessmentPacket = z.object({
  overallRoute: z.enum(["green", "amber", "red"]),
  preliminaryConclusion: z.string(),
  safeConclusion: z.string(),
  causalGap: z.string(),
  alternatives: z.array(z.string()),
  unresolved: z.array(z.string()),
});

export type AdmittedPacket = {
  claim: string;
  intendedUse: string;
  evidence: Array<{
    id: string;
    summary: string;
    supports: string;
    doesNotSupport: string;
    limitations: string;
    admissionStatus: "admitted";
  }>;
};

const instructions = `You are the preliminary Assessor inside Nature Assurance.
You may draft an assessment but may not approve, publish, or assign liability.
Use only the admitted evidence packet. Keep observation, mechanism, local inference,
causation, and responsibility distinct. Do not infer ecological recovery from
expenditure or activity. Do not approve a causal claim until plausible alternatives
are considered. Return a proportionate preliminary conclusion, a safer alternative,
the exact causal gap, alternatives, and unresolved questions. Never state that your
output is authorised.`;

/**
 * Server-only GPT-5.6 adapter. A server route may call this function with a secret
 * OPENAI_API_KEY. The static judge preview deliberately replays the preserved
 * result so no credential or unrestricted evidence archive reaches the browser.
 */
export async function assessWithGPT56(packet: AdmittedPacket) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required server-side");
  if (packet.evidence.some((item) => item.admissionStatus !== "admitted")) {
    throw new Error("Only admitted evidence may be assessed");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.parse({
    model: "gpt-5.6",
    reasoning: { effort: "medium" },
    input: [
      { role: "system", content: instructions },
      {
        role: "user",
        content: JSON.stringify({
          ...packet,
          preclassifiedPropositions: propositions.map(({ id, text, type, evidenceIds }) => ({ id, text, type, evidenceIds })),
        }),
      },
    ],
    text: { format: zodTextFormat(AssessmentPacket, "nature_assurance_assessment") },
  });

  if (!response.output_parsed) throw new Error("GPT-5.6 returned no structured assessment");
  return { id: response.id, model: "GPT-5.6", modelMode: "live" as const, ...response.output_parsed };
}
