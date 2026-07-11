const now = new Date();

function daysAgo(days: number, hour = 12) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
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
    id: 'demo-commit-001',
    user_id: 'demo-user-jordan',
    message: 'fixed the auth redirect bug and added tests around login state',
    grade: 16,
    ai_feedback: 'real engineering work. bug fix plus tests is a strong commit.',
    created_at: daysAgo(1, 14),
  },
  {
    id: 'demo-commit-002',
    user_id: 'demo-user-alex',
    message: 'worked on my portfolio site for 2h and fixed the mobile layout',
    grade: 14,
    ai_feedback: 'solid ship. real feature work and clear momentum.',
    created_at: daysAgo(2, 18),
  },
  {
    id: 'demo-commit-003',
    user_id: 'demo-user-maya',
    message: 'studied binary search patterns for 90m and solved two practice problems',
    grade: 11,
    ai_feedback: 'good reps. not flashy, but this is how consistency stacks.',
    created_at: daysAgo(3, 20),
  },
  {
    id: 'demo-commit-004',
    user_id: 'demo-user-sam',
    message: 'ran 3 miles before class',
    grade: 7,
    ai_feedback: 'clean discipline. simple, useful, done.',
    created_at: daysAgo(4, 8),
  },
  {
    id: 'demo-commit-005',
    user_id: 'demo-user-alex',
    message: "planned tomorrow's tasks",
    grade: 3,
    ai_feedback: 'planning is fine, but the board needs action next.',
    created_at: daysAgo(5, 21),
  },
  {
    id: 'demo-commit-006',
    user_id: 'demo-user-jordan',
    message: 'refactored the leaderboard query and removed duplicate state',
    grade: 13,
    ai_feedback: 'nice cleanup. less drift, better dashboard.',
    created_at: daysAgo(7, 16),
  },
  {
    id: 'demo-commit-007',
    user_id: 'demo-user-maya',
    message: 'wrote the first draft of the project proposal',
    grade: 9,
    ai_feedback: 'useful forward motion. draft exists, now iterate.',
    created_at: daysAgo(9, 11),
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
    id: 'demo-season-active',
    season_number: 3,
    label: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    status: 'active',
    champion_id: null,
    champion_name: null,
    champion_score: null,
    standings: null,
  },
  {
    id: 'demo-season-previous',
    season_number: 2,
    label: new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
    month: new Date(now.getFullYear(), now.getMonth() - 1, 1).getMonth() + 1,
    year: new Date(now.getFullYear(), now.getMonth() - 1, 1).getFullYear(),
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
];

export const demoChangelogCommits = [
  {
    sha: 'demo001',
    html_url: 'https://github.com/kirbybach/CommitCrew',
    author: { avatar_url: '' },
    commit: {
      message: 'add sanitized demo data flow',
      author: { name: 'CommitCrew Demo', date: daysAgo(1) },
    },
  },
  {
    sha: 'demo002',
    html_url: 'https://github.com/kirbybach/CommitCrew',
    author: { avatar_url: '' },
    commit: {
      message: 'document public privacy boundaries',
      author: { name: 'CommitCrew Demo', date: daysAgo(2) },
    },
  },
];

