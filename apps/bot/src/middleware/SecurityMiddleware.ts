import { config } from '../config';

export class SecurityMiddleware {
    private processedMsgIds: Map<string, number>;
    private allowedGroups: string[];
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        this.processedMsgIds = new Map();
        this.allowedGroups = config.ALLOWED_GROUPS;

        // Periodic Cleanup to prevent memory leaks
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, config.CACHE_CLEANUP_INTERVAL);
    }

    /**
     * Checks if the message is from an allowed group or DM.
     * Note: Currently we only check based on config whitelist.
     */
    public isAllowedChat(remoteJid: string): boolean {
        if (this.allowedGroups.length === 0) return true; // Start open if no config
        return this.allowedGroups.includes(remoteJid);
    }

    /**
     * Checks if a message ID has already been processed.
     * Returns true if duplicate, false if new.
     */
    public isDuplicate(msgId: string): boolean {
        if (this.processedMsgIds.has(msgId)) {
            return true;
        }

        this.processedMsgIds.set(msgId, Date.now());
        return false;
    }

    /**
     * Removes expired message IDs from the Map.
     */
    private cleanup() {
        const now = Date.now();
        for (const [id, timestamp] of this.processedMsgIds.entries()) {
            if (now - timestamp > config.DEDUP_TTL) {
                this.processedMsgIds.delete(id);
            }
        }
    }

    /**
     * Call this when shutting down the bot to clear the interval.
     */
    public dispose() {
        clearInterval(this.cleanupInterval);
    }
}
