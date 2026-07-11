import { NextResponse } from 'next/server';
import { demoChangelogCommits } from '../../../lib/demoData';

export async function GET() {
    const token = process.env.GITHUB_TOKEN;
    const repo = 'kirbybach/CommitCrew';
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';

    if (!token) {
        if (demoMode) {
            return NextResponse.json(demoChangelogCommits);
        }

        return NextResponse.json({ error: 'Missing GITHUB_TOKEN' }, { status: 500 });
    }

    try {
        const res = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=15`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
            },
            cache: 'no-store' // No caching (Real-time)
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('GitHub API Error:', res.status, errorText);
            return NextResponse.json({ error: `GitHub API Error: ${res.status}` }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch commits:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
