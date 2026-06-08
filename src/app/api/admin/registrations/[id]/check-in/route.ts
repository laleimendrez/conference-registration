import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const registration = await prisma.eventRegistration.update({
      where: { id },
      data: { checkedIn: true },
    });
    return NextResponse.json({ registration });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Check-in failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
