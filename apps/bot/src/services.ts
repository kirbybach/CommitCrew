import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const demoMode = process.env.DEMO_MODE !== 'false';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!demoMode && (!process.env.SUPABASE_URL || !supabaseKey || !process.env.OPENAI_API_KEY)) {
    throw new Error('Missing Supabase or OpenAI credentials');
}

export const supabase = createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder'
);
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'placeholder' });

export async function createEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float",
    });
    return response.data[0].embedding;
}
