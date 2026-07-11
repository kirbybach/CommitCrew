import { supabase, openai } from '../services';
import { config } from '../config';
import { retrieveContext, addMemory, retrieveRelevantRules } from '../memory';
import { BetsService } from './BetsService';
import { CalloutsService } from './CalloutsService';

export interface CommitResult {
    grade: number;
    feedback: string;
    userName: string;
    commitId?: number;
}

export class CommitService {
    /**
     * Parse optional time duration from commit messages (e.g., ~3h, ~45m, 2 hours).
     */
    private static parseTimeEstimate(message: string): { hours: number; cleaned: string } | null {
        // Match patterns: ~3h, ~45m, ~1.5h, ~2 hours, 3 hrs, 30 min, etc.
        const pattern = /~?\s*(\d+\.?\d*)\s*(h|hr|hrs|hours?|m|min|mins|minutes?)\b/i;
        const match = message.match(pattern);
        if (!match) return null;

        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        const hours = unit.startsWith('m') ? value / 60 : value;

        // Remove the time string from the message for cleaner AI processing
        const cleaned = message.replace(pattern, '').trim();

        return { hours, cleaned };
    }

    /**
     * Execute a commit: AI grading, DB save, memory storage.
     * Does NOT send any messages - caller decides how to notify.
     */
    public static async execute(
        userId: string,
        userName: string,
        message: string,
        groupJid: string | null,
        messageId: string | null
    ): Promise<CommitResult> {
        const timeData = this.parseTimeEstimate(message);
        const timeEstimateHours = timeData?.hours ?? null;

        // Parallel Fetch: Goals + Matches + Bets + Memory + Rules
        const [goalsResult, bets, contextString, rulesString] = await Promise.all([
            supabase.from('goals').select('id, description').eq('user_id', userId).eq('status', 'active'),
            BetsService.getActiveBets(userId),
            retrieveContext(userId, message),
            retrieveRelevantRules(userId, message)
        ]);

        const goals = goalsResult.data || [];
        const goalList = goals.map(g => `[${g.id}]: ${g.description}`).join('\n') || "No specific active goals.";

        const betList = bets.length > 0
            ? bets.map((b: any) => `[ID: ${b.id}] Bet: "${b.task}" (${b.amount} pts) Deadline: ${new Date(b.deadline).toLocaleString()}`).join('\n')
            : "No active bets.";

        const timeContext = timeEstimateHours !== null
            ? `\n**User-Reported Time: ~${timeEstimateHours.toFixed(1)} hours.**
       This is a STRONG signal for complexity. Use this mapping:
       - < 15 min (~0.25h): Time score 1-2
       - 1-2 hours: Time score 4-5
       - 4+ hours: Time score 7-8
       - Full day (8h+): Time score 9-10
       If the claimed time seems wildly inconsistent with the task, trust the time over your assumption.`
            : '';

        // AI Analysis
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system", content: `You are a precise, consistent productivity judge. 
                    
                    **TASK:** Analyze the user's commit and assess its Complexity and Impact.
                    
                    **1. Complex Analysis (Chain-of-Thought):**
                    Analyze what was done, technical difficulty, and real-world impact BEFORE outputting numbers.
                    Break Complexity into:
                    - **Technical Difficulty (1-10):** Specific skill/expertise required.
                    - **Time Investment (1-10):** Duration of focused effort.
                    - **Cognitive Load (1-10):** Intensity of focus/deep work required.

                    **2. The Formula:**
                    Grade = Complexity × Impact (Multiplicative)
                    *Note: This rewards high-complexity work that is ALSO high impact.*

                    **Complexity Calibration Grid:**
                    - 1: Typo / Email / Stretch
                    - 3: Small Component / 30m Workout / Lesson
                    - 5: Complex Feature / 1h Gym / 2h Deep Study
                    - 8: System Redesign / Marathon / Moving / Taxes
                    - 10: Industry-lead / Ultra-endurance / Life-altering Win

                    **Impact Multiplier (1.0 - 3.0):**
                    - 1.0: "Maintenance" (Routine, upkeep)
                    - 1.5: "Incremental" (Small step forward)
                    - 2.0: "Progress" (Meaningful advancement)
                    - 2.5: "Major" (Significant milestone)
                    - 3.0: "Transformative" (GOAL COMPLETED)

                    **3. Calibration Examples:**
                    - "Fixed typo" -> C:1, I:1.0 (1 pt)
                    - "Went for 30m run" -> C:3, I:1.5 (4.5 -> 5 pts)
                    - "Built auth flow" -> C:7, I:2.0 (14 pts)
                    - "Lost 5 lbs" -> C:9, I:3.0 (27 pts)
                    - "Marathon" -> C:10, I:3.0 (30 pts)

                    **4. Goal/Bet Matching:**
                    Goals:
                    ${goalList}
                    
                    Bets:
                    ${betList}
                    - Bet: The task must be fully completed. Return bet_id ONLY if fully done.

                    **5. Tone:**
                    - Style: memey, slang, low case, short.
                    ${timeContext}

                    Contextual Memory:
                    ${contextString}

                    Custom Rules:
                    ${rulesString || "None."}

                    Return JSON: 
                    { 
                        "analysis": "2 sentences of factual reasoning",
                        "technical_difficulty": number,
                        "time_investment_score": number, 
                        "cognitive_load": number,
                        "complexity": number (MUST be the average of technical_difficulty + time_investment_score + cognitive_load, rounded to nearest integer, clamped 1-10),
                        "impact": number (MUST be one of: 1.0, 1.5, 2.0, 2.5, or 3.0),
                        "confidence": number (0-100),
                        "goal_id": "UUID or null",
                        "bet_id": "UUID or null",
                        "reasoning": "1 sentence logic for grade", 
                        "feedback": "string (savage roasting < 5, based for high scores)" 
                    }`
                },
                { role: "user", content: message }
            ],
            model: config.OPENAI_MODEL,
            temperature: 0.2,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');
        let {
            feedback, goal_id, bet_id, complexity, impact, confidence,
            technical_difficulty, time_investment_score, cognitive_load
        } = result;

        if (goal_id === 'null' || goal_id === 'undefined') goal_id = null;
        if (bet_id === 'null' || bet_id === 'undefined') bet_id = null;

        // Fallbacks in case the LLM misses fields
        technical_difficulty = technical_difficulty !== undefined ? Number(technical_difficulty) : null;
        time_investment_score = time_investment_score !== undefined ? Number(time_investment_score) : null;
        cognitive_load = cognitive_load !== undefined ? Number(cognitive_load) : null;
        complexity = Number(complexity) || 5;
        impact = Number(impact) || 1.5;
        confidence = Number(confidence) || 50;

        // Hard clamp: LLM sometimes multiplies sub-scores instead of averaging
        if (complexity > 10 && technical_difficulty && time_investment_score && cognitive_load) {
            console.warn(`[CommitService] Complexity ${complexity} out of range — recalculating from sub-scores avg(${technical_difficulty}, ${time_investment_score}, ${cognitive_load})`);
            complexity = Math.round((technical_difficulty + time_investment_score + cognitive_load) / 3);
        }
        complexity = Math.min(10, Math.max(1, complexity));
        impact = Math.min(3.0, Math.max(1.0, impact));

        // Formula: Grade = Complexity * Impact
        let grade = Math.round(complexity * impact);

        // Optional: Small bonus for matching a goal?
        if (goal_id && goal_id !== "UNIVERSAL") {
            grade += 3; // Boosted goal bonus for the new scale
            console.log(`[CommitService] Goal Match Bonus (+3) applied.`);
        }

        // Apply Bet Bonus
        if (bet_id) {
            const wonBet = bets.find((b: any) => b.id === bet_id);
            if (wonBet) {
                const bonus = Math.floor(wonBet.amount * 1.5);
                grade += bonus;
                feedback += ` 🎰 BET WON! (+${bonus} pts)`;
                console.log(`[CommitService] Bet matched: ${bet_id} (Amount: ${wonBet.amount} -> Bonus: ${bonus})`);
            } else {
                console.warn(`[CommitService] LLM returned bet_id ${bet_id} but no matching active bet found.`);
                bet_id = null;
            }
        }

        console.log(`[CommitService] Grading Breakdown for ${userName}:
        - Message: "${message}"
        - Analysis: ${result.analysis}
        - Complexity: ${complexity} (Tech: ${technical_difficulty}, Time: ${time_investment_score}, Focus: ${cognitive_load})
        - Impact: ${impact} (x multiplier)
        - Final Grade: ${grade}
        - Confidence: ${confidence}%`);

        // Save to DB
        const { data: insertedCommit, error } = await supabase.from('commits').insert({
            user_id: userId,
            message: message,
            grade: grade,
            ai_feedback: feedback,
            group_id: groupJid,
            source_msg_ref: messageId,
            goal_id: goal_id === 'UNIVERSAL' ? null : goal_id,
            complexity_score: complexity,
            impact_score: impact,
            time_estimate_hours: timeEstimateHours,
            ai_confidence: confidence,
            technical_difficulty,
            time_investment_score,
            cognitive_load
        }).select().single();

        if (error) {
            console.error('Error saving commit:', error);
        }

        // Check for callout resolution (Fire-and-forget or await for better UX?? Let's await to be safe)
        if (insertedCommit?.id) {
            // Resolve Bet if applicable
            if (bet_id && bet_id !== "null") {
                await BetsService.resolveBet(bet_id, 'won', insertedCommit.id);
                console.log(`[CommitService] Bet ${bet_id} resolved with commit ${insertedCommit.id}`);
            }

            // Check for callout resolution (Fire-and-forget or await for better UX?? Let's await to be safe)
            const calloutResult = await CalloutsService.checkAndResolve(userId, message, insertedCommit.id);
            if (calloutResult.resolved && calloutResult.message) {
                feedback += `\n\n${calloutResult.message}`;

                // Update local grade so the reply message shows the total including bonus
                if (calloutResult.callout && calloutResult.callout.bonus_points) {
                    grade += calloutResult.callout.bonus_points;
                }
            }
        }

        // Async Memory Storage (Fire-and-forget)
        addMemory(userId, message, 'commit_log', { grade, original_date: new Date().toISOString() });

        return { grade, feedback, userName, commitId: insertedCommit?.id };
    }

    /**
     * Format the commit result for WhatsApp reply (user already sent message, so no need to repeat it).
     */
    public static formatMessage(result: CommitResult): string {
        const sign = result.grade > 0 ? '+' : '';
        return `*CommitCrew:* *${result.userName}: ${sign}${result.grade} pts*\n\n_${result.feedback}_`;
    }

    /**
     * Format for API commits - includes the commit message since it wasn't sent to chat.
     */
    public static formatApiMessage(result: CommitResult, commitMessage: string): string {
        const sign = result.grade > 0 ? '+' : '';
        return `*@c ${result.userName}:* ${commitMessage}\n\n*CommitCrew:* *${sign}${result.grade} pts* _${result.feedback}_`;
    }
}
