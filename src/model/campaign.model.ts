import mongoose, { Document } from "mongoose"; 

export type CampaignStatus = "pending" | "processing" | "completed" | "failed";

export interface ICampaignAttachment {
    fileName: string;
    localPath: string;
    mimeType: string;
}

export interface ICampaign extends Document {
    subject: string;
    body: string;
    sentBy: mongoose.Types.ObjectId;
    status: CampaignStatus;
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    attachments: ICampaignAttachment[];
    startedAt?: Date;
    completedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const campaignAttachmentSchema = new mongoose.Schema<ICampaignAttachment>(
    {
        fileName: { type: String, required: true },
        localPath: { type: String, required: true },
        mimeType: { type: String, required: true },
    },
    { _id: false }
);

const campaignSchema = new mongoose.Schema(
    {
        subject: { type: String, required: true, trim: true },
        body: { type: String, required: true },
        sentBy: { type: mongoose.Types.ObjectId, ref: "Auth", required: true },
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "failed"],
            default: "pending",
        },
        attachments: {
            type: [campaignAttachmentSchema],
            required: true,
            validate: {
                validator: (arr: ICampaignAttachment[]) =>
                    arr.length >= 1 && arr.length <= 3, // 👈 min 1, max 3
                message: "Between 1 and 3 attachments are required",
            },
        },
        totalRecipients: { type: Number, default: 0 },
        successCount: { type: Number, default: 0 },
        failureCount: { type: Number, default: 0 },
        startedAt: { type: Date },
        completedAt: { type: Date },
    },
    { timestamps: true }
);

campaignSchema.index({ status: 1 });
campaignSchema.index({ createdAt: -1 });

export const Campaign = mongoose.model<ICampaign>("Campaign", campaignSchema);