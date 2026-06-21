"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { AGENTS } from "@/lib/agents";
import { readStream } from "@/lib/streaming";
import { ModelSelector } from "./ModelSelector";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { Button } from "@/components/ui/button";
import { SquarePen, PanelLeftOpen, PanelLeftClose } from "lucide-react";

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

interface ChatInterfaceProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  conversationId: string | null;
  onConversationCreated: (id: string) => void;
  onMessagesChanged: () => void;
  onNewChat: () => void;
}

export function ChatInterface({
  sidebarOpen,
  onToggleSidebar,
  conversationId,
  onConversationCreated,
  onMessagesChanged,
  onNewChat,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentId, setAgentId] = useState(AGENTS[0].id);
  const [threadId, setThreadId] = useState(() => uuidv4());
  const [isStreaming, setIsStreaming] = useState(false);
  const prevConvId = useRef<string | null>(null);
  // Tracks the active conversation ID across messages (prop stays null on home page)
  const activeConvIdRef = useRef<string | null>(conversationId);

  // Load messages when switching to an existing conversation
  useEffect(() => {
    if (conversationId === prevConvId.current) return;
    prevConvId.current = conversationId;
    activeConvIdRef.current = conversationId;

    if (!conversationId) {
      setMessages([]);
      setThreadId(uuidv4());
      return;
    }

    fetch(`/api/conversations/${conversationId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) {
          setMessages(
            data.messages.map(
              (m: { id: string; role: string; content: string; attachments?: unknown }) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
                attachments: Array.isArray(m.attachments) ? m.attachments : undefined,
              })
            )
          );
        }
        if (data.agentId) setAgentId(data.agentId);
        if (data.threadId) setThreadId(data.threadId);
      })
      .catch(() => {});
  }, [conversationId]);

  const sendMessage = useCallback(
    async (text: string, attachments: Attachment[]) => {
      if (isStreaming) return;

      const context =
        attachments.length > 0
          ? attachments.map((a) => `[${a.name}]\n${a.text}`).join("\n\n---\n\n")
          : null;

      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content: text,
        attachments: attachments.map(({ name, type }) => ({ name, type })),
      };

      const assistantId = uuidv4();
      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setIsStreaming(true);

      // Resolve or create conversation in DB
      let convId = activeConvIdRef.current;
      const currentThreadId = threadId;

      if (!convId) {
        try {
          const title = text.slice(0, 60) + (text.length > 60 ? "…" : "");
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ threadId: currentThreadId, title, agentId }),
          });
          const conv = await res.json();
          convId = conv.id;
          activeConvIdRef.current = conv.id;
          onConversationCreated(conv.id);
        } catch {
          // non-fatal — continue without DB persistence
        }
      }

      // Save user message to DB
      if (convId) {
        fetch(`/api/conversations/${convId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "user",
            content: text,
            attachments: userMessage.attachments,
          }),
        }).catch(() => {});
      }

      let assistantContent = "";

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, agentId, threadId: currentThreadId, context }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Erro desconhecido");
        }

        await readStream(res, (chunk) => {
          assistantContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m
            )
          );
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao contactar a API.";
        assistantContent = `Erro: ${msg}`;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantContent } : m
          )
        );
      } finally {
        setIsStreaming(false);

        // Save assistant message to DB
        if (convId && assistantContent) {
          fetch(`/api/conversations/${convId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: "assistant", content: assistantContent }),
          }).catch(() => {});
        }

        onMessagesChanged();
      }
    },
    [agentId, threadId, isStreaming, onConversationCreated, onMessagesChanged]
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onToggleSidebar}
            title={sidebarOpen ? "Fechar sidebar" : "Abrir sidebar"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </Button>
          <h1 className="font-semibold text-base tracking-tight">iaedu</h1>
        </div>
        <div className="flex items-center gap-2">
          <ModelSelector value={agentId} onChange={(v) => v && setAgentId(v)} />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onNewChat}
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
