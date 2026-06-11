import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM ?? "noreply@example.com";
    const to = process.env.CONTACT_EMAIL ?? "support@conferenceportal.local";

    if (!apiKey) {
      console.log("[contact:dev]", { name, email, message });
      return NextResponse.json({ ok: true, mode: "console" });
    }

    // 1. Notify you
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: `New message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      }),
    });

    // 2. Auto-reply to sender
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: "We received your message — Conference Portal",
        text: `Hi ${name},\n\nThanks for reaching out! We've received your message and will get back to you within 24 hours.\n\nHere's a copy of what you sent:\n\n"${message}"\n\nBest regards,\nConference Portal Team`,
      }),
    });

    return NextResponse.json({ ok: true, mode: "resend" });
  } catch (err) {
    console.error("[contact] error:", err);
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }
}