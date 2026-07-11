import { WASocket } from '@whiskeysockets/baileys';
import dotenv from 'dotenv';

import { config } from '../config';

class MessagingService {
    private socket: WASocket | null = null;
    private allowedGroups: string[] = [];

    constructor() {
        this.allowedGroups = config.ALLOWED_GROUPS;
    }

    public updateSocket(sock: WASocket) {
        this.socket = sock;
        console.log('MessagingService: Socket updated.');
    }

    public getSocket() {
        return this.socket;
    }

    public async sendMessage(jid: string, text: string) {
        if (!this.socket) {
            console.warn('MessagingService: Cannot send message, socket is null.');
            return;
        }
        try {
            return await this.socket.sendMessage(jid, { text });
        } catch (error) {
            console.error(`MessagingService: Failed to send message to ${jid}`, error);
        }
    }

    public async broadcast(text: string) {
        if (!this.socket) {
            console.warn('MessagingService: Cannot broadcast, socket is null.');
            return;
        }

        console.log(`MessagingService: Broadcasting to ${this.allowedGroups.length} groups...`);

        for (const jid of this.allowedGroups) {
            if (jid) {
                // heuristic delay to prevent rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
                await this.sendMessage(jid, text);
            }
        }
    }
}

export const messagingService = new MessagingService();
