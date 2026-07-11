import { supabase } from '../services';

export class BetsService {
    /**
     * Create a new bet. 
     * Status starts as 'pending'.
     */
    public static async createBet(userId: string, task: string, amount: number, deadline: Date) {
        const { data, error } = await supabase.from('bets').insert({
            user_id: userId,
            task: task,
            amount: amount,
            deadline: deadline.toISOString(),
            status: 'pending'
        }).select().single();

        if (error) throw error;
        return data;
    }

    /**
     * Get active bets for a user.
     */
    public static async getActiveBets(userId: string) {
        const { data, error } = await supabase
            .from('bets')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'pending');

        if (error) {
            console.error('Error fetching bets:', error);
            return [];
        }
        return data || [];
    }

    /**
     * Resolve a bet (won/lost).
     */
    public static async resolveBet(betId: string, outcome: 'won' | 'lost', commitId?: string | number) {
        const updateData: any = { status: outcome };
        if (commitId) {
            updateData.resolved_commit_id = commitId;
        }

        const { error } = await supabase
            .from('bets')
            .update(updateData)
            .eq('id', betId);

        if (error) console.error(`Error resolving bet ${betId}:`, error);
    }

    /**
     * Check for expired bets and mark them as lost.
     * Intended to be run by Cron.
     */
    public static async checkExpiredBets() {
        // Find pending bets where deadline < now
        const now = new Date().toISOString();
        const { data: expiredBets, error } = await supabase
            .from('bets')
            .select('*')
            .eq('status', 'pending')
            .lt('deadline', now);

        if (error) {
            console.error('Error fetching expired bets:', error);
            return;
        }

        if (!expiredBets || expiredBets.length === 0) return;

        console.log(`Found ${expiredBets.length} expired bets. marking as lost.`);

        for (const bet of expiredBets) {
            // Mark as lost/expired
            await supabase.from('bets').update({ status: 'expired' }).eq('id', bet.id);

            // OPTIONAL: We could deduct points here immediately if we haven't already escrowed them.
            // For now, the "penalty" is just that they lost the potential gain, or we can deduct explicitly.
            // Plan says: "Failure: -BetAmount". 
            // We need to create a "negative commit" or some record of the deduction.
            // Let's insert a system commit for the penalty.

            await supabase.from('commits').insert({
                user_id: bet.user_id,
                message: `[SYSTEM] Bet Expired: "${bet.task}"`,
                grade: -bet.amount,
                ai_feedback: `You bet ${bet.amount} pts you'd "${bet.task}" by now. You didn't. Paying up.`,
                complexity_score: 0,
                impact_score: 0
            });
        }
    }
}
