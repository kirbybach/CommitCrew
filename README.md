# CommitCrew

**An AI accountability bot for group chats.**

CommitCrew turns casual group-chat progress updates into a lightweight accountability game. Members can log what they worked on, get AI-generated feedback, compete on leaderboards, track goals, and build momentum together.

This repository is a sanitized public version of a private prototype. The app structure and core code have been copied over, but private group-chat data, production credentials, auth/session files, real identifiers, internal debug scripts, and old git history are not included. Demo data is fake.

## What It Does

A group member sends a message like:

```txt
@c worked on my portfolio site for 2h and fixed the mobile layout
```

The bot can:

1. score the update with an AI judge
2. reply with short feedback
3. save the commit to Supabase
4. update individual and group stats
5. show progress on the web dashboard
6. support goals, callouts, wagers, disputes, reactions, and seasons

Example response:

```txt
CommitCrew: Alex +14 pts

solid ship. real feature work, clear time investment, and actual progress.
```

## Demo Safety

The public repo defaults to demo mode:

- `NEXT_PUBLIC_DEMO_MODE=true` makes the web app use fake local data.
- `DEMO_MODE=true` keeps the bot from connecting to real chat, Supabase, OpenAI, or cron integrations.
- `demo-data/` and `apps/web/src/lib/demoData.ts` contain fictional users and neutral sample commits.
- Real production data is not included.

See [`PRIVACY.md`](./PRIVACY.md) for the sanitization rules.

## Tech Stack

- TypeScript monorepo with npm workspaces
- Next.js dashboard in `apps/web`
- Node/TypeScript bot in `apps/bot`
- Supabase schema and migrations in `supabase`
- OpenAI scoring and embeddings when real integrations are enabled
- Baileys-based WhatsApp integration when real bot mode is enabled

## Repository Structure

```txt
.
├── apps/
│   ├── bot/            # Chat bot commands, services, cron, and API endpoint
│   └── web/            # Next.js dashboard and demo UI
├── demo-data/          # Fake sample data for public docs/screenshots
├── docs/               # Architecture, roadmap, and product notes
├── supabase/           # Sanitized schema and migrations
├── .env.example        # Placeholder environment variables only
├── PRIVACY.md          # Public-data and safety guidelines
└── README.md
```

## Local Setup

Install dependencies:

```sh
npm ci
```

Copy placeholders:

```sh
cp .env.example .env.local
```

The default `.env.example` values are safe for demo mode. Do not put real secrets in git.

## Run The Web App

From the repo root:

```sh
npm run dev --workspace=apps/web
```

Open the local Next.js URL. With `NEXT_PUBLIC_DEMO_MODE=true`, the dashboard loads fake data and does not require Supabase or dashboard auth.

For a real dashboard connection, set:

```txt
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
JWT_SECRET=...
SHARED_DASHBOARD_PASSWORD_HASH=...
SESSION_VERSION=1
GITHUB_TOKEN=...
```

## Run The Bot

Demo mode starts only the local health/API server and disables real chat integrations:

```sh
npm start --workspace=apps/bot
```

To run real integrations, set `DEMO_MODE=false` and provide:

```txt
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
OPENAI_MODEL=...
COMMIT_API_KEY=...
ALLOWED_GROUPS=...
PRODUCTIVITY_GROUP_JID=...
PHONE_NUMBER=...
PORT=8080
DEBUG_RAG=false
```

Real bot auth state is stored in `auth_info/`, which is ignored and must never be committed.

## Checks

```sh
npm run build:bot
npm run build:web
npm run lint --workspace=apps/web
```

## Privacy Boundaries

This repo should never contain:

- real group-chat messages
- real private user names
- phone numbers or platform-specific user identifiers
- source chat message references tied to real chats
- private database IDs connected to real users
- `.env`, `.env.local`, bot auth state, cookies, dumps, exports, or production credentials
- internal scripts that audit users, print database contents, or inspect private production state

## License

No license has been selected yet. All rights reserved until the project direction is clearer.
