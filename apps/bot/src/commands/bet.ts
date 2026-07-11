import { WASocket } from '@whiskeysockets/baileys';
import * as chrono from 'chrono-node';
import { Command, User } from '../types';
import { messagingService } from '../services/MessagingService';
import { BetsService } from '../services/BetsService';

// Simple in-memory storage for pending confirmations
// Key: userId, Value: { amount, task, deadline }
const pendingConfirmations = new Map<string, { amount: number, task: string, deadline: Date }>();

export const BetCommand: Command = {
    name: 'bet',
    triggers: ['@bet', '@wager'],
    async execute(sock: WASocket, message: any, args: string[], user: User) {
        const chatId = message.key.remoteJid!;

        // Handle Confirmation
        if (args[0]?.toLowerCase() === 'yes' || args[0]?.toLowerCase() === 'confirm') {
            const pending = pendingConfirmations.get(user.id);
            if (!pending) {
                await messagingService.sendMessage(chatId, `No pending bet to confirm. usage: @bet [amount] [task] by [time]`);
                return;
            }

            // Create Bet
            try {
                await BetsService.createBet(user.id, pending.task, pending.amount, pending.deadline);
                pendingConfirmations.delete(user.id);
                await messagingService.sendMessage(chatId, `✅ *Bet Locked In!* \nTask: "${pending.task}"\nRisk: ${pending.amount} pts\nDeadline: ${pending.deadline.toLocaleString()}`);
            } catch (err) {
                console.error(err);
                await messagingService.sendMessage(chatId, `❌ Failed to create bet.`);
            }
            return;
        }

        // Parse New Bet
        // Expected format: @bet 50 Finish the report by 5pm

        if (args.length < 3) {
            await messagingService.sendMessage(chatId, `Usage: @bet [amount] [task] by [deadline]\nExample: @bet 20 Finish cleanup by 8pm`);
            return;
        }

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) {
            await messagingService.sendMessage(chatId, `❌ Invalid amount. Must be a positive number.`);
            return;
        }

        if (amount > 30) {
            await messagingService.sendMessage(chatId, `❌ Bet too high! Max bet is 30 pts to prevent bankruptcy.`);
            return;
        }

        // Join the rest of the message to parse text and date
        const restOfMessage = args.slice(1).join(' ');

        // Parse Date
        const parsedResults = chrono.parse(restOfMessage, new Date(), { forwardDate: true });

        if (parsedResults.length === 0) {
            await messagingService.sendMessage(chatId, `❌ Could not parse a deadline. Please specify a time (e.g. "by 5pm", "tomorrow").`);
            return;
        }

        const deadline = parsedResults[0].start.date();
        // Remove the date text from the task description to clean it up? 
        // Or just keep the whole thing as the task description for context.
        // Let's keep it simple: Task is the text BEFORE the date match, or just the whole text?
        // chrono provides `text` which is the matched date string.
        // We can strip it out to get the "Core Task".

        const dateText = parsedResults[0].text;
        const taskDescription = restOfMessage.replace(dateText, '').trim().replace(/^by\s+/i, '').trim();

        if (taskDescription.length < 3) {
            await messagingService.sendMessage(chatId, `❌ Task description too short. What are you betting on?`);
            return;
        }

        // Store for confirmation
        pendingConfirmations.set(user.id, { amount, task: taskDescription, deadline });

        await messagingService.sendMessage(chatId, `🎰 *Wager Request*\n\nTask: "${taskDescription}"\nRisk: ${amount} pts\nDeadline: ${deadline.toLocaleString()}\n\nReply with *@bet yes* to confirm.`);
    }
};
