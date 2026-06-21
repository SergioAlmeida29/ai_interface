import { ChatLayout } from "@/components/chat/ChatLayout";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatLayout conversationId={id} />;
}
