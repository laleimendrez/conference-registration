import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EVENT_CERT_LABELS } from "@/lib/constants";

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
  const certificate = await prisma.eventCertificateRequest.findUnique({ where: { id } });

  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }
  if (certificate.userId !== session.id && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (certificate.status !== "ISSUED") {
    return NextResponse.json({ error: "Certificate is not issued yet" }, { status: 400 });
  }

  const typeLabel = EVENT_CERT_LABELS[certificate.type];
  const issued = certificate.issuedAt ?? certificate.updatedAt;
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(typeLabel)} - ${escapeHtml(certificate.recipientName)}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #eef2ff; font-family: Arial, sans-serif; color: #0f172a; }
    .certificate { width: min(960px, calc(100vw - 32px)); min-height: 620px; background: white; border: 14px solid #6366f1; padding: 56px; text-align: center; box-shadow: 0 30px 80px rgba(79,70,229,.22); }
    .kicker { color: #6366f1; text-transform: uppercase; letter-spacing: .22em; font-weight: 800; font-size: 13px; }
    h1 { font-size: 44px; margin: 22px 0 10px; }
    .recipient { font-size: 38px; font-weight: 900; margin: 36px 0 12px; color: #4f46e5; }
    p { line-height: 1.7; font-size: 17px; }
    .meta { margin-top: 46px; color: #475569; font-size: 14px; }
    @media print { body { background: white; } .certificate { box-shadow: none; width: auto; } }
  </style>
</head>
<body>
  <main class="certificate">
    <div class="kicker">Conference Portal</div>
    <h1>${escapeHtml(typeLabel)}</h1>
    <p>This certificate is proudly issued to</p>
    <div class="recipient">${escapeHtml(certificate.recipientName)}</div>
    <p>
      for the approved conference record${certificate.paperTitle ? ` related to <strong>${escapeHtml(certificate.paperTitle)}</strong>` : ""}.
    </p>
    <p class="meta">Issued ${issued.toLocaleDateString()} | Certificate ID: ${escapeHtml(certificate.id)}</p>
  </main>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
