import dotenv from 'dotenv';

dotenv.config();

export const config = {
    DEMO_MODE: process.env.DEMO_MODE !== 'false',

    // Security
    ALLOWED_GROUPS: process.env.ALLOWED_GROUPS?.split(',').map(g => g.trim()) || [],
    COMMIT_API_KEY: process.env.COMMIT_API_KEY || '',
    PRODUCTIVITY_GROUP_JID: process.env.PRODUCTIVITY_GROUP_JID || '',
    MAX_REQUEST_BODY_SIZE: 1024, // 1KB

    // Performance / Caching
    DEDUP_TTL: 5 * 60 * 1000, // 5 Minutes
    CACHE_CLEANUP_INTERVAL: 60 * 1000, // 1 Minute
    USER_CACHE_TTL: 60 * 60 * 1000, // 1 Hour
    PFP_REFRESH_INTERVAL: 24 * 60 * 60 * 1000, // 24 Hours

    // AI / Logic
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-5-nano',

    // RAG Thresholds (Business Logic)
    MEMORY_THRESHOLD: 0.40,
    RULES_THRESHOLD: 0.45,
    DUPLICATE_RULE_THRESHOLD: 0.60,
};
