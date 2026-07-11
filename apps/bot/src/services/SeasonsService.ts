import { supabase } from '../services';

type SeasonStatus = 'active' | 'completed';

interface SeasonRecord {
    id?: string;
    season_number: number;
    month: number;
    year: number;
    label?: string;
    status?: SeasonStatus;
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export class SeasonsService {
    private static monthIndex(month: number, year: number): number {
        return year * 12 + (month - 1);
    }

    private static key(month: number, year: number): string {
        return `${year}-${month}`;
    }

    private static nextMonth(month: number, year: number): { month: number; year: number } {
        if (month === 12) return { month: 1, year: year + 1 };
        return { month: month + 1, year };
    }

    private static getCurrentEasternMonth(): { month: number; year: number } {
        const now = new Date();
        const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        return {
            month: eastern.getMonth() + 1,
            year: eastern.getFullYear()
        };
    }

    private static getSeasonLabel(month: number, year: number): string {
        return `${MONTH_NAMES[month - 1]} ${year}`;
    }

    private static async getExpectedSeasonNumber(month: number, year: number): Promise<number> {
        const { data: firstSeason } = await supabase
            .from('seasons')
            .select('season_number, month, year')
            .order('year', { ascending: true })
            .order('month', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (!firstSeason) return 1;

        const offset = this.monthIndex(month, year) - this.monthIndex(firstSeason.month, firstSeason.year);
        return firstSeason.season_number + Math.max(0, offset);
    }

    private static async syncSeasonMetadata(month: number, year: number): Promise<void> {
        const { data: existing } = await supabase
            .from('seasons')
            .select('season_number, label')
            .eq('month', month)
            .eq('year', year)
            .maybeSingle();

        if (!existing) return;

        const expectedSeasonNumber = await this.getExpectedSeasonNumber(month, year);
        const expectedLabel = this.getSeasonLabel(month, year);
        const updates: Partial<Pick<SeasonRecord, 'season_number' | 'label'>> = {};

        if (existing.season_number !== expectedSeasonNumber) {
            updates.season_number = expectedSeasonNumber;
        }

        if (existing.label !== expectedLabel) {
            updates.label = expectedLabel;
        }

        if (Object.keys(updates).length === 0) return;

        const { error } = await supabase
            .from('seasons')
            .update(updates)
            .eq('month', month)
            .eq('year', year);

        if (error) {
            console.error('[SeasonsService] Error syncing season metadata:', error);
        }
    }

    private static async finalizePastSeasonsThrough(currentMonth: number, currentYear: number): Promise<void> {
        const { data: seasons } = await supabase
            .from('seasons')
            .select('season_number, month, year, status')
            .order('year', { ascending: true })
            .order('month', { ascending: true });

        if (!seasons || seasons.length === 0) return;

        const currentIndex = this.monthIndex(currentMonth, currentYear);
        const seasonsByMonth = new Map<string, SeasonRecord>();
        seasons.forEach((season: SeasonRecord) => {
            seasonsByMonth.set(this.key(season.month, season.year), season);
        });

        let cursor = { month: seasons[0].month, year: seasons[0].year };
        while (this.monthIndex(cursor.month, cursor.year) < currentIndex) {
            const existing = seasonsByMonth.get(this.key(cursor.month, cursor.year));

            if (!existing || existing.status !== 'completed') {
                await this.finalizeSeason(cursor.month, cursor.year);
            } else {
                await this.syncSeasonMetadata(cursor.month, cursor.year);
            }

            cursor = this.nextMonth(cursor.month, cursor.year);
        }
    }

    /**
     * Finalize a season: aggregate commits for the given month/year,
     * compute standings, determine champion, and write to DB.
     * 
     * Idempotent: if the season is already 'completed', returns null.
     */
    public static async finalizeSeason(month: number, year: number): Promise<string | null> {
        // 1. Check if already finalized
        const { data: existing } = await supabase
            .from('seasons')
            .select('status, season_number')
            .eq('month', month)
            .eq('year', year)
            .maybeSingle();

        if (existing?.status === 'completed') {
            await this.syncSeasonMetadata(month, year);
            console.log(`[SeasonsService] Season ${month}/${year} already finalized, skipping.`);
            return null;
        }

        // 2. Query commits for this month (using < next month start to avoid timezone boundary issues)
        const seasonStart = new Date(year, month - 1, 1).toISOString();
        const seasonEnd = new Date(year, month, 1).toISOString(); // 1st of next month

        const { data: commits, error: commitsErr } = await supabase
            .from('commits')
            .select('user_id, grade')
            .gte('created_at', seasonStart)
            .lt('created_at', seasonEnd);

        if (commitsErr) {
            console.error('[SeasonsService] Error fetching commits for finalization:', commitsErr);
            return null;
        }

        // 3. Get all users (to include 0-score users in standings)
        const { data: allUsers } = await supabase.from('users').select('id, name');
        if (!allUsers) {
            console.error('[SeasonsService] Error fetching users for finalization.');
            return null;
        }

        // 4. Aggregate per-user scores
        const userStats: Record<string, { user_id: string; name: string; score: number; commit_count: number }> = {};
        allUsers.forEach(u => {
            userStats[u.id] = { user_id: u.id, name: u.name || 'Unknown', score: 0, commit_count: 0 };
        });

        (commits || []).forEach((c: any) => {
            if (userStats[c.user_id]) {
                userStats[c.user_id].score += (c.grade || 0);
                userStats[c.user_id].commit_count += 1;
            }
        });

        // 5. Sort and rank (ties get same rank)
        const sorted = Object.values(userStats)
            .filter(u => u.commit_count > 0) // Exclude users with zero commits from standings
            .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

        let currentRank = 1;
        const standings = sorted.map((u, i) => {
            if (i > 0 && u.score < sorted[i - 1].score) {
                currentRank = i + 1;
            }
            return { ...u, rank: currentRank };
        });

        // 6. Determine champion(s)
        const topScore = standings.length > 0 ? standings[0].score : 0;
        const champions = standings.filter(u => u.rank === 1);
        // For denormalized fields, pick first alphabetically
        const displayChampion = champions.length > 0 ? champions.sort((a, b) => a.name.localeCompare(b.name))[0] : null;

        // 7. Compute season number from calendar position, not row count.
        const seasonNumber = await this.getExpectedSeasonNumber(month, year);

        // 8. Month label
        const label = this.getSeasonLabel(month, year);

        // 9. Upsert season
        const seasonData: any = {
            month,
            year,
            label,
            status: 'completed',
            season_number: seasonNumber,
            champion_id: displayChampion?.user_id || null,
            champion_name: displayChampion?.name || null,
            champion_score: displayChampion?.score || null,
            standings,
            finalized_at: new Date().toISOString()
        };

        if (!existing) {
            // No row exists yet — insert
            const { error } = await supabase.from('seasons').insert(seasonData);
            if (error) {
                console.error('[SeasonsService] Error inserting finalized season:', error);
                return null;
            }
        } else {
            // Row exists (was 'active') — update, including season_number in case older recovery code mis-numbered it.
            const { error } = await supabase
                .from('seasons')
                .update(seasonData)
                .eq('month', month)
                .eq('year', year);
            if (error) {
                console.error('[SeasonsService] Error updating season to completed:', error);
                return null;
            }
        }

        console.log(`[SeasonsService] ✅ Finalized Season: ${label} | Champion: ${displayChampion?.name || 'None'} (${topScore} pts)`);

        // 10. Build broadcast message
        const top3 = standings.slice(0, 3);
        const medals = ['👑', '🥈', '🥉'];

        let message = `*🏆 Season ${seasonNumber}: ${label} is OVER!*\n\n`;

        if (champions.length === 0) {
            message += `_No commits this season. Everyone was sleep._\n`;
        } else if (champions.length > 1) {
            message += `*Co-Champions:* ${champions.map(c => c.name).join(' & ')} (*${topScore} pts*)\n\n`;
        }

        top3.forEach((u, i) => {
            message += `${medals[i] || `${i + 1}.`} ${u.name} — *${u.score} pts* (${u.commit_count} commits)\n`;
        });

        message += `\n_New season starts NOW. Leaderboard reset. Lock in._ 🔥`;

        return message;
    }

    /**
     * Ensure an 'active' season row exists for the current month.
     * Idempotent: does nothing if row already exists.
     */
    public static async ensureCurrentSeason(): Promise<void> {
        const { month, year } = this.getCurrentEasternMonth();

        await this.finalizePastSeasonsThrough(month, year);

        const { data: existing } = await supabase
            .from('seasons')
            .select('id, status, season_number, label')
            .eq('month', month)
            .eq('year', year)
            .maybeSingle();

        const seasonNumber = await this.getExpectedSeasonNumber(month, year);
        const label = this.getSeasonLabel(month, year);

        if (existing) {
            const updates: any = {};

            if (existing.status !== 'active') {
                updates.status = 'active';
                updates.champion_id = null;
                updates.champion_name = null;
                updates.champion_score = null;
                updates.standings = null;
                updates.finalized_at = null;
            }

            if (existing.season_number !== seasonNumber) {
                updates.season_number = seasonNumber;
            }

            if (existing.label !== label) {
                updates.label = label;
            }

            if (Object.keys(updates).length > 0) {
                const { error } = await supabase
                    .from('seasons')
                    .update(updates)
                    .eq('month', month)
                    .eq('year', year);

                if (error) {
                    console.error('[SeasonsService] Error repairing current season:', error);
                    return;
                }
            }

            console.log(`[SeasonsService] Current season already exists (${month}/${year}).`);
            return;
        }

        const { error } = await supabase.from('seasons').insert({
            season_number: seasonNumber,
            month,
            year,
            label,
            status: 'active'
        });

        if (error) {
            console.error('[SeasonsService] Error creating current season:', error);
        } else {
            console.log(`[SeasonsService] ✅ Created Season ${seasonNumber}: ${label} (active)`);
        }
    }

    /**
     * Get current season standings (live computation from commits).
     * Used by GamificationService for the daily leaderboard footer.
     */
    public static async getCurrentSeasonStandings(): Promise<{ seasonNumber: number; label: string; standings: { name: string; score: number }[] } | null> {
        const { month, year } = this.getCurrentEasternMonth();

        // Get season info
        const { data: season } = await supabase
            .from('seasons')
            .select('season_number, label')
            .eq('month', month)
            .eq('year', year)
            .maybeSingle();

        if (!season) return null;

        // Get commits for current month
        const seasonStart = new Date(year, month - 1, 1).toISOString();
        const seasonEnd = new Date(year, month, 1).toISOString();

        const { data: commits } = await supabase
            .from('commits')
            .select('user_id, grade')
            .gte('created_at', seasonStart)
            .lt('created_at', seasonEnd);

        const { data: allUsers } = await supabase.from('users').select('id, name');

        if (!commits || !allUsers) return null;

        const scores: Record<string, { name: string; score: number }> = {};
        allUsers.forEach(u => {
            scores[u.id] = { name: u.name || 'Unknown', score: 0 };
        });

        commits.forEach((c: any) => {
            if (scores[c.user_id]) {
                scores[c.user_id].score += (c.grade || 0);
            }
        });

        const standings = Object.values(scores)
            .filter(u => u.score !== 0)
            .sort((a, b) => b.score - a.score);

        return {
            seasonNumber: season.season_number,
            label: season.label,
            standings
        };
    }
}
