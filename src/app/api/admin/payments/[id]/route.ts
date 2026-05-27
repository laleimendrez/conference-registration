import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildQrPayload, generateQrDataUrl } from "@/lib/qr";
import { membershipDatesOnApproval } from "@/lib/membership-dates";
import { formatApiError } from "@/lib/payment";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  adminNotes: z.string().optional(),
  kind: z.enum(["event", "membership"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json());

    if (body.kind === "event") {
      const payment = await prisma.paymentSubmission.findUnique({
        where: { id },
        include: { registration: true },
      });
      if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const status = body.action === "approve" ? "APPROVED" : "REJECTED";
      await prisma.$transaction([
        prisma.paymentSubmission.update({
          where: { id },
          data: { status, adminNotes: body.adminNotes, reviewedAt: new Date() },
        }),
        prisma.eventRegistration.update({
          where: { id: payment.registrationId },
          data: {
            status: body.action === "approve" ? "APPROVED" : "REJECTED",
          },
        }),
      ]);

      if (body.action === "approve") {
        const payload = buildQrPayload(payment.registrationId, payment.registration.qrCode);
        const qrDataUrl = await generateQrDataUrl(payload);
        return NextResponse.json({ ok: true, qrDataUrl });
      }
      return NextResponse.json({ ok: true });
    }

    const payment = await prisma.membershipPayment.findUnique({
      where: { id },
      include: { membership: true },
    });
    if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const status = body.action === "approve" ? "APPROVED" : "REJECTED";
    await prisma.membershipPayment.update({
      where: { id },
      data: { status, adminNotes: body.adminNotes, reviewedAt: new Date() },
    });

    if (body.action === "approve") {
      const { startDate, expiryDate } = membershipDatesOnApproval(
        payment.membership,
        payment.membership.type,
        payment.isRenewal,
      );
      await prisma.membership.update({
        where: { id: payment.membershipId },
        data: {
          status: "ACTIVE",
          startDate,
          expiryDate,
          renewalSent: false,
        },
      });
    } else {
      const mem = payment.membership;
      if (mem.status === "PENDING_PAYMENT") {
        const otherPending = await prisma.membershipPayment.count({
          where: {
            membershipId: mem.id,
            status: "PENDING",
            id: { not: payment.id },
          },
        });
        if (otherPending === 0) {
          await prisma.membership.update({
            where: { id: mem.id },
            data: { status: "PENDING_PAYMENT" },
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: formatApiError(e, "Update failed") },
      { status: 400 },
    );
  }
}
