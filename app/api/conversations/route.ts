import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await db.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, agentId: true, updatedAt: true },
  });
  return Response.json(conversations);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { threadId, title, agentId } = await req.json();
  const conversation = await db.conversation.create({
    data: { threadId, title: title || "Nova conversa", agentId, userId: user.id },
  });
  return Response.json(conversation, { status: 201 });
}
