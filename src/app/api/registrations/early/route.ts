import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildQrPayload, generateQrDataUrl } from "@/lib/qr";

const schema = z.object({
  eventId: z.string(),
  attendeeName: z.string().min(2),
  attendeeEmail: z.string().email(),
  organization: z.string().optional(),
  paperTitle: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = schema.parse(await req.json());
    const event = await prisma.event.findUnique({ where: { id: body.eventId } });
    if (!event?.active) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const qrCode = `REG-${uuidv4().slice(0, 8).toUpperCase()}`;
    const reg = await prisma.eventRegistration.upsert({
      where: { userId_eventId: { userId: session.id, eventId: body.eventId } },
      create: {
        userId: session.id,
        eventId: body.eventId,
        type: "EARLY",
        status: "APPROVED",
        qrCode,
        attendeeName: body.attendeeName,
        attendeeEmail: body.attendeeEmail,
        organization: body.organization,
        paperTitle: body.paperTitle,
      },
      update: {
        type: "EARLY",
        status: "APPROVED",
        attendeeName: body.attendeeName,
        attendeeEmail: body.attendeeEmail,
        organization: body.organization,
        paperTitle: body.paperTitle,
      },
    });

    const payload = buildQrPayload(reg.id, reg.qrCode);
    const qrDataUrl = await generateQrDataUrl(payload);

    return NextResponse.json({
      registration: reg,
      qrDataUrl,
      verifyUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/verify/${reg.qrCode}`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Registration failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
