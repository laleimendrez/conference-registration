#!/bin/bash
# Deploy WITHOUT GitHub. Run in Terminal on your Mac.
set -e
cd "$(dirname "$0")"
export PATH="$PWD/.tools/node/bin:$PATH"
source .neon.env
AUTH="Oq6Wx9key3uOVrvr02LajtvJQkSQuGXgd7fRY+By6oE="

echo "Step 1: Log in to Vercel (browser opens — use same account as vercel.com)"
npx vercel@latest login

echo "Step 2: Link project"
npx vercel@latest link --yes 2>/dev/null || npx vercel@latest link

echo "Step 3: Set Neon database + secrets"
printf '%s' "$DATABASE_URL" | npx vercel@latest env add DATABASE_URL production
printf '%s' "$AUTH" | npx vercel@latest env add AUTH_SECRET production
printf '%s' "https://conference-registration.vercel.app" | npx vercel@latest env add NEXT_PUBLIC_APP_URL production

echo "Step 4: Deploy (uploads from this folder — NO git push)"
npx vercel@latest --prod --yes

echo ""
echo "DONE. Copy the https://....vercel.app URL above and share it."
