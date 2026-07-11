
"use client";

import Link from 'next/link';
import { Sparkles, HelpCircle, Users, Eye, EyeOff } from 'lucide-react';
import { useDemoStore } from '../stores/useDemoStore';
import { useEffect, useState } from 'react';

export default function Header() {
    const { isDemoMode, toggleDemoMode } = useDemoStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                CommitCrew 🚀
            </h1>
            <div className="flex gap-4 text-sm text-neutral-400 items-center">

                {/* Demo Mode Toggle */}
                <button
                    onClick={toggleDemoMode}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${isDemoMode
                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                        }`}
                    title="Toggle Demo Mode (Anonymize Data)"
                >
                    {mounted && isDemoMode ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span className="hidden sm:inline">{isDemoMode ? 'Demo On' : 'Demo Off'}</span>
                </button>

                <Link
                    href="/changelog"
                    className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded transition-colors text-white"
                >
                    <Sparkles size={16} /> What's New
                </Link>
                <Link
                    href="/docs"
                    className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded transition-colors text-white"
                >
                    <HelpCircle size={16} /> Docs
                </Link>
                <span className="flex items-center gap-1 border-l border-neutral-700 pl-4 hidden md:flex"><Users size={16} /> AI accountability bot</span>
            </div>
        </div>
    );
}
