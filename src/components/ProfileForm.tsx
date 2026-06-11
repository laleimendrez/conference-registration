"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Dinagdagan natin ng metadata ang bawat bansa para sa phone validation at tracking
const countries = [
  { code: "PH", name: "Philippines", dialCode: "+63", minLen: 10, maxLen: 13, placeholder: "+63 912 345 6789" },
  { code: "US", name: "United States", dialCode: "+1", minLen: 10, maxLen: 12, placeholder: "+1 202 555 0143" },
  { code: "SG", name: "Singapore", dialCode: "+65", minLen: 8, maxLen: 11, placeholder: "+65 6123 4567" },
  { code: "MY", name: "Malaysia", dialCode: "+60", minLen: 9, maxLen: 12, placeholder: "+60 12-345 6789" },
  { code: "ID", name: "Indonesia", dialCode: "+62", minLen: 9, maxLen: 14, placeholder: "+62 812-3456-789" },
  { code: "TH", name: "Thailand", dialCode: "+66", minLen: 9, maxLen: 12, placeholder: "+66 81 234 5678" },
  { code: "VN", name: "Vietnam", dialCode: "+84", minLen: 9, maxLen: 12, placeholder: "+84 91 234 5678" },
  { code: "JP", name: "Japan", dialCode: "+81", minLen: 9, maxLen: 13, placeholder: "+81 90-1234-5678" },
  { code: "KR", name: "South Korea", dialCode: "+82", minLen: 9, maxLen: 12, placeholder: "+82 10-1234-5678" },
  { code: "CN", name: "China", dialCode: "+86", minLen: 11, maxLen: 14, placeholder: "+86 139 1234 5678" },
];

type ProfileUser = {
  name: string;
  email: string;
  organization: string | null;
  phone: string | null;
  country: string;
  createdAt: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProfileForm({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  // State para ma-track kung anong bansa ang pinili ng user ngayon
  const [currentCountryCode, setCurrentCountryCode] = useState(user.country || "PH");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(fd)),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Profile update failed.");
      return;
    }
    setMessage("Profile updated successfully.");
    router.refresh();
  }

  // Hanapin ang active country configuration base sa state
  const activeCountry = countries.find((c) => c.code === currentCountryCode) ?? countries[0];

  return (
    <section className="dashboard-card overflow-hidden">
      <div className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-2xl font-black text-emerald-700">
            {initials(user.name) || "U"}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black text-slate-950">{user.name}</h2>
            <p className="truncate text-sm font-semibold text-emerald-700">{user.email}</p>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-5 p-6">
        {message && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-bold text-indigo-800">
            {message}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input id="name" name="name" className="input-field" defaultValue={user.name} required />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" className="input-field bg-slate-50 text-slate-500" defaultValue={user.email} disabled />
          </div>
          <div>
            <label className="label" htmlFor="organization">
              Organization
            </label>
            <input id="organization" name="organization" className="input-field" defaultValue={user.organization ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="input-field"
              defaultValue={user.phone ?? ""}
              placeholder={activeCountry.placeholder}
              // Gumagamit na ngayon ng dynamic min/max length at patterns depende sa bansa
              minLength={activeCountry.minLen}
              maxLength={activeCountry.maxLen}
              pattern="[+\d\s\-().]{7,20}"
              title={`Enter a valid phone number for ${activeCountry.name}. Min length: ${activeCountry.minLen}, Max length: ${activeCountry.maxLen}`}
              onKeyDown={(e) => {
                const allowed = /[0-9+\-\s().]/;
                if (
                  !allowed.test(e.key) &&
                  !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                ) {
                  e.preventDefault();
                }
              }}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="country">
            Country / Region
          </label>
          <select 
            id="country" 
            name="country" 
            className="input-field" 
            value={currentCountryCode}
            onChange={(e) => setCurrentCountryCode(e.target.value)} // Ina-update ang state tuwing may pipiliing bansa
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.code} - {country.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Country selection is saved to your profile and can be used for future localization.
          </p>
        </div>

        <button type="submit" className="btn-primary justify-self-start" disabled={loading}>
          {loading ? "Saving..." : "Save profile"}
        </button>
      </form>
    </section>
  );
}