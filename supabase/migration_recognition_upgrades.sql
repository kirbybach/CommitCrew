-- Add Recognition & Valuation metrics to commits table
ALTER TABLE public.commits 
ADD COLUMN IF NOT EXISTS time_estimate_hours NUMERIC(4, 2),
ADD COLUMN IF NOT EXISTS ai_confidence INTEGER,
ADD COLUMN IF NOT EXISTS technical_difficulty INTEGER,
ADD COLUMN IF NOT EXISTS time_investment_score INTEGER,
ADD COLUMN IF NOT EXISTS cognitive_load INTEGER;
