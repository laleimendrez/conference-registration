import type { Membership, MembershipCertType } from "@prisma/client";
import { MEMBERSHIP_DURATION_YEARS } from "./constants";

/** Compute start/expiry when approving a membership payment. */
export function membershipDatesOnApproval(
  membership: Pick<Membership, "expiryDate" | "startDate">,
  type: MembershipCertType,
  isRenewal: boolean,
): { startDate: Date; expiryDate: Date | null } {
  const years = MEMBERSHIP_DURATION_YEARS[type];
  const now = new Date();

  if (years === null || years === undefined) {
    return { startDate: membership.startDate ?? now, expiryDate: null };
  }

  if (isRenewal && membership.expiryDate) {
    const base = new Date(membership.expiryDate);
    const extendFrom = base > now ? base : now;
    const expiryDate = new Date(extendFrom);
    expiryDate.setFullYear(expiryDate.getFullYear() + years);
    return {
      startDate: membership.startDate ?? now,
      expiryDate,
    };
  }

  const startDate = now;
  const expiryDate = new Date(startDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + years);
  return { startDate, expiryDate };
}
