import { NextResponse } from "next/server";
import { z } from "zod";
import { Bot } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import { requirePermission } from "@/server/auth/guards";
import { permissions } from "@/server/permissions/permissions";

const schema = z.object({
  name: z.string().min(2),
  avatar: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    const session = await requirePermission(permissions.aiManage);
    const body = schema.parse(await request.json());
    await connectToDatabase();
    const bot = await Bot.create({
      ...body,
      tenantId: session.user.tenantId,
      isActive: body.isActive ?? true
    });
    return NextResponse.json({ id: bot._id.toString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر إنشاء البوت.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
