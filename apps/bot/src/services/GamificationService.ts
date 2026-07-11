import { config } from '../config';
import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { SeasonsService } from './SeasonsService';

export const GamificationService = {
    async generateDailyLeaderboard(supabase: SupabaseClient): Promise<string | null> {
        // Get 24-hour window (Yesterday 9PM to Today 9PM)
        const now = new Date();
        const yesterdayStart = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString();

        const { data: users } = await supabase.from('users').select('*');
        const { data: todayCommits } = await supabase
            .from('commits')
            .select('user_id, grade')
            .gte('created_at', yesterdayStart);

        if (!users || !todayCommits) return null;

        // Calculate TODAY's Scores
        const dailyScores: Record<string, number> = {};
        users.forEach((u: any) => dailyScores[u.id] = 0);
        todayCommits.forEach((c: any) => {
            if (dailyScores[c.user_id] !== undefined) dailyScores[c.user_id] += (c.grade || 0);
        });

        // Build leaderboard with user data
        const leaderboard = users
            .map((u: any) => ({ id: u.id, name: u.name, score: dailyScores[u.id] }))
            .sort((a, b) => b.score - a.score);

        // Top 5 for broadcast
        const top5 = leaderboard.slice(0, 5);

        let message = `*🏆 Daily Leaderboard*\n\n` +
            top5.map((u, i) => `${i + 1}. ${u.name} (*${u.score} pts*)`).join('\n');

        // Append season standings footer
        try {
            const seasonData = await SeasonsService.getCurrentSeasonStandings();
            if (seasonData && seasonData.standings.length > 0) {
                const seasonTop3 = seasonData.standings.slice(0, 3);
                message += `\n\n---\n*⚔️ Season ${seasonData.seasonNumber} Standings*\n` +
                    seasonTop3.map((u, i) => `${i + 1}. ${u.name} (*${u.score} pts*)`).join('\n');
            }
        } catch (err) {
            console.error('[GamificationService] Failed to fetch season standings for daily report:', err);
        }

        message += `\n\n_Keep locking in!_ 🔒`;
        return message;
    },

    async generateWeeklyCheckIn(supabase: SupabaseClient, openai: OpenAI): Promise<string | null> {
        // Fetch last 7 days commits
        const now = new Date();
        const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString();

        const { data: users } = await supabase.from('users').select('*');
        const { data: commits } = await supabase
            .from('commits')
            .select('*, users(name)')
            .gte('created_at', weekAgo);

        if (!users || !commits || commits.length === 0) return null;

        // Aggregate Data for AI (IMPACT ANALYSIS)
        const userStats: Record<string, { id: string, name: string, points: number, count: number, current_wins: number }> = {};
        users.forEach((u: any) => {
            userStats[u.id] = { id: u.id, name: u.name, points: 0, count: 0, current_wins: u.weekly_wins_count || 0 };
        });

        commits.forEach((c: any) => {
            const uid = c.user_id;
            if (userStats[uid]) {
                userStats[uid].points += (c.grade || 0);
                userStats[uid].count += 1;
            }
        });

        // Determine Weekly Winner(s)
        const sortedStats = Object.values(userStats).sort((a, b) => b.points - a.points);
        const topScore = sortedStats[0].points;
        let winnerAnnouncement = "";

        if (topScore > 0) {
            const winners = sortedStats.filter(u => u.points === topScore);
            for (const winner of winners) {
                await supabase
                    .from('users')
                    .update({ weekly_wins_count: winner.current_wins + 1 })
                    .eq('id', winner.id);
                console.log(`🏆 Weekly win awarded to ${winner.name} (${topScore} pts)`);
            }
            winnerAnnouncement = `\n\n🏆 *Weekly Winner(s):* ${winners.map(w => w.name).join(', ')} (*${topScore} pts*)!`;
        }

        const statsString = Object.values(userStats)
            .filter(u => u.count > 0)
            .map(u => `${u.name}: ${u.points} pts (${u.count} commits)`)
            .join(', ');

        // Generate AI Summary
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are the savage CommitCrew bot. Generate a Weekly Recap based on these user stats (Last 7 days): [${statsString}].
                     
                     **Rules:**
                     - Roast the people with low impact (low points/volume).
                     - Hype up the high scorers (High Impact).
                     - Remind them that "3 huge days > 7 tiny days".
                     - Keep it memey, "brainrot" style, but under 200 words.
                     - Use bolding (*text*) for emphasis.`
                },
                { role: "user", content: "Generate weekly report." }
            ],
            model: config.OPENAI_MODEL
        });

        const report = completion.choices[0].message.content;
        return `*📅 Weekly Check-in*\n\n${report}${winnerAnnouncement}`;
    }
};
