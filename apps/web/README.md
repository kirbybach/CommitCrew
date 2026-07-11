# CommitCrew Web

Next.js dashboard for the CommitCrew public demo.

Demo mode is enabled by default with `NEXT_PUBLIC_DEMO_MODE=true`, which loads local fake data instead of querying Supabase or requiring dashboard auth.

```sh
npm run dev --workspace=apps/web
npm run build --workspace=apps/web
npm run lint --workspace=apps/web
```

For real data, set `NEXT_PUBLIC_DEMO_MODE=false` and provide the Supabase and dashboard auth values listed in the root `.env.example`.
