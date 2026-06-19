export type StreamChunkHandler = (chunk: string) => void;

interface NdjsonChunk {
  run_id: string;
  type: "start" | "token" | "message" | "done";
  content: string | object;
}

/**
 * Reads the iaedu.pt NDJSON stream.
 * Each line is a JSON object; only "token" type lines carry text content.
 *
 * Format:
 *   {"run_id":"...","type":"start","content":"Processing"}
 *   {"run_id":"...","type":"token","content":"Hello"}
 *   {"run_id":"...","type":"message","content":{...}} // full final message
 *   {"run_id":"...","type":"done","content":"..."}
 */
export async function readStream(
  response: Response,
  onChunk: StreamChunkHandler,
  onDone?: () => void
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let rawChunkCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const raw = decoder.decode(value, { stream: true });
    if (rawChunkCount === 0) {
      console.log("[stream] First raw chunk:", JSON.stringify(raw.slice(0, 300)));
    }
    rawChunkCount++;

    buffer += raw;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const parsed: NdjsonChunk = JSON.parse(trimmed);
        if (parsed.type === "token" && typeof parsed.content === "string") {
          onChunk(parsed.content);
        }
        // "start", "message", "done" are silently skipped
      } catch {
        // Fallback: not JSON, pass raw text
        console.log("[stream] Non-JSON line:", trimmed.slice(0, 100));
        onChunk(trimmed);
      }
    }
  }

  // Flush any remaining buffer
  if (buffer.trim()) {
    try {
      const parsed: NdjsonChunk = JSON.parse(buffer.trim());
      if (parsed.type === "token" && typeof parsed.content === "string") {
        onChunk(parsed.content);
      }
    } catch {
      onChunk(buffer.trim());
    }
  }

  console.log(`[stream] Done. Raw read() calls: ${rawChunkCount}`);
  onDone?.();
}
