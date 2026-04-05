#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/apps/api/.env"
ENV_EXAMPLE="$SCRIPT_DIR/.env.example"

echo "=== Seller Listing Copilot — Setup ==="
echo ""

if [ -f "$ENV_FILE" ]; then
  echo "✓ apps/api/.env already exists"
else
  echo "Creating apps/api/.env from .env.example ..."
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  echo "✓ Created apps/api/.env"
fi

# Check for Groq API key
GROQ_KEY=$(grep -E "^(GROQ_API_KEY|OPENROUTER_API_KEY)" "$ENV_FILE" | head -1 | cut -d= -f2-)

if [ -z "$GROQ_KEY" ] || [[ "$GROQ_KEY" == *"REPLACE"* ]] || [[ "$GROQ_KEY" == *"your-"* ]]; then
  echo ""
  echo "⚠  Groq API key not configured!"
  echo ""
  echo "   1. Go to https://console.groq.com/keys"
  echo "   2. Create a free API key"
  echo "   3. Edit apps/api/.env and set:"
  echo "      GROQ_API_KEY=gsk_your_key_here"
  echo ""
  read -rp "   Paste your Groq API key now (or press Enter to skip): " USER_KEY
  if [ -n "$USER_KEY" ]; then
    if grep -q "^GROQ_API_KEY=" "$ENV_FILE"; then
      sed -i.bak "s|^GROQ_API_KEY=.*|GROQ_API_KEY=$USER_KEY|" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
    elif grep -q "^OPENROUTER_API_KEY=" "$ENV_FILE"; then
      sed -i.bak "s|^OPENROUTER_API_KEY=.*|GROQ_API_KEY=$USER_KEY|" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
    else
      echo "GROQ_API_KEY=$USER_KEY" >> "$ENV_FILE"
    fi
    echo "   ✓ API key saved"
  else
    echo "   ⚠  Skipped — AI extraction will fail until the key is configured"
  fi
else
  echo "✓ Groq API key is configured"
fi

echo ""
echo "=== Installing dependencies ==="
cd "$SCRIPT_DIR"
npm install

echo ""
echo "=== Starting Docker services ==="
docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null || echo "⚠  Docker not available — start Postgres, Redis, MinIO manually"

echo ""
echo "=== Running database migrations ==="
cd apps/api
npx prisma migrate deploy 2>/dev/null || npx prisma db push
npx prisma db seed 2>/dev/null || echo "⚠  Seed skipped (may already exist)"

echo ""
echo "=== Setup complete! ==="
echo ""
echo "  Start the app:  npm run dev  (from project root)"
echo "  Frontend:        http://localhost:3000"
echo "  Backend:         http://localhost:4000"
echo "  Login:           admin@demo.com / demo1234"
echo ""
