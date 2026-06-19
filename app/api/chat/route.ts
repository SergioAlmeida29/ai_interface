import { NextRequest } from "next/server";
import { getAgentById, getAgentApiKey } from "@/lib/agents";

export async function POST(req: NextRequest) {
  const { message, agentId, threadId, context } = await req.json();

  const agent = getAgentById(agentId);
  if (!agent) {
    return new Response(JSON.stringify({ error: "Invalid agent" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let apiKey: string;
  try {
    apiKey = getAgentApiKey(agent);
  } catch {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Context injected directly into the message — the API's user_context field
  // is metadata only and is not visible to the AI model.
  const MAX_CONTEXT_CHARS = 12000;
  const fullMessage = context
    ? `${message}\n\n--- Documentos / Contexto Anexado ---\n${context.slice(0, MAX_CONTEXT_CHARS)}${context.length > MAX_CONTEXT_CHARS ? "\n[... truncado ...]" : ""}`
    : message;

  const formData = new FormData();
  formData.append("channel_id", agent.channelId);
  formData.append("thread_id", threadId);
  formData.append("user_info", "{}");
  formData.append("message", fullMessage);

  const upstream = await fetch(agent.endpoint, {
    method: "POST",
    headers: { "x-api-key": apiKey },
    body: formData,
  });

  if (!upstream.ok) {
    return new Response(
      JSON.stringify({ error: `Upstream error: ${upstream.status}` }),
      { status: upstream.status, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
