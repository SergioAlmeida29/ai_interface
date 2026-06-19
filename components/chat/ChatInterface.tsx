"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { AGENTS } from "@/lib/agents";
import { readStream } from "@/lib/streaming";
import { ModelSelector } from "./ModelSelector";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import type { Attachment } from "./FileAttachment";
import { Button } from "@/components/ui/button";
import { SquarePen } from "lucide-react";

export interface Message {
  role: "user" | "assistant";
  content: string;
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
    async (text: string, attachment?: Attachment) => {
      if (isStreaming) return;

      const userMessage: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      const assistantPlaceholder: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantPlaceholder]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            agentId,
            threadId,
            context: attachment?.text ?? null,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Erro desconhecido");
        }

        await readStream(
          res,
          (chunk) => {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = {
                ...last,
                content: last.content + chunk,
              };
              return updated;
            });
          }
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro ao contactar a API.";
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `Erro: ${errorMsg}`,
          };
          return updated;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [agentId, threadId, isStreaming]
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
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

      {/* Messages */}
      <MessageList messages={messages} isStreaming={isStreaming} />

      {/* Input */}
      <MessageInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
