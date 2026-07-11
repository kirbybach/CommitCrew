import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Bot,
  HelpCircle,
  KeyRound,
  Scale,
  ShieldCheck,
  Terminal,
  Trophy,
  Zap,
} from 'lucide-react';

const navItems = [
  ['quick-start', 'Quick Start'],
  ['commands', 'Commands'],
  ['scoring', 'Scoring'],
  ['seasons', 'Seasons'],
  ['demo-safety', 'Demo Safety'],
  ['integrations', 'Integrations'],
];

const commands = [
  {
    command: '@c [message]',
    title: 'File a commit',
    body: 'Log completed work. Include useful context like time spent, outcome, and what moved forward.',
    example: '@c shipped the profile page fixes for 2h',
  },
  {
    command: '@undo',
    title: 'Undo last commit',
    body: 'Remove your most recent commit when you posted the wrong thing.',
  },
  {
    command: '@d [argument]',
    title: 'Dispute a score',
    body: 'Reply to a graded commit and make the case for a different ruling.',
  },
  {
    command: '@g [goal]',
    title: 'Add a goal',
    body: 'Set a target that future commits can be matched against.',
    example: '@g launch portfolio redesign',
  },
  {
    command: '@gl',
    title: 'List goals',
    body: 'Show active goals and their numbers for edit, delete, or complete actions.',
  },
  {
    command: '@g complete #',
    title: 'Complete a goal',
    body: 'Close out a goal by number once the work is actually finished.',
  },
  {
    command: '@bet [pts] [task] by [time]',
    title: 'Wager points',
    body: 'Put points on the line for a deadline. The bot asks for confirmation before locking it in.',
  },
  {
    command: '@callout @[user] [task]',
    title: 'Challenge someone',
    body: 'Ask another player to finish a task by a natural-language deadline.',
  },
  {
    command: '@callout list',
    title: 'List challenges',
    body: 'See active callouts that still need a matching commit.',
  },
  {
    command: '@callout verify @[user]',
    title: 'Resolve a challenge',
    body: 'Let the caller or an admin manually award a completed callout.',
  },
];

const scoreBands = [
  ['-5 to 0', 'Penalty', 'Spam, reversals, or filler that should not climb the board.'],
  ['1 to 9', 'Solid', 'Normal upkeep, learning, health, or small but real progress.'],
  ['10 to 20', 'Strong', 'Meaningful work with clear effort, difficulty, or impact.'],
  ['21+', 'Major', 'A high-complexity milestone with outsized value.'],
];

const integrationRows = [
  ['Web demo', 'NEXT_PUBLIC_DEMO_MODE=true'],
  ['Real dashboard', 'NEXT_PUBLIC_DEMO_MODE=false, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, JWT_SECRET'],
  ['Bot demo', 'DEMO_MODE=true'],
  ['Real bot', 'DEMO_MODE=false, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, COMMIT_API_KEY'],
  ['Chat allowlist', 'ALLOWED_GROUPS, PRODUCTIVITY_GROUP_JID'],
];

export default function DocsPage() {
  return (
    <main className="clubhouse-page">
      <div className="clubhouse-shell space-y-7">
        <header className="sketch-card clubhouse-hero p-5 sm:p-7">
          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full max-w-3xl">
              <Link href="/" className="clubhouse-button mb-5 bg-[var(--button-bg)] px-3 py-2 text-sm font-black text-[var(--ink)]">
                <ArrowLeft size={16} />
                Back to board
              </Link>
              <p className="flex items-center gap-2 text-xs font-black uppercase text-[#f3df9c]">
                <BookOpen size={16} />
                CommitCrew handbook
              </p>
              <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">Rules of Play</h1>
              <p className="mt-3 max-w-[280px] text-base font-semibold text-[#fffdf7]/85 sm:max-w-2xl">
                Fake data, real app structure, and the same clubhouse command loop.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-1 text-center text-[10px] font-black uppercase sm:w-auto sm:grid-cols-3 sm:gap-2 sm:text-xs">
              <div className="min-w-0 border-2 border-[#fffdf7]/60 px-2 py-2 sm:px-3">
                <span className="block font-mono text-lg sm:text-xl">S1</span>
                Hall
              </div>
              <div className="min-w-0 border-2 border-[#fffdf7]/60 px-2 py-2 sm:px-3">
                <span className="block font-mono text-lg sm:text-xl">S2</span>
                Live
              </div>
              <div className="min-w-0 border-2 border-[#fffdf7]/60 px-2 py-2 sm:px-3">
                <span className="block font-mono text-lg sm:text-xl">0</span>
                Secrets
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <nav className="sketch-card-soft sticky top-6 p-3">
              {navItems.map(([href, label]) => (
                <Link
                  key={href}
                  href={`#${href}`}
                  className="block border-b-2 border-[var(--soft-line)] px-2 py-2 text-sm font-black text-[var(--muted-ink)] transition-colors last:border-b-0 hover:text-[var(--club-green)]"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </aside>

          <div className="space-y-7">
            <section id="quick-start" className="sketch-card p-5 scroll-mt-8 sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase text-[var(--club-green)]">
                <HelpCircle size={16} />
                Quick Start
              </div>
              <h2 className="wavy-title text-3xl font-black">What You Are Looking At</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="doc-stat">
                  <span className="font-mono text-2xl font-black">1</span>
                  <p className="font-black">Season 1 is archived in the Hall of Fame.</p>
                </div>
                <div className="doc-stat">
                  <span className="font-mono text-2xl font-black">2</span>
                  <p className="font-black">Season 2 is the live demo leaderboard.</p>
                </div>
                <div className="doc-stat">
                  <span className="font-mono text-2xl font-black">100%</span>
                  <p className="font-black">Demo names, commits, and scores are fictional.</p>
                </div>
              </div>
              <p className="mt-5 break-words text-sm font-semibold leading-7 text-[var(--muted-ink)]">
                In demo mode, the web app reads local seed data from <code>apps/web/src/lib/demoData.ts</code>. It does not need Supabase, OpenAI, WhatsApp auth state, or a dashboard password. Flip the environment flags only when you are intentionally wiring up real integrations.
              </p>
            </section>

            <section id="commands" className="sketch-card p-5 scroll-mt-8 sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase text-[var(--club-green)]">
                <Terminal size={16} />
                Commands
              </div>
              <h2 className="wavy-title text-3xl font-black">Clubhouse Commands</h2>
              <div className="mt-5 divide-y-2 divide-[var(--soft-line)]">
                {commands.map((item) => (
                  <div key={item.command} className="grid gap-3 py-4 md:grid-cols-[190px_minmax(0,1fr)]">
                    <code className="command-ticket">{item.command}</code>
                    <div>
                      <h3 className="text-lg font-black text-[var(--ink)]">{item.title}</h3>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[var(--muted-ink)]">{item.body}</p>
                      {item.example && (
                        <p className="mt-2 text-xs font-bold text-[var(--club-green)]">
                          Example: <code>{item.example}</code>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="scoring" className="sketch-card p-5 scroll-mt-8 sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase text-[var(--club-green)]">
                <Scale size={16} />
                Scoring
              </div>
              <h2 className="wavy-title text-3xl font-black">How Points Hit The Board</h2>
              <div className="score-formula mt-5">Score = Complexity x Impact</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rule-note">
                  <h3 className="font-black text-[var(--club-green)]">Complexity</h3>
                  <p>Blends technical difficulty, time investment, cognitive load, and how much focus the task required.</p>
                </div>
                <div className="rule-note">
                  <h3 className="font-black text-[var(--club-green)]">Impact</h3>
                  <p>Ranges from routine upkeep to a meaningful milestone or finished goal.</p>
                </div>
              </div>
              <div className="mt-5 overflow-hidden border-2 border-[var(--line)]">
                {scoreBands.map(([range, label, body]) => (
                  <div key={range} className="grid gap-2 border-b-2 border-[var(--line)] bg-[var(--card)] p-3 last:border-b-0 sm:grid-cols-[110px_120px_minmax(0,1fr)]">
                    <span className="font-mono font-black text-[var(--club-green)]">{range}</span>
                    <span className="font-black">{label}</span>
                    <span className="text-sm font-semibold text-[var(--muted-ink)]">{body}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm font-semibold leading-7 text-[var(--muted-ink)]">
                Goal matches, reaction bonuses, weekly wins, bets, and callouts can all move the final result. Disputes can also create per-user grading rules so similar work is handled consistently later.
              </p>
            </section>

            <section id="seasons" className="sketch-card p-5 scroll-mt-8 sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase text-[var(--club-green)]">
                <Trophy size={16} />
                Seasons
              </div>
              <h2 className="wavy-title text-3xl font-black">Monthly Standings</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rule-note">
                  <h3 className="font-black text-[var(--club-green)]">Live season</h3>
                  <p>The main board defaults to the current season, with a toggle for all-time totals.</p>
                </div>
                <div className="rule-note">
                  <h3 className="font-black text-[var(--club-green)]">Hall of Fame</h3>
                  <p>Completed seasons move to the trophy shelf with champion details and final standings.</p>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold leading-7 text-[var(--muted-ink)]">
                The public demo is seeded so Season 1 appears as a completed Hall of Fame season and Season 2 stays active on the main scoreboard.
              </p>
            </section>

            <section id="demo-safety" className="sketch-card p-5 scroll-mt-8 sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase text-[var(--club-green)]">
                <ShieldCheck size={16} />
                Demo Safety
              </div>
              <h2 className="wavy-title text-3xl font-black">Public-Safe By Default</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rule-note">
                  <h3 className="font-black text-[var(--club-green)]">Fake players</h3>
                  <p>Names, avatars, commits, seasons, and changelog commits are safe demo records.</p>
                </div>
                <div className="rule-note">
                  <h3 className="font-black text-[var(--club-green)]">No auth state</h3>
                  <p><code>.env</code>, <code>auth_info/</code>, build output, dumps, exports, and local sessions stay ignored.</p>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold leading-7 text-[var(--muted-ink)]">
                The demo intentionally shows fictional named players, which keeps screenshots human while avoiding private group data.
              </p>
            </section>

            <section id="integrations" className="sketch-card p-5 scroll-mt-8 sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase text-[var(--club-green)]">
                <KeyRound size={16} />
                Integrations
              </div>
              <h2 className="wavy-title text-3xl font-black">When You Wire Up The Real Thing</h2>
              <div className="mt-5 divide-y-2 divide-[var(--soft-line)]">
                {integrationRows.map(([label, values]) => (
                  <div key={label} className="grid gap-2 py-3 md:grid-cols-[160px_minmax(0,1fr)]">
                    <span className="font-black text-[var(--club-green)]">{label}</span>
                    <code className="break-words text-sm font-bold text-[var(--muted-ink)]">{values}</code>
                  </div>
                ))}
              </div>
              <div className="scorekeeper-note mt-5 p-4 text-sm font-semibold leading-7 text-[var(--muted-ink)]">
                <div className="mb-1 flex items-center gap-2 font-black uppercase text-[var(--club-green)]">
                  <Bot size={15} />
                  Real bot mode
                </div>
                WhatsApp, Supabase, OpenAI scoring, cron jobs, and commit API auth are optional. Keep them disabled for the public demo unless you are testing with explicit credentials.
              </div>
              <Link href="/changelog" className="clubhouse-button clubhouse-button-green mt-5 px-4 py-2 text-sm font-black">
                <Zap size={16} />
                Read what is new
              </Link>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
