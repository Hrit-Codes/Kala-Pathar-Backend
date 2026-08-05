import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { HeroSection } from "../model/heroSection.model";
import { uploadMediaToCloud, deleteFromCloud } from "../helpers/cloudinaryUpload";
import { ImageResolver } from "../utils/imageResolver";
import { redisClient } from "../config/redis";

const MAX_HERO_SECTIONS = 8;
const HERO_CACHE_KEY = "hero:sections";
const HERO_ACTIVE_CACHE_KEY = "hero:active";
const HERO_CACHE_TTL = 5 * 60;

const invalidateHeroCache = async () => {
    await Promise.all([
        redisClient.del(HERO_CACHE_KEY),
        redisClient.del(HERO_ACTIVE_CACHE_KEY),
    ]);
};

const parseBoolean = (value: unknown, defaultValue: boolean = true): boolean => {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === "boolean") return value;
    return String(value).trim().toLowerCase() === "true";
};

const resolveOrderConflict = async (order: number, excludeId?: string | string[]) => {
    const conflictFilter: Record<string, unknown> = excludeId ? { _id: { $ne: excludeId } } : {};

    const conflictExists = await HeroSection.exists({ ...conflictFilter, order });
    if (!conflictExists) return;

    await HeroSection.updateMany(
        { ...conflictFilter, order: { $gte: order } },
        { $inc: { order: 1 } }
    );
};

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createHeroSection = asyncHandler(async (req: Request, res: Response) => {
    const existingCount = await HeroSection.countDocuments();
    if (existingCount >= MAX_HERO_SECTIONS) {
        throw new ApiError(
            409,
            `Maximum of ${MAX_HERO_SECTIONS} hero sections allowed. Delete one before creating a new one.`
        );
    }

    if (!req.file) {
        throw new ApiError(400, "Background media is required");
    }

    const {
        eyebrow, brandName, headingLine1, headingLine2,
        description, primaryButtonText, primaryButtonLink,
        secondaryButtonText, secondaryButtonLink,
        mediaType, textAlignment, overlayColor, overlayOpacity,
        isActive, order,
    } = req.body;

    const uploaded = await uploadMediaToCloud(req.file, "hero", mediaType);

    const requestedOrder = order !== undefined ? Number(order) : existingCount;
    await resolveOrderConflict(requestedOrder);

    const heroSection = await HeroSection.create({
        eyebrow:             eyebrow.trim(),
        brandName:           brandName.trim(),
        headingLine1:        headingLine1.trim(),
        headingLine2:        headingLine2.trim(),
        description:         description.trim(),
        primaryButtonText:   primaryButtonText.trim(),
        primaryButtonLink:   primaryButtonLink.trim(),
        secondaryButtonText: secondaryButtonText.trim(),
        secondaryButtonLink: secondaryButtonLink?.trim(),
        mediaType,
        mediaUrl:            uploaded.cloudinaryUrl || uploaded.localUrl,
        // ─── Fix #3: Fallback || "" for mediaPublicId ───────────────────────
        mediaPublicId:       uploaded.cloudinaryPublicId || "",
        mediaLocalPath:      uploaded.localPath,
        mediaLocalUrl:       uploaded.localUrl,
        textAlignment:       textAlignment ?? "left",
        overlayColor:        overlayColor ?? "#000000",
        overlayOpacity:      overlayOpacity !== undefined ? Number(overlayOpacity) : 40,
        // ─── Fix #4: Safe boolean parsing ─────────────────────────────────────
        isActive:            parseBoolean(isActive, true),
        order:               requestedOrder,
    });

    await invalidateHeroCache();

    const totalAfterCreate = await HeroSection.countDocuments();

    return res.status(201).json({
        success: true,
        message: "Hero section created successfully",
        data: heroSection,
        slotsRemaining: MAX_HERO_SECTIONS - totalAfterCreate,
    });
});

// ─── GET ALL (Admin) ──────────────────────────────────────────────────────────
export const getAllHeroSections = asyncHandler(async (req: Request, res: Response) => {
    const cached = await redisClient.get(HERO_CACHE_KEY);
    if (cached) {
        return res.status(200).json({
            success: true,
            message: "Hero sections fetched successfully",
            ...JSON.parse(cached),
        });
    }

    const heroSections = await HeroSection.find()
        .sort({ order: 1, createdAt: -1 })
        .select("-mediaPublicId -mediaLocalPath");

    const resolved = await Promise.all(
        heroSections.map(async (section) => {
            const data = section.toObject();
            return ImageResolver.prepare({
                ...data,
                mediaUrl: await ImageResolver.resolveSingle(data.mediaUrl, data.mediaLocalUrl),
            });
        })
    );

    const responsePayload = {
        data: resolved,
        total: resolved.length,
        isFull: resolved.length >= MAX_HERO_SECTIONS,
        slotsRemaining: MAX_HERO_SECTIONS - resolved.length,
    };

    await redisClient.set(HERO_CACHE_KEY, JSON.stringify(responsePayload), "EX", HERO_CACHE_TTL);

    return res.status(200).json({
        success: true,
        message: "Hero sections fetched successfully",
        ...responsePayload,
    });
});

// ─── GET ACTIVE (Public) ──────────────────────────────────────────────────────
export const getActiveHeroSections = asyncHandler(async (req: Request, res: Response) => {
    const cached = await redisClient.get(HERO_ACTIVE_CACHE_KEY);
    if (cached) {
        return res.status(200).json({
            success: true,
            message: "Active hero sections fetched successfully",
            ...JSON.parse(cached),
        });
    }

    const heroSections = await HeroSection.find({ isActive: true })
        .sort({ order: 1, createdAt: -1 })
        .select("-mediaPublicId -mediaLocalPath");

    const resolved = await Promise.all(
        heroSections.map(async (section) => {
            const data = section.toObject();
            return ImageResolver.prepare({
                ...data,
                mediaUrl: await ImageResolver.resolveSingle(data.mediaUrl, data.mediaLocalUrl),
            });
        })
    );

    const responsePayload = {
        data: resolved,
        total: resolved.length,
    };

    await redisClient.set(HERO_ACTIVE_CACHE_KEY, JSON.stringify(responsePayload), "EX", HERO_CACHE_TTL);

    return res.status(200).json({
        success: true,
        message: "Active hero sections fetched successfully",
        ...responsePayload,
    });
});

// ─── GET BY ID (Admin) ────────────────────────────────────────────────────────
export const getHeroSectionById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Id is required");

    const heroSection = await HeroSection.findById(id).select("-mediaPublicId -mediaLocalPath");
    if (!heroSection) throw new ApiError(404, "Hero section not found");

    const data = heroSection.toObject();

    return res.status(200).json({
        success: true,
        message: "Hero section fetched successfully",
        data: ImageResolver.prepare({
            ...data,
            mediaUrl: await ImageResolver.resolveSingle(data.mediaUrl, data.mediaLocalUrl),
        }),
    });
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateHeroSection = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Id is required");

    const existing = await HeroSection.findById(id);
    if (!existing) throw new ApiError(404, "Hero section not found");

    const {
        eyebrow, brandName, headingLine1, headingLine2,
        description, primaryButtonText, primaryButtonLink,
        secondaryButtonText, secondaryButtonLink,
        mediaType, textAlignment, overlayColor, overlayOpacity,
        isActive, order,
    } = req.body;

    const updateData: Record<string, unknown> = {};

    if (eyebrow !== undefined)             updateData.eyebrow             = eyebrow.trim();
    if (brandName !== undefined)           updateData.brandName           = brandName.trim();
    if (headingLine1 !== undefined)        updateData.headingLine1        = headingLine1.trim();
    if (headingLine2 !== undefined)        updateData.headingLine2        = headingLine2.trim();
    if (description !== undefined)         updateData.description         = description.trim();
    if (primaryButtonText !== undefined)   updateData.primaryButtonText   = primaryButtonText.trim();
    if (primaryButtonLink !== undefined)   updateData.primaryButtonLink   = primaryButtonLink.trim();
    if (secondaryButtonText !== undefined) updateData.secondaryButtonText = secondaryButtonText.trim();
    if (secondaryButtonLink !== undefined) updateData.secondaryButtonLink = secondaryButtonLink.trim();
    if (textAlignment !== undefined)       updateData.textAlignment       = textAlignment;
    if (overlayColor !== undefined)        updateData.overlayColor        = overlayColor;
    if (overlayOpacity !== undefined)      updateData.overlayOpacity      = Number(overlayOpacity);
    if (isActive !== undefined)            updateData.isActive            = parseBoolean(isActive, existing.isActive);

    if (order !== undefined) {
        const requestedOrder = Number(order);
        if (requestedOrder !== existing.order) {
            await resolveOrderConflict(requestedOrder, id);
        }
        updateData.order = requestedOrder;
    }

    if (req.file) {
        const newMediaType = mediaType ?? existing.mediaType;

        const uploaded = await uploadMediaToCloud(req.file, "hero", newMediaType);

        await deleteFromCloud(
            existing.mediaPublicId,
            existing.mediaLocalPath,
            existing.mediaType === "video" ? "video" : "image"
        );

        updateData.mediaType      = newMediaType;
        updateData.mediaUrl       = uploaded.cloudinaryUrl || uploaded.localUrl;
        updateData.mediaPublicId  = uploaded.cloudinaryPublicId || "";
        updateData.mediaLocalPath = uploaded.localPath;
        updateData.mediaLocalUrl  = uploaded.localUrl;
    }

    const updated = await HeroSection.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    }).select("-mediaPublicId -mediaLocalPath");

    await invalidateHeroCache();

    if (!updated) throw new ApiError(404, "Hero section not found");
    const data = updated.toObject();

    return res.status(200).json({
        success: true,
        message: "Hero section updated successfully",
        data: ImageResolver.prepare({
            ...data,
            mediaUrl: await ImageResolver.resolveSingle(data.mediaUrl, data.mediaLocalUrl),
        }),
    });
});

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteHeroSection = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Id is required");

    const existing = await HeroSection.findById(id);
    if (!existing) throw new ApiError(404, "Hero section not found");

    await deleteFromCloud(
        existing.mediaPublicId,
        existing.mediaLocalPath,
        existing.mediaType === "video" ? "video" : "image"
    );

    await HeroSection.findByIdAndDelete(id);
    await invalidateHeroCache();

    const remaining = await HeroSection.countDocuments();

    return res.status(200).json({
        success: true,
        message: "Hero section deleted successfully",
        data: {
            _id: existing._id,
            headingLine1: existing.headingLine1,
            deletedAt: new Date(),
        },
        slotsRemaining: MAX_HERO_SECTIONS - remaining,
    });
});

// ─── TOGGLE ACTIVE ───────────────────────────────────────────────────────────
export const toggleHeroSectionActive = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Id is required");

    const existing = await HeroSection.findById(id);
    if (!existing) throw new ApiError(404, "Hero section not found");

    const updated = await HeroSection.findByIdAndUpdate(
        id,
        { isActive: !existing.isActive },
        { new: true }
    );

    await invalidateHeroCache();

    return res.status(200).json({
        success: true,
        message: `Hero section ${updated?.isActive ? "activated" : "deactivated"} successfully`,
        data: {
            _id: existing._id,
            isActive: updated?.isActive,
        },
    });
});