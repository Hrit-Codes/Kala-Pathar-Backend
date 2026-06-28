import mongoose, { Document, Types } from "mongoose";
import { DIFFICULTY_NAMES } from "../constants/difficulty";

export const CURRENCIES = [
    "Rs", "USD", "EUR", "GBP", "AUD", "CAD"
] as const;

export type Currency = typeof CURRENCIES[number];

export type PriceLabel = "per person" | "per group" | "per vehicle" | "per trip";

export const PRICE_LABELS: PriceLabel[] = [
    "per person",
    "per group",
    "per vehicle",
    "per trip",
];

export interface ISupportContact {
    name: string;
    phone: string;
}

export interface IItineraryDay {
    day: number;
    title: string;
    description: string;
}

export interface ITermsAndConditions {
    title: string;
    description: string;
    isRequired?: boolean;
}

export interface IFAQ {
    question: string;
    answer: string;
    order?: number;
}

export interface IFAQSection {
    title: string;
    description: string;
    faqs: IFAQ[];
}

export interface ITravelPackage extends Document {
    title: string;
    slug: string;
    badge?: string;
    overviewTitle?: string;
    description: string;
    thumbnail: string;
    thumbnailPublicId: string;
    thumbnailLocalPath:string;
    thumbnailLocalUrl:string
    gallery?: string[];
    galleryPublicIds?: string[];
    galleryLocalPaths?:string[];
    galleryLocalUrls:string[];
    price: number;
    currency: Currency;
    priceLabel: PriceLabel;
    durationDays: number;
    maxAltitude?: string;
    difficulty?: string;
    groupSize?: number;
    highlights: string[];
    inclusions: string[];
    exclusions?: string[];
    itinerary?: IItineraryDay[];
    supportContacts: ISupportContact[];
    termsAndConditions: ITermsAndConditions[];
    faqSection: IFAQSection;
    packageType: Types.ObjectId;
    destination: Types.ObjectId;
    isFeatured: boolean;
    isActive: boolean;
    views: number;
    thumbnailSource: "cloudinary" | "local";
    gallerySource?: ("cloudinary" | "local")[];
    createdAt?: Date;
    updatedAt?: Date;
}

const supportContactSchema = new mongoose.Schema<ISupportContact>(
    { name: { type: String, required: true, trim: true }, phone: { type: String, required: true, trim: true } },
    { _id: false }
);

const itineraryDaySchema = new mongoose.Schema<IItineraryDay>(
    {
        day: { type: Number, required: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
    },
    { _id: false }
);

const termsAndConditionsSchema = new mongoose.Schema<ITermsAndConditions>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        isRequired: { type: Boolean, default: true },
    },
    { _id: false }
);

const faqSchema = new mongoose.Schema<IFAQ>(
    {
        question: { type: String, required: true, trim: true },
        answer: { type: String, required: true, trim: true },
        order: { type: Number, default: 0 },
    },
    { _id: false }
);

const faqSectionSchema = new mongoose.Schema<IFAQSection>(
    {
        title: { type: String, required: true, trim: true, default: "FAQs" },
        description: {
            type: String, required: true, trim: true,
            default: "Everything you need to know about this tour before you book",
        },
        faqs: {
            type: [faqSchema],
            required: true,
            validate: {
                validator: (arr: IFAQ[]) => arr.length >= 2,
                message: "At least 2 FAQs are required",
            },
        },
    },
    { _id: false }
);

const travelPackageSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        badge: { type: String, trim: true },
        overviewTitle: { type: String, required:true, trim: true },
        description: { type: String, required: true },
        thumbnail: { type: String, required: true },
        thumbnailPublicId: { type: String, required: true },
        thumbnailLocalPath: {type:String, required:true},
        thumbnailLocalUrl: [{type:String}],
        gallery: [{ type: String }],
        galleryPublicIds: [{ type: String }],
        galleryLocalPaths: [{type:String}],
        galleryLocalUrls: [{type:String}],
        price: { type: Number, required: true, min: 0 },
        currency: { type: String, enum: CURRENCIES, default: "Rs" },
        priceLabel: { type: String, enum: PRICE_LABELS, default: "per person" },
        durationDays: { type: Number, required: true, min: 1 },
        maxAltitude: { type: String, trim: true },
        difficulty: { type: String, enum: DIFFICULTY_NAMES },
        groupSize: { type: Number, min: 1 },
        highlights: {
            type: [String],
            required: true,
            validate: {
                validator: (arr: string[]) => arr.length >= 2,
                message: "At least 2 highlights are required",
            },
        },
        inclusions: {
            type: [String],
            required: true,
            validate: {
                validator: (arr: string[]) => arr.length >= 2,
                message: "At least 2 inclusions are required",
            },
        },
        exclusions: {
            type: [String],
            validate: {
                validator: (arr: string[]) => arr.length >= 2,
                message: "At least 2 exclusions are required",
            },
        },
        itinerary: [itineraryDaySchema],
        supportContacts: {
            type: [supportContactSchema],
            required: true,
            validate: {
                validator: (arr: ISupportContact[]) => arr.length >= 2,
                message: "At least 2 support contacts are required",
            },
        },
        termsAndConditions: {
            type: [termsAndConditionsSchema],
            required: true,
            validate: {
                validator: (arr: ITermsAndConditions[]) => arr.length >= 2,
                message: "At least 2 terms and conditions are required",
            },
        },
        faqSection: {
            type: faqSectionSchema,
            required: true,
            default: () => ({
                title: "FAQs",
                description: "Everything you need to know about this package before you book",
                faqs: [],
            }),
        },
        packageType: { type: mongoose.Types.ObjectId, ref: "PackageType", required: true },
        destination: { type: mongoose.Types.ObjectId, ref: "Destination", required: true },
        isFeatured: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        views: { type: Number, default: 0, min: 0 },
        thumbnailSource: { type: String, enum: ["cloudinary", "local"], default: "cloudinary" },
        gallerySource: [{ type: String, enum: ["cloudinary", "local"] }],
    },
    { timestamps: true }
);

travelPackageSchema.index({ packageType: 1 });
travelPackageSchema.index({ destination: 1 });
travelPackageSchema.index({ difficulty: 1 });
travelPackageSchema.index({ packageType: 1, destination: 1 });
travelPackageSchema.index({ packageType: 1, destination: 1, difficulty: 1 });
travelPackageSchema.index({ price: 1 });
travelPackageSchema.index({ durationDays: 1 });
travelPackageSchema.index({ isFeatured: 1 });
travelPackageSchema.index({ createdAt: -1 });
travelPackageSchema.index({ slug: 1 });

export const TravelPackage = mongoose.model<ITravelPackage>("TravelPackage", travelPackageSchema);