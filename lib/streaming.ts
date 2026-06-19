export type StreamChunkHandler = (chunk: string) => void;

interface NdjsonChunk {
  run_id: string;
  type: "start" | "token" | "message" | "done";
  content: string | object;
}

function extractToken(line: string): string | null {
  if (!line.trim()) return null;
  try {
    const parsed: NdjsonChunk = JSON.parse(line.trim());
    if (parsed.type === "token" && typeof parsed.content === "string") {
      return parsed.content;
    }
    return null;
  } catch {
    // Not valid JSON — pass raw text as fallback
    return line.trim();
  }
}

/**
 * Reads the iaedu.pt NDJSON stream.
 * Each line is a JSON object; only "token" type lines carry text content.
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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const token = extractToken(line);
      if (token) onChunk(token);
    }
  }

  // Flush remaining buffer
  if (buffer.trim()) {
    const token = extractToken(buffer);
    if (token) onChunk(token);
  }

  onDone?.();
}
