import { NextRequest } from "next/server";

// PDF parsing is done client-side with pdfjs-dist.
// This route only handles URL text extraction.

const BLOCKED_PATTERNS = [
  /^localhost/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,   // AWS/GCP metadata
  /^::1$/,
  /^0\.0\.0\.0/,
  /^fd[0-9a-f]{2}:/i, // IPv6 private
];

function isBlockedUrl(raw: string): boolean {
  try {
    const { hostname, protocol } = new URL(raw);
    if (protocol !== "http:" && protocol !== "https:") return true;
    return BLOCKED_PATTERNS.some((p) => p.test(hostname));
  } catch {
    return true;
  }
}

export async function POST(req: NextRequest) {
  let body: { url?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.url) {
    return Response.json({ error: "Provide a url" }, { status: 400 });
  }

  if (isBlockedUrl(body.url)) {
    return Response.json({ error: "URL not allowed" }, { status: 400 });
  }

  try {
    const res = await fetch(body.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; iaedu-bot/1.0)" },
    });

    if (!res.ok) {
      return Response.json(
        { error: `Page returned ${res.status}` },
        { status: 400 }
      );
    }

    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000);
    return Response.json({ text });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
