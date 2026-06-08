"use client";

import { useMemo, useState } from "react";
import { EVENT_CERT_LABELS } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";

type EventPayment = {
  id: string;
  transactionNo: string;
  amount: string;
  status: string;
  payeeName: string | null;
  registration: { attendeeName: string; qrCode: string };
  createdAt: string;
  reviewedAt: string | null;
};

type MemPayment = {
  id: string;
  transactionNo: string;
  amount: string;
  status: string;
  isRenewal: boolean;
  membership: { memberId: string };
  createdAt: string;
  reviewedAt: string | null;
};

type Cert = {
  id: string;
  type: keyof typeof EVENT_CERT_LABELS;
  status: string;
  recipientName: string;
  paperTitle: string | null;
  createdAt: string;
  updatedAt: string;
  issuedAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Not yet reviewed";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminPanel({
  eventPayments,
  membershipPayments,
  certificates,
}: {
  eventPayments: EventPayment[];
  membershipPayments: MemPayment[];
  certificates: Cert[];
}) {
  const [msg, setMsg] = useState("");

  const pendingCertificates = useMemo(
    () => certificates.filter((certificate) => certificate.status === "PENDING"),
    [certificates],
  );
  const completedCertificates = useMemo(
    () => certificates.filter((certificate) => certificate.status !== "PENDING"),
    [certificates],
  );

  async function reviewPayment(
    id: string,
    action: "approve" | "reject",
    kind: "event" | "membership",
  ) {
    const res = await fetch(`/api/admin/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, kind }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? `Failed to ${action} payment`);
    } else {
      setMsg(`${kind} payment ${action}d.`);
      window.location.reload();
    }
  }

  async function reviewCert(id: string, action: "approve" | "issue" | "reject") {
    const res = await fetch(`/api/admin/certificates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Certificate update failed.");
      return;
    }
    setMsg(`Certificate ${action}d.`);
    window.location.reload();
  }

  async function sendRenewals() {
    const res = await fetch("/api/admin/renewals", { method: "POST" });
    const data = await res.json();
    setMsg(`Renewal emails sent: ${data.sent ?? 0}.`);
  }

  return (
    <div className="space-y-8">
      {msg && (
        <div className="dashboard-card border-indigo-100 bg-indigo-50 p-4 text-sm font-bold text-indigo-800">
          {msg}
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-2">
        <PaymentSection
          title="Event payment verification"
          empty="No event payments to review."
          payments={eventPayments}
          kind="event"
          onReview={reviewPayment}
        />
        <PaymentSection
          title="Membership payments"
          empty="No membership payments to review."
          payments={membershipPayments}
          kind="membership"
          onReview={reviewPayment}
        />
      </section>

      <section className="dashboard-card p-5 md:p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="section-kicker">Certificates</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Certificate logs</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review pending requests and track approved, issued, or rejected certificates.
            </p>
          </div>
          <div className="flex gap-2 text-xs font-black">
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
              Pending {pendingCertificates.length}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              Completed {completedCertificates.length}
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {certificates.map((certificate) => (
            <article key={certificate.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-950">
                    {EVENT_CERT_LABELS[certificate.type] ?? certificate.type}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{certificate.recipientName}</p>
                  {certificate.paperTitle && (
                    <p className="mt-1 text-xs text-slate-500">Paper: {certificate.paperTitle}</p>
                  )}
                </div>
                <StatusBadge status={certificate.status} />
              </div>
              <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                <p>Requested: {formatDate(certificate.createdAt)}</p>
                <p>Updated: {formatDate(certificate.updatedAt)}</p>
                <p>Issued: {formatDate(certificate.issuedAt)}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {certificate.status === "PENDING" && (
                  <>
                    <button type="button" className="btn-primary px-3 py-2 text-xs" onClick={() => reviewCert(certificate.id, "approve")}>
                      Approve
                    </button>
                    <button type="button" className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600" onClick={() => reviewCert(certificate.id, "reject")}>
                      Reject
                    </button>
                  </>
                )}
                {(certificate.status === "PENDING" || certificate.status === "APPROVED") && (
                  <button type="button" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700" onClick={() => reviewCert(certificate.id, "issue")}>
                    Issue certificate
                  </button>
                )}
                {certificate.status === "ISSUED" && (
                  <a
                    href={`/api/certificates/event/${certificate.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700"
                  >
                    Open certificate
                  </a>
                )}
              </div>
            </article>
          ))}
          {certificates.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              No certificate requests yet.
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-card border-indigo-100 bg-indigo-50/80 p-6">
        <h2 className="text-xl font-black text-slate-950">Membership renewal emails</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Send reminders to members expiring within 30 days. If an email provider is not configured,
          the message is logged for development testing.
        </p>
        <button type="button" className="btn-primary mt-5" onClick={sendRenewals}>
          Send renewal notifications
        </button>
      </section>
    </div>
  );
}

function PaymentSection({
  title,
  empty,
  payments,
  kind,
  onReview,
}: {
  title: string;
  empty: string;
  payments: Array<EventPayment | MemPayment>;
  kind: "event" | "membership";
  onReview: (id: string, action: "approve" | "reject", kind: "event" | "membership") => void;
}) {
  return (
    <section className="dashboard-card p-5 md:p-6">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <div className="mt-5 space-y-3">
        {payments.map((payment) => {
          const isEvent = kind === "event";
          const eventPayment = payment as EventPayment;
          const membershipPayment = payment as MemPayment;
          return (
            <article key={payment.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-950">
                    {isEvent ? eventPayment.registration.attendeeName : membershipPayment.membership.memberId}
                  </h3>
                  <p className="mt-1 text-slate-600">
                    {payment.transactionNo} - PHP {payment.amount}
                    {!isEvent && membershipPayment.isRenewal ? " - Renewal" : ""}
                  </p>
                </div>
                <StatusBadge status={payment.status} />
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                <p>Submitted: {formatDate(payment.createdAt)}</p>
                <p>Reviewed: {formatDate(payment.reviewedAt)}</p>
                {isEvent && <p>QR code: {eventPayment.registration.qrCode}</p>}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a
                  href={`/api/payments/proof/${payment.id}?kind=${kind}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700"
                >
                  View proof
                </a>
                {payment.status === "PENDING" && (
                  <>
                    <button type="button" className="btn-primary px-3 py-2 text-xs" onClick={() => onReview(payment.id, "approve", kind)}>
                      Approve
                    </button>
                    <button type="button" className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600" onClick={() => onReview(payment.id, "reject", kind)}>
                      Reject
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
        {payments.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            {empty}
          </div>
        )}
      </div>
    </section>
  );
}
