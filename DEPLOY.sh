#!/bin/bash
# One script — run on your Mac (not in Cursor agent).
cd "$(dirname "$0")"
export PATH="$PWD/.tools/node/bin:$PATH"
[ -f .neon.env ] && source .neon.env
export AUTH_SECRET="Oq6Wx9key3uOVrvr02LajtvJQkSQuGXgd7fRY+By6oE="

echo "Opening Vercel — paste env vars from Desktop GO LIVE - 2 STEPS.txt then click Deploy"
open "https://vercel.com/new/import?s=https://github.com/zeuswae/conference-registration"
open "/Users/shu/Desktop/GO LIVE - 2 STEPS.txt"
