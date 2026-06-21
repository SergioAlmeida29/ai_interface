import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

async function getAuthedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getAuthedUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const conversation = await db.conversation.findFirst({
    where: { id, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(conversation);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getAuthedUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { title } = await req.json();
  const conversation = await db.conversation.updateMany({
    where: { id, userId: user.id },
    data: { title },
  });
  if (conversation.count === 0)
    return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getAuthedUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  await db.conversation.deleteMany({ where: { id, userId: user.id } });
  return new Response(null, { status: 204 });
}
