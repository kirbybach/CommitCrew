"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { Activity, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Components
import Header from '../components/Header';
import UserAvatar from '../components/UserAvatar';
import PrivacyText from '../components/PrivacyText';
import SeasonBanner from '../components/SeasonBanner';
import HallOfFame from '../components/HallOfFame';
import { useDemoStore } from '../stores/useDemoStore';
import { anonymize } from '../utils/anonymizer';
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
  const [mounted, setMounted] = useState(false);

  // Season state
  const [currentSeason, setCurrentSeason] = useState<any>(null);
  const [seasonView, setSeasonView] = useState<'season' | 'alltime'>('season');
  const [pastChampionIds, setPastChampionIds] = useState<Set<string>>(new Set());

  // Raw data (always all-time, filtered client-side for instant toggle)
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allStats, setAllStats] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const displaySeasonLeader = useMemo(() => {
    if (!seasonLeader) return null;
    if (isDemoMode) {
      return {
        ...seasonLeader,
        name: anonymize(seasonLeader.id, 'name')
      };
    }
    return seasonLeader;
  }, [seasonLeader, isDemoMode]);

  // Derived State for Anonymized Charts
  const displayLeaderboard = useMemo(() => {
    if (!mounted || !isDemoMode) return leaderboard;
    return leaderboard.map((u: any) => ({
      ...u,
      name: anonymize(u.uid, 'name')
    }));
  }, [leaderboard, isDemoMode, mounted]);

  const displayGraphData = useMemo(() => {
    if (!mounted) return graphData;
    const nameMap = new Map<string, string>();
    leaderboard.forEach((u: any) => nameMap.set(u.uid, u.name));
    return graphData.map((point: any) => {
      const newPoint: any = { date: point.date };
      Object.keys(point).forEach(key => {
        if (key !== 'date') {
          const uid = key;
          const displayName = isDemoMode ? anonymize(uid, 'name') : (nameMap.get(uid) || 'Unknown');
          newPoint[displayName] = point[uid];
        }
      });
      return newPoint;
    });
  }, [graphData, isDemoMode, mounted, leaderboard]);


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
  const colors = ['#34d399', '#facc15', '#60a5fa', '#f472b6', '#a78bfa'];

  return (
    <main className="min-h-screen bg-neutral-900 text-white p-8 font-sans relative">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Extracted Header */}
        <Header />
        <SeasonBanner
          season={currentSeason}
          leader={displaySeasonLeader}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Main Feed */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-emerald-400">
              <Activity /> Recent Activity
            </h2>

            <div className="space-y-4">
              {commits.map((commit) => (
                <div key={commit.id} className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50 hover:border-emerald-500/30 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/user/${commit.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">

                      {/* Avatar Component */}
                      <UserAvatar
                        name={commit.users?.name}
                        avatarUrl={commit.users?.avatar_url}
                        userId={commit.user_id}
                      />

                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-200 hover:text-emerald-400 transition-colors">
                          {/* Privacy Text Component */}
                          <PrivacyText text={commit.users?.name} id={commit.user_id} />
                        </span>
                      </div>
                    </Link>
                    <span className="text-xs text-neutral-500">{formatDistanceToNow(new Date(commit.created_at))} ago</span>
                  </div>

                  <p className="text-neutral-300 mb-3">{commit.message}</p>

                  {commit.ai_feedback && (
                    <div className={`bg-neutral-900/50 p-3 rounded-lg text-sm border-l-2 ${commit.grade < 0 ? 'border-red-500' : 'border-emerald-500'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-bold uppercase tracking-wider ${commit.grade < 0 ? 'text-red-500' : 'text-emerald-500'}`}>AI Coach</span>
                        <span className={`font-bold ${commit.grade < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {commit.grade > 0 ? '+' : ''}{commit.grade} pts
                        </span>
                      </div>
                      <p className="text-neutral-400 italic">&quot;{commit.ai_feedback}&quot;</p>
                    </div>
                  )}
                </div>
              ))}

              {commits.length === 0 && (
                <div className="text-center text-neutral-500 py-12">
                  No commits yet. Waiting for WhatsApp messages...
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isLoading}
                className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded transition-colors text-white"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-neutral-400 text-sm">Page {page + 1}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={commits.length < 15 || isLoading}
                className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded transition-colors text-white"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-yellow-400">
                  <Trophy /> Leaderboard
                </h2>
                <button
                  onClick={() => setShowGraph(!showGraph)}
                  className="text-xs bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded text-neutral-400 transition-colors"
                >
                  {showGraph ? 'Show List' : 'Show Graph'}
                </button>
              </div>
              {/* Season / All-Time toggle */}
              <div className="flex bg-neutral-800/50 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setSeasonView('season')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${seasonView === 'season'
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/10'
                    : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                >
                  {currentSeason ? `Season ${currentSeason.season_number}` : 'Season'}
                </button>
                <button
                  onClick={() => setSeasonView('alltime')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${seasonView === 'alltime'
                    ? 'bg-neutral-700 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                >
                  All-Time
                </button>
              </div>
            </div>

            <div className="bg-neutral-800/30 rounded-xl p-4 border border-neutral-700/50 min-h-[300px]">
              {showGraph ? (
                <div className="h-[300px] w-full -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayGraphData}>
                      <XAxis dataKey="date" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                        itemStyle={{ color: '#e5e5e5' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />

                      {/* Need to map names dynamically here since keys change in demo mode */}
                      {displayLeaderboard.slice(0, 5).map((user: any, i) => (
                        <Line
                          key={user.uid}
                          type="linear"
                          // Use the anonymized name here if demo mode, else real name.
                          // displayLeaderboard already has 'name' anonymized, so we use user.name!
                          // AND graphData needs to match these keys. 
                          // displayGraphData also hashes keys if demo mode.
                          // So user.name SHOULD match keys in displayGraphData.
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
                    <Link href={`/user/${user.uid}`} key={i} className="flex items-center justify-between p-2 rounded hover:bg-neutral-700/30 transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-bold w-4 ${i === 0 ? 'text-yellow-400' : 'text-neutral-500'}`}>#{i + 1}</span>
                        <span className="group-hover:text-emerald-400 transition-colors pii-safe">
                          {pastChampionIds.has(user.uid) && <span title="Past Season Champion" className="mr-1">👑</span>}
                          {user.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-yellow-400 text-sm" title={seasonView === 'season' ? 'Weekly Wins (this season)' : 'Weekly Wins (all-time)'}>
                          <Trophy size={14} />
                          <span className="font-semibold">{user.weekly_wins || 0}</span>
                        </div>
                        <span className="font-bold text-emerald-400">{user.score} pts</span>
                      </div>
                    </Link>
                  ))}
                  {leaderboard.length === 0 && <span className="text-neutral-500 text-sm">No data yet.</span>}
                </div>
              )}
            </div>

            {/* Hall of Fame */}
            <HallOfFame />
          </div>

        </div>

      </div>
    </main >
  );
}
