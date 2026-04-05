#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/apps/api/.env"
ENV_EXAMPLE="$SCRIPT_DIR/.env.example"
MISSING=()

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║       Seller Listing Copilot — Setup             ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── 1. Check prerequisites ──────────────────────────────
echo "Checking prerequisites..."
echo ""

# Node.js
if command -v node &>/dev/null; then
  NODE_VER=$(node -v)
  echo "  ✓ Node.js $NODE_VER"
else
  echo "  ✗ Node.js — NOT FOUND"
  MISSING+=("nodejs")
fi

# npm
if command -v npm &>/dev/null; then
  NPM_VER=$(npm -v)
  echo "  ✓ npm $NPM_VER"
else
  echo "  ✗ npm — NOT FOUND"
  MISSING+=("npm")
fi

# Docker
if command -v docker &>/dev/null; then
  DOCKER_VER=$(docker --version 2>/dev/null | head -1)
  echo "  ✓ $DOCKER_VER"
else
  echo "  ✗ Docker — NOT FOUND"
  MISSING+=("docker")
fi

# Docker Compose
if docker compose version &>/dev/null 2>&1; then
  echo "  ✓ Docker Compose available"
elif docker-compose version &>/dev/null 2>&1; then
  echo "  ✓ docker-compose (legacy) available"
else
  echo "  ✗ Docker Compose — NOT FOUND"
  MISSING+=("docker-compose")
fi

# Git
if command -v git &>/dev/null; then
  GIT_VER=$(git --version)
  echo "  ✓ $GIT_VER"
else
  echo "  ✗ Git — NOT FOUND"
  MISSING+=("git")
fi

echo ""

# If anything is missing, show install instructions and exit
if [ ${#MISSING[@]} -gt 0 ]; then
  echo "═══ Missing prerequisites: ${MISSING[*]} ═══"
  echo ""
  echo "Install them first, then re-run this script."
  echo ""

  # Detect OS
  OS="unknown"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
  elif [[ "$OSTYPE" == "linux"* ]]; then
    OS="linux"
  elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
  fi

  for pkg in "${MISSING[@]}"; do
    case "$pkg" in
      nodejs|npm)
        echo "  Node.js + npm:"
        if [ "$OS" = "mac" ]; then
          echo "    brew install node"
          echo "    OR download from https://nodejs.org/ (LTS recommended)"
        elif [ "$OS" = "linux" ]; then
          echo "    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
          echo "    sudo apt-get install -y nodejs"
          echo "    OR: https://nodejs.org/ (download Linux binary)"
        else
          echo "    Download from https://nodejs.org/ (LTS recommended)"
        fi
        echo ""
        ;;
      docker|docker-compose)
        echo "  Docker Desktop (includes Docker + Compose):"
        if [ "$OS" = "mac" ]; then
          echo "    brew install --cask docker"
          echo "    OR download from https://docs.docker.com/desktop/install/mac-install/"
        elif [ "$OS" = "linux" ]; then
          echo "    curl -fsSL https://get.docker.com | sh"
          echo "    sudo usermod -aG docker \$USER && newgrp docker"
        else
          echo "    Download from https://docs.docker.com/desktop/install/windows-install/"
        fi
        echo ""
        ;;
      git)
        echo "  Git:"
        if [ "$OS" = "mac" ]; then
          echo "    brew install git"
        elif [ "$OS" = "linux" ]; then
          echo "    sudo apt-get install -y git"
        else
          echo "    Download from https://git-scm.com/downloads"
        fi
        echo ""
        ;;
    esac
  done
  exit 1
fi

echo "All prerequisites found!"
echo ""

# ── 2. Create .env if needed ────────────────────────────
if [ -f "$ENV_FILE" ]; then
  echo "✓ apps/api/.env exists"
else
  if [ -f "$ENV_EXAMPLE" ]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo "✓ Created apps/api/.env from .env.example"
  else
    echo "⚠ No .env.example found — .env will be auto-created on first run"
  fi
fi
echo ""

# ── 3. Install dependencies ─────────────────────────────
echo "Installing dependencies..."
cd "$SCRIPT_DIR"
npm install
echo ""

# ── 4. Start Docker services ────────────────────────────
echo "Starting Docker services..."
docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null || {
  echo "⚠ Docker not running. Start Docker Desktop first, then re-run this script."
  exit 1
}

echo ""
echo "Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
  if docker exec listingpilot-postgres pg_isready -U postgres &>/dev/null 2>&1; then
    echo "  ✓ PostgreSQL is ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "  ⚠ PostgreSQL not ready after 30s — continuing anyway"
  fi
  sleep 1
done
echo ""

# ── 5. Database setup ───────────────────────────────────
echo "Running database migrations..."
cd "$SCRIPT_DIR/apps/api"
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss 2>/dev/null || {
  echo "⚠ Migration failed. Make sure PostgreSQL is running."
  exit 1
}

echo ""
echo "Seeding database..."
npx prisma db seed 2>/dev/null || echo "  (seed skipped — may already exist)"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║              Setup Complete!                      ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║                                                   ║"
echo "║  Start the app:                                   ║"
echo "║    cd $(basename "$SCRIPT_DIR")                   ║"
echo "║    npm run dev                                    ║"
echo "║                                                   ║"
echo "║  Then open:                                       ║"
echo "║    Frontend:  http://localhost:3000                ║"
echo "║    Backend:   http://localhost:4000                ║"
echo "║    Health:    http://localhost:4000/api/v1/health  ║"
echo "║    Login:     admin@demo.com / demo1234           ║"
echo "║                                                   ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
