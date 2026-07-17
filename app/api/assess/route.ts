import { z } from "zod";
import { fallbackAssessment } from "@/lib/data";
import { assessWithGPT56 } from "@/server/openai-assessor";

const RequestBody = z.object({
  claim: z.string().min(10),
  intendedUse: z.string().min(3),
  evidence: z.array(z.object({
    id: z.string(),
    summary: z.string(),
    supports: z.string(),
    doesNotSupport: z.string(),
    limitations: z.string(),
    admissionStatus: z.literal("admitted"),
  })).min(1),
});

export async function POST(request: Request) {
  const parsed = RequestBody.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Only a fully admitted evidence packet may be assessed." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({
      ...fallbackAssessment,
      note: "Preserved GPT-5.6 demonstrator packet: no server-side key is configured.",
    });
  }

  try {
    return Response.json(await assessWithGPT56(parsed.data));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Assessment failed" }, { status: 502 });
  }
}
