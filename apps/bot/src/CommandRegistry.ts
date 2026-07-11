import { WASocket, proto } from '@whiskeysockets/baileys';
import { Command, User } from './types';

export class CommandRegistry {
    private commands: Command[] = [];

    register(command: Command) {
        this.commands.push(command);
    }

    async handle(sock: WASocket, message: proto.IWebMessageInfo, text: string, user: User) {
        const lowerText = text.toLowerCase().trim();
        const args = text.trim().split(/\s+/);
        const trigger = args[0].toLowerCase();

        for (const cmd of this.commands) {
            if (cmd.triggers.includes(trigger)) {
                // Remove the trigger from args for easier processing in commands.
                const commandArgs = args.slice(1);
                console.log(`Executing command ${cmd.name} for ${user.chat_user_id}`);
                try {
                    await cmd.execute(sock, message, commandArgs, user);
                } catch (e) {
                    console.error(`Error executing command ${cmd.name}:`, e);
                    const remoteJid = message.key.remoteJid;
                    if (remoteJid) {
                        await sock.sendMessage(remoteJid, { text: '*CommitCrew:* Error processing command.' });
                    }
                }
                return;
            }
        }
    }
}
