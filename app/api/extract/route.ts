import { NextRequest } from "next/server";
import { getDocumentProxy, extractText } from "unpdf";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  // PDF upload
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    try {
      console.log("[extract] Parsing PDF:", file.name, file.size, "bytes");
      const buffer = await file.arrayBuffer();
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      console.log("[extract] PDF parsed, text length:", text.length);
      return Response.json({ text });
    } catch (err) {
      console.error("[extract] PDF parse error:", err);
      return Response.json({ error: String(err) }, { status: 500 });
    }
  }

  // URL extraction
  let body: { url?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body?.url) {
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
      console.log("[extract] URL fetched, text length:", text.length);
      return Response.json({ text });
    } catch (err) {
      console.error("[extract] URL fetch error:", err);
      return Response.json({ error: String(err) }, { status: 500 });
    }
  }

  return Response.json({ error: "Provide a file or url" }, { status: 400 });
}
