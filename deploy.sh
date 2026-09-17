#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

if [ -d .git ]; then
  echo "Pulling latest changes..."
  git pull --ff-only
fi

if [ ! -f .env ]; then
  echo "No .env found, creating one from .env.example"
  cp .env.example .env
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
else
  COMPOSE="docker-compose"
fi

echo "Building images..."
$COMPOSE build

echo "Starting services..."
$COMPOSE up -d

echo ""
echo "TrainHub is starting up:"
echo "  Frontend: http://localhost:8888"
echo "  Backend:  http://localhost:7777"
echo ""
$COMPOSE ps
