import { NextRequest } from "next/server";

// PDF parsing is now done client-side with pdfjs-dist.
// This route only handles URL text extraction.

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

  try {
    console.log("[extract] Fetching URL:", body.url);
    const res = await fetch(body.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; iaedu-bot/1.0)" },
    });
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000);
    console.log("[extract] Done, text length:", text.length);
    return Response.json({ text });
  } catch (err) {
    console.error("[extract] URL fetch error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
