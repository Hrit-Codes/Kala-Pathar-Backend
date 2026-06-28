import mongoose, { Document } from "mongoose";

export interface ICeoQuote {
    quoteText: string;
    ceoName: string;
    ceoTitle: string;
    ceoPhoto?: string;
    ceoPhotoPublicId?: string;
    ceoPhotoLocalPath?: string;
    ceoPhotoLocalUrl?: string;
}

export interface IStat {
    label: string;
    value: string;
}

export interface IAboutUs extends Document {
    heading: string;
    tagline: string;
    description: string;
    heroImage: string;
    heroImagePublicId: string;
    heroImageLocalPath: string;
    heroImageLocalUrl: string;
    ceoQuote: ICeoQuote;
    stats: IStat[];
    createdAt?: Date;
    updatedAt?: Date;
}

const ceoQuoteSchema = new mongoose.Schema<ICeoQuote>(
    {
        quoteText: { type: String, required: true, trim: true },
        ceoName: { type: String, required: true, trim: true },
        ceoTitle: { type: String, required: true, trim: true },
        ceoPhoto: { type: String },
        ceoPhotoPublicId: { type: String },
        ceoPhotoLocalPath: { type: String },
        ceoPhotoLocalUrl: { type: String },
    },
    { _id: false }
);

const statSchema = new mongoose.Schema<IStat>(
    {
        label: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
    },
    { _id: false }
);

const aboutUsSchema = new mongoose.Schema(
    {
        heading: { type: String, required: true, trim: true },
        tagline: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        heroImage: { type: String, required: true },
        heroImagePublicId: { type: String, required: true },
        heroImageLocalPath: { type: String, required: true },
        heroImageLocalUrl: { type: String, required: true },
        ceoQuote: { type: ceoQuoteSchema, required: true },
        stats: {
            type: [statSchema],
            validate: {
                validator: (arr: IStat[]) => arr.length === 4,
                message: "Exactly 4 stats must be provided",
            },
        },
    },
    { timestamps: true }
);

export const AboutUs = mongoose.model<IAboutUs>("AboutUs", aboutUsSchema);