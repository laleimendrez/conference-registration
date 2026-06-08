"use client";

import { useState } from "react";

const workflow = [
  {
    title: "Create the event record",
    badge: "Setup",
    desc: "Organizers prepare registration details, certificate options, membership categories, and payment instructions.",
    stats: [
      ["Events", "Active"],
      ["Fees", "Ready"],
      ["Forms", "Open"],
    ],
    rows: [
      ["Event profile", "Configured", "Admin"],
      ["Registration form", "Published", "Portal"],
      ["Certificate options", "Available", "Office"],
      ["Payment guide", "Attached", "Finance"],
    ],
  },
  {
    title: "Register and submit proof",
    badge: "Participant",
    desc: "Participants complete their profile, register for the event, and upload payment proof when required.",
    stats: [
      ["Registrations", "248"],
      ["Proofs", "23"],
      ["QR codes", "Ready"],
    ],
    rows: [
      ["Participant details", "Submitted", "User"],
      ["Early registration", "Approved", "Portal"],
      ["Payment proof", "For review", "Admin"],
      ["QR ticket", "Prepared", "Event"],
    ],
  },
  {
    title: "Review and approve",
    badge: "Admin",
    desc: "Administrators verify payment submissions, monitor registration status, and keep records organized.",
    stats: [
      ["Pending", "23"],
      ["Approved", "91%"],
      ["Rejected", "4"],
    ],
    rows: [
      ["Payment proof", "Review", "Finance"],
      ["Registration", "Approved", "Admin"],
      ["Membership", "Active", "Office"],
      ["Audit trail", "Updated", "System"],
    ],
  },
  {
    title: "Issue QR tickets and certificates",
    badge: "Release",
    desc: "Approved participants receive check-in support, certificate updates, and membership renewal guidance.",
    stats: [
      ["Tickets", "Issued"],
      ["Certificates", "36"],
      ["Renewals", "Scheduled"],
    ],
    rows: [
      ["QR check-in", "Valid", "Event"],
      ["Certificate request", "Issued", "Office"],
      ["Membership renewal", "Scheduled", "Email"],
      ["Participant record", "Complete", "Portal"],
    ],
  },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const selected = workflow[active];

  return (
    <section id="how-it-works" className="how-section px-5 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="section-kicker">How it works</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 md:text-5xl">
            Everything you need to manage conference registration.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
            A guided workflow connects participants, administrators, payment review,
            certificates, and membership tracking from start to finish.
          </p>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="space-y-4">
            {workflow.map((step, index) => (
              <button
                key={step.title}
                type="button"
                onClick={() => setActive(index)}
                className={`workflow-card w-full text-left ${active === index ? "workflow-card-active" : ""}`}
              >
                <span className="workflow-number">{index + 1}</span>
                <span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-slate-950">{step.title}</span>
                    <span className="workflow-badge">{step.badge}</span>
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-slate-600">{step.desc}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="portal-preview">
            <div className="preview-topbar">
              <span className="bg-pink-400" />
              <span className="bg-indigo-300" />
              <span className="bg-cyan-300" />
              <p>conference.portal/registration</p>
            </div>
            <div className="preview-body">
              <div className="preview-stats">
                {selected.stats.map(([label, value]) => (
                  <div key={label}>
                    <p>{label}</p>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <div className="preview-table">
                {selected.rows.map(([name, status, owner]) => (
                  <div key={name}>
                    <span>{name}</span>
                    <strong>{status}</strong>
                    <em>{owner}</em>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
