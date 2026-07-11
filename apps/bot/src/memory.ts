import { supabase, createEmbedding } from './services';
import { config } from './config';

export type MemoryType = 'commit_log' | 'conversation_summary';

export interface MemoryMetadata {
    grade?: number;
    original_date?: string;
    [key: string]: any;
}

/**
 * Fire-and-forget memory storage.
 * Calculates embedding and inserts into DB without blocking main thread.
 */
export async function addMemory(
    userId: string,
    content: string,
    type: MemoryType,
    metadata: MemoryMetadata = {}
) {
    try {
        const embedding = await createEmbedding(content);

        const { error } = await supabase.from('memories').insert({
            user_id: userId,
            content,
            embedding,
            type,
            metadata,
            created_at: new Date().toISOString()
        });

        if (error) console.error('Error adding memory:', error);
    } catch (e) {
        console.error('Failed to add memory:', e);
    }
}

/**
 * Structured Log Interface for RAG Debugging
 */
interface RAGLog {
    type: 'RAG_DEBUG';
    operation: 'retrieveContext' | 'retrieveRelevantRules';
    query_preview: string;
    latency_ms: number;
    total_candidates: number;
    threshold_used: number; // The relaxed threshold used for DB lookup
    results: {
        similarity: number;
        preview: string;
        status: 'ACCEPTED' | 'REJECTED';
    }[];
}

function logRAG(data: RAGLog) {
    if (process.env.DEBUG_RAG === 'true') {
        console.log(`\n\x1b[36m--- RAG DEBUG [${data.operation}] ---\x1b[0m`);
        console.log(`Query: "${data.query_preview}..." (${data.latency_ms}ms)`);
        console.log(`Results: ${data.total_candidates} candidates evaluated (DB Threshold: ${data.threshold_used})`);

        if (data.results.length === 0) {
            console.log(`  No results found.`);
        } else {
            data.results.forEach((r, i) => {
                const icon = r.status === 'ACCEPTED' ? '✅' : '❌';
                const color = r.status === 'ACCEPTED' ? '\x1b[32m' : '\x1b[31m';
                const sim = r.similarity.toFixed(4);
                console.log(`  ${i + 1}. ${color}${icon} [${sim}] - ${r.status}\x1b[0m`);
                console.log(`     "${r.preview}..."`);
            });
        }
        console.log(`\x1b[36m-------------------------------------\x1b[0m\n`);
    }
}

/**
 * Hybrid Retrieval Strategy:
 * 1. Fetch search results via cosine similarity (long-term context).
 * 2. Fetch recent chronological items (short-term context).
 * 3. Merge and deduplicate.
 */
export async function retrieveContext(userId: string, query: string): Promise<string> {
    const start = Date.now();
    const queryEmbedding = await createEmbedding(query);

    // 1. Vector Search (Relaxed Threshold for Instrumentation)
    // Business Threshold: 0.40
    // Instrumentation Threshold: 0.10
    const vectorPromise = supabase.rpc('match_memories', {
        query_embedding: queryEmbedding,
        match_threshold: 0.10,
        match_count: 10, // Fetch more candidates to see near misses
        p_user_id: userId
    });

    // 2. Recent Chronological (Last 5)
    // Note: We don't log chronological retrieval for RAG debugging as it's deterministic.
    const recentPromise = supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(5);

    const [vectorResults, recentResults] = await Promise.all([vectorPromise, recentPromise]);

    const candidates = vectorResults.data || [];
    const recentMemories = (recentResults.data || []).reverse();

    // Instrumentation & Filtering
    const ACCEPTANCE_THRESHOLD = config.MEMORY_THRESHOLD;
    const finalVectorMemories = candidates.filter((m: any) => m.similarity > ACCEPTANCE_THRESHOLD);

    logRAG({
        type: 'RAG_DEBUG',
        operation: 'retrieveContext',
        query_preview: query.substring(0, 50),
        latency_ms: Date.now() - start,
        total_candidates: candidates.length,
        threshold_used: 0.10,
        results: candidates.map((m: any) => ({
            similarity: m.similarity,
            preview: m.content.substring(0, 50),
            status: m.similarity > ACCEPTANCE_THRESHOLD ? 'ACCEPTED' : 'REJECTED'
        }))
    });

    // Format for LLM
    let contextString = "";

    if (recentMemories.length > 0) {
        contextString += "### Recent History (Chronological)\n";
        recentMemories.forEach((m: any) => {
            const grade = m.metadata?.grade ? ` (Grade: ${m.metadata.grade})` : "";
            const date = new Date(m.created_at).toLocaleDateString();
            contextString += `- [${date}]: ${m.content}${grade}\n`;
        });
        contextString += "\n";
    }

    if (finalVectorMemories.length > 0) {
        contextString += "### Relevant Past Context\n";
        finalVectorMemories.forEach((m: any) => {
            // Deduplicate: Don't show if it's already in recent history
            if (recentMemories.find((rm: any) => rm.id === m.id)) return;

            const grade = m.metadata?.grade ? ` (Grade: ${m.metadata.grade})` : "";
            const date = new Date(m.created_at).toLocaleDateString();
            contextString += `- [${date}]: ${m.content}${grade}\n`;
        });
    }

    return contextString.trim();
}

/**
 * Adds a new grading rule to the permanent "Case Law".
 */
export async function addGradingRule(
    userId: string,
    rule: string,
    originCommitId: string | null
) {
    try {
        const embedding = await createEmbedding(rule);

        const { error } = await supabase.from('grading_rules').insert({
            user_id: userId,
            rule,
            embedding,
            origin_commit_id: originCommitId
        });

        if (error) console.error('Error adding grading rule:', error);
    } catch (e) {
        console.error('Failed to add grading rule:', e);
    }
}

/**
 * Retrieves generalized grading rules via RAG.
 */
export async function retrieveRelevantRules(userId: string, query: string): Promise<string> {
    const start = Date.now();
    const queryEmbedding = await createEmbedding(query);

    // Business Threshold: 0.60
    // Instrumentation Threshold: 0.10
    const { data: candidates, error } = await supabase.rpc('match_grading_rules', {
        query_embedding: queryEmbedding,
        match_threshold: 0.10,
        match_count: 5,
        p_user_id: userId
    });

    if (error) {
        console.error('Error retrieving rules:', error);
        return "";
    }

    const rulesCandidates = candidates || [];
    const ACCEPTANCE_THRESHOLD = config.RULES_THRESHOLD;
    const finalRules = rulesCandidates.filter((r: any) => r.similarity > ACCEPTANCE_THRESHOLD);

    logRAG({
        type: 'RAG_DEBUG',
        operation: 'retrieveRelevantRules',
        query_preview: query.substring(0, 50),
        latency_ms: Date.now() - start,
        total_candidates: rulesCandidates.length,
        threshold_used: 0.10,
        results: rulesCandidates.map((r: any) => ({
            similarity: r.similarity,
            preview: r.rule.substring(0, 50),
            status: r.similarity > ACCEPTANCE_THRESHOLD ? 'ACCEPTED' : 'REJECTED'
        }))
    });

    if (finalRules.length === 0) return "";

    return finalRules.map((r: any) => `- ${r.rule} (Precedent established: ${new Date(r.created_at).toLocaleDateString()})`).join('\n');
}

/**
 * Checks if a proposed rule is too similar to an existing one.
 * Returns the text of the similar rule if found, otherwise null.
 */
export async function findSimilarRule(userId: string, rule: string): Promise<string | null> {
    try {
        const embedding = await createEmbedding(rule);

        const { data: candidates, error } = await supabase.rpc('match_grading_rules', {
            query_embedding: embedding,
            match_threshold: config.DUPLICATE_RULE_THRESHOLD, // High threshold for "duplicate" detection
            match_count: 1,
            p_user_id: userId
        });

        if (error) {
            console.error('Error checking for similar rules:', error);
            return null;
        }

        if (candidates && candidates.length > 0) {
            return candidates[0].rule;
        }

        return null;
    } catch (e) {
        console.error('Failed to check for similar rules:', e);
        return null;
    }
}
