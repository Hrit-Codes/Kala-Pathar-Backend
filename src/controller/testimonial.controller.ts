import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { Testimonial } from "../model/testimonial.model";
import { redisClient } from "../config/redis";

const TESTIMONIAL_CACHE_KEY = "testimonials:active";
const TESTIMONIAL_ALL_CACHE_KEY = "testimonials:all";
const TESTIMONIAL_CACHE_TTL = 5 * 60;

const invalidateTestimonialCache = async () => {
    await redisClient.del(TESTIMONIAL_CACHE_KEY);
    await redisClient.del(TESTIMONIAL_ALL_CACHE_KEY);
};

const reorderAfterDelete = async (deletedOrder: number): Promise<void> => {
    await Testimonial.updateMany(
        { order: { $gt: deletedOrder } },
        { $inc: { order: -1 } }
    );
};

export const createTestimonial = asyncHandler(async (req: Request, res: Response) => {
    const {
        reviewerName, reviewerCountry,
        rating, title, body, package: pkg, isActive,
    } = req.body;

    const highestOrder = await Testimonial.findOne()
        .sort({ order: -1 })
        .select("order");

    const nextOrder = highestOrder ? highestOrder.order + 1 : 1;

    const testimonial = await Testimonial.create({
        reviewerName: reviewerName.trim(),
        reviewerCountry: reviewerCountry.trim(),
        rating: Number(rating),
        title: title.trim(),
        body: body.trim(),
        package: pkg || null,
        order: nextOrder,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    await testimonial.populate("package", "title slug thumbnail");
    await invalidateTestimonialCache();

    const total = await Testimonial.countDocuments();

    return res.status(201).json({
        success: true,
        message: "Testimonial created successfully",
        data: testimonial,
        totalTestimonials: total,
    });
});

export const updateTestimonial = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Id is required");

    const existing = await Testimonial.findById(id);
    if (!existing) throw new ApiError(404, "Testimonial not found");

    const {
        reviewerName, reviewerCountry,
        rating, title, body, package: pkg, isActive,
    } = req.body;

    if (reviewerName !== undefined) existing.reviewerName = reviewerName.trim();
    if (reviewerCountry !== undefined) existing.reviewerCountry = reviewerCountry.trim();
    if (rating !== undefined) existing.rating = Number(rating);
    if (title !== undefined) existing.title = title.trim();
    if (body !== undefined) existing.body = body.trim();
    if (pkg !== undefined) existing.package = pkg || null;
    if (isActive !== undefined) existing.isActive = Boolean(isActive);

    await existing.save();
    await existing.populate("package", "title slug thumbnail");
    await invalidateTestimonialCache();

    return res.status(200).json({
        success: true,
        message: "Testimonial updated successfully",
        data: existing,
    });
});

export const deleteTestimonial = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Id is required");

    const existing = await Testimonial.findById(id);
    if (!existing) throw new ApiError(404, "Testimonial not found");

    const deletedOrder = existing.order;

    await Testimonial.findByIdAndDelete(id);
    await reorderAfterDelete(deletedOrder);
    await invalidateTestimonialCache();

    const remaining = await Testimonial.countDocuments();

    return res.status(200).json({
        success: true,
        message: "Testimonial deleted successfully",
        data: {
            _id: existing._id,
            title: existing.title,
            deletedAt: new Date(),
        },
        totalTestimonials: remaining,
    });
});

export const reorderTestimonials = asyncHandler(async (req: Request, res: Response) => {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        throw new ApiError(400, "orderedIds must be a non-empty array of testimonial IDs");
    }

    const updateOperations = orderedIds.map((id: string, index: number) => ({
        updateOne: {
            filter: { _id: id },
            update: { $set: { order: index + 1 } },
        },
    }));

    await Testimonial.bulkWrite(updateOperations);
    await invalidateTestimonialCache();

    return res.status(200).json({
        success: true,
        message: "Testimonials reordered successfully",
    });
});

export const toggleTestimonialActive = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Id is required");

    const existing = await Testimonial.findById(id);
    if (!existing) throw new ApiError(404, "Testimonial not found");

    const updated = await Testimonial.findByIdAndUpdate(
        id,
        { isActive: !existing.isActive },
        { new: true }
    );

    await invalidateTestimonialCache();

    return res.status(200).json({
        success: true,
        message: `Testimonial ${updated?.isActive ? "activated" : "deactivated"} successfully`,
        data: { _id: existing._id, isActive: updated?.isActive },
    });
});

export const getAllTestimonials = asyncHandler(async (req: Request, res: Response) => {
    const cached = await redisClient.get(TESTIMONIAL_ALL_CACHE_KEY);
    if (cached) {
        return res.status(200).json({
            success: true,
            message: "Testimonials fetched successfully",
            ...JSON.parse(cached),
        });
    }

    const testimonials = await Testimonial.find()
        .populate("package", "title slug thumbnail")
        .sort({ order: 1 });

    const responsePayload = {
        data: testimonials,
        total: testimonials.length,
    };

    await redisClient.set(
        TESTIMONIAL_ALL_CACHE_KEY,
        JSON.stringify(responsePayload),
        "EX",
        TESTIMONIAL_CACHE_TTL
    );

    return res.status(200).json({
        success: true,
        message: "Testimonials fetched successfully",
        ...responsePayload,
    });
});

export const getActiveTestimonials = asyncHandler(async (req: Request, res: Response) => {
    const cached = await redisClient.get(TESTIMONIAL_CACHE_KEY);
    if (cached) {
        return res.status(200).json({
            success: true,
            message: "Testimonials fetched successfully",
            ...JSON.parse(cached),
        });
    }

    const testimonials = await Testimonial.find({ isActive: true })
        .populate("package", "title slug thumbnail")
        .sort({ order: 1 });

    const responsePayload = {
        data: testimonials,
        total: testimonials.length,
    };

    await redisClient.set(
        TESTIMONIAL_CACHE_KEY,
        JSON.stringify(responsePayload),
        "EX",
        TESTIMONIAL_CACHE_TTL
    );

    return res.status(200).json({
        success: true,
        message: "Testimonials fetched successfully",
        ...responsePayload,
    });
});