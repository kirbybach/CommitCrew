"use client";

import { differenceInDays, endOfMonth } from 'date-fns';
import { CalendarDays, Flag, Trophy } from 'lucide-react';

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
        <section className="clubhouse-hero sketch-card p-5 sm:p-7">
            <div className="relative z-10 grid gap-5 lg:grid-cols-[1fr_260px] lg:items-end">
                <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase text-[#f3df9c]">
                        <Flag size={16} />
                        CommitCrew Invitational
                    </div>
                    <h2 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
                        Season {season.season_number} is underway.
                    </h2>
                    <p className="mt-3 max-w-2xl text-base font-semibold text-[#fffdf7]/80 sm:text-lg">
                        Drop a win in the chat. The board updates. The crew keeps playing.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
                        <div className="inline-flex items-center gap-2 rounded-[5px] border-2 border-[#fffdf7]/70 bg-[#fffdf7]/10 px-3 py-2">
                            <CalendarDays size={17} />
                            {season.label}
                        </div>
                        {leader && leader.score > 0 ? (
                            <div className="inline-flex items-center gap-2 rounded-[5px] border-2 border-[#fffdf7]/70 bg-[#fffdf7]/10 px-3 py-2">
                                <Trophy size={17} />
                                {leader.name} leads with {leader.score} pts
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 rounded-[5px] border-2 border-[#fffdf7]/70 bg-[#fffdf7]/10 px-3 py-2">
                                Waiting on the first commit
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative z-10 border-2 border-[#fffdf7]/55 bg-[#fffdf7]/10 p-4 text-[#fffdf7] shadow-[3px_3px_0_rgba(0,0,0,0.22)]">
                    <p className="text-xs font-black uppercase text-[#f3df9c]">Season window</p>
                    <div className="mt-2 flex items-end gap-2">
                        <span className="font-mono text-6xl font-black leading-none">{daysRemaining}</span>
                        <span className="pb-2 text-sm font-black uppercase text-[#fffdf7]/75">days left</span>
                    </div>
                    <div className="mt-4 border-t-2 border-[#fffdf7]/35 pt-3">
                        <p className="text-xs font-black uppercase text-[#fffdf7]/70">Current leader</p>
                        <div className="mt-1 flex items-center justify-between gap-3">
                            <span className="text-xl font-black">{leader && leader.score > 0 ? leader.name : 'No leader'}</span>
                            <span className="font-mono text-lg font-black text-[#f3df9c]">
                                {leader && leader.score > 0 ? `${leader.score}` : '0'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
