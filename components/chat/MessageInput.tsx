"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { Paperclip, Link, Send, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Attachment } from "./ChatInterface";

interface MessageInputProps {
  onSend: (message: string, attachments: Attachment[]) => void;
  disabled: boolean;
}

async function parsePdf(file: File): Promise<string> {
  // Lazy-load pdfjs only when needed
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    parts.push(
      content.items.map((item) => ("str" in item ? item.str : "")).join(" ")
    );
  }
  return parts.join("\n\n");
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [urlInput, setUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    onSend(trimmed || "(ver anexo)", attachments);
    setText("");
    setAttachments([]);
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setLoading(true);
    setLoadError(null);
    try {
      const newAttachments: Attachment[] = await Promise.all(
        files.map(async (file) => {
          const text = await parsePdf(file);
          return { type: "file" as const, name: file.name, text };
        })
      );
      setAttachments((prev) => [...prev, ...newAttachments]);
    } catch (err) {
      console.error("[pdf] Parse error:", err);
      setLoadError(`Erro ao ler PDF: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlValue.trim()) return;
    setLoading(true);
    setLoadError(null);
    try {
      // Ensure the URL has a protocol
      const raw = urlValue.trim();
      const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      const hostname = new URL(normalized).hostname;
      setAttachments((prev) => [
        ...prev,
        { type: "url" as const, name: hostname, text: data.text },
      ]);
      setUrlInput(false);
      setUrlValue("");
    } catch (err) {
      setLoadError(`Erro ao carregar URL: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t bg-background px-4 py-3 space-y-2">
      {/* Attachment badges */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {attachments.map((att, i) => (
            <Badge key={i} variant="secondary" className="flex items-center gap-1.5 pr-1 py-1 text-xs max-w-52">
              <span className="truncate">{att.type === "file" ? "📄" : "🔗"} {att.name}</span>
              <button
                onClick={() => removeAttachment(i)}
                className="ml-1 rounded hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Error message */}
      {loadError && (
        <p className="text-xs text-destructive">{loadError}</p>
      )}

      {/* URL input row */}
      {urlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://..."
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            className="flex-1 text-sm border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
          <Button size="sm" onClick={handleUrlSubmit} disabled={loading}>
            {loading ? "A carregar..." : "Adicionar"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setUrlInput(false); setUrlValue(""); }}>
            Cancelar
          </Button>
        </div>
      )}

      {/* Main input row */}
      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            onClick={() => fileRef.current?.click()}
            disabled={disabled || loading}
            title="Anexar PDF(s)"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            onClick={() => setUrlInput((v) => !v)}
            disabled={disabled || loading}
            title="Adicionar URL"
          >
            <Link className="w-4 h-4" />
          </Button>
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escreve uma mensagem... (Enter envia, Shift+Enter nova linha)"
          className="flex-1 min-h-[40px] max-h-40 resize-none text-sm"
          rows={1}
          disabled={disabled}
        />

        <Button
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleSend}
          disabled={disabled || loading || (!text.trim() && attachments.length === 0)}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
