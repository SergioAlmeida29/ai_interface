"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Badge } from "@/components/ui/badge";
import type { Message } from "./ChatInterface";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  newMessageIds: Set<string>;
  isLoadingConv?: boolean;
}

export function MessageList({ messages, isStreaming, newMessageIds, isLoadingConv }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Começa uma conversa abaixo.
      </div>
    );
  }

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const lastAssistantId = lastAssistantMsg?.id;
  // Dots only while the current (last) assistant message has no content yet
  const lastAssistantHasContent = (lastAssistantMsg?.content.length ?? 0) > 0;

  return (
    <div
      className={`flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-6 transition-opacity duration-150 ${
        isLoadingConv ? "opacity-0" : "opacity-100"
      }`}
    >
      {messages.map((msg) =>
        msg.role === "assistant" && !msg.content ? null : (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} ${
              newMessageIds.has(msg.id)
                ? "animate-in fade-in slide-in-from-bottom-3 duration-300"
                : ""
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {msg.role === "user" && msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {msg.attachments.map((att, j) => (
                    <Badge
                      key={j}
                      variant="secondary"
                      className="text-xs opacity-80 max-w-[200px]"
                    >
                      <span className="mr-1">{att.type === "file" ? "📄" : "🔗"}</span>
                      <span className="truncate">{att.name}</span>
                    </Badge>
                  ))}
                </div>
              )}

              {msg.role === "assistant" ? (
                <ReactMarkdown
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const isBlock = !!match;
                      return isBlock ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-lg text-xs my-2"
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code
                          className="bg-black/20 rounded px-1 py-0.5 text-xs font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p({ children }) {
                      return <p className="mb-2 last:mb-0">{children}</p>;
                    },
                    ul({ children }) {
                      return <ul className="list-disc pl-4 mb-2">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal pl-4 mb-2">{children}</ol>;
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}

              {isStreaming && msg.id === lastAssistantId && (
                <span className="inline-block w-0.5 h-4 ml-0.5 bg-current align-middle animate-pulse" />
              )}
            </div>
          </div>
        )
      )}

      {isStreaming && !lastAssistantHasContent && (
        <div className="flex justify-start">
          <div className="bg-muted rounded-2xl px-4 py-3">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
