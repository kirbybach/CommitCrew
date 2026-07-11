-- Migration: Create callouts table for peer-to-Peer accountability
-- Tracks challenges between users, their status, and resolution.

CREATE TABLE public.callouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id uuid NOT NULL REFERENCES public.users(id),
  target_id uuid NOT NULL REFERENCES public.users(id),
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'expired')),
  bonus_points int DEFAULT 5,
  penalty_points int DEFAULT 5,
  caller_reward int DEFAULT 3,
  resolved_commit_id uuid REFERENCES public.commits(id), -- Matches commits.id (UUID)
  expires_at timestamptz NOT NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indices for performance
CREATE INDEX idx_callouts_status ON public.callouts(status);
CREATE INDEX idx_callouts_target_status ON public.callouts(target_id, status);
CREATE INDEX idx_callouts_caller_status ON public.callouts(caller_id, status);

-- Prevent spamming: Max 1 active callout per caller->target pair
CREATE UNIQUE INDEX idx_one_active_callout_per_pair 
ON public.callouts(caller_id, target_id) 
WHERE status = 'pending';

-- RLS Policies
ALTER TABLE public.callouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.callouts FOR SELECT USING (true);
CREATE POLICY "Allow service insert" ON public.callouts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update" ON public.callouts FOR UPDATE USING (true);
