-- Migration: Add resolving commit link to bets
-- Links a won bet to the specific commit that achieved it.

ALTER TABLE public.bets 
ADD COLUMN resolved_commit_id uuid REFERENCES public.commits(id);

CREATE INDEX idx_bets_resolved_commit ON public.bets(resolved_commit_id);
