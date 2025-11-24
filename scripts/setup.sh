#!/bin/bash
# scripts/setup.sh - Automatic setup script for first-time setup

echo "Setting up database..."
pnpm generate
pnpm migrate:dev --name "initial setup"
pnpm db:seed

echo "✓ Database setup complete!"
