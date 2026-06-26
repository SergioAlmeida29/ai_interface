"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { ConversationItem } from "@/components/sidebar/ConversationSidebar";

const ChatInterface = dynamic(
  () => import("@/components/chat/ChatInterface").then((m) => m.ChatInterface),
  { ssr: false }
);

const ConversationSidebar = dynamic(
  () =>
    import("@/components/sidebar/ConversationSidebar").then(
      (m) => m.ConversationSidebar
    ),
  { ssr: false }
);

export function ChatLayout({
  conversationId,
}: {
  conversationId: string | null;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    conversationId
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectConversation = useCallback(
    (conv: ConversationItem) => {
      router.push(`/chat/${conv.id}`);
    },
    [router]
  );

  const handleConversationCreated = useCallback((id: string) => {
    // Update URL without triggering re-render so streaming continues
    window.history.replaceState(null, "", `/chat/${id}`);
    setSelectedConvId(id);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleNewChat = useCallback(() => {
    setSelectedConvId(null);
    window.history.pushState(null, "", "/");
  }, []);

  const handleMessagesChanged = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={`shrink-0 hidden sm:flex overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-64" : "w-0"
        }`}
      >
        <div className="w-64 min-w-64">
          <ConversationSidebar
            selectedId={selectedConvId}
            onSelect={handleSelectConversation}
            refreshKey={refreshKey}
          />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <ChatInterface
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          conversationId={selectedConvId}
          onConversationCreated={handleConversationCreated}
          onMessagesChanged={handleMessagesChanged}
          onNewChat={handleNewChat}
        />
      </div>
    </div>
  );
}
