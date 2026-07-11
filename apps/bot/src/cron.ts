import cron from 'node-cron';
import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { GamificationService } from './services/GamificationService';
import { messagingService } from './services/MessagingService';
import { SummarizationService } from './services/SummarizationService';
import { BetsService } from './services/BetsService';
import { SeasonsService } from './services/SeasonsService';
import { CalloutsService } from './services/CalloutsService';

export function startCronJobs(supabase: SupabaseClient, openai: OpenAI) {
    console.log('Initializing Cron Jobs... 🕰️');

    // Ensure current season exists on startup (missed-run recovery)
    SeasonsService.ensureCurrentSeason().catch(err => {
        console.error('Failed to ensure current season on startup:', err);
    });

    // 0. Hourly Bet Expiration: Every hour at :00
    cron.schedule('0 * * * *', async () => {
        console.log('Checking for expired bets...');
        await BetsService.checkExpiredBets();

        console.log('Checking for expired callouts...');
        const messages = await CalloutsService.expireCallouts();
        for (const msg of messages) {
            await messagingService.broadcast(msg);
        }
    }, {
        timezone: 'America/New_York'
    });

    // Season Finalization: 1st of every month at 12:05 AM EST
    // 5-minute buffer ensures all last-day commits are processed
    cron.schedule('5 0 1 * *', async () => {
        console.log('Running Season Finalization... 🏆');
        try {
            // Compute previous month
            const now = new Date();
            const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
            const prevDate = new Date(est.getFullYear(), est.getMonth() - 1, 1);
            const prevMonth = prevDate.getMonth() + 1;
            const prevYear = prevDate.getFullYear();

            // Finalize previous season
            const message = await SeasonsService.finalizeSeason(prevMonth, prevYear);
            if (message) {
                await messagingService.broadcast(message);
            }

            // Create new active season
            await SeasonsService.ensureCurrentSeason();
        } catch (error) {
            console.error('Season Finalization failed:', error);
        }
    }, {
        timezone: 'America/New_York'
    });

    // 1. Daily Leaderboard: Every Day at 9:00 PM EST
    cron.schedule('0 21 * * *', async () => {
        console.log('Running Daily Leaderboard...');
        try {
            const report = await GamificationService.generateDailyLeaderboard(supabase);
            if (report) {
                await messagingService.broadcast(report);
            } else {
                console.log('Daily Leaderboard: No activity to report.');
            }
        } catch (error) {
            console.error('Daily Leaderboard failed:', error);
        }
    }, {
        timezone: 'America/New_York'
    });

    // 2. Weekly Check-in: Sunday at 8:00 PM EST
    cron.schedule('0 20 * * 0', async () => {
        console.log('Running Weekly Check-in...');
        try {
            const report = await GamificationService.generateWeeklyCheckIn(supabase, openai);
            if (report) {
                await messagingService.broadcast(report);
            } else {
                console.log('Weekly Check-in: No activity to report.');
            }
        } catch (error) {
            console.error('Weekly Check-in failed:', error);
        }
    }, {
        timezone: 'America/New_York'
    });

    // 3. Daily Memory Summarization: 4:00 AM EST (Nightly)
    cron.schedule('0 4 * * *', async () => {
        console.log('Running Memory Summarization... 🧠');
        await SummarizationService.runMemorySummarization(supabase, openai);
    }, {
        timezone: 'America/New_York'
    });
}
