import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, jidNormalizedUser, WASocket } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import dotenv from 'dotenv';
import http from 'http';
import { supabase, openai } from './services';
import { CommandRegistry } from './CommandRegistry';
import { CommitCommand } from './commands/commit';
import { GoalCommand } from './commands/goal';
import { UndoCommand } from './commands/undo';
import { DisputeCommand } from './commands/dispute';
import { BetCommand } from './commands/bet';
import { CalloutCommand } from './commands/callout';
import { CalloutsService } from './services/CalloutsService';
import { startCronJobs } from './cron';
import { messagingService } from './services/MessagingService';
import { SecurityMiddleware } from './middleware/SecurityMiddleware';
import { UserService } from './services/UserService';
import { CommitService } from './services/CommitService';
import { config } from './config';

dotenv.config();

const DIRECT_CHAT_SUFFIX = '@' + 's.whatsapp.net';
const GROUP_CHAT_SUFFIX = '@' + 'g.us';

// HTTP Server for Railway (Health Check + API Endpoints)
const port = process.env.PORT || 8080;
const server = http.createServer(async (req, res) => {
    // Health check
    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
        res.writeHead(200);
        res.end('CommitCrew Bot is Online 🤖');
        return;
    }

    // Commit endpoint
    if (req.method === 'POST' && req.url === '/send-commit') {
        if (config.DEMO_MODE) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Real chat integrations are disabled in demo mode.' }));
            return;
        }

        // Auth check
        if (req.headers['x-api-key'] !== config.COMMIT_API_KEY) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }

        // Parse body with size limit
        let body = '';
        let tooLarge = false;

        req.on('data', (chunk: Buffer) => {
            body += chunk.toString();
            if (body.length > config.MAX_REQUEST_BODY_SIZE) {
                tooLarge = true;
                req.destroy();
            }
        });

        req.on('end', async () => {
            if (tooLarge) {
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Request too large' }));
                return;
            }

            try {
                const { author, message } = JSON.parse(body);

                if (!author || !message) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing author or message' }));
                    return;
                }

                // Validate author exists
                const user = await UserService.getUserByNameFuzzy(author);
                if (!user) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: `Unknown user: ${author}` }));
                    return;
                }

                // Execute commit logic directly
                const result = await CommitService.execute(
                    user.id,
                    user.name,
                    message,
                    config.PRODUCTIVITY_GROUP_JID,
                    null // No WhatsApp message ID for API commits initially
                );

                // Send notification to group
                const sentMsg = await messagingService.sendMessage(
                    config.PRODUCTIVITY_GROUP_JID,
                    CommitService.formatApiMessage(result, message)
                );

                // Update commit with the actual message ID from WhatsApp so disputes work
                if (sentMsg && sentMsg.key.id && result.commitId) {
                    await supabase.from('commits').update({
                        source_msg_ref: sentMsg.key.id
                    }).eq('id', result.commitId);
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    user: user.name,
                    grade: result.grade,
                    feedback: result.feedback
                }));
            } catch (err) {
                console.error('Error in /send-commit:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to process commit' }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});
server.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
});

// Initialize Registry
const registry = new CommandRegistry();
registry.register(CommitCommand);
registry.register(GoalCommand);
registry.register(UndoCommand);
registry.register(DisputeCommand);
registry.register(BetCommand);
registry.register(CalloutCommand);

// Initialize Middleware
const securityMiddleware = new SecurityMiddleware();

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

    const sock: WASocket = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: !process.env.PHONE_NUMBER,
        connectTimeoutMs: 60_000,
        keepAliveIntervalMs: 10_000,
        retryRequestDelayMs: 2_000,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
    });

    // Update MessagingService
    messagingService.updateSocket(sock);

    if (process.env.PHONE_NUMBER && !sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const phoneNumber = process.env.PHONE_NUMBER!.replace(/[^0-9]/g, '');
                console.log(`Requesting Pairing Code for: ${phoneNumber}`);
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n\nCOMMITCREW PAIRING CODE: ${code?.match(/.{1,4}/g)?.join('-')}\n\n`);
            } catch (err) {
                console.error('Failed to request pairing code:', err);
            }
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                // Ensure recursive call passes the new socket if we had a way to pass it, 
                // but since connectToWhatsApp creates a NEW socket, we just call it again.
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('opened connection');
            messagingService.updateSocket(sock);
        }
    });

    // Track reactions: Map<"commitId_reactorJid", { emoji, points }>
    const reactionTracker = new Map<string, { emoji: string; points: number }>();

    // Listen for reactions
    sock.ev.on('messages.reaction', async (reactions) => {
        console.log('Reaction event:', JSON.stringify(reactions, null, 2));

        for (const reactionEvent of reactions) {
            const allowedReactions = ['🔥', '🚀', '🤯', '👍', '👎'];
            const emoji = reactionEvent.reaction.text;
            const reactorJid = reactionEvent.key?.participant || reactionEvent.key?.remoteJid || '';

            const msgId = reactionEvent.key?.id;
            if (!msgId) continue;

            // Look up the commit
            const { data: commit, error } = await supabase
                .from('commits')
                .select('id, user_id, grade, ai_feedback, source_msg_ref')
                .eq('source_msg_ref', msgId)
                .maybeSingle();

            if (error || !commit) {
                console.log(`Reaction: No commit found for source_msg_ref="${msgId}". Error: ${error?.message || 'no match'}`);
                continue;
            }

            const trackerKey = `${commit.id}_${reactorJid}`;

            // UNREACT: empty emoji means reaction was removed
            if (!emoji) {
                const previous = reactionTracker.get(trackerKey);
                if (!previous) {
                    console.log(`Reaction: Unreact on commit ${commit.id} by ${reactorJid}, but no tracked reaction to reverse.`);
                    continue;
                }

                const reversePoints = -previous.points;
                const newGrade = (commit.grade || 0) + reversePoints;
                // Remove the emoji from feedback
                const newFeedback = (commit.ai_feedback || '').replace(` ${previous.emoji}`, '');

                await supabase
                    .from('commits')
                    .update({ grade: newGrade, ai_feedback: newFeedback })
                    .eq('id', commit.id);

                reactionTracker.delete(trackerKey);
                console.log(`Reversed reaction ${previous.emoji} (${reversePoints > 0 ? '+' : ''}${reversePoints}) on commit ${commit.id}`);
                continue;
            }

            // REACT: apply new reaction
            console.log(`Reaction: emoji="${emoji}", allowed=${allowedReactions.includes(emoji)}`);
            if (!allowedReactions.includes(emoji)) continue;

            // If user already reacted, reverse the old one first
            const previous = reactionTracker.get(trackerKey);
            let pointsDelta = 0;

            if (previous) {
                pointsDelta -= previous.points; // reverse old
            }

            const newPoints = emoji === '👎' ? -2 : 2;
            pointsDelta += newPoints;

            const newGrade = (commit.grade || 0) + pointsDelta;
            const oldFeedback = previous
                ? (commit.ai_feedback || '').replace(` ${previous.emoji}`, '')
                : (commit.ai_feedback || '');
            const newFeedback = oldFeedback + ` ${emoji}`;

            await supabase
                .from('commits')
                .update({ grade: newGrade, ai_feedback: newFeedback })
                .eq('id', commit.id);

            reactionTracker.set(trackerKey, { emoji, points: newPoints });
            console.log(`Added social proof (${pointsDelta > 0 ? '+' : ''}${pointsDelta}) to commit ${commit.id} for reaction ${emoji}`);
        }
    });

    // Listen for messages
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || m.type !== 'notify') return;

        const msgId = msg.key.id;
        if (msgId && securityMiddleware.isDuplicate(msgId)) {
            // Duplicate detected
            return;
        }

        const remoteJid = msg.key.remoteJid;
        const participant = msg.key.participant;
        let userJid = jidNormalizedUser(participant || remoteJid || '');
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (!text || !userJid || !remoteJid) return;

        // PREVENT GROUP ATTRIBUTION BUG:
        // If the message is from a group but missing a participant, baileys might resolve userJid to the group ID.
        // We must NEVER treat a group JID as a user.
        if (userJid.endsWith(GROUP_CHAT_SUFFIX)) {
            console.warn(`Ignoring message where userJid is a group: ${userJid} (Remote: ${remoteJid}, Participant: ${participant}, MsgId: ${msgId})`);
            return;
        }

        // Security Check
        if (!securityMiddleware.isAllowedChat(remoteJid)) {
            return;
        }

        // Check if it's a command
        const lowerText = text.toLowerCase().trim();
        if (!lowerText.startsWith('@')) return;

        console.log(`[MESSAGE_RECEIVED] Processing message from ${userJid} in ${remoteJid} (msgId=${msg.key.id}): ${text}`);

        // 1. Normalize JID (Strict Normalization)
        const normalizedJid = jidNormalizedUser(userJid);

        // Resolution trace for debugging
        const resolutionLog = {
            timestamp: new Date().toISOString(),
            incomingJid: normalizedJid,
            pushName: msg.pushName || null,
            remoteJid,
            path: 'unknown' as string,
            resolvedLid: null as string | null,
            resolvedUserId: null as string | null,
            linkedPhone: false,
            createdNew: false
        };

        // 2. Lookup: Try to find user by EITHER identifier (LID or Phone)
        let user = await UserService.getUser(normalizedJid);

        // 3. Authentication / Resolution Logic
        if (user) {
            // Case A: Found User - Check if we should link fallback_chat_user_id
            resolutionLog.path = 'found_direct';
            resolutionLog.resolvedUserId = user.id;
            const isCurrentJidPhone = normalizedJid.endsWith(DIRECT_CHAT_SUFFIX);
            const isStoredJidLid = user.chat_user_id.endsWith('@lid');

            if (isCurrentJidPhone && isStoredJidLid && !user.fallback_chat_user_id) {
                // User exists with LID, and we're seeing them from Phone JID - link it!
                console.log(`[USER_RESOLUTION] Case A: Linking Phone JID ${normalizedJid} to existing LID user ${user.id} (${user.name})`);
                await UserService.linkPhoneJid(user.id, normalizedJid);
                resolutionLog.linkedPhone = true;
            }
        } else {
            // Case B: Not Found - Try Global Resolution (e.g. via Group Metadata)

            let resolvedLid: string | null = null;

            // Only try group resolution if it's a group chat
            if (remoteJid.endsWith(GROUP_CHAT_SUFFIX)) {
                try {
                    const metadata = await sock.groupMetadata(remoteJid);
                    const participantNode = metadata.participants.find(p => jidNormalizedUser(p.id) === normalizedJid);

                    if (participantNode && participantNode.lid) {
                        resolvedLid = jidNormalizedUser(participantNode.lid);
                        resolutionLog.resolvedLid = resolvedLid;
                        console.log(`[USER_RESOLUTION] Case B: Resolved Phone JID ${normalizedJid} to LID ${resolvedLid} via group metadata`);
                    }
                } catch (err) {
                    console.error(`[USER_RESOLUTION_ERROR] Failed to resolve LID for ${normalizedJid} in ${remoteJid}`, err);
                }
            }

            if (resolvedLid) {
                // We found an LID. Check if THIS LID exists in the DB.
                const lidUser = await UserService.getUser(resolvedLid);

                if (lidUser) {
                    // Scenario C1: LID User Exists -> LINKING STEP
                    resolutionLog.path = 'found_lid';
                    resolutionLog.resolvedUserId = lidUser.id;
                    console.log(`[USER_RESOLUTION] Scenario C1: Found existing LID user ${lidUser.id} (${lidUser.name}) for ${normalizedJid}`);

                    // Check if we can link the phone JID (if it's missing or different)
                    if (!lidUser.fallback_chat_user_id) {
                        // SECURITY CHECK is inside linkPhoneJid
                        await UserService.linkPhoneJid(lidUser.id, normalizedJid);
                        resolutionLog.linkedPhone = true;
                        // Re-fetch to get updated object
                        user = await UserService.getUser(resolvedLid);
                    } else if (lidUser.fallback_chat_user_id !== normalizedJid) {
                        console.warn(`[USER_RESOLUTION_WARNING] User ${lidUser.id} has fallback_chat_user_id ${lidUser.fallback_chat_user_id} but matched ${normalizedJid} via LID. Mismatch or multiple phones.`);
                        user = lidUser; // Trust the LID user
                    } else {
                        user = lidUser; // Already fully linked
                    }
                } else {
                    // Scenario C2: LID User Does NOT Exist -> CREATE NEW (Primary = LID)
                    resolutionLog.path = 'created_lid';
                    resolutionLog.createdNew = true;
                    console.log(`[USER_RESOLUTION] Scenario C2: Creating new user with LID ${resolvedLid} and Phone ${normalizedJid}. PushName: ${msg.pushName}`);

                    // Step 1: Create with LID
                    await UserService.ensureUser(resolvedLid, msg.pushName || '', null);
                    const newUser = await UserService.getUser(resolvedLid);

                    if (newUser) {
                        resolutionLog.resolvedUserId = newUser.id;
                        // Step 2: Link Phone
                        await UserService.linkPhoneJid(newUser.id, normalizedJid);
                        resolutionLog.linkedPhone = true;
                        user = await UserService.getUser(resolvedLid);
                    }
                }
            } else {
                // If No LID found (and message is from Phone JID, and they don't exist in DB)
                // SAFETY CHECK 1: Try to find existing user by pushName
                const nameMatch = msg.pushName ? await UserService.getUserByNameFuzzy(msg.pushName) : null;

                if (nameMatch) {
                    resolutionLog.path = 'found_name';
                    resolutionLog.resolvedUserId = nameMatch.id;
                    console.log(`[USER_RESOLUTION] Found match by name "${msg.pushName}" -> User ${nameMatch.id}. Linking instead of creating duplicate.`);
                    if (!nameMatch.fallback_chat_user_id) {
                        await UserService.linkPhoneJid(nameMatch.id, normalizedJid);
                        resolutionLog.linkedPhone = true;
                    }
                    user = nameMatch;
                } else {
                    // SAFETY CHECK 2: Direct fallback_chat_user_id column lookup
                    // Catches users who exist via LID primary but have this phone linked                    
                    const phoneMatch = await UserService.getUserByPhoneJid(normalizedJid);

                    if (phoneMatch) {
                        resolutionLog.path = 'found_fallback_chat_user_id';
                        resolutionLog.resolvedUserId = phoneMatch.id;
                        console.log(`[USER_RESOLUTION] Found existing user by fallback_chat_user_id lookup: ${phoneMatch.id} (${phoneMatch.name}). Avoiding duplicate.`);
                        user = phoneMatch;
                    } else {
                        // Fallback: Create NEW user with Phone JID as 'chat_user_id' (Legacy Mode)
                        resolutionLog.path = 'created_legacy';
                        resolutionLog.createdNew = true;
                        console.log(`[USER_RESOLUTION_FALLBACK] No LID resolved for ${normalizedJid}, no pushName match (${msg.pushName}), no fallback_chat_user_id match. Creating legacy Phone JID user.`);

                        const getPfp = async () => {
                            try {
                                return await sock.profilePictureUrl(normalizedJid, 'image');
                            } catch {
                                return null;
                            }
                        };
                        const pfpUrl = await getPfp();
                        await UserService.ensureUser(normalizedJid, msg.pushName || '', pfpUrl || null);
                        user = await UserService.getUser(normalizedJid);
                        if (user) resolutionLog.resolvedUserId = user.id;
                    }
                }
            }
        }

        if (!user) {
            // Try one last fetch if ensureUser was called but we didn't assign 'user' yet (in the caching block)
            user = await UserService.getUser(userJid);
        }

        // Log the full resolution trace
        if (user) resolutionLog.resolvedUserId = user.id;
        console.log(`[USER_RESOLUTION_TRACE] ${JSON.stringify(resolutionLog)}`);

        if (!user) return; // Should not happen if ensureUser worked

        // PFP Refresh Check (Throttled by PFP_REFRESH_INTERVAL)
        // We do this asynchronously so we don't block the bot response
        if (UserService.shouldUpdatePfp(normalizedJid)) {
            (async () => {
                try {
                    // Fetch from WhatsApp
                    const url = await sock.profilePictureUrl(normalizedJid, 'image').catch(() => null);
                    const pfpUrl = url || null; // Ensure strict null if undefined
                    // Update DB & Cache
                    await UserService.updatePfp(normalizedJid, pfpUrl);
                } catch (err) {
                    // Ignore errors here, we'll try again next time
                }
            })();
        }

        // 4. Check for Reply to Callout
        const replyContext = msg.message.extendedTextMessage?.contextInfo;
        if (replyContext && replyContext.stanzaId) {
            const replyResult = await CalloutsService.handleReply(user.id, replyContext.stanzaId);
            if (replyResult) {
                await messagingService.sendMessage(remoteJid, replyResult);
                return; // Stop processing (don't treat as command if it was a callout verification)
            }
        }

        // Hand off to Registry
        await registry.handle(sock, msg, text, user);
    });
}

if (config.DEMO_MODE) {
    console.log('CommitCrew bot running in demo mode; chat integrations and cron jobs are disabled.');
} else {
    connectToWhatsApp();

    // Start-up Cron Jobs
    startCronJobs(supabase, openai);
}
