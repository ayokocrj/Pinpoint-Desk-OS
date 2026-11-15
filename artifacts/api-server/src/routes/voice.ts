import { Router, type IRouter } from "express";
import { CreateVoiceSessionBody, CreateVoiceSessionResponse } from "@workspace/api-zod";
import { issueTicket, sameOrigin, VOICE_MODEL, MAX_SECONDS } from "../lib/voice";

const router: IRouter = Router();
router.post("/voice/session", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!sameOrigin(req)) { res.status(403).json({ error: "Voice sessions must start from this application." }); return; }
  const parsed = CreateVoiceSessionBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.consent) { res.status(400).json({ error: "Explicit audio consent is required." }); return; }
  if (!process.env.GEMINI_API_KEY) { res.status(503).json({ error: "Gemini Live is not configured on the server." }); return; }
  const ticket = issueTicket(parsed.data.context, parsed.data.sampleRate, req.headers.origin!);
  if ("error" in ticket) {
    res.status(ticket.error === "limit" ? 429 : 503).json({ error: ticket.error === "limit" ? "The hourly demo voice limit has been reached. Please try again later." : "Two voice sessions are already active. Please try again shortly." }); return;
  }
  res.status(201).json(CreateVoiceSessionResponse.parse({ socketPath: "/api/voice/live", model: VOICE_MODEL, maxSeconds: MAX_SECONDS, ticket: ticket.token }));
});
export default router;
