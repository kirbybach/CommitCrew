import { WASocket } from '@whiskeysockets/baileys';

export interface User {
    id: string;
    chat_user_id: string;
    name: string;
    avatar_url?: string | null;
    weekly_wins_count?: number;
    created_at?: string;
    [key: string]: any;
}

export interface Command {
    name: string;
    triggers: string[];
    execute(sock: WASocket, message: any, args: string[], user: User): Promise<void>;
}
