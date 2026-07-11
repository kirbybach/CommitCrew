"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, ChevronDown, ChevronUp, Medal } from 'lucide-react';
import { useDemoStore } from '../stores/useDemoStore';
import { demoSeasons } from '../lib/demoData';

interface Standing {
    user_id: string;
    name: string;
    score: number;
    rank: number;
    commit_count: number;
}

interface Season {
    id: string;
    season_number: number;
    label: string;
    status: string;
    champion_id: string | null;
    champion_name: string | null;
    champion_score: number | null;
    standings: Standing[] | null;
}

export default function HallOfFame() {
    const [pastSeasons, setPastSeasons] = useState<Season[]>([]);
    const [expandedSeason, setExpandedSeason] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { isDemoMode } = useDemoStore();

    useEffect(() => {
        async function fetchPastSeasons() {
            if (isDemoMode) {
                setPastSeasons(demoSeasons.filter((season) => season.status === 'completed') as Season[]);
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('seasons')
                .select('*')
                .eq('status', 'completed')
                .order('season_number', { ascending: false });

            setPastSeasons(data || []);
            setLoading(false);
        }
        fetchPastSeasons();
    }, [isDemoMode]);

    if (loading || pastSeasons.length === 0) return null;

    const medalLabels = ['1st', '2nd', '3rd'];
    const medalColors = ['text-[var(--gold)]', 'text-[var(--muted-ink)]', 'text-[var(--bronze)]'];

    return (
        <section className="mt-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase text-[var(--club-green)]">
                <Trophy size={16} /> Trophy Shelf
            </h3>

            <div className="space-y-2">
                {pastSeasons.map((season) => {
                    const isExpanded = expandedSeason === season.id;
                    const standings = season.standings || [];
                    const top3 = standings.slice(0, 3);

                    return (
                        <div
                            key={season.id}
                            className="trophy-plaque overflow-hidden transition-all"
                        >
                            {/* Header — always visible */}
                            <button
                                onClick={() => setExpandedSeason(isExpanded ? null : season.id)}
                                className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-[var(--paper-deep)]"
                            >
                                <div>
                                    <span className="block text-sm font-black text-[var(--ink)]">
                                        Season {season.season_number}
                                    </span>
                                    <span className="text-xs font-bold text-[var(--muted-ink)]">{season.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {season.champion_name && season.champion_id && (
                                        <span className="hidden text-right text-xs font-black sm:block">
                                            <span className="text-[var(--gold)] pii-safe">{season.champion_name}</span>
                                            <span className="ml-1 text-[var(--muted-ink)]">({season.champion_score} pts)</span>
                                        </span>
                                    )}
                                    {isExpanded ? <ChevronUp size={16} className="text-[var(--muted-ink)]" /> : <ChevronDown size={16} className="text-[var(--muted-ink)]" />}
                                </div>
                            </button>

                            {/* Expanded: Full standings */}
                            {isExpanded && standings.length > 0 && (
                                <div className="border-t-2 border-[var(--line)] px-3 pb-3">
                                    {/* Podium — Top 3 */}
                                    <div className="grid grid-cols-3 gap-2 py-4">
                                        {top3.map((user, i) => (
                                            <div key={user.user_id} className="border-2 border-[var(--line)] bg-white p-2 text-center shadow-[2px_2px_0_var(--line)]">
                                                <div className={`mb-1 flex items-center justify-center gap-1 text-xs font-black ${medalColors[i]}`}>
                                                    <Medal size={14} /> {medalLabels[i]}
                                                </div>
                                                <div className={`truncate text-sm font-black ${medalColors[i]} pii-safe`}>{user.name}</div>
                                                <div className="text-xs font-bold text-[var(--muted-ink)]">{user.score} pts</div>
                                                <div className="text-[10px] font-bold uppercase text-[var(--muted-ink)]">{user.commit_count} commits</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Full List (if more than 3) */}
                                    {standings.length > 3 && (
                                        <div className="space-y-1 border-t-2 border-[var(--soft-line)] pt-2">
                                            {standings.slice(3).map((user) => (
                                                <div key={user.user_id} className="flex items-center justify-between px-2 py-1 text-xs font-bold">
                                                    <span className="text-[var(--muted-ink)]">
                                                        <span className="mr-2 font-mono text-[var(--club-green)]">#{user.rank}</span>
                                                        <span className="pii-safe">{user.name}</span>
                                                    </span>
                                                    <span className="text-[var(--muted-ink)]">{user.score} pts</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
