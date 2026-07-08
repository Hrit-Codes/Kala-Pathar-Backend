import { Queue } from "bullmq";
import { redisClient } from "../config/redis";

export interface EmailJobData {
    campaignId: string;
    email: string;
    subject: string;
    body: string;
    unsubscribeToken: string;
    attachments: {
        fileName: string;
        localPath: string;
        mimeType: string;
    }[];
}

export const emailQueue = new Queue<EmailJobData>("email-campaign", {
    connection: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT) || 6379,
    },
    defaultJobOptions: {
        attempts: 3,                        
        backoff: {
            type: "exponential",
            delay: 2000,                    // 2s, 4s, 8s between retries
        },
        removeOnComplete: { count: 100 },   // keep last 100 completed jobs
        removeOnFail: { count: 50 },        // keep last 50 failed jobs
    },
});