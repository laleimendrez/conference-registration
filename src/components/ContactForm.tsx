"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="contact-card flex flex-col items-center justify-center gap-6 text-center min-h-[380px] py-12">
        {/* Animated checkmark */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full bg-indigo-100 animate-ping opacity-20" />
          <div className="relative grid h-20 w-20 place-items-center rounded-full bg-indigo-600 shadow-lg shadow-indigo-600/30">
            <svg
              className="h-9 w-9 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-950">Message sent!</h3>
          <p className="text-sm leading-7 text-slate-500 max-w-xs mx-auto">
            Thanks for reaching out. Check your inbox — we've sent you a confirmation and will follow up within 24 hours.
          </p>
        </div>

        {/* Divider */}
        <div className="w-16 h-px bg-slate-200" />

        {/* Reset */}
        <button
          onClick={() => setStatus("idle")}
          className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form className="contact-card" onSubmit={handleSubmit} noValidate>
      <div>
        <label className="contact-label" htmlFor="contact-name">
          Name
        </label>
        <input
          id="contact-name"
          className="contact-field"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={status === "loading"}
        />
      </div>

      <div>
        <label className="contact-label" htmlFor="contact-email">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          className="contact-field"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === "loading"}
        />
      </div>

      <div>
        <label className="contact-label" htmlFor="contact-message">
          Message
        </label>
        <textarea
          id="contact-message"
          className="contact-field min-h-32 resize-none"
          placeholder="Tell us what you need help with."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          disabled={status === "loading"}
        />
      </div>

      {status === "error" && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        className="contact-submit disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={status === "loading"}
      >
        {status === "loading" ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Sending…
          </span>
        ) : (
          "Send message ->"
        )}
      </button>

      <p className="text-center text-xs font-semibold text-slate-500">
        We usually respond within 24 hours.
      </p>
    </form>
  );
}