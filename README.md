# CommitCrew

**An AI accountability bot for group chats.**

CommitCrew turns casual group-chat progress updates into a lightweight accountability game. Members can log what they worked on, get AI-generated feedback, compete on leaderboards, track goals, and build momentum together.

This repository is a sanitized public-facing version of an earlier private prototype. The original prototype was built for a real friend group and contains private group data, so this repo uses fake examples and documentation-first structure.

## Why this exists

Group chats are where a lot of real accountability already happens, but they are messy:

- progress updates disappear in the scroll
- goals are hard to track over time
- follow-up depends on people remembering
- leaderboards, streaks, and momentum have to be tracked manually

CommitCrew explores a simple idea: **what if your group chat could become a shared scoreboard for getting things done?**

## Core concept

A member sends a message like:

```txt
@c worked on my portfolio site for 2h and fixed the mobile layout
```

The bot can then:

1. score the update using an AI judge
2. reply with short feedback
3. save the commit to a database
4. update individual and group stats
5. show progress on a dashboard
6. support goals, challenges, and weekly seasons

## Example bot response

```txt
CommitCrew: Alex +14 pts

solid ship. real feature work, clear time investment, and actually moved the project forward.
```

## Example features

- **Progress commits** — log completed work directly from chat
- **AI scoring** — grade work based on complexity, effort, and impact
- **Leaderboards** — track weekly, monthly, and all-time points
- **Goals** — connect commits to longer-term outcomes
- **Callouts** — challenge another member to finish something by a deadline
- **Wagers** — bet points on your own task completion
- **Dashboard** — view commits, stats, trends, and seasons
- **Demo mode** — use fake data for public screenshots and development

## Tech direction

The original private prototype used:

- WhatsApp bot integration
- Next.js dashboard
- Supabase database
- OpenAI scoring and embeddings
- TypeScript monorepo structure

This public repo is intentionally being rebuilt with privacy in mind before any production code is copied over.

## Privacy-first note

The real prototype processed private group-chat activity. That means the public version needs to avoid:

- real names
- phone numbers
- WhatsApp JIDs
- message IDs
- raw commit logs from private groups
- database identifiers tied to real users
- API keys or auth session files

See [`PRIVACY.md`](./PRIVACY.md) for the rules guiding this repo.

## Project status

CommitCrew is currently a **sanitized case-study/demo repo**, not a hosted SaaS product.

The current goal is to document the idea, architecture, and product direction without exposing private production data. A working demo may be added later with fake data only.

## Possible future direction

CommitCrew could become a niche accountability tool for:

- student builders
- founder houses
- CS/project clubs
- fitness groups
- creative groups
- hackathon teams
- small friend groups trying to stay consistent

The key product question is whether the accountability loop works outside the original group.

## Repository structure

```txt
.
├── demo-data/          # Fake sample data for screenshots and demos
├── docs/               # Architecture, roadmap, and product notes
├── .env.example        # Placeholder environment variables only
├── PRIVACY.md          # Public-data and safety guidelines
└── README.md
```

## License

No license has been selected yet. All rights reserved until the project direction is clearer.
