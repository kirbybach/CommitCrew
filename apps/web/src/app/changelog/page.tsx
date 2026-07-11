"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, GitBranch, GitCommit, Sparkles, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type ChangelogCommit = {
  sha: string;
  html_url: string;
  author?: {
    avatar_url?: string | null;
  } | null;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
};

const releaseNotes = [
  {
    title: 'Clubhouse scoreboard redesign',
    date: 'Jul 11, 2026',
    tag: 'Public demo',
    items: [
      'Reworked the dashboard into a golf-inspired tournament board with paper commit slips.',
      'Changed the main labels from generic cards to commits, points, players, and standings.',
      'Kept the fake demo names visible so the public version feels human without exposing private data.',
    ],
  },
  {
    title: 'Demo seasons repaired',
    date: 'Jul 11, 2026',
    tag: 'Demo data',
    items: [
      'Season 1 now appears as a completed Hall of Fame season.',
      'Season 2 is active on the live demo board with seeded commits for every player.',
      'Changelog avatars no longer render empty image sources.',
    ],
  },
  {
    title: 'Sanitized application source',
    date: 'Jul 11, 2026',
    tag: 'Public repo',
    items: [
      'Copied the real app structure without private git history, auth files, secrets, dumps, or local exports.',
      'Removed risky internal scripts and replaced private examples with fictional demo data.',
      'Updated the README, privacy notes, env placeholders, and ignore rules for public development.',
    ],
  },
  {
    title: 'Season system',
    date: 'Feb 19, 2026',
    tag: 'Prototype feature',
    items: [
      'Added monthly seasons, active-season standings, all-time totals, and completed-season champions.',
      'Introduced the Hall of Fame shelf for archived results.',
    ],
  },
  {
    title: 'Goals, disputes, callouts, and wagers',
    date: 'Jan-Feb 2026',
    tag: 'Prototype feature',
    items: [
      'Expanded the bot from simple commit scoring into a fuller group-accountability game.',
      'Added goal context, score disputes, challenge verification, reaction bonuses, and point wagers.',
    ],
  },
];

export default function ChangelogPage() {
  const [commits, setCommits] = useState<ChangelogCommit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/changelog')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCommits(data);
        } else {
          console.error('API Error:', data.error);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch commits', err);
        setLoading(false);
      });
  }, []);

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
                <Sparkles size={16} />
                CommitCrew clubhouse notes
              </p>
              <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">What&apos;s New</h1>
              <p className="mt-3 max-w-[280px] text-base font-semibold text-[#fffdf7]/85 sm:max-w-2xl">
                Public demo updates and safe repo notes.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 text-center text-xs font-black uppercase sm:w-auto sm:grid-cols-2">
              <div className="min-w-0 border-2 border-[#fffdf7]/60 px-3 py-2">
                <span className="block font-mono text-xl">S2</span>
                Live
              </div>
              <div className="min-w-0 border-2 border-[#fffdf7]/60 px-3 py-2">
                <span className="block font-mono text-xl">S1</span>
                Hall
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-5">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase text-[var(--club-green)]">
                <CalendarDays size={16} />
                Release notes
              </p>
              <h2 className="wavy-title text-3xl font-black text-[var(--ink)]">Scorecard</h2>
            </div>

            <div className="release-timeline">
              {releaseNotes.map((note) => (
                <article key={note.title} className="release-note paper-slip p-4 pt-5 sm:p-5 sm:pt-6">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className="inline-flex w-fit border-2 border-[var(--line)] bg-[var(--button-bg)] px-2 py-1 text-xs font-black uppercase text-[var(--club-green)]">
                        {note.tag}
                      </span>
                      <h3 className="mt-3 text-xl font-black text-[var(--ink)] sm:text-2xl">{note.title}</h3>
                    </div>
                    <span className="font-mono text-sm font-black text-[var(--muted-ink)]">{note.date}</span>
                  </div>
                  <ul className="space-y-2 text-sm font-semibold leading-6 text-[var(--muted-ink)]">
                    {note.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" />
                        <span className="min-w-0">{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="sketch-card tournament-board-panel overflow-hidden">
              <div className="border-b-2 border-[#fffdf7]/35 px-4 py-4">
                <p className="flex items-center gap-2 text-xs font-black uppercase text-[#f3df9c]">
                  <Trophy size={15} />
                  Demo state
                </p>
                <h2 className="mt-1 text-2xl font-black">Current Board</h2>
              </div>
              <div className="divide-y divide-[#fffdf7]/20 px-4 py-2 font-black">
                <div className="flex items-center justify-between py-3">
                  <span>Season 2</span>
                  <span className="font-mono text-[#f3df9c]">Live</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span>Season 1</span>
                  <span className="font-mono text-[#f3df9c]">Hall</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span>Data</span>
                  <span className="font-mono text-[#f3df9c]">Fake</span>
                </div>
              </div>
            </section>

            <section className="sketch-card p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-[var(--club-green)]">
                <GitBranch size={16} />
                Safe commit log
              </div>
              <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
                {loading ? (
                  <p className="py-6 text-center text-sm font-bold text-[var(--muted-ink)]">Loading commit slips...</p>
                ) : (
                  commits.map((commit) => (
                    <article key={commit.sha} className="border-b-2 border-[var(--soft-line)] pb-3 last:border-b-0 last:pb-0">
                      <p className="text-sm font-black leading-snug text-[var(--ink)]">{commit.commit.message}</p>
                      <div className="mt-2 flex items-center justify-between gap-2 text-xs font-bold text-[var(--muted-ink)]">
                        <div className="flex min-w-0 items-center gap-2">
                          {commit.author?.avatar_url ? (
                            <img src={commit.author.avatar_url} className="h-5 w-5 rounded-full border border-[var(--line)]" alt="" />
                          ) : (
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--button-bg)] text-[10px]">
                              {commit.commit.author.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <span className="truncate">{commit.commit.author.name}</span>
                        </div>
                        <span className="shrink-0">{formatDistanceToNow(new Date(commit.commit.author.date))} ago</span>
                      </div>
                      <a
                        href={commit.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[var(--club-green)] hover:underline"
                      >
                        <GitCommit size={12} />
                        {commit.sha.substring(0, 7)}
                      </a>
                    </article>
                  ))
                )}
                {commits.length === 0 && !loading && (
                  <span className="block py-6 text-center text-sm font-bold text-[var(--muted-ink)]">No commits found.</span>
                )}
              </div>
            </section>

            <Link href="/docs" className="clubhouse-button clubhouse-button-green w-full px-4 py-3 text-sm font-black">
              Read the rules
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
