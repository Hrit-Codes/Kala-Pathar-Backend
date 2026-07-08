import { Worker, Job } from "bullmq";
import { transporter } from "../config/nodemailer";
import { Campaign } from "../model/campaign.model";
import type { EmailJobData } from "./emailQueue";

const processEmailJob = async (job: Job<EmailJobData>) => {
    const { campaignId, email, subject, body, unsubscribeToken, attachments } = job.data;

    const unsubscribeUrl = `${process.env.BASE_URL}/api/subscriber/unsubscribe/${unsubscribeToken}`;

    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #047857; padding: 24px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Kala Patthar Treks</h1>
                </div>
                <div style="padding: 32px;">
                    ${body}
                </div>
                <div style="padding: 16px; text-align: center; background: #f4f4f4; font-size: 12px; color: #999;">
                    <p>You're receiving this because you subscribed to our newsletter.</p>
                    <a href="${unsubscribeUrl}" style="color: #047857;">Unsubscribe</a>
                </div>
            </div>
        `,
        attachments: attachments.map((a) => ({
            filename: a.fileName,
            path: a.localPath,       // nodemailer reads directly from disk
            contentType: a.mimeType,
        })),
    });

    await Campaign.findByIdAndUpdate(campaignId, {
        $inc: { successCount: 1 },
    });
};

export const emailWorker = new Worker<EmailJobData>(
    "email-campaign",
    processEmailJob,
    {
        connection: {
            host: process.env.REDIS_HOST || "127.0.0.1",
            port: Number(process.env.REDIS_PORT) || 6379,
        },
        concurrency: 5, // process 5 emails at a time
    }
);

emailWorker.on("failed", async (job, error) => {
    console.error(`Email job failed for ${job?.data.email}:`, error);

    if (job && job.attemptsMade >= 3) {
        await Campaign.findByIdAndUpdate(job.data.campaignId, {
            $inc: { failureCount: 1 },
        });
    }
});

emailWorker.on("drained", async () => {
    // Queue is empty — mark any processing campaigns as completed
    console.log("Email queue drained");
});