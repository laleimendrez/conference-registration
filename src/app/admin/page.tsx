import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminPanel } from "@/components/AdminPanel";
import { DashboardNav } from "@/components/DashboardNav";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const [eventPayments, membershipPayments, certificates, membershipCount] =
    await Promise.all([
      prisma.paymentSubmission.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { registration: true },
      }),
      prisma.membershipPayment.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { membership: true },
      }),
      prisma.eventCertificateRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.membership.count(),
    ]);

  return (
    <div className="dashboard-shell dashboard-layout">
      <DashboardNav user={session} />
      <main className="w-full px-5 py-8 md:px-8 md:py-10">
        <section className="mb-8">
          <p className="section-kicker">Admin console</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Operations control center</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Review payments, issue certificates, and manage renewal reminders.
            Total memberships in database: <strong>{membershipCount}</strong>.
          </p>
        </section>

        <AdminPanel
          eventPayments={eventPayments.map((payment) => ({
            id: payment.id,
            transactionNo: payment.transactionNo,
            amount: payment.amount.toString(),
            status: payment.status,
            payeeName: payment.payeeName,
            registration: {
              attendeeName: payment.registration.attendeeName,
              qrCode: payment.registration.qrCode,
            },
            createdAt: payment.createdAt.toISOString(),
            reviewedAt: payment.reviewedAt?.toISOString() ?? null,
          }))}
          membershipPayments={membershipPayments.map((payment) => ({
            id: payment.id,
            transactionNo: payment.transactionNo,
            amount: payment.amount.toString(),
            status: payment.status,
            isRenewal: payment.isRenewal,
            membership: { memberId: payment.membership.memberId },
            createdAt: payment.createdAt.toISOString(),
            reviewedAt: payment.reviewedAt?.toISOString() ?? null,
          }))}
          certificates={certificates.map((certificate) => ({
            id: certificate.id,
            type: certificate.type,
            status: certificate.status,
            recipientName: certificate.recipientName,
            paperTitle: certificate.paperTitle,
            createdAt: certificate.createdAt.toISOString(),
            updatedAt: certificate.updatedAt.toISOString(),
            issuedAt: certificate.issuedAt?.toISOString() ?? null,
          }))}
        />
      </main>
    </div>
  );
}
