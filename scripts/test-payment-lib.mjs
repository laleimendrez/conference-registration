#!/usr/bin/env node
/** Quick sanity checks for payment helpers (no database). */
import assert from "node:assert/strict";

// Inline copies of logic under test (keep in sync with src/lib/payment.ts)
function parseTransactionDate(dateStr) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
  }
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) throw new Error("Invalid transaction date");
  return parsed;
}

const pngB64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const d = parseTransactionDate("2026-05-27");
assert.equal(d.getFullYear(), 2026);
assert.equal(d.getMonth(), 4);
assert.equal(d.getDate(), 27);

const buf = Buffer.from(pngB64, "base64");
assert.ok(buf.length > 0 && buf.length < 5000);

console.log("payment lib checks: OK");
