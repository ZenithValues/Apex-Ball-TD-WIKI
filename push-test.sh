#!/usr/bin/env bash
# ============================================================================
#  APEX BALL TD — MOBILE / CODESPACES / LINUX STAGING DEPLOY (push-test.sh)
#  Usage:
#    ./push-test.sh "Your update message"
#    (or put your message in push-message.txt and run ./push-test.sh)
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

TEST_REMOTE="https://github.com/ZenithValues/Apex-Ball-TD-WIKI.git"
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
  MSG="Update website"
fi

echo ""
echo " ========================================================"
echo "   APEX BALL TD  ::  PUSH TO TEST REALM (STAGING)"
echo "   Target: ZenithValues/Apex-Ball-TD-WIKI"
echo "   Commit: [TEST] $MSG"
echo " ========================================================"
echo ""

if [ ! -d ".git" ]; then
  git init
  git branch -M "$BRANCH"
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$TEST_REMOTE"
else
  git remote add origin "$TEST_REMOTE"
fi

git add -A
if ! git diff --cached --quiet; then
  git commit -m "[TEST] $MSG"
else
  echo " [i] Working tree clean; pushing current HEAD..."
fi

git push -u origin "$BRANCH" --force

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
    -d "{\"embeds\":[{\"title\":\"🧪 [TEST] Staging Update Pushed\",\"description\":$(node -e 'console.log(JSON.stringify(process.argv[1]))' "$MSG"),\"color\":16753920,\"fields\":[{\"name\":\"Commit\",\"value\":\"\`$SHA\`\",\"inline\":true},{\"name\":\"Live URL\",\"value\":\"https://zenithvalues.github.io/Apex-Ball-TD-WIKI/\",\"inline\":true}]}]}" >/dev/null || true
  echo " [ok] Discord notification sent."
fi

echo ""
echo " [SUCCESS] Pushed to Staging! GitHub Actions is now building:"
echo " https://zenithvalues.github.io/Apex-Ball-TD-WIKI/"
