import dynamic from "next/dynamic";

const ChatLayout = dynamic(
  () => import("@/components/chat/ChatLayout").then((m) => m.ChatLayout),
  { ssr: false }
);

export default function Home() {
  return <ChatLayout conversationId={null} />;
}
