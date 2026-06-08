"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/events", label: "Events" },
  { href: "/dashboard/certificates", label: "Certificate Logs" },
  { href: "/dashboard/membership", label: "Membership" },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function DashboardNav({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  return (
    <aside className="dashboard-sidebar">
      <div>
        <Link href="/dashboard" className="mb-8 flex items-center gap-3">
          <span className="dashboard-brand-mark">CR</span>
          <span>
            <span className="block text-sm font-black uppercase tracking-[0.18em] text-slate-900">
              Conference
            </span>
            <span className="block text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Portal
            </span>
          </span>
        </Link>

        <nav className="space-y-1">
          {links.map((link) => {
            const active =
              link.href === "/dashboard"
                ? pathname === link.href
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`dashboard-side-link ${active ? "dashboard-side-link-active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className={`dashboard-side-link ${pathname.startsWith("/admin") ? "dashboard-side-link-active" : ""}`}
            >
              Admin Console
            </Link>
          )}
        </nav>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="dashboard-avatar">{initials(user.name) || "U"}</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-slate-900">{user.name}</span>
            <span className="block truncate text-xs font-semibold text-slate-500">{user.role.toLowerCase()}</span>
          </span>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
