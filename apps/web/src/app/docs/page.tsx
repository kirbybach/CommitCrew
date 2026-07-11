import Link from 'next/link';
import { ArrowLeft, HelpCircle, Terminal, Trophy, Scale, Zap, Brain } from 'lucide-react';

export default function DocsPage() {
    return (
        <main className="min-h-screen bg-neutral-900 text-white p-4 md:p-8 font-sans">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8 flex items-center gap-4 border-b border-neutral-800 pb-6">
                <Link href="/" className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
                    <HelpCircle /> Documentation
                </h1>
            </div>

            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-start">

                {/* Sticky Sidebar */}
                <aside className="md:w-64 shrink-0 hidden md:block sticky top-8">
                    <div className="bg-neutral-800/30 p-4 rounded-xl border border-neutral-700/50 space-y-2">
                        <Link href="#commands" className="block text-neutral-400 hover:text-emerald-400 transition-colors py-1 text-sm font-medium">Commands</Link>
                        <Link href="#scoring" className="block text-neutral-400 hover:text-emerald-400 transition-colors py-1 text-sm font-medium">Scoring System</Link>
                        <Link href="#seasons" className="block text-neutral-400 hover:text-emerald-400 transition-colors py-1 text-sm font-medium">Seasons</Link>
                        <Link href="#precedents" className="block text-neutral-400 hover:text-emerald-400 transition-colors py-1 text-sm font-medium">Legal Precedents</Link>
                        <Link href="#api" className="block text-neutral-400 hover:text-emerald-400 transition-colors py-1 text-sm font-medium">CLI / API Commits</Link>
                        <Link href="#prompts" className="block text-neutral-400 hover:text-emerald-400 transition-colors py-1 text-sm font-medium">AI System Prompts</Link>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 space-y-16 max-w-3xl">

                    {/* Commands Section */}
                    <div id="commands" className="space-y-6 scroll-mt-8">
                        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                            <Terminal /> Commands
                        </h2>

                        <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700/50 space-y-4">

                            {/* Core Commands */}
                            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start border-b border-neutral-700/50 pb-4 last:border-0 last:pb-0">
                                <code className="bg-neutral-900 px-3 py-1.5 rounded text-yellow-400 font-mono text-sm text-center">@c [msg]</code>
                                <div>
                                    <p className="font-semibold text-neutral-200">Commit Task</p>
                                    <p className="text-sm text-neutral-400">Log a completed task to get graded by the AI. Be specific!</p>
                                    <div className="mt-2 text-xs bg-neutral-800/50 border border-neutral-700/50 p-2 rounded text-neutral-300">
                                        <span className="text-emerald-400 font-bold">Pro Tip (Time Tracking):</span> Include an estimate like <code className="bg-neutral-900 px-1 rounded text-neutral-400">~2h</code> or <code className="bg-neutral-900 px-1 rounded text-neutral-400">45m</code> in your message. This gives the AI hard data for "Time Investment" and can significantly boost your score for deep work.
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start border-b border-neutral-700/50 pb-4 last:border-0 last:pb-0">
                                <code className="bg-neutral-900 px-3 py-1.5 rounded text-red-400 font-mono text-sm text-center">@undo</code>
                                <div>
                                    <p className="font-semibold text-neutral-200">Undo Commit</p>
                                    <p className="text-sm text-neutral-400">Delete your last commit if you made a mistake. Cannot undo older commits.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start border-b border-neutral-700/50 pb-4 last:border-0 last:pb-0">
                                <code className="bg-neutral-900 px-3 py-1.5 rounded text-indigo-400 font-mono text-sm text-center">@d [arg]</code>
                                <div>
                                    <p className="font-semibold text-neutral-200">Dispute Grade</p>
                                    <p className="text-sm text-neutral-400">
                                        Reply to a commit message with this command to argue against the AI&apos;s grade. The AI is identity-aware — it knows who is disputing and who committed. Self-disputes treat &quot;I&quot; statements as confessions; third-party disputes treat them as accusations or the disputer&apos;s own claims.
                                    </p>
                                </div>
                            </div>

                            {/* Goal Commands */}
                            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start border-b border-neutral-700/50 pb-4 last:border-0 last:pb-0">
                                <code className="bg-neutral-900 px-3 py-1.5 rounded text-blue-400 font-mono text-sm text-center">@g [text]</code>
                                <div>
                                    <p className="font-semibold text-neutral-200">Add Goal</p>
                                    <p className="text-sm text-neutral-400">Set a high-level goal. Example: <code>@g Run 5k</code></p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start border-b border-neutral-700/50 pb-4 last:border-0 last:pb-0">
                                <code className="bg-neutral-900 px-3 py-1.5 rounded text-green-400 font-mono text-sm text-center">@g complete #</code>
                                <div>
                                    <p className="font-semibold text-neutral-200">Complete Goal</p>
                                    <p className="text-sm text-neutral-400">Mark a goal as finished. Use the number from <code>@gl</code>.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start border-b border-neutral-700/50 pb-4 last:border-0 last:pb-0">
                                <code className="bg-neutral-900 px-3 py-1.5 rounded text-orange-400 font-mono text-sm text-center">@g delete #</code>
                                <div>
                                    <p className="font-semibold text-neutral-200">Delete Goal</p>
                                    <p className="text-sm text-neutral-400">Remove a goal without completing it.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start border-b border-neutral-700/50 pb-4 last:border-0 last:pb-0">
                                <code className="bg-neutral-900 px-3 py-1.5 rounded text-cyan-400 font-mono text-sm text-center">@g edit # [txt]</code>
                                <div>
                                    <p className="font-semibold text-neutral-200">Edit Goal</p>
                                    <p className="text-sm text-neutral-400">Update the description of an existing goal.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start border-b border-neutral-700/50 pb-4 last:border-0 last:pb-0">
                                <code className="bg-neutral-900 px-3 py-1.5 rounded text-purple-400 font-mono text-sm text-center">@gl</code>
                                <div>
                                    <p className="font-semibold text-neutral-200">List Goals</p>
                                    <p className="text-sm text-neutral-400">Show all your currently active goals.</p>
                                </div>
                            </div>

                            {/* Bet Commands */}
                            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start border-b border-neutral-700/50 pb-4 last:border-0 last:pb-0">
                                <code className="bg-neutral-900 px-3 py-1.5 rounded text-rose-400 font-mono text-sm text-center">@bet [pts] [task] by [time]</code>
                                <div>
                                    <p className="font-semibold text-neutral-200">Wager Points</p>
                                    <p className="text-sm text-neutral-400">
                                        Bet points on completing a task by a deadline. Win 1.5x if completed on time, lose 1x if missed. Max bet is <strong>30 pts</strong>.
                                        <br />
                                        Example: <code>@bet 20 Finish report by 5pm</code>
                                        <br />
                                        The bot asks for confirmation before locking in. Reply with <code>@bet yes</code> to confirm.
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1">Aliases: <code>@wager</code></p>
                                </div>
                            </div>

                            {/* Callout Commands */}
                            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start border-b border-neutral-700/50 pb-4 last:border-0 last:pb-0">
                                <code className="bg-neutral-900 px-3 py-1.5 rounded text-yellow-500 font-mono text-sm text-center">@callout @[User] [Task]</code>
                                <div>
                                    <p className="font-semibold text-neutral-200">Callout Challenge</p>
                                    <p className="text-sm text-neutral-400">
                                        Challenge a friend to complete a task. Supports custom deadlines via natural language — if no time is specified, defaults to 24 hours.
                                        <br />
                                        Examples:
                                        <br />
                                        <code>@callout @Taylor Fix the bug by 5pm</code>
                                        <br />
                                        <code>@callout @Taylor Ship the feature by end of week</code>
                                        <br />
                                        <strong>Reward:</strong> Target gets Bonus Pts. Caller gets Accountability Pts.
                                        <br />
                                        <strong>Penalty:</strong> Target loses points if they flake.
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1">Aliases: <code>@challenge</code></p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start border-b border-neutral-700/50 pb-4 last:border-0 last:pb-0">
                                <code className="bg-neutral-900 px-3 py-1.5 rounded text-yellow-500 font-mono text-sm text-center">@callout list</code>
                                <div>
                                    <p className="font-semibold text-neutral-200">List Active Callouts</p>
                                    <p className="text-sm text-neutral-400">
                                        View all currently active callout challenges.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start border-b border-neutral-700/50 pb-4 last:border-0 last:pb-0">
                                <code className="bg-neutral-900 px-3 py-1.5 rounded text-yellow-500 font-mono text-sm text-center">Reply to Verify</code>
                                <div>
                                    <p className="font-semibold text-neutral-200">Easy Verification</p>
                                    <p className="text-sm text-neutral-400">
                                        If the bot misses your commit for a callout, just <strong>Reply</strong> to the callout message with &quot;check this&quot;.
                                        The bot will re-check your latest commit with a more lenient judge.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start border-b border-neutral-700/50 pb-4 last:border-0 last:pb-0">
                                <code className="bg-neutral-900 px-3 py-1.5 rounded text-yellow-500 font-mono text-sm text-center">@callout verify @[User]</code>
                                <div>
                                    <p className="font-semibold text-neutral-200">Manual Verification</p>
                                    <p className="text-sm text-neutral-400">
                                        Caller (or Admin) can manually resolve a callout if the AI is being stubborn.
                                        Awards full points to everyone.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start border-b border-neutral-700/50 pb-4 last:border-0 last:pb-0">
                                <code className="bg-neutral-900 px-3 py-1.5 rounded text-emerald-400 font-mono text-sm text-center">Trophies 🏆</code>
                                <div>
                                    <p className="font-semibold text-neutral-200">Weekly Trophies</p>
                                    <p className="text-sm text-neutral-400">
                                        Winning the weekly check-in awards a Trophy. Trophies are displayed on your profile and provide a significant boost to your all-time standing.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Scoring System */}
                    <div id="scoring" className="space-y-6 scroll-mt-8">
                        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                            ⚖️ Scoring System
                        </h2>
                        <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700/50 space-y-4 text-neutral-300">
                            <p>
                                The AI Judge (&quot;CommitCrew&quot;) evaluates every commit using a **Multiplicative Formula** and a **Deep Recognition Engine**:
                            </p>
                            <div className="bg-neutral-900/50 p-4 rounded border border-neutral-700/50 font-mono text-center text-emerald-400 my-4">
                                Score = Complexity × Impact
                            </div>
                            <p>
                                Scores range from <span className="text-red-400 font-bold">-5</span> to <span className="text-emerald-400 font-bold">30+</span>.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                <div className="bg-neutral-900/50 p-4 rounded border border-blue-500/20">
                                    <h3 className="font-bold text-blue-400 mb-2">Multipliers</h3>
                                    <ul className="list-disc pl-4 space-y-1 text-sm">
                                        <li><strong>Complexity (1-10)</strong>: Composite score based on Technical Difficulty, Time Investment, and Cognitive Load.</li>
                                        <li><strong>Impact (1.0 - 3.0)</strong>: 1.0 (Maintenance), 2.0 (Progress), 3.0 (Milestone).</li>
                                    </ul>
                                </div>
                                <div className="bg-neutral-900/50 p-4 rounded border border-rose-500/20">
                                    <h3 className="font-bold text-rose-400 mb-2">Bonuses</h3>
                                    <ul className="list-disc pl-4 space-y-1 text-sm">
                                        <li><strong>Goal Match</strong>: Automatic <strong>+2 pts</strong> (or alignment bonus) if task is a <em>technical prerequisite</em> for <code>@gl</code>.</li>
                                        <li><strong>Social Proof</strong>: <strong>+2 pts</strong> (🔥 🚀 🤯 👍) or <strong>-2 pts</strong> (👎). Reversing reaction reverses points.</li>
                                        <li><strong>Bets</strong>: Win 1.5x wager (max bet: 30 pts).</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                <div className="bg-neutral-900/50 p-4 rounded border border-red-500/20">
                                    <h3 className="font-bold text-red-400 mb-2">The Punishment Zone (-5 to 0)</h3>
                                    <ul className="list-disc pl-4 space-y-1 text-sm">
                                        <li><strong>-5: Major L</strong>. Active self-sabotage / 👎 spam.</li>
                                        <li><strong>0: NPC Behavior</strong>. Filler tasks.</li>
                                    </ul>
                                </div>

                                <div className="bg-neutral-900/50 p-4 rounded border border-emerald-500/20">
                                    <h3 className="font-bold text-emerald-400 mb-2">The W Zone (1 to 30+)</h3>
                                    <ul className="list-disc pl-4 space-y-1 text-sm">
                                        <li><strong>1-9: Good</strong>. Trivial to solid effort.</li>
                                        <li><strong>10-20: Great</strong>. High complexity or high impact feature.</li>
                                        <li><strong>21+: God Tier</strong>. Strategic milestones + High complexity.</li>
                                    </ul>
                                </div>
                            </div>

                            <p className="text-sm italic text-neutral-500 mt-4">
                                * Note: Scores are calculated automatically based on your Active Goals (`@gl`). Universal wins (Health, Learning) always count.
                            </p>
                        </div>
                    </div>

                    {/* Seasons System */}
                    <div id="seasons" className="space-y-6 scroll-mt-8">
                        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                            <Trophy /> Seasons
                        </h2>
                        <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700/50 space-y-4 text-neutral-300">
                            <p>
                                CommitCrew runs on a <strong>monthly season system</strong>. Each season corresponds to a calendar month.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                <div className="bg-neutral-900/50 p-4 rounded border border-emerald-500/20">
                                    <h3 className="font-bold text-emerald-400 mb-2">How It Works</h3>
                                    <ul className="list-disc pl-4 space-y-1 text-sm">
                                        <li>A new season starts automatically on the 1st of every month.</li>
                                        <li>The previous season is finalized at <strong>12:05 AM EST</strong> on the 1st.</li>
                                        <li>The user with the highest total score for the month is crowned <strong>Season Champion</strong> 👑.</li>
                                        <li>Ties result in co-champions.</li>
                                    </ul>
                                </div>
                                <div className="bg-neutral-900/50 p-4 rounded border border-yellow-500/20">
                                    <h3 className="font-bold text-yellow-400 mb-2">Dashboard</h3>
                                    <ul className="list-disc pl-4 space-y-1 text-sm">
                                        <li>The <strong>Season Banner</strong> shows the current season leader and days remaining.</li>
                                        <li>Toggle the leaderboard between <strong>Season</strong> and <strong>All-Time</strong> views.</li>
                                        <li>The <strong>Hall of Fame</strong> lists all past champions with expandable standings.</li>
                                        <li>Past champions display a 👑 icon on the leaderboard.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Legal Precedents */}
                    <div id="precedents" className="space-y-6 scroll-mt-8">
                        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                            <Scale /> Legal Precedents
                        </h2>
                        <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700/50 space-y-4 text-neutral-300">
                            <p>
                                When a dispute establishes new case law, the AI generates a <strong>Generalized Grading Rule</strong> — a permanent precedent that future grading decisions must respect.
                            </p>
                            <ul className="list-disc pl-4 space-y-2 text-sm">
                                <li><strong>Stare Decisis</strong>: The AI is bound by existing precedents unless there is an extraordinary exception.</li>
                                <li><strong>Deduplication</strong>: Proposed rules are compared semantically against existing rules. If a similar rule already exists, the duplicate is rejected.</li>
                                <li><strong>Sanity Check</strong>: Rules that would break the system (e.g. &quot;Breathing is +10&quot;) are flagged and discarded.</li>
                                <li><strong>Per-User</strong>: Grading rules are stored per-user. Each person builds their own body of case law over time.</li>
                            </ul>
                        </div>
                    </div>

                    {/* CLI / API Commits */}
                    <div id="api" className="space-y-6 scroll-mt-8">
                        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                            <Zap /> CLI / API Commits
                        </h2>
                        <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700/50 space-y-4 text-neutral-300">
                            <p>
                                Commits can also be submitted via the bot&apos;s HTTP API — useful for shell scripts, git hooks, or automation.
                            </p>
                            <pre className="bg-neutral-950 p-4 rounded-lg overflow-x-auto text-xs font-mono text-neutral-400 whitespace-pre-wrap">
                                {`POST /send-commit
Headers: { "x-api-key": "<COMMIT_API_KEY>" }
Body:    { "author": "Kirby", "message": "Shipped the landing page" }

Response: { "success": true, "user": "Kirby", "grade": 9, "feedback": "..." }`}
                            </pre>
                            <p className="text-sm text-neutral-400">
                                The commit is graded normally and the result is broadcast to the WhatsApp group.
                            </p>
                        </div>
                    </div>

                    {/* System Prompt */}
                    <div id="prompts" className="space-y-6 scroll-mt-8">
                        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                            <Brain /> AI System Prompts
                        </h2>
                        <div className="space-y-6">

                            {/* Commit Prompt */}
                            <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700/50 space-y-4 text-neutral-300">
                                <h3 className="font-bold text-emerald-400">@commit Grading Logic (GPT-4o-mini)</h3>
                                <pre className="bg-neutral-950 p-4 rounded-lg overflow-x-auto text-xs font-mono text-neutral-400 whitespace-pre-wrap">
                                    {`You are a precise, consistent productivity judge.

**TASK:** Analyze the user's commit and assess its Complexity and Impact.

**1. Complex Analysis (Chain-of-Thought):**
Analyze what was done, technical difficulty, and real-world impact BEFORE outputting numbers.
Break Complexity into:
- **Technical Difficulty (1-10):** Specific skill/expertise required.
- **Time Investment (1-10):** Duration of focused effort.
- **Cognitive Load (1-10):** Intensity of focus/deep work required.

**2. The Formula:**
Grade = Complexity × Impact (Multiplicative)
*Note: This rewards high-complexity work that is ALSO high impact.*

**Complexity Calibration Grid:**
- 1: Typo / Email / Stretch
- 3: Small Component / 30m Workout / Lesson
- 5: Complex Feature / 1h Gym / 2h Deep Study
- 8: System Redesign / Marathon / Moving / Taxes
- 10: Industry-lead / Ultra-endurance / Life-altering Win

**Impact Multiplier (1.0 - 3.0):**
- 1.0: "Maintenance" (Routine, upkeep)
- 1.5: "Incremental" (Small step forward)
- 2.0: "Progress" (Meaningful advancement)
- 2.5: "Major" (Significant milestone)
- 3.0: "Transformative" (GOAL COMPLETED)`}
                                </pre>
                            </div>

                            {/* Dispute Prompt */}
                            <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700/50 space-y-4 text-neutral-300">
                                <h3 className="font-bold text-orange-400">@dispute Logic (Supreme Court, GPT-4o)</h3>
                                <pre className="bg-neutral-950 p-4 rounded-lg overflow-x-auto text-xs font-mono text-neutral-400 whitespace-pre-wrap">
                                    {`You are the Supreme Court Judge of Brainrot Productivity.
A user is disputing a grade. You are performing a "Resentencing" based on their argument AND the existing body of case law.

**Resentencing Guidelines:**
- **The "Context Premium" (+1 to +5):** Award points if the user reveals hidden effort, high-stakes pressure, or technical complexity that wasn't apparent in the original commit.
- **The "Honesty Policy" (Score Reduction):** If the user admits low effort or corrects a mistake (e.g. "Actually this was easy, only give me 3 points"), REDUCE the score.
- **The "Mid-Curve Preservation" (No Change):** If the argument is valid but doesn't fundamentally change the nature of the task.

**CRITICAL - Identity & "Confessions":**
- If **Disputer == Committer**: Treat "I" statements ("I lied", "I worked hard") as fact/confessions from the Committer.
- If **Disputer != Committer**: Treat "I" statements as the Disputer speaking about themselves, OR accusations against the Committer. Do NOT treat "I didn't do it" as a confession from the Committer.

**CRITICAL - Stare Decisis (Respect Precedent):**
If a Legal Precedent below directly applies to this case, you MUST follow it unless there's an extraordinary exception. Precedents are established for consistency.

**Precedent Generation:**
- If this ruling **clarifies a boundary or establishes new case law** (win OR loss), draft a **Generalized Grading Rule** that future cases can cite.
- **Sanity Check**: If the rule would break the system (e.g. "Breathing is +10"), set 'rule_violation_check' to true.`}
                                </pre>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
