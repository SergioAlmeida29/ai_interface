import { NextRequest } from "next/server";
import { getAgentById, getAgentApiKey } from "@/lib/agents";

export async function POST(req: NextRequest) {
  const { message, agentId, threadId, context } = await req.json();

  console.log("[chat] →", { agentId, threadId, messageLength: message?.length, hasContext: !!context });

  const agent = getAgentById(agentId);
  if (!agent) {
    console.error("[chat] Unknown agentId:", agentId);
    return new Response(JSON.stringify({ error: "Invalid agent" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let apiKey: string;
  try {
    apiKey = getAgentApiKey(agent);
  } catch (err) {
    console.error("[chat] Missing API key for", agent.envKey, err);
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

  console.log("[chat] fullMessage length:", fullMessage.length);

  const formData = new FormData();
  formData.append("channel_id", agent.channelId);
  formData.append("thread_id", threadId);
  formData.append("user_info", "{}");
  formData.append("message", fullMessage);

  console.log("[chat] Calling upstream:", agent.endpoint);

  const upstream = await fetch(agent.endpoint, {
    method: "POST",
    headers: { "x-api-key": apiKey },
    body: formData,
  });

  console.log("[chat] Upstream response:", upstream.status, upstream.headers.get("Content-Type"));

  if (!upstream.ok) {
    const text = await upstream.text();
    console.error("[chat] Upstream error body:", text);
    return new Response(
      JSON.stringify({ error: `Upstream error: ${upstream.status}`, detail: text }),
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
