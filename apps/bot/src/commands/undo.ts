import { Command } from '../types';
import { supabase } from '../services';

export const UndoCommand: Command = {
    name: 'Undo',
    triggers: ['@undo'],
    execute: async (sock, message, args, user) => {
        const remoteJid = message.key.remoteJid;
        if (!remoteJid) return;

        const { data: lastCommit } = await supabase
            .from('commits')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!lastCommit) {
            await sock.sendMessage(remoteJid, { text: `*CommitCrew:* _No commits to undo._` });
            return;
        }

        await supabase.from('commits').delete().eq('id', lastCommit.id);
        await sock.sendMessage(remoteJid, { react: { text: '✅', key: message.key } });
    }
};
