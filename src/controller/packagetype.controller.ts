import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { PackageType } from "../model/packageTypeModel";

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
        themeColor: themeColor.trim(),
        description,
        hasDifficultyLevels,
        order,
        isActive
    });

    return res.status(201).json({
        success: true,
        message: "Package type created successfully",
        data: packageType,
    });
});

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

    return res.status(200).json({
        success: true,
        message: "Package type deleted successfully",
        data: {
            _id: packageType._id,
            name: packageType.name,
            deletedAt: new Date(),
        }
    });
});

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
            runValidators: true
        }
    );

    const statusMessage = updatedPackageType?.isActive ? "activated" : "deactivated";

    return res.status(200).json({
        success: true,
        message: `Package type ${statusMessage} successfully`,
        data: {
            _id: packageType._id,
            name: packageType.name,
            slug: updatedPackageType?.slug,
            isActive: updatedPackageType?.isActive,
        }
    });
});

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

    const updateData: any = {};

    if (name) {
        updateData.name = name.trim();
        updateData.slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }
    if (icon) updateData.icon = icon.trim();
    if (themeColor) updateData.themeColor = themeColor.trim();
    if (description) updateData.description = description.trim();
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

    return res.status(200).json({
        success: true,
        message: "Package type updated successfully",
        data: updatedPackageType
    });
});

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
        data: packageType
    });
});

export const getPackageTypes = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const [packageTypes, total] = await Promise.all([
        PackageType.find()
            .sort({ order: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit),
        PackageType.countDocuments()
    ]);

    return res.status(200).json({
        success: true,
        message: "Package types fetched successfully",
        data: packageTypes,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1
        }
    });
});