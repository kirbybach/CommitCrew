"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '../../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Trophy, Target, History, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import UserAvatar from '../../../components/UserAvatar';
import PrivacyText from '../../../components/PrivacyText';
import { useDemoStore } from '../../../stores/useDemoStore';
import { demoCommits, demoGoals, demoSeasons, demoUsers } from '../../../lib/demoData';

import Link from 'next/link';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isAfter } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const TIMEZONE = 'America/New_York';

// Helper to ensure dates are treated as UTC if Supabase returns valid ISO without TZ info
function parseSupabaseDate(dateStr: string | null | undefined): Date {
    if (!dateStr) return new Date();
    const safeStr = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`;
    return new Date(safeStr);
}

export default function UserProfile({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [user, setUser] = useState<any>(null);
    const [goals, setGoals] = useState<any[]>([]);
    const [completedGoals, setCompletedGoals] = useState<any[]>([]);
    const [commits, setCommits] = useState<any[]>([]);
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
    const [hovered, setHovered] = useState<{ x: number, y: number, date: string, score: number } | null>(null);
    const [shownMonth, setShownMonth] = useState(new Date());
    const [seasonTitles, setSeasonTitles] = useState(0);
    const { isDemoMode } = useDemoStore();

    useEffect(() => {
        async function fetchUserData() {
            if (!id) return;
            setLoading(true);

            if (isDemoMode) {
                const demoUser = demoUsers.find((candidate) => candidate.id === id) || null;
                const userGoals = demoGoals.filter((goal) => goal.user_id === id && goal.status === 'active');
                const completed = demoGoals.filter((goal) => goal.user_id === id && goal.status === 'completed');
                const userStats = demoCommits
                    .filter((commit) => commit.user_id === id)
                    .map(({ grade, created_at }) => ({ grade, created_at }));
                const titles = demoSeasons.filter((season) => season.status === 'completed' && season.champion_id === id).length;

                setUser(demoUser);
                setGoals(userGoals);
                setCompletedGoals(completed);
                setStats(userStats);
                setSeasonTitles(titles);
                setLoading(false);
                return;
            }

            // 1. Get User
            const { data: u } = await supabase.from('users').select('*').eq('id', id).single();
            setUser(u);

            // 2. Get Active Goals
            const { data: g } = await supabase.from('goals').select('*').eq('user_id', id).eq('status', 'active').order('created_at', { ascending: false });
            setGoals(g || []);

            // 3. Get Completed Goals
            const { data: cg } = await supabase.from('goals').select('*').eq('user_id', id).eq('status', 'completed').order('updated_at', { ascending: false });
            setCompletedGoals(cg || []);

            // 4. Get Global Stats (Lightweight) - Fetch ALL for accurate graph/score
            const allStats: any[] = [];
            let from = 0;
            const batch = 1000;
            let fetched = 0;

            do {
                const { data: s } = await supabase
                    .from('commits')
                    .select('grade, created_at')
                    .eq('user_id', id)
                    .range(from, from + batch - 1);

                if (s && s.length > 0) {
                    allStats.push(...s);
                    fetched = s.length;
                    from += batch;
                } else {
                    fetched = 0;
                }
            } while (fetched === batch);

            setStats(allStats);

            // 5. Get Season Titles Count
            const { count: titlesCount } = await supabase
                .from('seasons')
                .select('*', { count: 'exact', head: true })
                .eq('champion_id', id)
                .eq('status', 'completed');
            setSeasonTitles(titlesCount || 0);

            setLoading(false);
        }
        fetchUserData();
    }, [id, isDemoMode]);

    useEffect(() => {
        async function fetchCommits() {
            if (!id) return;
            if (isDemoMode) {
                let filtered = demoCommits.filter((commit) => commit.user_id === id);
                if (filter === 'positive') filtered = filtered.filter((commit) => commit.grade > 0);
                if (filter === 'negative') filtered = filtered.filter((commit) => commit.grade < 0);
                setCommits(filtered.slice(page * 15, (page + 1) * 15));
                return;
            }

            let query = supabase.from('commits').select('*').eq('user_id', id).order('created_at', { ascending: false });

            if (filter === 'positive') query = query.gt('grade', 0);
            if (filter === 'negative') query = query.lt('grade', 0);

            const { data: c } = await query.range(page * 15, (page + 1) * 15 - 1);
            setCommits(c || []);
        }
        fetchCommits();
    }, [id, page, filter, isDemoMode]); // Re-fetch on filter/page change

    // 3. Generate Contribution Graph (Memoized)
    // Removed useMemo since it was causing issues with reactivity on Date changes sometimes, and this is heavy enough to potentially just be simpler.
    // Re-adding simple calc.
    const dataMap = new Map<string, number>();
    stats.forEach(s => {
        const k = formatInTimeZone(parseSupabaseDate(s.created_at), TIMEZONE, 'yyyy-MM-dd');
        dataMap.set(k, (dataMap.get(k) || 0) + (s.grade || 0));
    });

    const cellSize = 14;
    const cellGap = 3;
    const totalCellSize = cellSize + cellGap;
    const cols = 7;
    const rows = 6;
    const width = cols * totalCellSize;
    const height = rows * totalCellSize;

    const monthStart = startOfMonth(shownMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const cells = [];
    let currentDate = new Date(calendarStart);
    let weekIndex = 0;

    while (currentDate <= calendarEnd) {
        for (let d = 0; d < 7; d++) {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const score = dataMap.get(dateStr) || 0;
            const isCurrentMonth = isSameMonth(currentDate, shownMonth);
            const isFuture = isAfter(currentDate, new Date());

            if (!isFuture) {
                let fill = '#262626';
                if (score > 0) {
                    if (score >= 10) fill = '#34d399';
                    else if (score >= 5) fill = '#10b981';
                    else fill = '#065f46';
                } else if (score < 0) {
                    if (score <= -5) fill = '#ef4444';
                    else fill = '#7f1d1d';
                }

                const opacity = isCurrentMonth ? 1 : 0.2;

                cells.push(
                    <rect
                        key={dateStr}
                        x={d * totalCellSize}
                        y={weekIndex * totalCellSize}
                        width={cellSize}
                        height={cellSize}
                        rx={3}
                        fill={fill}
                        fillOpacity={opacity}
                        className="transition-colors hover:opacity-80 cursor-pointer"
                        onMouseEnter={(e) => {
                            setHovered({
                                x: e.clientX,
                                y: e.clientY,
                                date: dateStr,
                                score
                            });
                        }}
                        onMouseLeave={() => setHovered(null)}
                    />
                );
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        weekIndex++;
    }

    const contributionGraph = (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            {cells}
        </svg>
    );

    if (loading) return <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">Loading...</div>;
    if (!user) return <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">User not found</div>;

    const totalScore = stats.reduce((acc, c) => acc + (c.grade || 0), 0);
    const avgGrade = stats.length > 0 ? (totalScore / stats.length).toFixed(1) : '0.0';
    const weeklyWins = user?.weekly_wins_count || 0;

    return (
        <main className="min-h-screen bg-neutral-900 text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Nav */}
                <Link href="/" className="flex items-center gap-2 text-neutral-400 hover:text-emerald-400 transition-colors">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>

                {/* Header */}
                <div className="bg-neutral-800/50 p-6 rounded-2xl border border-neutral-700/50 flex flex-col md:flex-row items-center gap-6">
                    <UserAvatar
                        name={user.name}
                        avatarUrl={user.avatar_url}
                        userId={user.id}
                        size="xl"
                        className="border-neutral-700"
                    />

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row justify-between items-center w-full">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    <PrivacyText text={user.name} id={user.id} />
                                </h1>
                                <div className="flex gap-4 justify-center md:justify-start mb-4 md:mb-0">
                                    <div className="bg-neutral-900/50 px-4 py-2 rounded-lg flex items-center gap-2 border border-neutral-700">
                                        <Trophy size={16} className="text-yellow-400" />
                                        <span className="font-bold text-lg">{totalScore}</span>
                                        <span className="text-xs text-neutral-500 uppercase">pts</span>
                                    </div>
                                    <div className="bg-neutral-900/50 px-4 py-2 rounded-lg flex items-center gap-2 border border-neutral-700">
                                        <Star size={16} className="text-emerald-400" />
                                        <span className="font-bold text-lg">{avgGrade}</span>
                                        <span className="text-xs text-neutral-500 uppercase">avg</span>
                                    </div>
                                    <div className="bg-neutral-900/50 px-4 py-2 rounded-lg flex items-center gap-2 border border-neutral-700">
                                        <Trophy size={16} className="text-yellow-400" />
                                        <span className="font-bold text-lg">{weeklyWins}</span>
                                        <span className="text-xs text-neutral-500 uppercase">Weekly wins</span>
                                    </div>
                                    {seasonTitles > 0 && (
                                        <div className="bg-neutral-900/50 px-4 py-2 rounded-lg flex items-center gap-2 border border-yellow-600/50">
                                            <span className="text-lg">👑</span>
                                            <span className="font-bold text-lg text-yellow-400">{seasonTitles}</span>
                                            <span className="text-xs text-neutral-500 uppercase">Season {seasonTitles === 1 ? 'title' : 'titles'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Contribution Graph (Month View) */}
                            <div className="flex flex-col items-center md:items-end w-full max-w-[200px]">
                                <div className="p-3 bg-neutral-900/30 rounded-xl border border-neutral-800 w-full relative">
                                    <div className="flex justify-between items-center mb-2">
                                        <button
                                            onClick={() => setShownMonth(prev => subMonths(prev, 1))}
                                            disabled={shownMonth < new Date(2026, 0, 1)}
                                            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 disabled:opacity-20"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                        <span className="text-xs font-bold text-neutral-300">{format(shownMonth, 'MMMM yyyy')}</span>
                                        <button
                                            onClick={() => setShownMonth(prev => addMonths(prev, 1))}
                                            disabled={isSameMonth(shownMonth, new Date())}
                                            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 disabled:opacity-20"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                    {contributionGraph}

                                    {/* Tooltip Portal */}
                                    {hovered && (
                                        <div
                                            className="fixed z-50 bg-neutral-800 border border-neutral-700 p-2 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-8px]"
                                            style={{ left: hovered.x, top: hovered.y }}
                                        >
                                            <div className="text-xs text-neutral-400 font-mono mb-0.5">{format(new Date(`${hovered.date}T00:00:00`), 'MMM do, yyyy')}</div>
                                            <div className={`text-sm font-bold ${hovered.score > 0 ? 'text-emerald-400' : hovered.score < 0 ? 'text-red-400' : 'text-neutral-200'}`}>
                                                {hovered.score > 0 ? '+' : ''}{hovered.score} pts
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Legend */}
                                <div className="flex items-center gap-2 mt-2 text-[10px] text-neutral-500">
                                    <span>Less</span>
                                    <div className="w-2.5 h-2.5 rounded-[1px] bg-red-500"></div>
                                    <div className="w-2.5 h-2.5 rounded-[1px] bg-neutral-800"></div>
                                    <div className="w-2.5 h-2.5 rounded-[1px] bg-emerald-800"></div>
                                    <div className="w-2.5 h-2.5 rounded-[1px] bg-emerald-500"></div>
                                    <div className="w-2.5 h-2.5 rounded-[1px] bg-emerald-400"></div>
                                    <span>More</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Goals Column */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-yellow-400">
                            <Target /> Active Goals
                        </h2>
                        <div className="space-y-3">
                            {goals.map((goal) => (
                                <div key={goal.id} className="bg-neutral-800/30 p-4 rounded-xl border border-neutral-700/50">
                                    <p className="text-neutral-200">{goal.description}</p>
                                    <span className="text-xs text-neutral-500 mt-2 block">Set {formatDistanceToNow(new Date(goal.created_at))} ago</span>
                                </div>
                            ))}
                            {goals.length === 0 && <span className="text-neutral-500 italic">No active goals.</span>}
                        </div>

                        {/* Completed Goals Section */}
                        {completedGoals.length > 0 && (
                            <>
                                <h2 className="text-xl font-semibold flex items-center gap-2 text-neutral-500 mt-8">
                                    ✅ Completed Goals
                                </h2>
                                <div className="space-y-3">
                                    {completedGoals.map((goal) => (
                                        <div key={goal.id} className="bg-neutral-800/20 p-4 rounded-xl border border-neutral-700/30">
                                            <p className="text-neutral-500 line-through">{goal.description}</p>
                                            <span className="text-xs text-neutral-600 mt-2 block">Completed {formatDistanceToNow(new Date(goal.updated_at || goal.created_at))} ago</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Commits Column */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold flex items-center gap-2 text-emerald-400">
                                <History /> Commit History
                            </h2>
                            <div className="flex bg-neutral-800 rounded-lg p-1">
                                <button
                                    onClick={() => { setFilter('all'); setPage(0); }}
                                    className={`px-3 py-1 rounded-md text-sm transition-colors ${filter === 'all' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => { setFilter('positive'); setPage(0); }}
                                    className={`px-3 py-1 rounded-md text-sm transition-colors ${filter === 'positive' ? 'bg-emerald-900/50 text-emerald-400' : 'text-neutral-400 hover:text-emerald-400'}`}
                                >
                                    Good
                                </button>
                                <button
                                    onClick={() => { setFilter('negative'); setPage(0); }}
                                    className={`px-3 py-1 rounded-md text-sm transition-colors ${filter === 'negative' ? 'bg-red-900/50 text-red-400' : 'text-neutral-400 hover:text-red-400'}`}
                                >
                                    Bad
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {commits.map((commit) => (
                                <div key={commit.id} className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50 hover:border-emerald-500/30 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs text-neutral-500">{formatDistanceToNow(parseSupabaseDate(commit.created_at))} ago</span>
                                        <span className={`font-bold ${commit.grade < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {commit.grade > 0 ? '+' : ''}{commit.grade} pts
                                        </span>
                                    </div>
                                    <p className="text-neutral-300 mb-3">{commit.message}</p>
                                    {commit.ai_feedback && (
                                        <div className={`bg-neutral-900/50 p-3 rounded-lg text-sm border-l-2 ${commit.grade < 0 ? 'border-red-500' : 'border-emerald-500'}`}>
                                            <p className="text-neutral-400 italic">&quot;{commit.ai_feedback}&quot;</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {commits.length === 0 && <span className="text-neutral-500 italic">No commits found for this filter.</span>}
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex justify-between items-center mt-6">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded transition-colors text-white"
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <span className="text-neutral-400 text-sm">Page {page + 1}</span>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={commits.length < 15}
                                className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded transition-colors text-white"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
