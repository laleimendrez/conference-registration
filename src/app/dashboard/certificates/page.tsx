import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CertificateRequestForm } from "@/components/CertificateRequestForm";
import { StatusBadge } from "@/components/StatusBadge";
import { EVENT_CERT_LABELS } from "@/lib/constants";

function formatDate(value: Date | null) {
  if (!value) return "Not yet issued";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function CertificatesPage() {
  const session = await getSession();
  if (!session) return null;

  const [events, requests] = await Promise.all([
    prisma.event.findMany({ where: { active: true }, select: { id: true, name: true } }),
    prisma.eventCertificateRequest.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const grouped = requests.reduce<
    Record<
      string,
      {
        title: string;
        recipientName: string;
        paperTitle: string | null;
        latestStatus: string;
        latestUpdatedAt: Date;
        issuedRequestId: string | null;
        logs: {
          id: string;
          status: string;
          createdAt: Date;
          updatedAt: Date;
          issuedAt: Date | null;
        }[];
      }
    >
  >((acc, request) => {
    const key = [request.type, request.recipientName, request.paperTitle ?? ""].join("|");
    const existing = acc[key];
    const log = {
      id: request.id,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      issuedAt: request.issuedAt,
    };

    if (!existing) {
      acc[key] = {
        title: EVENT_CERT_LABELS[request.type],
        recipientName: request.recipientName,
        paperTitle: request.paperTitle,
        latestStatus: request.status,
        latestUpdatedAt: request.updatedAt,
        issuedRequestId: request.status === "ISSUED" ? request.id : null,
        logs: [log],
      };
      return acc;
    }

    existing.logs.push(log);
    if (request.updatedAt > existing.latestUpdatedAt) {
      existing.latestStatus = request.status;
      existing.latestUpdatedAt = request.updatedAt;
    }
    if (request.status === "ISSUED") {
      existing.issuedRequestId = request.id;
    }
    return acc;
  }, {});

  const certificateLogs = Object.values(grouped);

  return (
    <div className="space-y-8">
      <section>
        <p className="section-kicker">Certificates</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Certificate logs</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Request and track certificate progress in one organized log. Pending,
          approved, issued, and rejected updates are grouped by certificate record.
        </p>
      </section>

      <CertificateRequestForm eventOptions={events} />

      <section>
        <h2 className="mb-4 text-xl font-black text-slate-950">Your certificate logs</h2>
        {certificateLogs.length === 0 ? (
          <div className="dashboard-card p-5 text-sm text-slate-600">
            No certificate requests yet. Submit a request above when you are ready.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {certificateLogs.map((log) => (
              <article key={`${log.title}-${log.recipientName}-${log.paperTitle ?? ""}`} className="dashboard-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-950">{log.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{log.recipientName}</p>
                    {log.paperTitle && <p className="mt-1 text-xs text-slate-500">Paper: {log.paperTitle}</p>}
                  </div>
                  <StatusBadge status={log.latestStatus} />
                </div>

                <div className="mt-4 space-y-2">
                  {log.logs.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <StatusBadge status={entry.status} />
                        <span className="font-semibold text-slate-500">Updated {formatDate(entry.updatedAt)}</span>
                      </div>
                      <p className="mt-2 text-slate-500">Requested {formatDate(entry.createdAt)}</p>
                      {entry.issuedAt && <p className="text-slate-500">Issued {formatDate(entry.issuedAt)}</p>}
                    </div>
                  ))}
                </div>

                {log.issuedRequestId && (
                  <a
                    href={`/api/certificates/event/${log.issuedRequestId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700"
                  >
                    Open issued certificate
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
