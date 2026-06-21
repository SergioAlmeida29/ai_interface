import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await ctx.params;

  // Verify conversation belongs to this user before adding messages
  const owns = await db.conversation.findFirst({
    where: { id: conversationId, userId: user.id },
    select: { id: true },
  });
  if (!owns) return Response.json({ error: "Not found" }, { status: 404 });

  const { role, content, attachments } = await req.json();
  const message = await db.message.create({
    data: { conversationId, role, content, attachments: attachments ?? undefined },
  });
  return Response.json(message, { status: 201 });
}
