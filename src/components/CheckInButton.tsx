"use client";

import { useState } from "react";

export function CheckInButton({
  registrationId,
  checkedIn,
}: {
  registrationId: string;
  checkedIn: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(checkedIn ? "Already checked in." : "");

  async function checkIn() {
    setLoading(true);
    const res = await fetch(`/api/admin/registrations/${registrationId}/check-in`, {
      method: "PATCH",
    });
    if (res.ok) {
      setMessage("Attendance marked successfully.");
      window.location.reload();
    } else {
      const data = await res.json();
      setMessage(data.error ?? "Check-in failed.");
    }
    setLoading(false);
  }

  return (
    <div className="mt-4">
      {!checkedIn && (
        <button type="button" className="btn-primary w-full" disabled={loading} onClick={checkIn}>
          {loading ? "Marking..." : "Mark attendance"}
        </button>
      )}
      {message && <p className="mt-2 text-sm font-semibold text-slate-600">{message}</p>}
    </div>
  );
}
