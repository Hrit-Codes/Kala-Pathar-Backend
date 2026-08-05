import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Destination } from "../model/destinationModel";
import { redisClient } from "../config/redis";

const DESTINATIONS_CACHE_TTL = 30 * 60;
const DESTINATIONS_CACHE_KEY = "destinations:all";
const DESTINATIONS_ACTIVE_CACHE_KEY = "destinations:active";

const invalidateDestinationsCache = async () => {
    await Promise.all([
        redisClient.del(DESTINATIONS_CACHE_KEY),
        redisClient.del(DESTINATIONS_ACTIVE_CACHE_KEY),
    ]);
};

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createDestination = asyncHandler(async (req: Request, res: Response) => {
    const { name, description, isActive, order } = req.body;

    if (!name?.trim()) {
        throw new ApiError(400, "Destination name is required");
    }

    const slug = name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    const existingDestination = await Destination.findOne({ slug });

    if (existingDestination) {
        throw new ApiError(409, "A destination with this name already exists");
    }

    const destination = await Destination.create({
        name: name.trim(),
        slug,
        description,
        order,
        isActive,
    });

    await invalidateDestinationsCache();

    return res.status(201).json({
        success: true,
        message: "Destination created successfully",
        data: destination,
    });
});

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteDestination = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Id is required");
    }

    const destination = await Destination.findById(id);

    if (!destination) {
        throw new ApiError(404, "Destination not found");
    }

    await Destination.findByIdAndDelete(id);

    await invalidateDestinationsCache();

    return res.status(200).json({
        success: true,
        message: "Destination deleted successfully",
        data: {
            _id: destination._id,
            name: destination.name,
            deletedAt: new Date(),
        },
    });
});

// ─── TOGGLE ACTIVE STATUS ─────────────────────────────────────────────────────
export const toggleDestinationActiveStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Id is required");
    }

    const destination = await Destination.findById(id);

    if (!destination) {
        throw new ApiError(404, "Destination not found");
    }

    const updatedDestination = await Destination.findByIdAndUpdate(
        id,
        {
            isActive: !destination.isActive,
            updatedAt: new Date(),
        },
        {
            new: true,
            runValidators: true,
        }
    );

    await invalidateDestinationsCache();

    const statusMessage = updatedDestination?.isActive ? "activated" : "deactivated";

    return res.status(200).json({
        success: true,
        message: `Destination ${statusMessage} successfully`,
        data: {
            _id: updatedDestination?._id,
            name: updatedDestination?.name,
            slug: updatedDestination?.slug,
            isActive: updatedDestination?.isActive,
        },
    });
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateDestination = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Id is required");
    }

    const { name, description, order, isActive } = req.body;

    const existingDestination = await Destination.findById(id);

    if (!existingDestination) {
        throw new ApiError(404, "Destination not found");
    }

    const updateData: Record<string, unknown> = {};

    if (name) {
        const newSlug = name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        const slugConflict = await Destination.findOne({
            slug: newSlug,
            _id: { $ne: id },
        });

        if (slugConflict) {
            throw new ApiError(409, "A destination with this name already exists");
        }

        updateData.name = name.trim();
        updateData.slug = newSlug;
    }

    if (description !== undefined) updateData.description = description.trim();
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    updateData.updatedAt = new Date();

    const updatedDestination = await Destination.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );

    await invalidateDestinationsCache();

    return res.status(200).json({
        success: true,
        message: "Destination updated successfully",
        data: updatedDestination,
    });
});

// ─── GET BY ID ────────────────────────────────────────────────────────────────
export const getDestinationById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Id is required");
    }

    const destination = await Destination.findById(id);

    if (!destination) {
        throw new ApiError(404, "Destination not found");
    }

    return res.status(200).json({
        success: true,
        message: "Destination data fetched successfully",
        data: destination,
    });
});

// ─── GET ALL (Admin) ──────────────────────────────────────────────────────────
export const getAllDestinations = asyncHandler(async (req: Request, res: Response) => {
    const cached = await redisClient.get(DESTINATIONS_CACHE_KEY);

    if (cached) {
        return res.status(200).json({
            success: true,
            message: "Destinations fetched successfully (cached)",
            data: JSON.parse(cached),
        });
    }

    const destinations = await Destination.find().sort({ order: 1, createdAt: -1 });

    await redisClient.set(
        DESTINATIONS_CACHE_KEY,
        JSON.stringify(destinations),
        "EX",
        DESTINATIONS_CACHE_TTL
    );

    return res.status(200).json({
        success: true,
        message: "Destinations fetched successfully",
        data: destinations,
    });
});

// ─── GET ACTIVE (Public) ──────────────────────────────────────────────────────
export const getActiveDestinations = asyncHandler(async (req: Request, res: Response) => {
    const cached = await redisClient.get(DESTINATIONS_ACTIVE_CACHE_KEY);

    if (cached) {
        return res.status(200).json({
            success: true,
            message: "Active destinations fetched successfully (cached)",
            ...JSON.parse(cached),
        });
    }

    const destinations = await Destination.find({ isActive: true })
        .sort({ order: 1, createdAt: -1 })
        .select("_id name slug description");

    const responsePayload = {
        data: destinations,
        total: destinations.length,
    };

    await redisClient.set(
        DESTINATIONS_ACTIVE_CACHE_KEY,
        JSON.stringify(responsePayload),
        "EX",
        DESTINATIONS_CACHE_TTL
    );

    return res.status(200).json({
        success: true,
        message: "Active destinations fetched successfully",
        ...responsePayload,
    });
});