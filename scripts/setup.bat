@echo off
REM scripts\setup.bat - Automatic setup script for Windows (first-time setup)

echo Setting up database...
call pnpm generate
call pnpm migrate:dev --name "initial setup"
call pnpm db:seed

echo ✓ Database setup complete!
