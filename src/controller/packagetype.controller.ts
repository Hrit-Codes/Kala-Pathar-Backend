import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { PackageType } from "../model/packageTypeModel";
import { redisClient } from "../config/redis";

const PACKAGE_TYPES_CACHE_TTL = 30 * 60;
const PACKAGE_TYPES_CACHE_KEY = "packageTypes:all";
const PACKAGE_TYPES_ACTIVE_CACHE_KEY = "packagetypes:active";

const invalidatePackageTypesCache = async () => {
    await Promise.all([
        redisClient.del(PACKAGE_TYPES_CACHE_KEY),
        redisClient.del(PACKAGE_TYPES_ACTIVE_CACHE_KEY),
    ]);
};

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createPackageType = asyncHandler(async (req: Request, res: Response) => {
    const { name, icon, themeColor, description, hasDifficultyLevels, order, isActive } = req.body;

    if (!name?.trim()) {
        throw new ApiError(400, "Package type name is required");
    }

    if (!icon?.trim()) {
        throw new ApiError(400, "Icon is required");
    }

    if (!themeColor?.trim()) {
        throw new ApiError(400, "Theme color is required");
    }

    const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const existingPackageType = await PackageType.findOne({ slug });

    if (existingPackageType) {
        throw new ApiError(409, "A package type with this name already exists");
    }

    const packageType = await PackageType.create({
        name: name.trim(),
        slug,
        icon: icon.trim(),
        themeColor: themeColor.trim().toUpperCase(),
        description: description?.trim(),
        hasDifficultyLevels,
        order,
        isActive,
    });

    await invalidatePackageTypesCache();

    return res.status(201).json({
        success: true,
        message: "Package type created successfully",
        data: packageType,
    });
});

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deletePackageType = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Id is required");
    }

    const packageType = await PackageType.findById(id);

    if (!packageType) {
        throw new ApiError(404, "Package type not found");
    }

    await PackageType.findByIdAndDelete(id);

    await invalidatePackageTypesCache();

    return res.status(200).json({
        success: true,
        message: "Package type deleted successfully",
        data: {
            _id: packageType._id,
            name: packageType.name,
            deletedAt: new Date(),
        },
    });
});

// ─── TOGGLE ACTIVE STATUS ─────────────────────────────────────────────────────
export const toggleActiveStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Id is required");
    }

    const packageType = await PackageType.findById(id);

    if (!packageType) {
        throw new ApiError(404, "Package type not found");
    }

    const updatedPackageType = await PackageType.findByIdAndUpdate(
        id,
        {
            isActive: !packageType.isActive,
            updatedAt: new Date(),
        },
        {
            new: true,
            runValidators: true,
        }
    );

    await invalidatePackageTypesCache();

    const statusMessage = updatedPackageType?.isActive ? "activated" : "deactivated";

    return res.status(200).json({
        success: true,
        message: `Package type ${statusMessage} successfully`,
        data: {
            _id: updatedPackageType?._id,
            name: updatedPackageType?.name,
            slug: updatedPackageType?.slug,
            isActive: updatedPackageType?.isActive,
        },
    });
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updatePackageType = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Id is required");
    }

    const { name, icon, themeColor, description, hasDifficultyLevels, order, isActive } = req.body;

    const existingPackageType = await PackageType.findById(id);

    if (!existingPackageType) {
        throw new ApiError(404, "Package type not found");
    }

    const updateData: Record<string, unknown> = {};

    if (name) {
        const newSlug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        const slugConflict = await PackageType.findOne({
            slug: newSlug,
            _id: { $ne: id },
        });

        if (slugConflict) {
            throw new ApiError(409, "A package type with this name already exists");
        }

        updateData.name = name.trim();
        updateData.slug = newSlug;
    }

    if (icon) updateData.icon = icon.trim();
    if (themeColor) updateData.themeColor = themeColor.trim().toUpperCase();
    if (description !== undefined) updateData.description = description.trim();
    if (hasDifficultyLevels !== undefined) updateData.hasDifficultyLevels = hasDifficultyLevels;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    updateData.updatedAt = new Date();

    const updatedPackageType = await PackageType.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );

    await invalidatePackageTypesCache();

    return res.status(200).json({
        success: true,
        message: "Package type updated successfully",
        data: updatedPackageType,
    });
});

// ─── GET BY ID ────────────────────────────────────────────────────────────────
export const getPackageTypeById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Id is required");
    }

    const packageType = await PackageType.findById(id);

    if (!packageType) {
        throw new ApiError(404, "Package type not found");
    }

    return res.status(200).json({
        success: true,
        message: "Package type data fetched successfully",
        data: packageType,
    });
});

// ─── GET ALL (Admin) ──────────────────────────────────────────────────────────
export const getAllPackageTypes = asyncHandler(async (req: Request, res: Response) => {
    const cached = await redisClient.get(PACKAGE_TYPES_CACHE_KEY);

    if (cached) {
        return res.status(200).json({
            success: true,
            message: "Package types fetched successfully (cached)",
            data: JSON.parse(cached),
        });
    }

    const packageTypes = await PackageType.find().sort({ order: 1, createdAt: -1 });

    await redisClient.set(
        PACKAGE_TYPES_CACHE_KEY,
        JSON.stringify(packageTypes),
        "EX",
        PACKAGE_TYPES_CACHE_TTL
    );

    return res.status(200).json({
        success: true,
        message: "Package types fetched successfully",
        data: packageTypes,
    });
});

// ─── GET ACTIVE (Public) ──────────────────────────────────────────────────────
export const getActivePackageTypes = asyncHandler(async (req: Request, res: Response) => {
    const cached = await redisClient.get(PACKAGE_TYPES_ACTIVE_CACHE_KEY);

    if (cached) {
        return res.status(200).json({
            success: true,
            message: "Active package types fetched successfully (cached)",
            ...JSON.parse(cached),
        });
    }

    const packageTypes = await PackageType.find({ isActive: true })
        .sort({ order: 1, createdAt: -1 })
        .select("_id name slug icon themeColor description hasDifficultyLevels");

    const responsePayload = {
        data: packageTypes,
        total: packageTypes.length,
    };

    await redisClient.set(
        PACKAGE_TYPES_ACTIVE_CACHE_KEY,
        JSON.stringify(responsePayload),
        "EX",
        PACKAGE_TYPES_CACHE_TTL
    );

    return res.status(200).json({
        success: true,
        message: "Active package types fetched successfully",
        ...responsePayload,
    });
});