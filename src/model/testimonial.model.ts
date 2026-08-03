import mongoose, { Document } from "mongoose";

export interface ITestimonial extends Document {
    reviewerName: string;
    reviewerCountry: string;
    rating: number;
    title: string;
    body: string;
    package?: mongoose.Types.ObjectId | string | null; // Fixed: allow string and null
    order: number;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const testimonialSchema = new mongoose.Schema(
    {
        reviewerName: { type: String, required: true, trim: true },
        reviewerCountry: { type: String, required: true, trim: true },
        rating: {
            type: Number,
            required: true,
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating must be at most 5"],
        },
        title: { type: String, required: true, trim: true },
        body: { type: String, required: true, trim: true },
        package: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TravelPackage",
            default: null,
        },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

testimonialSchema.index({ order: 1 });
testimonialSchema.index({ isActive: 1 });

export const Testimonial = mongoose.model<ITestimonial>("Testimonial", testimonialSchema);