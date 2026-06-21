"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, MessageSquare, LogOut, Link2 } from "lucide-react";
import { AGENTS } from "@/lib/agents";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface ConversationItem {
  id: string;
  title: string;
  agentId: string;
  updatedAt: string;
}

interface ConversationSidebarProps {
  selectedId: string | null;
  onSelect: (conv: ConversationItem) => void;
  refreshKey: number;
}

function agentLabel(agentId: string) {
  return AGENTS.find((a) => a.id === agentId)?.label ?? agentId;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function ConversationSidebar({
  selectedId,
  onSelect,
  refreshKey,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) setConversations(await res.json());
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function deleteConversation(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function handleLinkGoogle() {
    const supabase = createClient();
    await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  const hasGoogle = user?.identities?.some((i) => i.provider === "google");

  return (
    <aside className="flex flex-col h-full w-full bg-muted/40 border-r">
      <div className="px-3 py-3 border-b">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Conversas
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="text-xs text-muted-foreground px-3 py-4">
            Sem conversas guardadas.
          </p>
        ) : (
          <ul className="py-1">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  onClick={() => onSelect(conv)}
                  className={cn(
                    "group w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-muted transition-colors",
                    selectedId === conv.id && "bg-muted"
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate leading-snug">{conv.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {agentLabel(conv.agentId)} · {timeAgo(conv.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-opacity"
                    title="Apagar"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {user && (
        <div className="border-t px-3 py-3 space-y-2">
          <p className="text-xs text-muted-foreground truncate" title={user.email}>
            {user.email}
          </p>
          {!hasGoogle && (
            <button
              onClick={handleLinkGoogle}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Ligar conta Google"
            >
              <Link2 className="w-3 h-3" />
              Ligar conta Google
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Terminar sessão
          </button>
        </div>
      )}
    </aside>
  );
}
