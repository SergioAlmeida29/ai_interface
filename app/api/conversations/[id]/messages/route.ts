import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id: conversationId } = await ctx.params;
  const { role, content, attachments } = await req.json();
  const message = await db.message.create({
    data: { conversationId, role, content, attachments: attachments ?? undefined },
  });
  return Response.json(message, { status: 201 });
}
