import { Command } from '../types';
import { supabase } from '../services';

export const GoalCommand: Command = {
    name: 'Goal',
    triggers: ['@goal', '@g', '@gl'],
    execute: async (sock, message, args, user) => {
        const remoteJid = message.key.remoteJid;
        if (!remoteJid) return;
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const trigger = text.trim().split(/\s+/)[0].toLowerCase();
        const isList = trigger === '@gl';

        if (isList) {
            // LIST GOALS
            const { data: goals } = await supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: true });
            if (!goals || goals.length === 0) {
                await sock.sendMessage(remoteJid, { text: `*CommitCrew:* *${user.name}'s Goals:*\n\n_No active goals._` });
            } else {
                const list = goals.map((g: any, i: number) => `_${i + 1}. ${g.description}_`).join('\n');
                await sock.sendMessage(remoteJid, { text: `*CommitCrew:* *${user.name}'s Goals:*\n\n${list}` });
            }
            return;
        }

        // Handle @g subcommands
        const subcommand = args[0]?.toLowerCase();
        const subArgs = args.slice(1);

        if (subcommand === 'complete' && subArgs.length > 0) {
            // COMPLETE GOAL
            const goalNum = parseInt(subArgs[0]) - 1;
            const { data: goals } = await supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: true });

            if (!goals || goalNum < 0 || goalNum >= goals.length) {
                await sock.sendMessage(remoteJid, { text: `*CommitCrew:* _Invalid goal number._` });
                return;
            }

            const goal = goals[goalNum];
            await supabase.from('goals').update({ status: 'completed' }).eq('id', goal.id);
            await sock.sendMessage(remoteJid, { react: { text: '✅', key: message.key } });

        } else if (subcommand === 'delete' && subArgs.length > 0) {
            // DELETE GOAL
            const goalNum = parseInt(subArgs[0]) - 1;
            const { data: goals } = await supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: true });

            if (!goals || goalNum < 0 || goalNum >= goals.length) {
                await sock.sendMessage(remoteJid, { text: `*CommitCrew:* _Invalid goal number._` });
                return;
            }

            const goal = goals[goalNum];
            await supabase.from('goals').update({ status: 'deleted' }).eq('id', goal.id);
            await sock.sendMessage(remoteJid, { react: { text: '🗑️', key: message.key } });

        } else if (subcommand === 'edit' && subArgs.length > 1) {
            // EDIT GOAL
            const goalNum = parseInt(subArgs[0]) - 1;
            const newText = subArgs.slice(1).join(' ');
            const { data: goals } = await supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: true });

            if (!goals || goalNum < 0 || goalNum >= goals.length) {
                await sock.sendMessage(remoteJid, { text: `*CommitCrew:* _Invalid goal number._` });
                return;
            }

            const goal = goals[goalNum];
            await supabase.from('goals').update({ description: newText }).eq('id', goal.id);
            await sock.sendMessage(remoteJid, { react: { text: '✏️', key: message.key } });

        } else if (subcommand && !['complete', 'delete', 'edit', 'list'].includes(subcommand)) {
            // ADD GOAL (default behavior if not a keyword)
            // Note: If user types "@g list", previous logic would add a goal named "list".
            // I'll keep the logic mostly consistent but maybe "list" should map to list?
            // For now, following strict porting, but "list" isn't in the exclusions list in original code.
            // ORIGINAL Code:
            // } else if (subcommand && !['complete', 'delete', 'edit'].includes(subcommand)) {
            //      ADD
            // }
            // So yes, "@g list" added a goal. I will preserve this unless I want to improve it.
            // I'll stick to preserving logic.

            const goalText = args.join(' ');
            if (goalText.length > 0) {
                await supabase.from('goals').insert({ user_id: user.id, description: goalText, status: 'active' });
                await sock.sendMessage(remoteJid, { react: { text: '✅', key: message.key } });
            } else {
                await sock.sendMessage(remoteJid, { text: `*CommitCrew:* _Please specify a goal description._\n_Example: @g Run 5k_` });
            }

        } else {
            // No args or invalid command structure that fell through?
            // Actually if args is empty, subcommand is undefined.
            await sock.sendMessage(remoteJid, { text: `*CommitCrew:* _Invalid command. Use:_\n_@g [text] - Add goal_\n_@g complete [#]_\n_@g delete [#]_\n_@g edit [#] [text]_` });
        }
    }
};
