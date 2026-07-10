# Privacy Guidelines

CommitCrew started from a private group-chat prototype, so privacy is a core constraint for this public repo.

## Public repo rules

This repository should never include:

- real group-chat messages
- real names from private groups
- phone numbers
- WhatsApp JIDs or other platform-specific user identifiers
- message IDs tied to real chats
- private database UUIDs connected to real users
- API keys, access tokens, cookies, session files, or auth state
- raw exports from Supabase or any production database
- screenshots containing private messages or identifiable profile photos

## Demo data rules

Demo data should use fictional names and neutral examples.

Good examples:

- Alex shipped a landing page
- Maya studied algorithms for 90 minutes
- Jordan fixed an auth bug
- Sam ran three miles

Avoid examples that reveal real work, real businesses, real friends, private jokes, or sensitive personal goals.

## Bot/session files

Any real bot session directory must stay out of git. Examples include:

- `auth_info/`
- `.env`
- `.env.local`
- exported cookies
- QR or pairing-code logs
- local database dumps

## Dashboard screenshots

Public screenshots should use demo mode only. Before posting a screenshot, check for:

- names
- avatars
- dates that reveal real activity
- commit messages from real users
- private group labels
- database IDs or browser console logs

## Production separation

The production/private prototype and this public demo repo should remain separated. Production code can be copied here only after it has been reviewed, sanitized, and rewritten to default to fake/demo data.
