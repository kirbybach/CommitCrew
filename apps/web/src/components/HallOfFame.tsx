"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { useDemoStore } from '../stores/useDemoStore';
import { anonymize } from '../utils/anonymizer';
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

    const medals = ['🥇', '🥈', '🥉'];
    const medalColors = ['text-yellow-400', 'text-neutral-400', 'text-amber-700'];

    // Helper to anonymize a name if in demo mode
    const displayName = (name: string, userId: string) =>
        isDemoMode ? anonymize(userId, 'name') : name;

    return (
        <div className="mt-6">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Trophy size={14} /> Hall of Fame
            </h3>

            <div className="space-y-2">
                {pastSeasons.map((season) => {
                    const isExpanded = expandedSeason === season.id;
                    const standings = season.standings || [];
                    const top3 = standings.slice(0, 3);

                    return (
                        <div
                            key={season.id}
                            className="bg-neutral-800/30 rounded-xl border border-neutral-700/50 overflow-hidden transition-all"
                        >
                            {/* Header — always visible */}
                            <button
                                onClick={() => setExpandedSeason(isExpanded ? null : season.id)}
                                className="w-full p-3 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-neutral-300">
                                        Season {season.season_number}
                                    </span>
                                    <span className="text-xs text-neutral-500">{season.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {season.champion_name && season.champion_id && (
                                        <span className="text-xs">
                                            👑 <span className="text-yellow-400 font-semibold pii-safe">{displayName(season.champion_name, season.champion_id)}</span>
                                            <span className="text-neutral-500 ml-1">({season.champion_score} pts)</span>
                                        </span>
                                    )}
                                    {isExpanded ? <ChevronUp size={14} className="text-neutral-500" /> : <ChevronDown size={14} className="text-neutral-500" />}
                                </div>
                            </button>

                            {/* Expanded: Full standings */}
                            {isExpanded && standings.length > 0 && (
                                <div className="px-3 pb-3 border-t border-neutral-700/30">
                                    {/* Podium — Top 3 */}
                                    <div className="flex justify-center gap-4 py-4">
                                        {top3.map((user, i) => (
                                            <div key={user.user_id} className="text-center">
                                                <div className="text-2xl mb-1">{medals[i]}</div>
                                                <div className={`text-sm font-bold ${medalColors[i]} pii-safe`}>{displayName(user.name, user.user_id)}</div>
                                                <div className="text-xs text-neutral-500">{user.score} pts</div>
                                                <div className="text-[10px] text-neutral-600">{user.commit_count} commits</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Full List (if more than 3) */}
                                    {standings.length > 3 && (
                                        <div className="space-y-1 pt-2 border-t border-neutral-700/30">
                                            {standings.slice(3).map((user) => (
                                                <div key={user.user_id} className="flex items-center justify-between py-1 px-2 text-xs">
                                                    <span className="text-neutral-400">
                                                        <span className="font-mono text-neutral-600 mr-2">#{user.rank}</span>
                                                        <span className="pii-safe">{displayName(user.name, user.user_id)}</span>
                                                    </span>
                                                    <span className="text-neutral-500">{user.score} pts</span>
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
        </div>
    );
}
