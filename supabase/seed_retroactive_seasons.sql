-- Seed: Retroactive seasons for January 2026 (completed) and February 2026 (active)
-- Run this AFTER migration_seasons.sql
-- Uses EST (America/New_York) timezone boundaries

-- ============================================================
-- Season 1: January 2026 (Completed)
-- ============================================================

WITH jan_stats AS (
  SELECT
    c.user_id,
    u.name,
    SUM(c.grade) AS score,
    COUNT(*) AS commit_count
  FROM commits c
  JOIN users u ON u.id = c.user_id
  WHERE c.created_at >= '2026-01-01T00:00:00-05:00'
    AND c.created_at < '2026-02-01T00:00:00-05:00'
  GROUP BY c.user_id, u.name
),
jan_ranked AS (
  SELECT
    user_id,
    name,
    score,
    commit_count,
    RANK() OVER (ORDER BY score DESC) AS rank
  FROM jan_stats
),
jan_standings AS (
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', user_id,
      'name', name,
      'score', score,
      'rank', rank,
      'commit_count', commit_count
    ) ORDER BY rank ASC, name ASC
  ) AS standings_json
  FROM jan_ranked
),
jan_champion AS (
  SELECT user_id, name, score
  FROM jan_ranked
  WHERE rank = 1
  ORDER BY name ASC
  LIMIT 1
)
INSERT INTO seasons (season_number, month, year, label, status, champion_id, champion_name, champion_score, standings, finalized_at)
SELECT
  1,
  1,
  2026,
  'January 2026',
  'completed',
  jc.user_id,
  jc.name,
  jc.score,
  COALESCE(js.standings_json, '[]'::jsonb),
  '2026-02-01T00:00:00-05:00'::timestamptz
FROM jan_champion jc, jan_standings js
ON CONFLICT (month, year) DO NOTHING;

-- If January had zero commits, still insert a season with null champion
INSERT INTO seasons (season_number, month, year, label, status, champion_id, champion_name, champion_score, standings, finalized_at)
SELECT 1, 1, 2026, 'January 2026', 'completed', NULL, NULL, NULL, '[]'::jsonb, '2026-02-01T00:00:00-05:00'::timestamptz
WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE month = 1 AND year = 2026);

-- ============================================================
-- Season 2: February 2026 (Active - in progress)
-- ============================================================

INSERT INTO seasons (season_number, month, year, label, status)
VALUES (2, 2, 2026, 'February 2026', 'active')
ON CONFLICT (month, year) DO NOTHING;
