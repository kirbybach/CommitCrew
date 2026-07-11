const now = new Date();
const currentSeasonStart = new Date(now.getFullYear(), now.getMonth(), 1);
const previousSeasonStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

function daysAgo(days: number, hour = 12) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function seasonLabel(date: Date) {
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function dateInSeason(seasonStart: Date, day: number, hour = 12) {
  const date = new Date(seasonStart);
  date.setDate(day);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function dateInCurrentSeason(daysBack: number, hour = 12) {
  const date = new Date(currentSeasonStart);
  date.setDate(Math.max(1, now.getDate() - daysBack));
  date.setHours(hour, 0, 0, 0);

  if (date.getTime() > now.getTime()) {
    date.setHours(Math.max(0, now.getHours() - 1), 0, 0, 0);
  }

  return date.toISOString();
}

export const demoUsers = [
  {
    id: 'demo-user-alex',
    name: 'Alex',
    avatar_url: null,
    weekly_wins_count: 2,
    created_at: daysAgo(40),
  },
  {
    id: 'demo-user-maya',
    name: 'Maya',
    avatar_url: null,
    weekly_wins_count: 1,
    created_at: daysAgo(36),
  },
  {
    id: 'demo-user-jordan',
    name: 'Jordan',
    avatar_url: null,
    weekly_wins_count: 3,
    created_at: daysAgo(32),
  },
  {
    id: 'demo-user-sam',
    name: 'Sam',
    avatar_url: null,
    weekly_wins_count: 0,
    created_at: daysAgo(28),
  },
];

export const demoCommits = [
  {
    id: 'demo-s2-commit-001',
    user_id: 'demo-user-jordan',
    message: 'fixed the auth redirect bug and added tests around login state',
    grade: 16,
    ai_feedback: 'real engineering work. bug fix plus tests is a strong commit.',
    created_at: dateInCurrentSeason(1, 14),
  },
  {
    id: 'demo-s2-commit-002',
    user_id: 'demo-user-alex',
    message: 'worked on my portfolio site for 2h and fixed the mobile layout',
    grade: 14,
    ai_feedback: 'solid ship. real feature work and clear momentum.',
    created_at: dateInCurrentSeason(2, 18),
  },
  {
    id: 'demo-s2-commit-003',
    user_id: 'demo-user-maya',
    message: 'studied binary search patterns for 90m and solved two practice problems',
    grade: 11,
    ai_feedback: 'good reps. not flashy, but this is how consistency stacks.',
    created_at: dateInCurrentSeason(3, 20),
  },
  {
    id: 'demo-s2-commit-004',
    user_id: 'demo-user-sam',
    message: 'ran 3 miles before class',
    grade: 7,
    ai_feedback: 'clean discipline. simple, useful, done.',
    created_at: dateInCurrentSeason(4, 8),
  },
  {
    id: 'demo-s2-commit-005',
    user_id: 'demo-user-alex',
    message: "planned tomorrow's tasks",
    grade: 3,
    ai_feedback: 'planning is fine, but the board needs action next.',
    created_at: dateInCurrentSeason(5, 21),
  },
  {
    id: 'demo-s2-commit-006',
    user_id: 'demo-user-jordan',
    message: 'refactored the leaderboard query and removed duplicate state',
    grade: 13,
    ai_feedback: 'nice cleanup. less drift, better dashboard.',
    created_at: dateInCurrentSeason(7, 16),
  },
  {
    id: 'demo-s2-commit-007',
    user_id: 'demo-user-maya',
    message: 'wrote the first draft of the project proposal',
    grade: 9,
    ai_feedback: 'useful forward motion. draft exists, now iterate.',
    created_at: dateInCurrentSeason(9, 11),
  },
  {
    id: 'demo-s1-commit-001',
    user_id: 'demo-user-jordan',
    message: 'shipped the season dashboard banner and standings snapshot',
    grade: 18,
    ai_feedback: 'big visible feature, clear product impact.',
    created_at: dateInSeason(previousSeasonStart, 24, 15),
  },
  {
    id: 'demo-s1-commit-002',
    user_id: 'demo-user-alex',
    message: 'rebuilt the landing page layout and tightened mobile spacing',
    grade: 15,
    ai_feedback: 'high-quality frontend work with real polish.',
    created_at: dateInSeason(previousSeasonStart, 23, 18),
  },
  {
    id: 'demo-s1-commit-003',
    user_id: 'demo-user-maya',
    message: 'finished the systems design reading set and summarized notes',
    grade: 13,
    ai_feedback: 'solid learning loop with a useful artifact.',
    created_at: dateInSeason(previousSeasonStart, 22, 20),
  },
  {
    id: 'demo-s1-commit-004',
    user_id: 'demo-user-jordan',
    message: 'added season finalization logic and tested champion selection',
    grade: 14,
    ai_feedback: 'core feature work with tests where it mattered.',
    created_at: dateInSeason(previousSeasonStart, 20, 14),
  },
  {
    id: 'demo-s1-commit-005',
    user_id: 'demo-user-alex',
    message: 'fixed chart overflow on small screens',
    grade: 12,
    ai_feedback: 'small surface area, real user experience win.',
    created_at: dateInSeason(previousSeasonStart, 19, 17),
  },
  {
    id: 'demo-s1-commit-006',
    user_id: 'demo-user-sam',
    message: 'completed a long run and logged recovery notes',
    grade: 8,
    ai_feedback: 'good discipline and useful follow-through.',
    created_at: dateInSeason(previousSeasonStart, 18, 9),
  },
  {
    id: 'demo-s1-commit-007',
    user_id: 'demo-user-maya',
    message: 'implemented the goal list empty state',
    grade: 10,
    ai_feedback: 'clean product polish that removes confusion.',
    created_at: dateInSeason(previousSeasonStart, 16, 13),
  },
  {
    id: 'demo-s1-commit-008',
    user_id: 'demo-user-jordan',
    message: 'debugged duplicate commit inserts and documented the fix',
    grade: 8,
    ai_feedback: 'unblocked reliability and left breadcrumbs.',
    created_at: dateInSeason(previousSeasonStart, 15, 16),
  },
  {
    id: 'demo-s1-commit-009',
    user_id: 'demo-user-alex',
    message: 'wrote copy for the privacy and demo-mode sections',
    grade: 9,
    ai_feedback: 'clear communication is product work too.',
    created_at: dateInSeason(previousSeasonStart, 14, 11),
  },
  {
    id: 'demo-s1-commit-010',
    user_id: 'demo-user-sam',
    message: 'meal prepped for the week and planned workouts',
    grade: 7,
    ai_feedback: 'useful setup work that makes consistency easier.',
    created_at: dateInSeason(previousSeasonStart, 12, 10),
  },
  {
    id: 'demo-s1-commit-011',
    user_id: 'demo-user-maya',
    message: 'solved three graph traversal problems',
    grade: 8,
    ai_feedback: 'good practice volume with a focused theme.',
    created_at: dateInSeason(previousSeasonStart, 11, 19),
  },
  {
    id: 'demo-s1-commit-012',
    user_id: 'demo-user-jordan',
    message: 'cleaned up Supabase migration ordering',
    grade: 6,
    ai_feedback: 'not flashy, but it reduces future pain.',
    created_at: dateInSeason(previousSeasonStart, 10, 12),
  },
  {
    id: 'demo-s1-commit-013',
    user_id: 'demo-user-alex',
    message: 'added dashboard loading states',
    grade: 5,
    ai_feedback: 'small but visible polish for rough network moments.',
    created_at: dateInSeason(previousSeasonStart, 9, 15),
  },
  {
    id: 'demo-s1-commit-014',
    user_id: 'demo-user-sam',
    message: 'finished mobility work after training',
    grade: 6,
    ai_feedback: 'quiet consistency, still counts.',
    created_at: dateInSeason(previousSeasonStart, 7, 8),
  },
  {
    id: 'demo-s1-commit-015',
    user_id: 'demo-user-jordan',
    message: 'reviewed open bugs and triaged the top three',
    grade: 4,
    ai_feedback: 'good prioritization work, lighter execution.',
    created_at: dateInSeason(previousSeasonStart, 6, 17),
  },
  {
    id: 'demo-s1-commit-016',
    user_id: 'demo-user-alex',
    message: 'organized the component backlog',
    grade: 4,
    ai_feedback: 'planning helped, but needs shipping next.',
    created_at: dateInSeason(previousSeasonStart, 5, 12),
  },
  {
    id: 'demo-s1-commit-017',
    user_id: 'demo-user-maya',
    message: 'reviewed spaced repetition cards for algorithms',
    grade: 7,
    ai_feedback: 'steady reps, good retention work.',
    created_at: dateInSeason(previousSeasonStart, 4, 20),
  },
  {
    id: 'demo-s1-commit-018',
    user_id: 'demo-user-jordan',
    message: 'fixed a flaky test in the scoring service',
    grade: 2,
    ai_feedback: 'small fix, but useful stability.',
    created_at: dateInSeason(previousSeasonStart, 3, 13),
  },
].map((commit) => ({
  ...commit,
  users: demoUsers.find((user) => user.id === commit.user_id) || null,
}));

export const demoGoals = [
  {
    id: 'demo-goal-ship-dashboard',
    user_id: 'demo-user-alex',
    description: 'Ship the dashboard polish pass',
    status: 'active',
    created_at: daysAgo(10),
  },
  {
    id: 'demo-goal-study-systems',
    user_id: 'demo-user-maya',
    description: 'Review core systems design notes',
    status: 'active',
    created_at: daysAgo(8),
  },
  {
    id: 'demo-goal-finish-auth',
    user_id: 'demo-user-jordan',
    description: 'Finish auth reliability improvements',
    status: 'completed',
    created_at: daysAgo(18),
    updated_at: daysAgo(1),
  },
];

export const demoSeasons = [
  {
    id: 'demo-season-1',
    season_number: 1,
    label: seasonLabel(previousSeasonStart),
    month: previousSeasonStart.getMonth() + 1,
    year: previousSeasonStart.getFullYear(),
    status: 'completed',
    champion_id: 'demo-user-jordan',
    champion_name: 'Jordan',
    champion_score: 52,
    standings: [
      { user_id: 'demo-user-jordan', name: 'Jordan', score: 52, rank: 1, commit_count: 6 },
      { user_id: 'demo-user-alex', name: 'Alex', score: 45, rank: 2, commit_count: 5 },
      { user_id: 'demo-user-maya', name: 'Maya', score: 38, rank: 3, commit_count: 4 },
      { user_id: 'demo-user-sam', name: 'Sam', score: 21, rank: 4, commit_count: 3 },
    ],
  },
  {
    id: 'demo-season-2',
    season_number: 2,
    label: seasonLabel(currentSeasonStart),
    month: currentSeasonStart.getMonth() + 1,
    year: currentSeasonStart.getFullYear(),
    status: 'active',
    champion_id: null,
    champion_name: null,
    champion_score: null,
    standings: [
      { user_id: 'demo-user-jordan', name: 'Jordan', score: 29, rank: 1, commit_count: 2 },
      { user_id: 'demo-user-maya', name: 'Maya', score: 20, rank: 2, commit_count: 2 },
      { user_id: 'demo-user-alex', name: 'Alex', score: 17, rank: 3, commit_count: 2 },
      { user_id: 'demo-user-sam', name: 'Sam', score: 7, rank: 4, commit_count: 1 },
    ],
  },
];

export const demoChangelogCommits = [
  {
    sha: 'demo001',
    html_url: 'https://github.com/kirbybach/CommitCrew',
    author: { avatar_url: null },
    commit: {
      message: 'add sanitized demo data flow',
      author: { name: 'CommitCrew Demo', date: daysAgo(1) },
    },
  },
  {
    sha: 'demo002',
    html_url: 'https://github.com/kirbybach/CommitCrew',
    author: { avatar_url: null },
    commit: {
      message: 'document public privacy boundaries',
      author: { name: 'CommitCrew Demo', date: daysAgo(2) },
    },
  },
];
