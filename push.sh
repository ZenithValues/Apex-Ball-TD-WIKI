#!/usr/bin/env bash
# ============================================================================
#  APEX BALL TD — MOBILE / CODESPACES / LINUX PRODUCTION DEPLOY (push.sh)
#  Usage:
#    ./push.sh "Your production release message"
#    (or put your message in push-message.txt and run ./push.sh)
# ============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f "package.json" ] && [ -f "apex-td-project/package.json" ]; then
  if [ -d ".git" ] && [ ! -d "apex-td-project/.git" ]; then
    rm -rf ".git"
  fi
  cd "$SCRIPT_DIR/apex-td-project"
fi

MAIN_REMOTE="https://github.com/ApexBallValuesWiki/ApexBallValuesWiki.github.io.git"
BRANCH="main"

MSG="${1:-}"
if [ -z "$MSG" ]; then
  if [ -f "push-message.txt" ]; then
    MSG="$(head -n 1 push-message.txt | tr -d '\r')"
  elif [ -f "../push-message.txt" ]; then
    MSG="$(head -n 1 ../push-message.txt | tr -d '\r')"
  fi
fi
if [ -z "$MSG" ]; then
  MSG="Production release"
fi

echo ""
echo " ========================================================"
echo "   APEX BALL TD  ::  PUSH TO PRODUCTION (MAIN WEBSITE)"
echo "   Target: ApexBallValuesWiki/ApexBallValuesWiki.github.io"
echo "   Commit: [MAIN] $MSG"
echo " ========================================================"
echo ""

if [ ! -d ".git" ]; then
  git init
  git branch -M "$BRANCH"
fi

if git remote get-url production >/dev/null 2>&1; then
  git remote set-url production "$MAIN_REMOTE"
else
  git remote add production "$MAIN_REMOTE"
fi

git add -A
if ! git diff --cached --quiet; then
  git commit -m "[MAIN] $MSG"
else
  echo " [i] Working tree clean; pushing current HEAD..."
fi

git push -u production "$BRANCH" --force

# Optional Discord Webhook notification (reads webhook.txt or DISCORD_WEBHOOK_URL)
WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
if [ -z "$WEBHOOK_URL" ] && [ -f "webhook.txt" ]; then
  WEBHOOK_URL="$(head -n 1 webhook.txt | tr -d '\r\n ')"
elif [ -z "$WEBHOOK_URL" ] && [ -f "../webhook.txt" ]; then
  WEBHOOK_URL="$(head -n 1 ../webhook.txt | tr -d '\r\n ')"
fi

if [ -n "$WEBHOOK_URL" ]; then
  SHA="$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')"
  curl -sS -H "Content-Type: application/json" -X POST "$WEBHOOK_URL" \
    -d "{\"embeds\":[{\"title\":\"🚀 [MAIN] Production Update Live\",\"description\":$(node -e 'console.log(JSON.stringify(process.argv[1]))' "$MSG"),\"color\":5763719,\"fields\":[{\"name\":\"Commit\",\"value\":\"\`$SHA\`\",\"inline\":true},{\"name\":\"Live URL\",\"value\":\"https://apexballvalueswiki.github.io/\",\"inline\":true}]}]}" >/dev/null || true
  echo " [ok] Discord notification sent."
fi

echo ""
echo " [SUCCESS] Pushed to Production! GitHub Actions is now building:"
echo " https://apexballvalueswiki.github.io/"
