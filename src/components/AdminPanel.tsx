"use client";

import { useState } from "react";

type EventPayment = {
  id: string;
  transactionNo: string;
  amount: string;
  status: string;
  payeeName: string | null;
  registration: { attendeeName: string; qrCode: string };
};

type MemPayment = {
  id: string;
  transactionNo: string;
  amount: string;
  status: string;
  isRenewal: boolean;
  membership: { memberId: string };
};

type Cert = {
  id: string;
  type: string;
  status: string;
  recipientName: string;
};

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
      setMsg(`${kind} payment ${action}d`);
      window.location.reload();
    }
  }

  async function reviewCert(id: string, action: "approve" | "issue" | "reject") {
    const res = await fetch(`/api/admin/certificates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) window.location.reload();
  }

  async function sendRenewals() {
    const res = await fetch("/api/admin/renewals", { method: "POST" });
    const data = await res.json();
    setMsg(`Renewal emails sent: ${data.sent ?? 0}`);
  }

  return (
    <div className="space-y-10">
      {msg && <p className="text-sm text-indigo-700">{msg}</p>}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Event payment verification</h2>
        </div>
        <div className="space-y-3">
          {eventPayments.map((p) => (
            <div key={p.id} className="p-4 bg-white rounded-xl border text-sm flex flex-wrap gap-3 justify-between">
              <div>
                <p className="font-semibold">{p.registration.attendeeName}</p>
                <p>
                  {p.transactionNo} · ₱{p.amount} · {p.status}
                </p>
                <a
                  href={`/api/payments/proof/${p.id}?kind=event`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  View proof
                </a>
              </div>
              {p.status === "PENDING" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-primary text-xs py-2"
                    onClick={() => reviewPayment(p.id, "approve", "event")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl border text-red-600 text-xs"
                    onClick={() => reviewPayment(p.id, "reject", "event")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
          {eventPayments.length === 0 && <p className="text-slate-500">No payments.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4">Membership payments</h2>
        <div className="space-y-3">
          {membershipPayments.map((p) => (
            <div key={p.id} className="p-4 bg-white rounded-xl border text-sm flex flex-wrap gap-3 justify-between">
              <div>
                <p className="font-semibold">{p.membership.memberId}</p>
                <p>
                  {p.transactionNo} · ₱{p.amount}
                  {p.isRenewal ? " (renewal)" : ""} · {p.status}
                </p>
                <a
                  href={`/api/payments/proof/${p.id}?kind=membership`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  View proof
                </a>
              </div>
              {p.status === "PENDING" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-primary text-xs py-2"
                    onClick={() => reviewPayment(p.id, "approve", "membership")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl border text-red-600 text-xs"
                    onClick={() => reviewPayment(p.id, "reject", "membership")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4">Certificate requests</h2>
        <div className="space-y-3">
          {certificates.map((c) => (
            <div key={c.id} className="p-4 bg-white rounded-xl border text-sm flex flex-wrap gap-2">
              <span className="font-semibold">{c.recipientName}</span>
              <span className="text-slate-500">{c.type}</span>
              <span className="badge badge-pending">{c.status}</span>
              {c.status === "PENDING" && (
                <>
                  <button type="button" className="text-indigo-600 text-xs" onClick={() => reviewCert(c.id, "approve")}>
                    Approve
                  </button>
                  <button type="button" className="text-green-600 text-xs" onClick={() => reviewCert(c.id, "issue")}>
                    Issue
                  </button>
                  <button type="button" className="text-red-600 text-xs" onClick={() => reviewCert(c.id, "reject")}>
                    Reject
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="p-6 bg-pink-50 rounded-2xl border border-pink-100">
        <h2 className="font-bold mb-2">Membership renewal emails</h2>
        <p className="text-sm text-slate-600 mb-4">
          Sends reminders to members expiring within 30 days (uses Resend if configured, else console log).
        </p>
        <button type="button" className="btn-primary" onClick={sendRenewals}>
          Send renewal notifications
        </button>
      </section>
    </div>
  );
}
