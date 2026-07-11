import { WASocket, jidNormalizedUser } from '@whiskeysockets/baileys';
import * as chrono from 'chrono-node';
import { Command, User } from '../types';
import { messagingService } from '../services/MessagingService';
import { CalloutsService } from '../services/CalloutsService';
import { UserService } from '../services/UserService';

export const CalloutCommand: Command = {
    name: 'callout',
    triggers: ['@callout', '@challenge'],
    async execute(sock: WASocket, message: any, args: string[], user: User) {
        const chatId = message.key.remoteJid!;

        // 1. Handle List
        if (args[0]?.toLowerCase() === 'list') {
            const list = await CalloutsService.listActive();
            await messagingService.sendMessage(chatId, list);
            return;
        }

        // 1b. Handle Verify (Manual Resolution)
        if (args[0]?.toLowerCase() === 'verify' || args[0]?.toLowerCase() === 'confirm') {
            if (args.length < 2) {
                await messagingService.sendMessage(chatId, `Usage: @callout verify @<User>`);
                return;
            }

            // Resolve target
            const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            let targetUser: User | null = null;

            if (mentionedJids && mentionedJids.length > 0) {
                targetUser = await UserService.getUser(jidNormalizedUser(mentionedJids[0]));
            } else {
                const nameQuery = args[1].replace('@', '');
                targetUser = await UserService.getUserByNameFuzzy(nameQuery);
            }

            if (!targetUser) {
                await messagingService.sendMessage(chatId, `❌ User not found.`);
                return;
            }

            const result = await CalloutsService.resolveManually(user.id, targetUser.id);
            await messagingService.sendMessage(chatId, result.message);
            return;
        }

        // 2. Validate Args
        if (args.length < 2) {
            await messagingService.sendMessage(chatId, `Usage: @callout @<User> [Reason]\nExample: @callout @Taylor Ship the landing page`);
            return;
        }

        // 3. Resolve Target User
        let targetUser: User | null = null;

        // Strategy A: Native Mention
        const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;

        if (mentionedJids && mentionedJids.length > 0) {
            const targetJid = jidNormalizedUser(mentionedJids[0]);
            targetUser = await UserService.getUser(targetJid);

            if (!targetUser) {
                // Determine name from args for better error message
                const mentionedName = args[0].replace('@', '');
                // Create user if they don't exist? 
                // We ideally want them to exist in DB. 
                // UserService.getUser handles linking, but if they are brand new and never spoke, they might not be in DB.
                // We can try to ensure them, but we need their pushName.
                // For now, fail safely.
                await messagingService.sendMessage(chatId, `❌ User not found in database. Have they chatted here before?`);
                return;
            }
        }

        // Strategy B: Text Parsing & Fuzzy Lookup
        else {
            const nameQuery = args[0].replace('@', '');
            targetUser = await UserService.getUserByNameFuzzy(nameQuery);
        }

        // 4. Verification Check
        if (!targetUser) {
            await messagingService.sendMessage(chatId, `❌ Could not find user "${args[0]}". Please tag them directly (@Mention) for accuracy.`);
            return;
        }

        if (targetUser.id === user.id) {
            await messagingService.sendMessage(chatId, `❌ You can't call yourself out. That's just a regular goal.`);
            return;
        }

        // 5. Extract Reason & Time
        // Args: ["@Taylor", "Ship", "the", "landing", "page", "by", "5pm"]
        let rawReason = args.slice(1).join(' ').trim();

        // Pre-process tricky phrases
        // "End of week" -> "Friday 5pm"
        const preprocessedReason = rawReason
            .replace(/end of (the )?week/gi, 'Friday 5pm')
            .replace(/eod/gi, '5pm');

        let deadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24h
        let reason = rawReason;

        // Parse Date
        const parsedResults = chrono.parse(preprocessedReason, new Date(), { forwardDate: true });

        if (parsedResults.length > 0) {
            deadline = parsedResults[0].start.date();
            const dateText = parsedResults[0].text;

            // Clean reason - remove the date text from the ORIGINAL reason if possible, 
            // but chrono matched on preprocessed. 
            // Simple heuristic: remove the matched text if present in raw, else remove specific phrases.

            // Actually, better to just fallback to rawReason minus the text found in preprocessed, 
            // IF that text exists in rawReason. 
            // If we replaced "end of week" with "Friday 5pm", chrono matched "Friday 5pm".
            // So we need to remove "end of week" from rawReason manually if we did the replacement.

            if (rawReason.match(/end of (the )?week/gi)) {
                reason = rawReason.replace(/before\s+end of (the )?week/gi, '').replace(/by\s+end of (the )?week/gi, '').replace(/end of (the )?week/gi, '').trim();
            } else if (rawReason.match(/eod/gi)) {
                reason = rawReason.replace(/by\s+eod/gi, '').replace(/eod/gi, '').trim();
            } else {
                reason = rawReason.replace(dateText, '').trim().replace(/(?:^|\s)by\s*$/, '');
            }
        }

        if (reason.length < 3) {
            await messagingService.sendMessage(chatId, `❌ Reason too short. What are you calling them out for?`);
            return;
        }

        // 6. Create Callout
        const result = await CalloutsService.createCallout(user.id, targetUser.id, reason, deadline);

        if (!result.success) {
            await messagingService.sendMessage(chatId, result.message);
            return;
        }

        // 7. Announcement
        const timeLeft = Math.max(0, deadline.getTime() - Date.now());
        const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));

        const announcement = `📣 *CALLOUT!*\n\n` +
            `🤬 *Caller:* ${user.name}\n` +
            `🎯 *Target:* ${targetUser.name}\n` +
            `📝 *Challenge:* "${reason}"\n` +
            `⏰ *Deadline:* ${deadline.toLocaleString()} (${hoursLeft}h)\n\n` +
            `Reply with a matching @commit to win:\n` +
            `• Deliver: +${result.callout?.bonus_points} pts (Bonus)\n` +
            `• Dodge: -${result.callout?.penalty_points} pts (Penalty)`;

        const sentMsg = await messagingService.sendMessage(chatId, announcement);

        if (sentMsg && sentMsg.key.id && result.callout) {
            await CalloutsService.setAnnouncementMessageId(result.callout.id, sentMsg.key.id);
        }
    }
};
