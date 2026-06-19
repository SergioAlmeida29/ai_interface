"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { AGENTS } from "@/lib/agents";
import { readStream } from "@/lib/streaming";
import { ModelSelector } from "./ModelSelector";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { Button } from "@/components/ui/button";
import { SquarePen } from "lucide-react";

export interface Attachment {
  type: "file" | "url";
  name: string;
  text: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Pick<Attachment, "name" | "type">[];
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentId, setAgentId] = useState(AGENTS[0].id);
  const [threadId, setThreadId] = useState(() => uuidv4());
  const [isStreaming, setIsStreaming] = useState(false);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setThreadId(uuidv4());
  }, []);

  const sendMessage = useCallback(
    async (text: string, attachments: Attachment[]) => {
      if (isStreaming) return;

      const context = attachments.length > 0
        ? attachments.map((a) => `[${a.name}]\n${a.text}`).join("\n\n---\n\n")
        : null;

      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content: text,
        attachments: attachments.map(({ name, type }) => ({ name, type })),
      };

      // Assign a stable ID to the assistant reply so we can update it by ID
      const assistantId = uuidv4();
      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setIsStreaming(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, agentId, threadId, context }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Erro desconhecido");
        }

        await readStream(res, (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m
            )
          );
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao contactar a API.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: `Erro: ${msg}` } : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [agentId, threadId, isStreaming]
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="font-semibold text-base tracking-tight">iaedu</h1>
        <div className="flex items-center gap-2">
          <ModelSelector value={agentId} onChange={(v) => v && setAgentId(v)} />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={startNewChat}
            title="Nova conversa"
          >
            <SquarePen className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <MessageList messages={messages} isStreaming={isStreaming} />
      <MessageInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
