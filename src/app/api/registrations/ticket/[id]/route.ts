import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildQrPayload, generateQrDataUrl } from "@/lib/qr";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  const { id } = await params;
  const registration = await prisma.eventRegistration.findUnique({
    where: { id },
    include: { event: true },
  });

  if (!registration) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }
  if (registration.userId !== session.id && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (registration.status !== "APPROVED") {
    return NextResponse.json({ error: "Registration is not approved yet" }, { status: 400 });
  }

  const qrDataUrl = await generateQrDataUrl(
    buildQrPayload(registration.id, registration.qrCode),
  );
  const eventDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    registration.event.startDate,
  );

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Event Ticket - ${escapeHtml(registration.attendeeName)}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #eef2ff; font-family: Arial, sans-serif; color: #0f172a; }
    .ticket { width: min(760px, calc(100vw - 32px)); background: white; border: 1px solid #c7d2fe; border-radius: 28px; overflow: hidden; box-shadow: 0 30px 80px rgba(79,70,229,.2); }
    .top { background: linear-gradient(135deg, #6366f1, #ec4899); color: white; padding: 34px; }
    .kicker { text-transform: uppercase; letter-spacing: .2em; font-weight: 800; font-size: 12px; opacity: .82; }
    h1 { margin: 12px 0 0; font-size: 34px; }
    .body { display: grid; gap: 26px; grid-template-columns: 1fr 220px; padding: 34px; align-items: center; }
    .label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; font-weight: 800; }
    p { margin: 8px 0 20px; font-size: 18px; font-weight: 800; }
    img { width: 220px; border: 1px solid #e2e8f0; border-radius: 18px; padding: 12px; }
    @media (max-width: 640px) { .body { grid-template-columns: 1fr; } img { width: 100%; max-width: 260px; } }
    @media print { body { background: white; } .ticket { box-shadow: none; } }
  </style>
</head>
<body>
  <main class="ticket">
    <section class="top">
      <div class="kicker">Conference Portal QR Ticket</div>
      <h1>${escapeHtml(registration.event.name)}</h1>
    </section>
    <section class="body">
      <div>
        <div class="label">Attendee</div>
        <p>${escapeHtml(registration.attendeeName)}</p>
        <div class="label">Event date</div>
        <p>${escapeHtml(eventDate)}</p>
        <div class="label">QR code</div>
        <p>${escapeHtml(registration.qrCode)}</p>
        <div class="label">Status</div>
        <p>${registration.checkedIn ? "Checked in" : "Approved for entry"}</p>
      </div>
      <img src="${qrDataUrl}" alt="Registration QR code" />
    </section>
  </main>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
