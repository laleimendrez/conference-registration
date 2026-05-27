import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { formatApiError, parseProofBase64, parseTransactionDate } from "@/lib/payment";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  eventId: z.string().min(1),
  attendeeName: z.string().min(2),
  attendeeEmail: z.string().email(),
  organization: z.string().optional(),
  paperTitle: z.string().optional(),
  method: z.enum(["BANK", "EWALLET"]),
  transactionDate: z.string().min(1),
  transactionNo: z.string().min(3),
  amount: z.coerce.number().positive(),
  paymentFor: z.string().min(3),
  payeeName: z.string().optional(),
  proofBase64: z.string().min(1),
  proofFileName: z.string().min(1),
  proofMimeType: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = schema.parse(await req.json());
    const event = await prisma.event.findUnique({ where: { id: body.eventId } });
    if (!event?.active) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { proofData, proofMimeType, proofFileName } = parseProofBase64(
      body.proofBase64,
      body.proofMimeType,
      body.proofFileName,
    );
    const transactionDate = parseTransactionDate(body.transactionDate);

    const qrCode = `REG-${uuidv4().slice(0, 8).toUpperCase()}`;

    const result = await prisma.$transaction(async (tx) => {
      const reg = await tx.eventRegistration.upsert({
        where: { userId_eventId: { userId: session.id, eventId: body.eventId } },
        create: {
          userId: session.id,
          eventId: body.eventId,
          type: "CONFIRMED",
          status: "PAYMENT_SUBMITTED",
          qrCode,
          attendeeName: body.attendeeName,
          attendeeEmail: body.attendeeEmail,
          organization: body.organization,
          paperTitle: body.paperTitle,
        },
        update: {
          type: "CONFIRMED",
          status: "PAYMENT_SUBMITTED",
          attendeeName: body.attendeeName,
          attendeeEmail: body.attendeeEmail,
          organization: body.organization,
          paperTitle: body.paperTitle,
        },
      });

      const payment = await tx.paymentSubmission.upsert({
        where: { registrationId: reg.id },
        create: {
          userId: session.id,
          registrationId: reg.id,
          method: body.method,
          status: "PENDING",
          transactionDate,
          transactionNo: body.transactionNo.trim(),
          amount: body.amount,
          paymentFor: body.paymentFor.trim(),
          payeeName: body.payeeName?.trim() || null,
          proofFileName,
          proofMimeType,
          proofData,
        },
        update: {
          method: body.method,
          status: "PENDING",
          transactionDate,
          transactionNo: body.transactionNo.trim(),
          amount: body.amount,
          paymentFor: body.paymentFor.trim(),
          payeeName: body.payeeName?.trim() || null,
          proofFileName,
          proofMimeType,
          proofData,
          reviewedAt: null,
          adminNotes: null,
        },
      });

      return { reg, payment };
    });

    return NextResponse.json({
      ok: true,
      registration: result.reg,
      payment: { id: result.payment.id, status: result.payment.status },
    });
  } catch (e) {
    return NextResponse.json(
      { error: formatApiError(e, "Payment submission failed") },
      { status: 400 },
    );
  }
}
