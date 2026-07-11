"use client";

import { differenceInDays, endOfMonth } from 'date-fns';

interface SeasonBannerProps {
    season: {
        season_number: number;
        label: string;
        month: number;
        year: number;
        status: string;
    } | null;
    leader: {
        name: string;
        score: number;
    } | null;
}

export default function SeasonBanner({ season, leader }: SeasonBannerProps) {
    if (!season || season.status !== 'active') return null;

    const now = new Date();
    const monthEnd = endOfMonth(new Date(season.year, season.month - 1, 1));
    const daysRemaining = Math.max(0, differenceInDays(monthEnd, now) + 1);

    return (
        <div className="relative rounded-2xl overflow-hidden">
            {/* Animated gradient border */}
            <div
                className="absolute inset-0 rounded-2xl p-[1px]"
                style={{
                    background: 'linear-gradient(135deg, #34d399, #06b6d4, #8b5cf6, #f59e0b, #34d399)',
                    backgroundSize: '300% 300%',
                    animation: 'gradientShift 6s ease infinite',
                }}
            />
            <div className="relative bg-neutral-900/95 backdrop-blur-sm rounded-2xl p-5 m-[1px]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    {/* Left: Season info */}
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚔️</span>
                        <div>
                            <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                Season {season.season_number}: {season.label}
                            </h2>
                            {leader && leader.score > 0 ? (
                                <p className="text-sm text-neutral-400">
                                    👑 <span className="text-yellow-400 font-semibold">{leader.name}</span> leads with <span className="text-emerald-400 font-semibold">{leader.score} pts</span>
                                </p>
                            ) : (
                                <p className="text-sm text-neutral-500 italic">No commits yet this season</p>
                            )}
                        </div>
                    </div>

                    {/* Right: Countdown */}
                    <div className="flex items-center gap-2 bg-neutral-800/50 px-4 py-2 rounded-xl border border-neutral-700/50">
                        <div className="text-center">
                            <span className="text-xl font-bold text-white">{daysRemaining}</span>
                            <span className="text-xs text-neutral-500 uppercase ml-1.5">days left</span>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>
        </div>
    );
}
