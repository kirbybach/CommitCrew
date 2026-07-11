import { SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import OpenAI from 'openai';
import { createEmbedding } from '../services';

export const SummarizationService = {
    async runMemorySummarization(supabase: SupabaseClient, openai: OpenAI) {
        try {
            // 1. Find users with enough data (> 10 unarchived logs)
            // Note: For MVP, we'll fetch all unarchived logs and group in memory.

            const { data: activeUsers, error: userError } = await supabase
                .from('memories')
                .select('user_id')
                .eq('type', 'commit_log')
                .eq('is_archived', false);

            if (userError || !activeUsers) {
                console.error('Failed to fetch active memory users', userError);
                return;
            }

            // Group by User ID in memory
            const userCounts: Record<string, number> = {};
            activeUsers.forEach(r => {
                userCounts[r.user_id] = (userCounts[r.user_id] || 0) + 1;
            });

            const MIN_LOGS_THRESHOLD = 10;
            const targetUserIds = Object.keys(userCounts).filter(uid => {
                const count = userCounts[uid];
                if (count > MIN_LOGS_THRESHOLD) return true;
                return false;
            });

            if (targetUserIds.length === 0) {
                return;
            }

            console.log(`Found ${targetUserIds.length} users eligible for summarization (Threshold: ${MIN_LOGS_THRESHOLD}).`);

            for (const userId of targetUserIds) {
                // Fetch their logs
                const { data: logs } = await supabase
                    .from('memories')
                    .select('content, created_at')
                    .eq('user_id', userId)
                    .eq('type', 'commit_log')
                    .eq('is_archived', false)
                    .order('created_at', { ascending: true });

                if (!logs || logs.length === 0) continue;

                const logsText = logs.map(l => `[${new Date(l.created_at).toISOString()}] ${l.content}`).join('\n');

                // Generate Summary
                const completion = await openai.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: `You are an AI assistant summarizing developer activity logs.
                            
                            **Goal**: Compress these logs into a dense, search-optimized summary.
                            **CRITICAL RULES**:
                            1. Preserve SPECIFIC technical keywords (e.g., 'React', 'Supabase', 'Error 500', 'OAuth').
                            2. Do not use generic fluff like "The user worked on various tasks." Say "The user fixed OAuth bug #123."
                            3. Maintain the chronological narrative.
                            4. Mention specific struggles or wins.`
                        },
                        { role: "user", content: logsText }
                    ],
                    model: config.OPENAI_MODEL
                });

                const summary = completion.choices[0].message.content || "No summary generated.";

                // Generate Embedding
                const summaryEmbedding = await createEmbedding(summary);

                // Atomic Save & Archive
                const { error } = await supabase.rpc('summarize_memory_transaction', {
                    p_user_id: userId,
                    p_summary_text: summary,
                    p_summary_embedding: summaryEmbedding
                });

                if (error) {
                    console.error(`Failed to summarize for user ${userId}:`, error);
                } else {
                    console.log(`✅ Summarized ${logs.length} logs for user ${userId}`);
                }
            }

        } catch (e) {
            console.error('Memory Summarization failed:', e);
        }
    }
};
