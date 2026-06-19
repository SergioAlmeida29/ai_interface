"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { Paperclip, Link, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileAttachment, type Attachment } from "./FileAttachment";

interface MessageInputProps {
  onSend: (message: string, attachment?: Attachment) => void;
  disabled: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [urlInput, setUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [loadingAttachment, setLoadingAttachment] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;
    onSend(trimmed || "(ver anexo)", attachment ?? undefined);
    setText("");
    setAttachment(null);
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingAttachment(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const { text } = await res.json();
      setAttachment({ type: "file", name: file.name, text });
    } finally {
      setLoadingAttachment(false);
      e.target.value = "";
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlValue.trim()) return;
    setLoadingAttachment(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlValue.trim() }),
      });
      const { text } = await res.json();
      const hostname = new URL(urlValue).hostname;
      setAttachment({ type: "url", name: hostname, text });
      setUrlInput(false);
      setUrlValue("");
    } finally {
      setLoadingAttachment(false);
    }
  };

  return (
    <div className="border-t bg-background px-4 py-3 space-y-2">
      {attachment && (
        <div className="flex items-center gap-2">
          <FileAttachment attachment={attachment} onRemove={() => setAttachment(null)} />
        </div>
      )}

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
          <Button size="sm" onClick={handleUrlSubmit} disabled={loadingAttachment}>
            {loadingAttachment ? "A carregar..." : "Adicionar"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setUrlInput(false)}>
            Cancelar
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            onClick={() => fileRef.current?.click()}
            disabled={disabled || loadingAttachment}
            title="Anexar PDF"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            onClick={() => setUrlInput((v) => !v)}
            disabled={disabled || loadingAttachment}
            title="Adicionar URL"
          >
            <Link className="w-4 h-4" />
          </Button>
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escreve uma mensagem... (Enter para enviar, Shift+Enter para nova linha)"
          className="flex-1 min-h-[40px] max-h-40 resize-none text-sm"
          rows={1}
          disabled={disabled}
        />

        <Button
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !attachment)}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
