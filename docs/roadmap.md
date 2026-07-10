# Roadmap

CommitCrew should grow in stages. The goal is to avoid overbuilding before the accountability loop is proven outside the original group.

## Stage 1: Public case study

Status: in progress

Goals:

- explain the product idea clearly
- document the architecture
- include fake demo data
- keep the real/private prototype separate
- create a safe GitHub repo that can be linked from a portfolio

Deliverables:

- README
- privacy guidelines
- architecture doc
- fake demo data
- screenshots or GIFs using fake data

## Stage 2: Static demo dashboard

Goal: show what CommitCrew feels like without requiring a real group chat integration.

Possible features:

- load fake commits from `demo-data/`
- show leaderboard
- show recent commits
- show simple weekly points chart
- show example bot responses
- include a demo-mode banner

This should not require Supabase, OpenAI, WhatsApp, or any production credentials.

## Stage 3: Local bot simulation

Goal: simulate the core loop without connecting to a real messaging platform.

Possible features:

- local command input
- fake users
- deterministic scoring mode
- optional AI scoring when an API key is provided
- generated bot replies

Example:

```txt
> Alex: @c built the settings page for 2h
CommitCrew: Alex +13 pts — strong ship, actual feature work.
```

## Stage 4: Private beta integration

Goal: test with a small number of opt-in groups.

Questions to answer:

- Do groups actually keep using it after the novelty wears off?
- Is the scoring motivating or annoying?
- Which features matter most: points, goals, callouts, wagers, or dashboard?
- Does it feel fun, or does it feel like surveillance?
- Who would pay, if anyone?

## Stage 5: Product decision

CommitCrew becomes a real product only if groups outside the original prototype ask to use it repeatedly.

Possible target users:

- student builder groups
- founder houses
- hackathon teams
- fitness groups
- project clubs
- creative accountability circles

Avoid early expansion into workplace monitoring. The product should feel opt-in, social, and fun — not like a manager dashboard.
