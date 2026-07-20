"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '../../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Trophy, Target, History, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import UserAvatar from '../../../components/UserAvatar';
import PrivacyText from '../../../components/PrivacyText';
import ThemeToggle from '../../../components/ThemeToggle';
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
                let fill = 'var(--activity-empty)';
                if (score > 0) {
                    if (score >= 10) fill = 'var(--activity-high)';
                    else if (score >= 5) fill = 'var(--activity-medium)';
                    else fill = 'var(--activity-low)';
                } else if (score < 0) {
                    if (score <= -5) fill = 'var(--activity-negative-high)';
                    else fill = 'var(--activity-negative-low)';
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

    if (loading) return <main className="clubhouse-page flex items-center justify-center p-4"><div className="sketch-card px-6 py-4 font-bold">Loading profile...</div></main>;
    if (!user) return <main className="clubhouse-page flex items-center justify-center p-4"><div className="sketch-card px-6 py-4 font-bold">User not found</div></main>;

    const totalScore = stats.reduce((acc, c) => acc + (c.grade || 0), 0);
    const avgGrade = stats.length > 0 ? (totalScore / stats.length).toFixed(1) : '0.0';
    const weeklyWins = user?.weekly_wins_count || 0;

    return (
        <main className="clubhouse-page">
            <div className="clubhouse-shell space-y-6 sm:space-y-8">

                {/* Nav */}
                <nav className="flex items-center justify-between gap-3" aria-label="Profile navigation">
                    <Link href="/" className="clubhouse-button w-fit px-3 py-2 text-sm font-bold">
                        <ArrowLeft size={20} /> Back to Dashboard
                    </Link>
                    <ThemeToggle />
                </nav>

                {/* Header */}
                <section className="clubhouse-hero profile-hero sketch-card flex flex-col items-center gap-5 p-4 sm:p-6 md:flex-row md:items-stretch">
                    <UserAvatar
                        name={user.name}
                        avatarUrl={user.avatar_url}
                        userId={user.id}
                        size="xl"
                        className="border-[var(--line)]"
                    />

                    <div className="relative z-10 flex-1 text-center md:text-left">
                        <div className="flex h-full w-full flex-col items-center justify-between gap-5 lg:flex-row lg:items-center">
                            <div className="w-full">
                                <h1 className="mb-3 text-3xl font-black text-[#fffdf7] sm:text-4xl">
                                    <PrivacyText text={user.name} id={user.id} />
                                </h1>
                                <div className="profile-stats grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center md:justify-start">
                                    <div className="profile-stat">
                                        <Trophy size={16} className="text-[var(--gold)]" />
                                        <span className="font-bold text-lg">{totalScore}</span>
                                        <span className="text-xs uppercase text-white/65">pts</span>
                                    </div>
                                    <div className="profile-stat">
                                        <Star size={16} className="text-[var(--gold)]" />
                                        <span className="font-bold text-lg">{avgGrade}</span>
                                        <span className="text-xs uppercase text-white/65">avg</span>
                                    </div>
                                    <div className="profile-stat">
                                        <Trophy size={16} className="text-[var(--gold)]" />
                                        <span className="font-bold text-lg">{weeklyWins}</span>
                                        <span className="text-xs uppercase text-white/65">Weekly wins</span>
                                    </div>
                                    {seasonTitles > 0 && (
                                        <div className="profile-stat border-[var(--gold)]">
                                            <span className="text-lg">👑</span>
                                            <span className="text-lg font-bold text-[var(--gold)]">{seasonTitles}</span>
                                            <span className="text-xs uppercase text-white/65">Season {seasonTitles === 1 ? 'title' : 'titles'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Contribution Graph (Month View) */}
                            <div className="flex w-full max-w-[240px] flex-col items-center lg:items-end">
                                <div className="profile-activity relative w-full p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <button
                                            onClick={() => setShownMonth(prev => subMonths(prev, 1))}
                                            disabled={shownMonth < new Date(2026, 0, 1)}
                                            className="rounded p-1 text-white/75 hover:bg-white/10 disabled:opacity-20"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                        <span className="text-xs font-bold text-white">{format(shownMonth, 'MMMM yyyy')}</span>
                                        <button
                                            onClick={() => setShownMonth(prev => addMonths(prev, 1))}
                                            disabled={isSameMonth(shownMonth, new Date())}
                                            className="rounded p-1 text-white/75 hover:bg-white/10 disabled:opacity-20"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                    {contributionGraph}

                                    {/* Tooltip Portal */}
                                    {hovered && (
                                        <div
                                            className="sketch-card fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full p-2 text-[var(--ink)]"
                                            style={{ left: hovered.x, top: hovered.y }}
                                        >
                                            <div className="mb-0.5 font-mono text-xs text-[var(--muted-ink)]">{format(new Date(`${hovered.date}T00:00:00`), 'MMM do, yyyy')}</div>
                                            <div className={`text-sm font-bold ${hovered.score > 0 ? 'text-[var(--score-green)]' : hovered.score < 0 ? 'text-[var(--pencil-red)]' : 'text-[var(--ink)]'}`}>
                                                {hovered.score > 0 ? '+' : ''}{hovered.score} pts
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Legend */}
                                <div className="mt-2 flex items-center gap-2 text-[10px] text-white/65">
                                    <span>Less</span>
                                    <i className="activity-key bg-[var(--activity-negative-high)]" />
                                    <i className="activity-key bg-[var(--activity-empty)]" />
                                    <i className="activity-key bg-[var(--activity-low)]" />
                                    <i className="activity-key bg-[var(--activity-medium)]" />
                                    <i className="activity-key bg-[var(--activity-high)]" />
                                    <span>More</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">

                    {/* Goals Column */}
                    <div className="space-y-6">
                        <h2 className="flex items-center gap-2 text-xl font-black text-[var(--club-green)]">
                            <Target /> Active Goals
                        </h2>
                        <div className="space-y-3">
                            {goals.map((goal) => (
                                <div key={goal.id} className="paper-slip p-4">
                                    <p>{goal.description}</p>
                                    <span className="mt-2 block text-xs text-[var(--muted-ink)]">Set {formatDistanceToNow(new Date(goal.created_at))} ago</span>
                                </div>
                            ))}
                            {goals.length === 0 && <span className="italic text-[var(--muted-ink)]">No active goals.</span>}
                        </div>

                        {/* Completed Goals Section */}
                        {completedGoals.length > 0 && (
                            <>
                                <h2 className="mt-8 flex items-center gap-2 text-xl font-black text-[var(--muted-ink)]">
                                    ✅ Completed Goals
                                </h2>
                                <div className="space-y-3">
                                    {completedGoals.map((goal) => (
                                        <div key={goal.id} className="paper-slip p-4 opacity-75">
                                            <p className="line-through text-[var(--muted-ink)]">{goal.description}</p>
                                            <span className="mt-2 block text-xs text-[var(--muted-ink)]">Completed {formatDistanceToNow(new Date(goal.updated_at || goal.created_at))} ago</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Commits Column */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="flex items-center gap-2 text-xl font-black text-[var(--club-green)]">
                                <History /> Commit History
                            </h2>
                            <div className="grid grid-cols-3 rounded border-2 border-[var(--line)] bg-[var(--paper-deep)] p-1">
                                <button
                                    onClick={() => { setFilter('all'); setPage(0); }}
                                    className={`rounded px-3 py-1 text-sm font-bold ${filter === 'all' ? 'bg-[var(--board-green)] text-white' : 'text-[var(--muted-ink)]'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => { setFilter('positive'); setPage(0); }}
                                    className={`rounded px-3 py-1 text-sm font-bold ${filter === 'positive' ? 'bg-[var(--board-green)] text-white' : 'text-[var(--muted-ink)]'}`}
                                >
                                    Good
                                </button>
                                <button
                                    onClick={() => { setFilter('negative'); setPage(0); }}
                                    className={`rounded px-3 py-1 text-sm font-bold ${filter === 'negative' ? 'bg-[var(--pencil-red)] text-white' : 'text-[var(--muted-ink)]'}`}
                                >
                                    Bad
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {commits.map((commit) => (
                                <div key={commit.id} className="paper-slip p-4">
                                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                                        <span className="text-xs text-[var(--muted-ink)]">{formatDistanceToNow(parseSupabaseDate(commit.created_at))} ago</span>
                                        <span className={`font-bold ${commit.grade < 0 ? 'text-[var(--pencil-red)]' : 'text-[var(--score-green)]'}`}>
                                            {commit.grade > 0 ? '+' : ''}{commit.grade} pts
                                        </span>
                                    </div>
                                    <p className="mb-3 break-words">{commit.message}</p>
                                    {commit.ai_feedback && (
                                        <div className={`rounded bg-[var(--paper-deep)] p-3 text-sm border-l-4 ${commit.grade < 0 ? 'border-[var(--pencil-red)]' : 'border-[var(--score-green)]'}`}>
                                            <p className="italic text-[var(--muted-ink)]">&quot;{commit.ai_feedback}&quot;</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {commits.length === 0 && <span className="italic text-[var(--muted-ink)]">No commits found for this filter.</span>}
                        </div>

                        {/* Pagination Controls */}
                        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="clubhouse-button justify-self-start px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <span className="text-sm font-bold text-[var(--muted-ink)]">Page {page + 1}</span>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={commits.length < 15}
                                className="clubhouse-button justify-self-end px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
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
