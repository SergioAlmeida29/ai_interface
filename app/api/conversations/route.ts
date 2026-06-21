import { db } from "@/lib/db";

export async function GET() {
  const conversations = await db.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, agentId: true, updatedAt: true },
  });
  return Response.json(conversations);
}

export async function POST(req: Request) {
  const { threadId, title, agentId } = await req.json();
  const conversation = await db.conversation.create({
    data: { threadId, title: title || "Nova conversa", agentId },
  });
  return Response.json(conversation, { status: 201 });
}
