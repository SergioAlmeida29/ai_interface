import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const conversation = await db.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(conversation);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { title } = await req.json();
  const conversation = await db.conversation.update({
    where: { id },
    data: { title },
  });
  return Response.json(conversation);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await db.conversation.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
