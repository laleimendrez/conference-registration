import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { EventRegistrationForms } from "@/components/EventRegistrationForms";
import { StatusBadge } from "@/components/StatusBadge";
import { buildQrPayload, generateQrDataUrl } from "@/lib/qr";

export default async function EventsPage() {
  const session = await getSession();
  if (!session) return null;

  const [events, registrations] = await Promise.all([
    prisma.event.findMany({ where: { active: true }, orderBy: { startDate: "asc" } }),
    prisma.eventRegistration.findMany({
      where: { userId: session.id },
      include: { event: true, payment: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const regsWithQr = await Promise.all(
    registrations
      .filter((r) => r.status === "APPROVED")
      .map(async (r) => ({
        ...r,
        qrDataUrl: await generateQrDataUrl(buildQrPayload(r.id, r.qrCode)),
      })),
  );

  return (
    <div className="space-y-8">
      <section>
        <p className="section-kicker">Events</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Event registration</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Register early for instant QR preparation or submit payment proof for
          administrator verification.
        </p>
      </section>

      <EventRegistrationForms events={events} />

      <section>
        <h2 className="mb-4 text-xl font-black text-slate-950">Your registrations</h2>
        {registrations.length === 0 ? (
          <div className="dashboard-card p-5 text-sm text-slate-600">
            No registrations yet. Start by submitting an event registration above.
          </div>
        ) : (
          <div className="space-y-5">
            {registrations.map((registration) => {
              const qr = regsWithQr.find((item) => item.id === registration.id);
              return (
                <div key={registration.id} className="dashboard-card p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-black text-slate-950">{registration.event.name}</span>
                    <StatusBadge status={registration.status} />
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-mono text-slate-500">
                      {registration.qrCode}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {registration.attendeeName} - {registration.type}
                    {registration.payment && ` - Payment: ${registration.payment.status}`}
                  </p>
                  {qr && (
                    <div className="mt-4 flex flex-col items-start gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qr.qrDataUrl} alt="Registration QR" className="w-40 rounded-xl border bg-white p-2" />
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/verify/${registration.qrCode}`}
                          className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700"
                        >
                          Open verification
                        </a>
                        <a
                          href={`/api/registrations/ticket/${registration.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-700"
                        >
                          Open QR ticket
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
