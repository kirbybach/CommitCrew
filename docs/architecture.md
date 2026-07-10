# Architecture

CommitCrew is designed as a small group-chat accountability system.

## High-level flow

```txt
Group chat message
      ↓
Bot command parser
      ↓
AI scoring service
      ↓
Database
      ↓
Dashboard + group-chat reply
```

## Core components

### 1. Group chat bot

The bot listens for commands such as:

```txt
@c worked on my app for 2h
@g ship portfolio redesign
@callout @Alex finish the landing page by Friday
```

The bot is responsible for:

- parsing commands
- identifying the sender
- checking whether the chat is allowed
- sending replies back to the group
- avoiding duplicate processing

### 2. Scoring service

The scoring service evaluates a commit based on:

- effort
- complexity
- time investment
- goal alignment
- impact
- confidence

The result should be structured data, not just prose:

```json
{
  "grade": 14,
  "complexity": 7,
  "impact": 2.0,
  "confidence": 88,
  "feedback": "solid ship. real feature work and clear momentum."
}
```

### 3. Database

The database stores:

- users
- commits
- goals
- callouts
- wagers
- seasons
- scoring metadata

The public demo should only use fake data. Real group-chat data must stay out of this repo.

### 4. Dashboard

The dashboard turns chat activity into visible progress:

- leaderboard
- recent commits
- season view
- all-time stats
- user profiles
- charts over time

### 5. Demo mode

Demo mode should be the default for public development. It should:

- load from `demo-data/`
- avoid external API calls by default
- avoid connecting to production databases
- use fake names and neutral sample commits

## Privacy boundaries

CommitCrew should separate three worlds:

```txt
Private prototype      → real group, real data, private repo
Sanitized demo repo    → fake data, public-safe docs/code
Future product         → opt-in users, explicit privacy model
```

The public repo should never require access to the original private database.
