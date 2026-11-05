# Nexora AI

Nexora AI is a self-hosted Next.js workspace for AI-assisted business workflows.
This project uses the Next.js App Router, TypeScript, Prisma, PostgreSQL, Gemini,
Nodemailer, Redis/BullMQ, and Remotion.

## Local setup

1. Install Node.js 20.9 or later and Redis.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and `DIRECT_URL` for your
   PostgreSQL database. `DATABASE_URL` should use the provider's pooled endpoint
   when available; `DIRECT_URL` should use its direct endpoint for migrations.
3. Add a Google Gemini API key to `GEMINI_API_KEY`.
4. Install dependencies with `npm install`.
5. Apply the checked-in PostgreSQL migrations with `npm run db:migrate`.
6. Start the application with `npm run dev`.
7. Create the first account and workspace at `/register`.

For iterative local schema changes, use `npm run db:dev`. Back up any existing
database before applying schema changes.
The checked-in migrations create a fresh PostgreSQL database; SQLite data from
an earlier local installation must be exported and imported separately.

The database-backed sessions use secure, HTTP-only cookies. Passwords are hashed
with Node.js `scrypt`; session tokens are random and only their SHA-256 hashes
are stored in the database.

## Email and contact submissions

Contact submissions are persisted before AI enrichment or SMTP delivery. Email
notifications are optional and use Nodemailer's SMTP transport. Set
`ENABLE_EMAIL_NOTIFICATIONS=true`, `CONTACT_NOTIFY_EMAIL`, and the appropriate
SMTP settings to enable them.

To route public contact submissions into a workspace inbox, set
`CONTACT_WORKSPACE_ID` to that workspace's ID. Without it, submissions remain
stored as unassigned contact records and are not exposed in a workspace inbox.

## Background video rendering

Start Redis and run `npm run worker` in a separate process to process video
render jobs. Piper and FFmpeg must also be installed and configured for local
voice generation and MP4 rendering.

## Configuration and deployment notes

- Keep `.env` out of version control; `.env.example` contains placeholders only.
- Configure both `DATABASE_URL` (pooled runtime connection) and `DIRECT_URL`
  (direct connection for Prisma migrations) in Vercel. Use the PostgreSQL
  connection strings from Neon or your chosen managed provider; do not commit
  credentials.
- Set both variables for the Vercel Production environment, then pull the
  environment locally with Vercel CLI and run `npm run db:migrate` once to
  create the tables. Verify `/api/ready` returns `{"status":"ready"}` after
  deploying with the database configured.
- Configure SMTP and Redis availability monitoring before enabling those
  optional integrations in production.
- Configure reverse-proxy HTTPS so production session cookies remain secure.
- `/api/health` is a liveness check, `/api/ready` checks database readiness, and
  `/api/metrics` exposes workspace counts to owners and administrators.

## Current milestone scope

The project has been reorganized into one canonical App Router tree. This
baseline includes workspace registration, sign-in/sign-out, role membership,
workspace-scoped dashboard access, audit records, Gemini output validation and
retry, SMTP contact delivery, content generation, saved campaigns, and the
existing chat, social, business development, inbox, and video workflows.
Invitation flows, password recovery/MFA, external object storage, billing,
provider integrations, and disaster-recovery automation still require
deployment-specific milestones.
