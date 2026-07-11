"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { Activity, Trophy, ChevronLeft, ChevronRight, BarChart3, ClipboardList, Flag } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Components
import Header from '../components/Header';
import UserAvatar from '../components/UserAvatar';
import PrivacyText from '../components/PrivacyText';
import SeasonBanner from '../components/SeasonBanner';
import HallOfFame from '../components/HallOfFame';
import { useDemoStore } from '../stores/useDemoStore';
import { demoCommits, demoSeasons, demoUsers } from '../lib/demoData';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface SeasonAnchor {
  season_number: number;
  month: number;
  year: number;
}

interface SeasonRow extends SeasonAnchor {
  label: string;
  status: string;
  [key: string]: unknown;
}

function getCurrentEasternMonth() {
  const eastern = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return {
    month: eastern.getMonth() + 1,
    year: eastern.getFullYear()
  };
}

function monthIndex(month: number, year: number) {
  return year * 12 + (month - 1);
}

function getSeasonLabel(month: number, year: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function buildCurrentSeasonFallback(firstSeason: SeasonAnchor | null, month: number, year: number) {
  if (!firstSeason) return null;

  const offset = monthIndex(month, year) - monthIndex(firstSeason.month, firstSeason.year);
  return {
    season_number: firstSeason.season_number + Math.max(0, offset),
    month,
    year,
    label: getSeasonLabel(month, year),
    status: 'active'
  };
}

export default function Home() {
  const [commits, setCommits] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [showGraph, setShowGraph] = useState(false);
  const { isDemoMode } = useDemoStore();

  // Season state
  const [currentSeason, setCurrentSeason] = useState<any>(null);
  const [seasonView, setSeasonView] = useState<'season' | 'alltime'>('season');
  const [pastChampionIds, setPastChampionIds] = useState<Set<string>>(new Set());

  // Raw data (always all-time, filtered client-side for instant toggle)
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allStats, setAllStats] = useState<any[]>([]);

  useEffect(() => {
    fetchData(page);

    if (isDemoMode) return;

    const channel = supabase
      .channel('public:commits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commits' }, () => {
        fetchData(page);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // fetchData is defined below and intentionally keyed by page/demo mode here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isDemoMode]);

  // Derive leaderboard + graph from raw data based on seasonView (instant, no network)
  const { leaderboard, graphData } = useMemo(() => {
    if (!allUsers.length || !allStats.length) return { leaderboard: [], graphData: [] };

    // Filter stats by season if needed
    let filteredStats = allStats;
    if (seasonView === 'season' && currentSeason) {
      const seasonStart = new Date(currentSeason.year, currentSeason.month - 1, 1).getTime();
      const seasonEnd = new Date(currentSeason.year, currentSeason.month, 1).getTime();
      filteredStats = allStats.filter((c: any) => {
        const t = new Date(c.created_at).getTime();
        return t >= seasonStart && t < seasonEnd;
      });
    }

    // Build leaderboard
    const stats: any = {};
    allUsers.forEach((u: any) => {
      stats[u.id] = { uid: u.id, name: u.name, avatar_url: u.avatar_url, score: 0, count: 0, weekly_wins: u.weekly_wins_count || 0 };
    });

    const dailyPoints: any = {};
    const distinctUsers = new Set<string>();
    const sortedStats = [...filteredStats].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Also track weekly scores for computing season weekly wins
    const weeklyScores: Record<string, Record<string, number>> = {};

    sortedStats.forEach((c: any) => {
      const uid = c.user_id;
      distinctUsers.add(uid);
      if (stats[uid]) {
        stats[uid].score += (c.grade || 0);
        stats[uid].count += 1;
      }
      const dateKey = format(new Date(c.created_at), 'MM/dd');
      if (!dailyPoints[dateKey]) dailyPoints[dateKey] = {};
      if (!dailyPoints[dateKey][uid]) dailyPoints[dateKey][uid] = 0;
      dailyPoints[dateKey][uid] += (c.grade || 0);

      // Group by ISO week for weekly wins
      const d = new Date(c.created_at);
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
      const weekKey = `${d.getFullYear()}-W${weekNum}`;
      if (!weeklyScores[weekKey]) weeklyScores[weekKey] = {};
      weeklyScores[weekKey][uid] = (weeklyScores[weekKey][uid] || 0) + (c.grade || 0);
    });

    // Compute weekly wins: for each week, find who scored the most
    // We strive for consistency: always compute from the loaded stats, 
    // whether filtered by season or all-time (unfiltered).
    const seasonWins: Record<string, number> = {};

    // Calculate current week key to exclude it (only count completed weeks)
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const currentWeekNum = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    const currentWeekKey = `${now.getFullYear()}-W${currentWeekNum}`;

    Object.entries(weeklyScores).forEach(([weekKey, week]) => {
      if (weekKey === currentWeekKey) return; // Skip incomplete week

      let maxScore = 0;
      let winners: string[] = [];
      Object.entries(week).forEach(([uid, score]) => {
        if (score > maxScore) { maxScore = score; winners = [uid]; }
        else if (score === maxScore) { winners.push(uid); }
      });
      if (maxScore > 0) winners.forEach(w => { seasonWins[w] = (seasonWins[w] || 0) + 1; });
    });

    // Override whatever was in the DB with our computed values
    Object.keys(stats).forEach(uid => { stats[uid].weekly_wins = seasonWins[uid] || 0; });

    // Graph
    const dates = Object.keys(dailyPoints);
    const cumulative: any = {};
    const graphPoints: any[] = [];
    dates.forEach(date => {
      const point: any = { date };
      distinctUsers.forEach(uid => {
        cumulative[uid] = (cumulative[uid] || 0) + (dailyPoints[date][uid] || 0);
        point[uid] = cumulative[uid];
      });
      graphPoints.push(point);
    });

    const lb = Object.values(stats).sort((a: any, b: any) => b.score - a.score);
    return { leaderboard: lb, graphData: graphPoints };
  }, [allUsers, allStats, seasonView, currentSeason]);

  // Season leader — always computed from season data, independent of toggle
  const seasonLeader = useMemo(() => {
    if (!allUsers.length || !allStats.length || !currentSeason) return null;
    const seasonStart = new Date(currentSeason.year, currentSeason.month - 1, 1).getTime();
    const seasonEnd = new Date(currentSeason.year, currentSeason.month, 1).getTime();
    const scores: Record<string, { id: string; name: string; score: number }> = {};
    allUsers.forEach((u: any) => { scores[u.id] = { id: u.id, name: u.name, score: 0 }; });
    allStats.forEach((c: any) => {
      const t = new Date(c.created_at).getTime();
      if (t >= seasonStart && t < seasonEnd && scores[c.user_id]) {
        scores[c.user_id].score += (c.grade || 0);
      }
    });
    const sorted = Object.values(scores).filter(u => u.score > 0).sort((a, b) => b.score - a.score);
    return sorted.length > 0 ? sorted[0] : null;
  }, [allUsers, allStats, currentSeason]);

  const displaySeasonLeader = seasonLeader;
  const displayLeaderboard = leaderboard;

  const displayGraphData = useMemo(() => {
    const nameMap = new Map<string, string>();
    leaderboard.forEach((u: any) => nameMap.set(u.uid, u.name));
    return graphData.map((point: any) => {
      const newPoint: any = { date: point.date };
      Object.keys(point).forEach(key => {
        if (key !== 'date') {
          const uid = key;
          const displayName = nameMap.get(uid) || 'Unknown';
          newPoint[displayName] = point[uid];
        }
      });
      return newPoint;
    });
  }, [graphData, leaderboard]);

  const boardStats = useMemo(() => {
    return {
      totalPoints: leaderboard.reduce((sum: number, user: any) => sum + (user.score || 0), 0),
      totalCommits: leaderboard.reduce((sum: number, user: any) => sum + (user.count || 0), 0),
      activePlayers: leaderboard.filter((user: any) => (user.score || 0) > 0).length,
    };
  }, [leaderboard]);


  async function fetchData(pageNum: number) {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        const feed = demoCommits.slice(pageNum * 15, (pageNum + 1) * 15);
        const activeSeason = demoSeasons.find((season) => season.status === 'active') || null;
        const championIds = new Set<string>(
          demoSeasons
            .filter((season) => season.status === 'completed' && season.champion_id)
            .map((season) => season.champion_id as string)
        );

        setAllUsers(demoUsers);
        setCurrentSeason(activeSeason);
        setPastChampionIds(championIds);
        setCommits(feed);
        setAllStats(demoCommits.map(({ user_id, grade, created_at }) => ({ user_id, grade, created_at })));
        return;
      }

      // 1. Get All Users
      const { data: users } = await supabase.from('users').select('*');
      if (users) setAllUsers(users);

      // 1b. Get current season. Be tolerant of stale/duplicate active rows while the bot repairs history.
      const currentMonth = getCurrentEasternMonth();
      const { data: activeSeasons } = await supabase
        .from('seasons')
        .select('*')
        .eq('status', 'active')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      const { data: firstSeason } = await supabase
        .from('seasons')
        .select('season_number, month, year')
        .order('year', { ascending: true })
        .order('month', { ascending: true })
        .limit(1)
        .maybeSingle();
      const expectedCurrentSeason = buildCurrentSeasonFallback(firstSeason, currentMonth.month, currentMonth.year);
      const activeCurrentSeason = ((activeSeasons || []) as SeasonRow[]).find((season) =>
        season.month === currentMonth.month && season.year === currentMonth.year
      );
      setCurrentSeason(
        activeCurrentSeason && expectedCurrentSeason
          ? { ...activeCurrentSeason, season_number: expectedCurrentSeason.season_number, label: expectedCurrentSeason.label }
          : activeCurrentSeason || expectedCurrentSeason
      );

      // 1c. Get past champion IDs
      const { data: pastSeasons } = await supabase
        .from('seasons').select('champion_id').eq('status', 'completed');
      const championIds = new Set<string>(
        (pastSeasons || []).map((s: any) => s.champion_id).filter(Boolean)
      );
      setPastChampionIds(championIds);

      // 2a. Get Commits for Feed (Paginated)
      const { data: feedData } = await supabase
        .from('commits')
        .select('*, users(name, avatar_url)')
        .order('created_at', { ascending: false })
        .range(pageNum * 15, (pageNum + 1) * 15 - 1);

      // 2b. Get ALL Stats (always all-time, filtered client-side)
      const { data: statsData } = await supabase
        .from('commits')
        .select('user_id, grade, created_at')
        .order('created_at', { ascending: false })
        .limit(10000);

      if (feedData) setCommits(feedData);
      if (statsData) setAllStats(statsData);

    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  }

  // Generate colors for lines
  const colors = ['#1f6b47', '#d6a536', '#4a90d9', '#d94f45', '#8b5cf6'];

  return (
    <main className="clubhouse-page">
      <div className="clubhouse-shell space-y-7">

        {/* Extracted Header */}
        <Header />
        <SeasonBanner
          season={currentSeason}
          leader={displaySeasonLeader}
        />

        <section className="sketch-card tournament-board-panel overflow-hidden">
          <div className="flex flex-col gap-4 border-b-2 border-[#fffdf7]/35 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase text-[#f3df9c]">
                <Flag size={15} />
                Tournament Board
              </p>
              <h2 className="mt-1 text-3xl font-black sm:text-4xl">
                {currentSeason ? `Season ${currentSeason.season_number} Standings` : 'Season Standings'}
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-black uppercase">
              <div className="border-2 border-[#fffdf7]/60 px-3 py-2">
                <span className="block font-mono text-xl">{boardStats.activePlayers}</span>
                Players
              </div>
              <div className="border-2 border-[#fffdf7]/60 px-3 py-2">
                <span className="block font-mono text-xl">{boardStats.totalCommits}</span>
                Commits
              </div>
              <div className="border-2 border-[#fffdf7]/60 px-3 py-2">
                <span className="block font-mono text-xl">{boardStats.totalPoints}</span>
                Points
              </div>
            </div>
          </div>

          <div className="px-4 py-2 sm:px-5">
            <div className="scoreboard-grid scoreboard-header py-2">
              <span>Rank</span>
              <span>Player</span>
              <span className="hidden text-right sm:block">Wins</span>
              <span className="hidden text-right sm:block">Commits</span>
              <span className="text-right">Total</span>
            </div>
            {displayLeaderboard.map((user: any, i) => (
              <Link
                href={`/user/${user.uid}`}
                key={user.uid}
                className="scoreboard-grid scoreboard-row py-3 transition-colors hover:bg-[#fffdf7]/10"
              >
                <span className="scoreboard-rank">#{i + 1}</span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 truncate text-lg font-black pii-safe">
                    {pastChampionIds.has(user.uid) && <Trophy size={16} className="shrink-0 text-[#f3df9c]" />}
                    {user.name}
                  </span>
                  {i === 0 && <span className="text-xs font-black uppercase text-[#f3df9c]">Current leader</span>}
                </span>
                <span className="scoreboard-number hidden sm:block">{user.weekly_wins || 0}</span>
                <span className="scoreboard-number hidden sm:block">{user.count || 0}</span>
                <span className="scoreboard-number text-[#f3df9c]">{user.score}</span>
              </Link>
            ))}
            {leaderboard.length === 0 && (
              <div className="border-t border-[#fffdf7]/25 py-6 text-center text-sm font-bold text-[#fffdf7]/70">
                Waiting for the first commit.
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">

          {/* Main Feed */}
          <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-black uppercase text-[var(--club-green)]">
                  <Activity size={16} /> Latest from the clubhouse
                </p>
                <h2 className="wavy-title text-3xl font-black text-[var(--ink)]">Commit Slips</h2>
              </div>
              <span className="sketch-card-soft inline-flex w-fit items-center gap-2 px-3 py-2 text-sm font-bold text-[var(--muted-ink)]">
                <ClipboardList size={16} />
                {isDemoMode ? 'Fictional public demo data' : 'Live crew feed'}
              </span>
            </div>

            <div className="space-y-4">
              {commits.map((commit) => (
                <article key={commit.id} className="paper-slip p-4 pt-5 transition-transform hover:-translate-y-0.5 sm:p-5 sm:pt-6">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <Link href={`/user/${commit.user_id}`} className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80">

                      {/* Avatar Component */}
                      <UserAvatar
                        name={commit.users?.name}
                        avatarUrl={commit.users?.avatar_url}
                        userId={commit.user_id}
                      />

                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-lg font-black text-[var(--ink)] transition-colors hover:text-[var(--club-green)]">
                          {/* Privacy Text Component */}
                          <PrivacyText text={commit.users?.name} id={commit.user_id} />
                        </span>
                        <span className="text-xs font-bold uppercase text-[var(--muted-ink)]">commit filed</span>
                      </div>
                    </Link>
                    <span className="shrink-0 text-right text-xs font-bold text-[var(--muted-ink)]">{formatDistanceToNow(new Date(commit.created_at))} ago</span>
                  </div>

                  <p className="mb-4 text-lg font-semibold leading-relaxed text-[var(--ink)]">{commit.message}</p>

                  {commit.ai_feedback && (
                    <div className="scorekeeper-note p-3 text-sm">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="text-xs font-black uppercase text-[var(--club-green)]">Scorekeeper&apos;s Note</span>
                        <span className={`font-mono text-lg font-black ${commit.grade < 0 ? 'text-[var(--pencil-red)]' : 'text-[var(--club-green)]'}`}>
                          {commit.grade > 0 ? '+' : ''}{commit.grade} pts
                        </span>
                      </div>
                      <p className="font-semibold text-[var(--muted-ink)]">&quot;{commit.ai_feedback}&quot;</p>
                    </div>
                  )}
                </article>
              ))}

              {commits.length === 0 && (
                <div className="sketch-card-soft py-12 text-center font-bold text-[var(--muted-ink)]">
                  No commits yet. Waiting for the crew to post a win.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isLoading}
                className="clubhouse-button px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-sm font-black text-[var(--muted-ink)]">Page {page + 1}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={commits.length < 15 || isLoading}
                className="clubhouse-button px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xl font-black text-[var(--club-green)]">
                  <BarChart3 /> Momentum
                </h2>
                <button
                  onClick={() => setShowGraph(!showGraph)}
                  className="clubhouse-button px-2 py-1 text-xs"
                >
                  {showGraph ? 'Show List' : 'Show Graph'}
                </button>
              </div>
              {/* Season / All-Time toggle */}
              <div className="sketch-card-soft flex gap-1 p-1">
                <button
                  onClick={() => setSeasonView('season')}
                  className={`flex-1 rounded-[4px] py-1.5 text-xs font-black transition-all ${seasonView === 'season'
                    ? 'bg-[var(--board-green)] text-[#fffdf7]'
                    : 'text-[var(--muted-ink)] hover:bg-[var(--paper-deep)]'
                    }`}
                >
                  {currentSeason ? `Season ${currentSeason.season_number}` : 'Season'}
                </button>
                <button
                  onClick={() => setSeasonView('alltime')}
                  className={`flex-1 rounded-[4px] py-1.5 text-xs font-black transition-all ${seasonView === 'alltime'
                    ? 'bg-[var(--board-green)] text-[#fffdf7]'
                    : 'text-[var(--muted-ink)] hover:bg-[var(--paper-deep)]'
                    }`}
                >
                  All-Time
                </button>
              </div>
            </section>

            <div className="chart-panel min-h-[300px] p-4">
              {showGraph ? (
                <div className="h-[300px] w-full -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayGraphData}>
                      <XAxis dataKey="date" stroke="#5f5a50" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--card)', border: '2px solid var(--line)', borderRadius: '6px', boxShadow: 'var(--shadow-soft)' }}
                        itemStyle={{ color: 'var(--ink)', fontWeight: 700 }}
                        labelStyle={{ color: 'var(--club-green)', fontWeight: 900 }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px', color: 'var(--ink)' }} />

                      {displayLeaderboard.slice(0, 5).map((user: any, i) => (
                        <Line
                          key={user.uid}
                          type="linear"
                          dataKey={user.name}
                          stroke={colors[i % colors.length]}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayLeaderboard.map((user: any, i) => (
                    <Link href={`/user/${user.uid}`} key={user.uid} className="group flex items-center justify-between border-b-2 border-[var(--soft-line)] p-2 transition-colors last:border-b-0 hover:bg-[var(--paper-deep)]">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`w-6 font-mono font-black ${i === 0 ? 'text-[var(--gold)]' : 'text-[var(--muted-ink)]'}`}>#{i + 1}</span>
                        <span className="truncate font-black transition-colors group-hover:text-[var(--club-green)] pii-safe">
                          {pastChampionIds.has(user.uid) && <Trophy size={14} className="mr-1 inline text-[var(--gold)]" />}
                          {user.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-bold">
                        <div className="flex items-center gap-1 text-sm text-[var(--gold)]" title={seasonView === 'season' ? 'Weekly Wins (this season)' : 'Weekly Wins (all-time)'}>
                          <Trophy size={14} />
                          <span className="font-semibold">{user.weekly_wins || 0}</span>
                        </div>
                        <span className="font-mono font-black text-[var(--club-green)]">{user.score} pts</span>
                      </div>
                    </Link>
                  ))}
                  {leaderboard.length === 0 && <span className="text-sm font-bold text-[var(--muted-ink)]">No data yet.</span>}
                </div>
              )}
            </div>

            {/* Hall of Fame */}
            <HallOfFame />
          </aside>

        </div>

      </div>
    </main >
  );
}
