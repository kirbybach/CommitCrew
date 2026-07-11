import { Command } from '../types';
import { CommitService } from '../services/CommitService';

export const CommitCommand: Command = {
    name: 'Commit',
    triggers: ['@commit', '@c'],
    execute: async (sock, message, args, user) => {
        const remoteJid = message.key.remoteJid;
        if (!remoteJid) return;

        const messageContent = args.join(' ');
        if (!messageContent) {
            await sock.sendMessage(remoteJid, { text: `*CommitCrew:* _Please provide a commit message._` });
            return;
        }

        const result = await CommitService.execute(
            user.id,
            user.name,
            messageContent,
            remoteJid,
            message.key.id // Store the user's original message ID — this is what users react to
        );

        await sock.sendMessage(remoteJid, { text: CommitService.formatMessage(result) });
    }
};


