"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
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

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

  const handleSelectConversation = useCallback((conv: ConversationItem) => {
    setSelectedConvId(conv.id);
    setSelectedThreadId(null); // ChatInterface will load threadId from DB
  }, []);

  const handleConversationCreated = useCallback((id: string, threadId: string) => {
    if (!id) {
      // New chat button pressed
      setSelectedConvId(null);
      setSelectedThreadId(null);
    } else {
      setSelectedConvId(id);
      setSelectedThreadId(threadId);
      setSidebarRefreshKey((k) => k + 1);
    }
  }, []);

  const handleMessagesChanged = useCallback(() => {
    setSidebarRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div className="w-64 shrink-0 hidden sm:flex">
          <ConversationSidebar
            selectedId={selectedConvId}
            onSelect={handleSelectConversation}
            refreshKey={sidebarRefreshKey}
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <ChatInterface
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          conversationId={selectedConvId}
          conversationThreadId={selectedThreadId}
          onConversationCreated={handleConversationCreated}
          onMessagesChanged={handleMessagesChanged}
        />
      </div>
    </div>
  );
}
