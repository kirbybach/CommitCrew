-- Migration: Create seasons table for monthly leaderboard resets
-- Each row represents one calendar month (season).

CREATE TABLE public.seasons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  season_number int NOT NULL,
  month int NOT NULL,
  year int NOT NULL,
  label text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  champion_id uuid REFERENCES public.users(id),
  champion_name text,
  champion_score int,
  standings jsonb,
  finalized_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(month, year)
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Allow service insert" ON public.seasons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update" ON public.seasons FOR UPDATE USING (true);
