import { supabase } from '../services';
import { config } from '../config';

export class UserService {
    private static userCache: Map<string, number> = new Map();
    private static pfpCache: Map<string, number> = new Map();

    public static isUserCached(userJid: string): boolean {
        const lastCheck = this.userCache.get(userJid);
        const now = Date.now();
        return !!lastCheck && (now - lastCheck < config.USER_CACHE_TTL);
    }

    /**
     * Ensures a user exists in the database.
     * Uses a local cache to avoid hitting Supabase on every message.
     */
    public static async ensureUser(userJid: string, pushName: string, pfpUrl: string | null): Promise<any> {
        const now = Date.now();
        const lastCheck = this.userCache.get(userJid);

        if (lastCheck && (now - lastCheck < config.USER_CACHE_TTL)) {
            return;
        }

        try {
            // Check existence via EITHER ID first
            const existingUser = await this.getUser(userJid);

            // Calculate name
            // If user exists, keep their name. If not, use pushName or fallback.
            const nameToUse = existingUser?.name || pushName || userJid.split('@')[0];

            // If user exists, we might just be here to update cache or pfp.
            // But if 'userJid' is the PHONE JID and they are found via LID, we don't want to insert a new row.

            if (existingUser) {
                // Explicit update to ensure last_seen or just validation
                // For now, we just cache and return.
                this.userCache.set(userJid, now);
                return;
            }

            // If we are here, NO user was found matching this JID (in either column).
            // Creates a NEW user.
            // NOTE: We assume 'userJid' passed here is the 'chat_user_id' (Primary).
            // If the caller wants to set fallback_chat_user_id, they should use the link method or we strictly control inputs.

            console.log(`[USER_CREATED] Creating NEW user entry in database. JID: ${userJid}, Evaluated Name: ${nameToUse}`);

            const { error } = await supabase
                .from('users')
                .upsert({
                    chat_user_id: userJid,
                    name: nameToUse,
                    avatar_url: pfpUrl
                }, { onConflict: 'chat_user_id' });

            if (error) {
                console.error('[UserService] Error ensuring user:', error);
            } else {
                console.log(`[USER_CREATED] Successfully created user ${nameToUse} (${userJid})`);
                this.userCache.set(userJid, now);
            }

        } catch (err) {
            console.error('[UserService] Fatal error ensuring user:', err);
        }
    }

    /**
     * Fetches a user from the database.
     */
    /**
     * Fetches a user from the database by either identifier.
     * Checks both 'chat_user_id' (Primary/LID) and 'fallback_chat_user_id' (Secondary).
     */
    public static async getUser(jid: string): Promise<any> {
        // We use .or() to search both columns combined with an explicit index
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .or(`chat_user_id.eq.${jid},fallback_chat_user_id.eq.${jid}`)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
            console.error('UserService: Error fetching user:', error);
            return null;
        }
        return user || null;
    }

    /**
     * Direct lookup by fallback_chat_user_id column.
     * Used as a safety net before fallback user creation to prevent duplicates.
     */
    public static async getUserByPhoneJid(phoneJid: string): Promise<any | null> {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('fallback_chat_user_id', phoneJid)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error('UserService: Error in fallback_chat_user_id lookup:', error);
        }
        return user || null;
    }

    /**
     * Links a Phone JID to an existing user (who likely only has an LID).
     * Includes a safety check to ensure the connection isn't already claimed.
     */
    public static async linkPhoneJid(userId: string, phoneJid: string): Promise<boolean> {
        // 1. Safety Check: Is this Phone JID already claimed?
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('fallback_chat_user_id', phoneJid)
            .single();

        if (existing) {
            console.warn(`UserService: Aborted linking ${phoneJid} to ${userId} - already claimed by ${existing.id}`);
            return false;
        }

        // 2. Perform Update
        const { error } = await supabase
            .from('users')
            .update({ fallback_chat_user_id: phoneJid })
            .eq('id', userId);

        if (error) {
            console.error('UserService: Error linking phone JID:', error);
            return false;
        }

        console.log(`UserService: Successfully linked Phone JID ${phoneJid} to User ${userId}`);
        return true;
    }

    /**
     * Fallback lookup by display name. Used as safety net when JID lookup fails.
     * WARNING: May return wrong user if multiple people share the same name.
     */
    public static async getUserByNameFuzzy(pushName: string): Promise<any | null> {
        if (!pushName?.trim()) return null;

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .ilike('name', pushName.trim())
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('UserService: Error in name lookup:', error);
        }
        return user || null;
    }
    /**
     * Checks if the user's PFP should be updated based on the refresh interval.
     */
    public static shouldUpdatePfp(jid: string): boolean {
        const lastCheck = this.pfpCache.get(jid);
        const now = Date.now();
        // If never checked, or time since last check > interval, return true
        return !lastCheck || (now - lastCheck > config.PFP_REFRESH_INTERVAL);
    }

    /**
     * Updates the user's profile picture in Supabase and resets the cache timer.
     */
    public static async updatePfp(jid: string, pfpUrl: string | null): Promise<void> {
        const now = Date.now();

        // 1. Update Cache immediately to prevent spamming while DB op finishes
        this.pfpCache.set(jid, now);

        try {
            // 2. Update Supabase
            // We use the same loose matching as ensureUser (chat_user_id or fallback_chat_user_id)
            // But since 'jid' here is normalized from the message, it matches what we use in ensureUser.
            // Ideally we should use the User ID (UUID) if we have it, but JID is fine for now.
            const user = await this.getUser(jid);
            if (!user) return; // Should not happen if ensureUser was called first

            const { error } = await supabase
                .from('users')
                .update({ avatar_url: pfpUrl })
                .eq('id', user.id);

            if (error) {
                console.error(`UserService: Error updating PFP for ${jid}:`, error);
                // On error, maybe invalidate cache so we try again next time? 
                // Or just leave it to retry in 24 hours to avoid error loops. 
                // Let's leave it for 24h.
            } else {
                console.log(`UserService: Updated PFP for ${user.name} (${jid})`);
            }
        } catch (err) {
            console.error(`UserService: Fatal error updating PFP for ${jid}:`, err);
        }
    }
}
