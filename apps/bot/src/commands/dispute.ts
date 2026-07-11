import { Command } from '../types';
import { supabase, openai } from '../services';
import { addGradingRule, retrieveRelevantRules, findSimilarRule } from '../memory';

export const DisputeCommand: Command = {
    name: 'Dispute',
    triggers: ['@dispute', '@d'],
    execute: async (sock, message, args, user) => {
        const remoteJid = message.key.remoteJid;
        if (!remoteJid) return;

        // 1. Check for Quoted Message
        const quotedMsg = message.message?.extendedTextMessage?.contextInfo;
        if (!quotedMsg || !quotedMsg.stanzaId) {
            await sock.sendMessage(remoteJid, { text: `*CommitCrew:* _You must reply to the ORIGINAL commit message to dispute it._` });
            return;
        }

        const quoteId = quotedMsg.stanzaId;
        const disputeArg = args.join(' ');

        console.log(`Dispute: Looking for commit with source_msg_ref: ${quoteId}`);

        if (!disputeArg) {
            await sock.sendMessage(remoteJid, { text: `*CommitCrew:* _Please provide an argument for your dispute._` });
            return;
        }

        // 2. Find Original Commit
        const { data: commit, error } = await supabase
            .from('commits')
            .select('*')
            .eq('source_msg_ref', quoteId) // Requires source_msg_ref to be saved on commit
            .single();

        if (error) {
            console.error('Dispute Lookup Error:', error);
        }

        if (!commit) {
            // Fallback: If we can't find by ID (maybe old commit), try matching exact text? 
            // For now, let's assume ID is required.
            await sock.sendMessage(remoteJid, { text: `*CommitCrew:* _Could not find the commit you are disputing (it might be too old)._` });
            return;
        }

        // 3. Check Status
        if (commit.dispute_status && commit.dispute_status !== 'none') {
            await sock.sendMessage(remoteJid, { text: `*CommitCrew:* _This commit has already been disputed (${commit.dispute_status}). Case closed._` });
            return;
        }

        // 4. AI Judge
        await sock.sendMessage(remoteJid, { react: { text: '✅', key: message.key } });

        const committerId = commit.user_id;
        const disputerId = user.id;
        const isSelfDispute = committerId === disputerId;

        // Fetch goals + precedents for the COMMITTER (The Defendant), not the Disputer
        const [goalsResult, rulesString] = await Promise.all([
            supabase.from('goals').select('description').eq('user_id', committerId).eq('status', 'active'),
            retrieveRelevantRules(committerId, commit.message + " " + disputeArg)
        ]);
        const goalList = goalsResult.data?.map((g: any) => g.description).join(', ') || "No specific goals.";

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system", content: `You are the Supreme Court Judge of Brainrot Productivity. 
                    A user is disputing a grade. You are performing a "Resentencing" based on their argument AND the existing body of case law.

                    **Identities:**
                    - **Disputer (Prosecutor):** ${user.name || 'Unknown User'} (ID: ${disputerId})
                    - **Committer (Defendant):** Commit Owner (ID: ${committerId})
                    - **Relationship:** ${isSelfDispute ? "Self-Dispute (Disputer IS Committer)" : "Third-Party Dispute (Disputer is NOT Committer)"}

                    **Resentencing Guidelines:**
                    - **The "Context Premium" (+1 to +5):** Award points if the user reveals hidden effort, high-stakes pressure, or technical complexity that wasn't apparent in the original commit.
                    - **The "Honesty Policy" (Score Reduction):** If the user admits low effort or corrects a mistake (e.g. "Actually this was easy, only give me 3 points"), REDUCE the score.
                    - **The "Mid-Curve Preservation" (No Change):** If the argument is valid but doesn't fundamentally change the nature of the task.
                    
                    **CRITICAL - Identity & "Confessions":**
                    - If **Disputer == Committer**: Treat "I" statements ("I lied", "I worked hard") as fact/confessions from the Committer.
                    - If **Disputer != Committer**: Treat "I" statements as the Disputer speaking about themselves, OR accusations against the Committer. Do NOT treat "I didn't do it" as a confession from the Committer.
                    
                    **CRITICAL - Stare Decisis (Respect Precedent):**
                    If a Legal Precedent below directly applies to this case, you MUST follow it unless there's an extraordinary exception. Precedents are established for consistency.
                    
                    **Legal Precedents (Binding Case Law for Committer):**
                    ${rulesString || "No relevant precedents found for this case."}
                    
                    **Evidence Review:**
                    - Committer's Goals: [${goalList}]
                    - Commit: "${commit.message}" (Current Grade: ${commit.grade})
                    - Dispute Argument: "${disputeArg}"
                    
                    **Tone:**
                    - Lawyer-brainrot style. Use terms like "resentencing," "mitigating circumstances," "precedent," "binding ruling."
                    - Max 2 sentences. No emojis.
                    
                    **Precedent Generation:**
                    - If this ruling **clarifies a boundary or establishes new case law** (win OR loss), draft a **Generalized Grading Rule** that future cases can cite.
                    - Only generate a rule if it's genuinely precedent-setting (not obvious). Set 'is_precedent_setting' to true if so.
                    - **Sanity Check**: If the rule would break the system (e.g. "Breathing is +10"), set 'rule_violation_check' to true.
                    
                    Return JSON: { 
                        "adjustment": number, 
                        "new_grade": number, 
                        "reply": "string",
                        "generated_rule": "string | null",
                        "is_precedent_setting": boolean,
                        "rule_violation_check": boolean
                    }`
                },
                { role: "user", content: "Resentence this commit." }
            ],
            model: "gpt-5-mini",
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');
        const { new_grade, reply, generated_rule, is_precedent_setting, rule_violation_check } = result;

        // Infer status: Any change is a "resolution", but we track direction for UI
        const isChange = new_grade !== undefined && new_grade !== commit.grade;
        const status = isChange ? 'won' : 'lost'; // "won" in DB means "dispute resolved/closed with change"
        const finalGrade = new_grade ?? commit.grade;
        const scoreDiff = finalGrade - commit.grade;

        // 5. Update DB
        await supabase.from('commits').update({
            dispute_status: status,
            grade: finalGrade,
            ai_feedback: isChange ? `(Resentenced) ${reply}` : commit.ai_feedback
        }).eq('id', commit.id);

        // 6. Save Precedent Rule (If precedent-setting & valid) -- FOR COMMITTER
        const shouldSaveRule = is_precedent_setting && generated_rule && !rule_violation_check;
        let similarRule: string | null = null;

        if (shouldSaveRule) {
            // Check for duplicates before adding (Check Committer's rules)
            similarRule = await findSimilarRule(committerId, generated_rule);

            if (similarRule) {
                console.log(`Skipping duplicate rule. Proposed: "${generated_rule}", Existing similar: "${similarRule}"`);
            } else {
                console.log(`Precedent-Setting Ruling. New Rule: "${generated_rule}"`);
                await addGradingRule(committerId, generated_rule, commit.id);
            }
        }

        // 7. Reply
        let icon = '⚖️❌'; // Default denied
        let header = 'Appeal Denied';

        if (scoreDiff > 0) {
            icon = '⚖️✅';
            header = 'Appeal Won';
        } else if (scoreDiff < 0) {
            icon = '⚖️📉';
            header = 'Appeal Processed (Score Reduced)';
        }

        let responseText = `*CommitCrew:* ${icon} ${header}\n${reply}\n\n*Final Score: ${finalGrade}*`;

        if (shouldSaveRule && !similarRule) {
            responseText += `\n\n_New Legal Precedent Established:_\n"${generated_rule}"`;
        } else if (shouldSaveRule && similarRule) {
            responseText += `\n\n_(Note: Proposed rule was too similar to existing precedent: "${similarRule}", so it was not added.)_`;
        }

        await sock.sendMessage(remoteJid, { text: responseText });
    }
};
