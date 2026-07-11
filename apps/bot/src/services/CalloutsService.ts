import { supabase, openai } from '../services';
import { config } from '../config';
import { SupabaseClient } from '@supabase/supabase-js';

export interface Callout {
    id: string;
    caller_id: string;
    target_id: string;
    reason: string;
    status: 'pending' | 'delivered' | 'expired';
    bonus_points: number;
    penalty_points: number;
    caller_reward: number;
    expires_at: string;
    created_at: string;
    announcement_source_msg_ref?: string;
}

export class CalloutsService {
    /**
     * Create a new callout
     */
    public static async createCallout(
        callerId: string,
        targetId: string,
        reason: string,
        deadline: Date
    ): Promise<{ success: boolean; message: string; callout?: Callout }> {
        // Validation: No self-callout
        if (callerId === targetId) {
            return { success: false, message: "You can't call yourself out. That's just a regular goal." };
        }

        // Validation: Check for existing pending callout for this pair
        const { data: existing } = await supabase
            .from('callouts')
            .select('id')
            .eq('caller_id', callerId)
            .eq('target_id', targetId)
            .eq('status', 'pending')
            .single();

        if (existing) {
            return { success: false, message: "❌ You already have a pending callout for this person. Let them finish the first one!" };
        }

        // Check active callout limit for caller (Prevent spam)
        const { count } = await supabase
            .from('callouts')
            .select('id', { count: 'exact' })
            .eq('caller_id', callerId)
            .eq('status', 'pending');

        if ((count || 0) >= 2) {
            return { success: false, message: "❌ You have too many active callouts (Max 2). Wait for some to resolve." };
        }

        // Use details passed in
        const expiresAt = deadline.toISOString();

        const { data: callout, error } = await supabase
            .from('callouts')
            .insert({
                caller_id: callerId,
                target_id: targetId,
                reason: reason,
                expires_at: expiresAt,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating callout:', error);
            return { success: false, message: "Failed to create callout. Database error." };
        }

        return { success: true, message: "Callout created!", callout };
    }

    /**
     * List active callouts for display
     */
    public static async listActive(): Promise<string> {
        const { data: callouts } = await supabase
            .from('callouts')
            .select(`
                *,
                caller:caller_id(name),
                target:target_id(name)
            `)
            .eq('status', 'pending')
            .order('expires_at', { ascending: true });

        if (!callouts || callouts.length === 0) {
            return "No active callouts right now. The streets are quiet. 🤫";
        }

        return "*📣 Active Callouts*\n\n" + callouts.map((c: any) => {
            const timeLeft = Math.max(0, new Date(c.expires_at).getTime() - Date.now());
            const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
            return `• *${c.caller.name}* called out *${c.target.name}*:\n  "${c.reason}"\n  ⏳ ${hoursLeft}h remaining`;
        }).join('\n\n');
    }

    /**
     * Set the announcement message ID for a callout (for reply tracking)
     */
    public static async setAnnouncementMessageId(calloutId: string, messageId: string): Promise<void> {
        await supabase.from('callouts').update({ announcement_source_msg_ref: messageId }).eq('id', calloutId);
    }

    /**
     * Handle a reply to a callout message
     */
    public static async handleReply(targetId: string, messageIdOfCallout: string): Promise<string | null> {
        // 1. Find the callout
        const { data: callout } = await supabase
            .from('callouts')
            .select(`*, caller:caller_id(name)`)
            .eq('announcement_source_msg_ref', messageIdOfCallout)
            .eq('target_id', targetId) // Security: Ensure replier is the target
            .eq('status', 'pending')
            .single();

        if (!callout) return null; // Not a callout, or not for this user, or already resolved

        // 2. Fetch latest commit from this user
        const { data: commit } = await supabase
            .from('commits')
            .select('*')
            .eq('user_id', targetId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!commit) {
            return "❌ You haven't made any commits yet to check!";
        }

        // 3. Trigger Check
        const result = await this.checkAndResolve(targetId, commit.message, commit.id, "User manually requested verification via reply.");

        if (result.resolved) {
            return result.message || "✅ *Verification Successful!* Points awarded.";
        } else {
            return "❌ *Verification Failed.* The latest commit didn't match the callout criteria.";
        }
    }

    /**
     * Manually resolve a callout (Caller uses @callout verify)
     */
    public static async resolveManually(callerId: string, targetId: string): Promise<{ success: boolean; message: string }> {
        // Find pending callout
        const { data: callout } = await supabase
            .from('callouts')
            .select(`*, target:target_id(name)`)
            .eq('caller_id', callerId)
            .eq('target_id', targetId)
            .eq('status', 'pending')
            .single();

        if (!callout) {
            return { success: false, message: "❌ No pending callout found for this user." };
        }

        // Resolve it
        await supabase
            .from('callouts')
            .update({
                status: 'delivered',
                resolved_at: new Date().toISOString()
            })
            .eq('id', callout.id);

        // System Commit for Target (Bonus)
        await supabase.from('commits').insert({
            user_id: callout.target_id,
            message: `[SYSTEM] Callout Manually Verified by ${callout.caller_id === callerId ? 'Caller' : 'Admin'}`,
            grade: callout.bonus_points,
            ai_feedback: `The caller verified you did the work, even if the bot missed it. W.`,
            complexity_score: 0,
            impact_score: 0
        });

        // System Commit for Caller (Reward)
        await supabase.from('commits').insert({
            user_id: callout.caller_id,
            message: `[SYSTEM] Callout Successful (Manual Verify)`,
            grade: callout.caller_reward,
            ai_feedback: `Good callout. You kept them honest.`,
            complexity_score: 0,
            impact_score: 0
        });

        return { success: true, message: `✅ Callout verified! ${callout.target.name} got +${callout.bonus_points} pts.` };
    }

    /**
     * Check if a commit fulfills any pending callouts for the user.
     * Called AFTER a commit is inserted (Fire-and-forget style, but awaited for UX).
     */
    public static async checkAndResolve(userId: string, commitMessage: string, commitId?: number | string, manualContext?: string): Promise<{ resolved: boolean; callout?: any; message?: string }> {
        if (!commitId) return { resolved: false };

        // Fetch pending callouts targeting this user
        const { data: callouts } = await supabase
            .from('callouts')
            .select(`*, caller:caller_id(name)`)
            .eq('target_id', userId)
            .eq('status', 'pending');

        if (!callouts || callouts.length === 0) return { resolved: false };

        console.log(`[Callouts] Checking ${callouts.length} pending callouts for verification...`);

        for (const callout of callouts) {
            // AI Verification
            const completion = await openai.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are an impartial judge. Does the commit fulfill the specific callout challenge?
                        
                        Callout Reason: "${callout.reason}"
                        Commit Message: "${commitMessage}"
                        Manual Context: "${manualContext || 'None'}"
                        
                        Rules:
                        - "Fixing auth bugs" MATCHES "Fix the login page" (Semantic Match)
                        - "Went to gym" DOES NOT MATCH "Finish the report"
                        - Be generous with semantic matching but strict on topic.
                        - If "Manual Context" implies the user is explicitly pointing this out, be slightly more lenient on vague phrasing.
                        
                        Return JSON: { "match": boolean, "reason": "short explanation" }`
                    },
                    { role: "user", content: "Judge this." }
                ],
                model: config.OPENAI_MODEL,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(completion.choices[0].message.content || '{}');

            if (result.match) {
                console.log(`[Callouts] Match found! Resolving callout ${callout.id}`);

                // 1. Mark Callout as Delivered
                await supabase
                    .from('callouts')
                    .update({
                        status: 'delivered',
                        resolved_commit_id: commitId,
                        resolved_at: new Date().toISOString()
                    })
                    .eq('id', callout.id);

                // 2. Reward Target (Update existing commit)
                // Fetch current commit first to append feedback safely
                const { data: commit } = await supabase.from('commits').select('grade, ai_feedback').eq('id', commitId).single();
                if (commit) {
                    const newGrade = (commit.grade || 0) + callout.bonus_points;
                    const newFeedback = (commit.ai_feedback || "") + `\n\n✅ *Answered Callout by ${callout.caller.name}: +${callout.bonus_points} pts*`;

                    await supabase
                        .from('commits')
                        .update({ grade: newGrade, ai_feedback: newFeedback })
                        .eq('id', commitId);
                }

                // 3. Reward Caller (System Commit)
                await supabase.from('commits').insert({
                    user_id: callout.caller_id,
                    message: `[SYSTEM] Callout Successful: ${callout.caller.name} called out target successfully`,
                    grade: callout.caller_reward,
                    ai_feedback: `You successfully called out the homie. Accountability pays.`,
                    complexity_score: 0,
                    impact_score: 0
                });

                return {
                    resolved: true,
                    callout,
                    message: `✅ *Callout Verified!* You completed ${callout.caller.name}'s challenge: "${callout.reason}" (+${callout.bonus_points} pts)`
                };
            } else {
                console.log(`[Callouts] No match for "${callout.reason}". AI Reasoning: ${result.reason}`);
            }
        }

        return { resolved: false };
    }

    /**
     * Cron Job: Expire overdue callouts
     */
    public static async expireCallouts(): Promise<string[]> { // Returns array of broadcast messages
        const now = new Date().toISOString();

        // Find overdue pending callouts
        const { data: overdue } = await supabase
            .from('callouts')
            .select(`
                *,
                caller:caller_id(name),
                target:target_id(name)
            `)
            .eq('status', 'pending')
            .lt('expires_at', now);

        if (!overdue || overdue.length === 0) return [];

        const messages: string[] = [];

        for (const callout of overdue) {
            console.log(`[Callouts] Expiring callout ${callout.id} (Target: ${callout.target.name})`);

            // 1. Mark Expired
            await supabase.from('callouts').update({ status: 'expired' }).eq('id', callout.id);

            // 2. Penalize Target (System Commit)
            await supabase.from('commits').insert({
                user_id: callout.target_id,
                message: `[SYSTEM] Callout Dodged: "${callout.reason}"`,
                grade: -callout.penalty_points, // Negative grade
                ai_feedback: `You got called out by ${callout.caller.name} and didn't deliver within 24h. Shame.`,
                complexity_score: 0,
                impact_score: 0
            });

            // 3. Reward Caller for holding accountability (System Commit)
            // Even if target failed, caller did their job.
            await supabase.from('commits').insert({
                user_id: callout.caller_id,
                message: `[SYSTEM] Callout Expired (Reward): Held ${callout.target.name} accountable`,
                grade: callout.caller_reward,
                ai_feedback: `Target missed the deadline, but you did your part keeping standards high.`,
                complexity_score: 0,
                impact_score: 0
            });

            messages.push(`💀 *Callout EXPIRED!*\n\n${callout.target.name} dodged the callout by ${callout.caller.name}: "${callout.reason}"\n\n📉 ${callout.target.name}: -${callout.penalty_points} pts\n📈 ${callout.caller.name}: +${callout.caller_reward} pts (Accountability Reward)`);
        }

        return messages;
    }
}
