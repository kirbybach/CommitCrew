-- 1. Add Quality Metrics to Commits Table
ALTER TABLE public.commits 
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES public.goals(id),
ADD COLUMN IF NOT EXISTS impact_score NUMERIC(3, 1), -- e.g., 1.0, 1.5, 2.0
ADD COLUMN IF NOT EXISTS complexity_score INTEGER;    -- 1 to 10

-- 2. Create Bets Table
CREATE TABLE IF NOT EXISTS public.bets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    task TEXT NOT NULL,
    amount INTEGER NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_commits_goal_id ON public.commits(goal_id);
CREATE INDEX IF NOT EXISTS idx_bets_user_status ON public.bets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bets_deadline ON public.bets(deadline) WHERE status = 'pending';

-- 4. RLS Policies (Open for now, matching existing schema style)
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.bets FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.bets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.bets FOR UPDATE USING (true);
