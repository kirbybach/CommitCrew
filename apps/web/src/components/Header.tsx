
"use client";

import Link from 'next/link';
import { Sparkles, HelpCircle, Users, Flag, Github, ExternalLink } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
    return (
        <header className="sketch-card bg-[var(--card)] px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-[0.72rem] font-bold uppercase text-[var(--club-green)]">
                        <Flag size={15} />
                        CommitCrew clubhouse
                    </div>
                    <h1 className="mt-1 text-3xl font-black text-[var(--ink)] sm:text-4xl">
                        CommitCrew
                    </h1>
                    <p className="mt-1 max-w-xl text-sm font-semibold text-[var(--muted-ink)] sm:text-base">
                        A group-chat scoreboard for people trying to actually do stuff.
                    </p>
                </div>

                <div className="flex flex-col items-end gap-3 text-sm font-bold text-[var(--ink)]">
                    <div className="flex flex-wrap justify-end gap-3">
                        <ThemeToggle />
                        <Link
                            href="/changelog"
                            className="clubhouse-button px-3 py-1.5"
                        >
                            <Sparkles size={16} /> What&apos;s New
                        </Link>
                        <Link
                            href="/docs"
                            className="clubhouse-button clubhouse-button-green px-3 py-1.5"
                        >
                            <HelpCircle size={16} /> Rules
                        </Link>
                        <a
                            href="https://kirbybach.me"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="clubhouse-button px-3 py-1.5"
                        >
                            kirbybach.me <ExternalLink size={14} aria-hidden="true" />
                        </a>
                        <a
                            href="https://github.com/kirbybach/CommitCrew"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="clubhouse-button px-3 py-1.5"
                            aria-label="CommitCrew on GitHub"
                        >
                            <Github size={17} aria-hidden="true" /> GitHub
                        </a>
                    </div>
                    <span className="flex items-center justify-end gap-1 text-right text-[var(--muted-ink)]">
                        <Users size={16} /> Fake crew, real scoreboard
                    </span>
                </div>
            </div>
        </header>
    );
}
