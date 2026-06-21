import dynamic from "next/dynamic";

const ChatLayout = dynamic(
  () => import("@/components/chat/ChatLayout").then((m) => m.ChatLayout),
  { ssr: false }
);

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatLayout conversationId={id} />;
}
