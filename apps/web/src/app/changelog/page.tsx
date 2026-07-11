"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, GitCommit, GitBranch } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ChangelogPage() {
    const [commits, setCommits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch commits from our server-side API (which handles auth)
        fetch('/api/changelog')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCommits(data);
                } else {
                    console.error("API Error:", data.error);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch commits", err);
                setLoading(false);
            });
    }, []);

    return (
        <main className="min-h-screen bg-neutral-900 text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4 border-b border-neutral-800 pb-6">
                    <Link href="/" className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
                        <Sparkles /> Changelog
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Manual Release Notes */}
                    <div className="md:col-span-2 space-y-8">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-emerald-400">
                            Major Updates
                        </h2>

                        {/* Version 2.2 - Multiplicative Scoring & Deep Recognition */}
                        <div className="border-l-4 border-emerald-400 pl-6 relative">
                            <span className="absolute -left-[11px] top-0 w-5 h-5 bg-neutral-900 border-4 border-emerald-400 rounded-full"></span>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-white">Multiplicative Scoring & Deep Recognition</h3>
                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Feb 24, 2026</span>
                            </div>
                            <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
                                <li>✖️ <strong>Multiplicative Formula</strong>: Grades are now calculated as <code className="bg-neutral-800 px-1 rounded text-emerald-400">Complexity × Impact</code>, rewarding high-value work with much higher point ceilings (up to 30+).</li>
                                <li>🧠 <strong>Deep Recognition Engine</strong>: Complexity is now a composite score derived from <strong>Technical Difficulty</strong>, <strong>Time Investment</strong>, and <strong>Cognitive Load</strong>.</li>
                                <li>🎯 <strong>Smart Goal Alignment</strong>: The AI now recognizes "Technical Prerequisites" (e.g., setting up a database) as fully aligned with your end goals.</li>
                                <li>🏆 <strong>Weekly Trophies</strong>: Winning the weekly check-in now awards a permanent Trophy visible on your profile.</li>
                            </ul>
                        </div>

                        {/* Version 2.1 - Grading Rules v2 */}
                        <div className="border-l-4 border-violet-500 pl-6 relative">
                            <span className="absolute -left-[11px] top-0 w-5 h-5 bg-neutral-900 border-4 border-violet-500 rounded-full"></span>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-white">Grading Rules v2: Smarter Precedents</h3>
                                <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-1 rounded">Feb 24, 2026</span>
                            </div>
                            <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
                                <li>🧠 <strong>Semantic Deduplication</strong>: Proposed grading rules are compared against existing ones via embedding similarity before being saved.</li>
                                <li>⚖️ <strong>Tuned Thresholds</strong>: Improved similarity thresholds for both rule retrieval and creation, reducing noise in AI decisions.</li>
                                <li>🛡️ <strong>Sanity Checks</strong>: Rules that would break the system (e.g. &quot;Breathing is +10&quot;) are flagged and discarded automatically.</li>
                            </ul>
                        </div>

                        {/* Version 2.0 - Season System */}
                        <div className="border-l-4 border-emerald-500 pl-6 relative">
                            <span className="absolute -left-[11px] top-0 w-5 h-5 bg-neutral-900 border-4 border-emerald-500 rounded-full"></span>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-white">Season System: Monthly Competition</h3>
                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Feb 19, 2026</span>
                            </div>
                            <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
                                <li>🏆 <strong>Monthly Seasons</strong>: Each calendar month is a competitive season. The top scorer is crowned Season Champion 👑.</li>
                                <li>📊 <strong>Season / All-Time Toggle</strong>: The leaderboard supports toggling between the current season and all-time views.</li>
                                <li>🏛️ <strong>Hall of Fame</strong>: Past season results are stored and displayed with expandable standings and a podium.</li>
                                <li>🔄 <strong>Auto Finalization</strong>: Seasons finalize automatically on the 1st of each month at 12:05 AM EST.</li>
                            </ul>
                        </div>

                        {/* Version 1.9 - Dispute Identity */}
                        <div className="border-l-4 border-blue-500 pl-6 relative">
                            <span className="absolute -left-[11px] top-0 w-5 h-5 bg-neutral-900 border-4 border-blue-500 rounded-full"></span>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-white">Dispute Identity Awareness</h3>
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Feb 17, 2026</span>
                            </div>
                            <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
                                <li>🔍 <strong>Identity-Aware Judging</strong>: The Supreme Court AI knows who is disputing and who committed — &quot;I&quot; statements are interpreted contextually.</li>
                                <li>⚖️ <strong>Stare Decisis</strong>: Dispute rulings respect existing Legal Precedents. The AI is bound by prior case law unless an extraordinary exception applies.</li>
                                <li>📉 <strong>Honesty Policy</strong>: Admitting low effort during a self-dispute can reduce the score, not just increase it.</li>
                            </ul>
                        </div>

                        {/* Version 1.8 - Callout 2.0 */}
                        <div className="border-l-4 border-yellow-500 pl-6 relative">
                            <span className="absolute -left-[11px] top-0 w-5 h-5 bg-neutral-900 border-4 border-yellow-500 rounded-full"></span>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-white">Callouts 2.0: Verification, Reply & Timeframes</h3>
                                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Feb 17, 2026</span>
                            </div>
                            <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
                                <li>📣 <strong>Reply to Verify</strong>: Bot missed your commit? Just <strong>reply</strong> to the callout message to trigger a lenient re-check.</li>
                                <li>✅ <strong>Manual Verification</strong>: Callers can use <code className="bg-neutral-800 px-1 rounded text-yellow-400">@callout verify @User</code> to override the AI and award points manually.</li>
                                <li>⏰ <strong>Custom Timeframes</strong>: Callouts support natural language deadlines — &quot;by 5pm&quot;, &quot;by eod&quot;, &quot;end of week&quot;. Defaults to 24 hours if omitted.</li>
                                <li>📋 <strong>List Active</strong>: View all pending callouts with <code className="bg-neutral-800 px-1 rounded text-yellow-400">@callout list</code>.</li>
                            </ul>
                        </div>

                        {/* Version 1.7.5 - Callouts v1 */}
                        <div className="border-l-4 border-orange-500 pl-6 relative">
                            <span className="absolute -left-[11px] top-0 w-5 h-5 bg-neutral-900 border-4 border-orange-500 rounded-full"></span>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-white">Callouts v1: The Beginning</h3>
                                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">Feb 14, 2026</span>
                            </div>
                            <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
                                <li>📢 <strong>Public Callouts</strong>: Challenge friends with <code className="bg-neutral-800 px-1 rounded text-orange-400">@callout @User [Task]</code>.</li>
                                <li>⏰ <strong>24h Deadline</strong>: Default 24-hour timer to complete the task.</li>
                                <li>🤖 <strong>AI Judging</strong>: The bot checks your next commit to see if it matches the challenge.</li>
                            </ul>
                        </div>

                        {/* Version 1.7 - Quality Suite */}
                        <div className="border-l-4 border-rose-500 pl-6 relative">
                            <span className="absolute -left-[11px] top-0 w-5 h-5 bg-neutral-900 border-4 border-rose-500 rounded-full"></span>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-white">Quality Suite: Bets & Weighted Grading</h3>
                                <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded">Feb 8, 2026</span>
                            </div>
                            <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
                                <li>🎰 <strong>Betting System</strong>: Wager points on tasks with <code className="bg-neutral-800 px-1 rounded text-rose-400">@bet [amount] [task] by [time]</code>. Win 1.5x or lose it all.</li>
                                <li>⚖️ <strong>Weighted Formula</strong>: New grading logic <code className="bg-neutral-800 px-1 rounded text-emerald-400">Complexity + (Impact * 2)</code> rewards high-value work over volume.</li>
                                <li>🔥 <strong>Social Proof</strong>: React with 🔥, 🚀, 🤯, or 👍 for <strong>+2 pts</strong>. Use 👎 for <strong>-2 pts</strong>.</li>
                                <li>🎯 <strong>Goal Context</strong>: Commits matching Active Goals get a <strong>+2 pt Bonus</strong>.</li>
                            </ul>
                        </div>

                        {/* Version 1.6 - Tuning System */}
                        <div className="border-l-4 border-pink-500 pl-6 relative">
                            <span className="absolute -left-[11px] top-0 w-5 h-5 bg-neutral-900 border-4 border-pink-500 rounded-full"></span>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-white">Tuning System & Universal Wins</h3>
                                <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded">Jan 13, 2026</span>
                            </div>
                            <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
                                <li>⚖️ <strong>Legal Precedents</strong>: Winning disputes now creates permanent "Grading Rules" that the AI must follow.</li>
                                <li>🌍 <strong>Universal Wins</strong>: Mental health, hygiene, and exercise are now automatically recognized as "Wins" (5-9 pts).</li>
                                <li>🧠 <strong>Rule Generalization</strong>: The AI learns principles (e.g. "Aerobic exercise aids focus") rather than just specific precedents.</li>
                            </ul>
                        </div>

                        {/* Version 1.5 - AI Memory */}
                        <div className="border-l-4 border-cyan-500 pl-6 relative">
                            <span className="absolute -left-[11px] top-0 w-5 h-5 bg-neutral-900 border-4 border-cyan-500 rounded-full"></span>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-white">AI Contextual Memory</h3>
                                <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">Jan 9, 2026</span>
                            </div>
                            <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
                                <li>🧠 <strong>Context Awareness</strong>: The bot now remembers your past commits and behavior.</li>
                                <li>🔍 <strong>Semantic Search</strong>: References previous bugs or goals when relevant.</li>
                                <li>📈 <strong>Streak Tracking</strong>: Can call out improved efficiency or recurring bad habits.</li>
                            </ul>
                        </div>

                        {/* Version 1.4 - AI Tweaks */}
                        <div className="border-l-4 border-orange-500 pl-6 relative">
                            <span className="absolute -left-[11px] top-0 w-5 h-5 bg-neutral-900 border-4 border-orange-500 rounded-full"></span>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-white">Dispute System & Docs</h3>
                                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">Jan 9, 2026</span>
                            </div>
                            <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
                                <li>⚖️ Added <strong>Dispute System</strong>: Reply to commit grades with <code className="bg-neutral-800 px-1 rounded text-orange-400">@dispute</code> if you disagree.</li>
                                <li>📚 Added dedicated <strong>/docs</strong> page.</li>
                                <li>📝 Added automated <strong>/changelog</strong> page (You are here).</li>
                                <li>⚡️ Real-time updates for Disputes and Undos on the dashboard.</li>
                            </ul>
                        </div>

                        {/* Version 1.3 - Weekly Win Tracker */}
                        <div className="border-l-4 border-purple-500 pl-6 relative">
                            <span className="absolute -left-[11px] top-0 w-5 h-5 bg-neutral-900 border-4 border-purple-500 rounded-full"></span>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-white">Weekly Win Tracker</h3>
                                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Jan 8, 2026</span>
                            </div>
                            <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
                                <li>🏆 Track how many weeks each user "wins" (highest weekly score).</li>
                                <li>📊 Win count displayed on leaderboard and profiles.</li>
                                <li>⏰ Automatically awarded at 8 PM EST every Sunday.</li>
                            </ul>
                        </div>

                        {/* Version 1.2 - Goal Management */}
                        <div className="border-l-4 border-emerald-500 pl-6 relative">
                            <span className="absolute -left-[11px] top-0 w-5 h-5 bg-neutral-900 border-4 border-emerald-500 rounded-full"></span>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-white">Goal Management & Undo</h3>
                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Jan 7, 2026</span>
                            </div>
                            <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
                                <li>🎯 Goal Commands: <code className="bg-neutral-800 px-1 rounded text-green-400">@g complete</code>, <code className="bg-neutral-800 px-1 rounded text-orange-400">delete</code>, <code className="bg-neutral-800 px-1 rounded text-cyan-400">edit</code>.</li>
                                <li>↩️ Added <code className="bg-neutral-800 px-1 rounded text-red-400">@undo</code> command.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Automated Git Log */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-neutral-400">
                            <GitBranch size={18} /> Commit History
                        </h2>

                        <div className="bg-neutral-800/30 rounded-xl p-4 border border-neutral-700/50 max-h-[600px] overflow-y-auto space-y-4 shadow-inner">
                            {loading ? (
                                <p className="text-sm text-neutral-500 text-center py-4">Loading from GitHub...</p>
                            ) : (
                                commits.map((commit: any) => (
                                    <div key={commit.sha} className="flex flex-col gap-1 border-b border-neutral-700/50 pb-3 last:border-0 last:pb-0">
                                        <p className="text-sm text-neutral-200 font-medium leading-snug break-words">
                                            {commit.commit.message}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-neutral-500">
                                            <div className="flex items-center gap-2">
                                                <img src={commit.author?.avatar_url} className="w-4 h-4 rounded-full" alt="" />
                                                <span>{commit.commit.author.name}</span>
                                            </div>
                                            <span>{formatDistanceToNow(new Date(commit.commit.author.date))} ago</span>
                                        </div>
                                        <a href={commit.html_url} target="_blank" className="text-[10px] text-emerald-500 hover:underline flex items-center gap-1">
                                            <GitCommit size={10} /> {commit.sha.substring(0, 7)}
                                        </a>
                                    </div>
                                ))
                            )}
                            {commits.length === 0 && !loading && <span className="text-xs text-neutral-500">No commits found.</span>}
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
