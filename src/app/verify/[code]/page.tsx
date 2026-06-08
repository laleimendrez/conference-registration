import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { CheckInButton } from "@/components/CheckInButton";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const [{ code }, session] = await Promise.all([params, getSession()]);
  const reg = await prisma.eventRegistration.findUnique({
    where: { qrCode: code },
    include: { event: true },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6fb] p-6">
      <div className="glass-card w-full max-w-md rounded-3xl p-8">
        <p className="section-kicker">QR verification</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950">Registration verification</h1>
        {!reg ? (
          <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            Invalid or unknown QR code.
          </p>
        ) : (
          <div className="mt-6 space-y-3 text-sm">
            <p>
              <span className="text-slate-500">Event:</span>{" "}
              <strong>{reg.event.name}</strong>
            </p>
            <p>
              <span className="text-slate-500">Attendee:</span> {reg.attendeeName}
            </p>
            <p>
              <span className="text-slate-500">Email:</span> {reg.attendeeEmail}
            </p>
            <p>
              <span className="text-slate-500">Code:</span>{" "}
              <span className="font-mono">{reg.qrCode}</span>
            </p>
            <p>
              <span className="text-slate-500">Attendance:</span>{" "}
              <strong>{reg.checkedIn ? "Checked in" : "Not checked in"}</strong>
            </p>
            <StatusBadge status={reg.status} />
            {reg.status === "APPROVED" && (
              <p className="mt-4 rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-700">
                Valid for event entry.
              </p>
            )}
            {session?.role === "ADMIN" && reg.status === "APPROVED" && (
              <CheckInButton registrationId={reg.id} checkedIn={reg.checkedIn} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
