import type { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadImageToCloud, deleteFromCloud } from "../helpers/cloudinaryUpload";
import {
    guardFeaturedIncrease,
    guardFeaturedDecrease,
    getFeaturedCount,
    FEATURED_MIN,
    FEATURED_MAX,
} from "../utils/featuredPackageGuard";
import { TravelPackage } from "../model/package.model";

const parse = (field: any) =>
    typeof field === "string" ? JSON.parse(field) : field ?? [];

const parseOptional = (field: any) =>
    field === undefined ? undefined
        : typeof field === "string" ? JSON.parse(field)
            : field;

export const createTravelPackage = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const thumbnailFile = files?.thumbnail?.[0];
    const galleryFiles = files?.gallery ?? [];

    if (!thumbnailFile) throw new ApiError(400, "Thumbnail image is required");

    const {
        title, badge, overviewTitle, description,
        price, currency, priceLabel,
        durationDays, maxAltitude, difficulty, groupSize,
        highlights, inclusions, exclusions,
        itinerary, supportContacts, termsAndConditions, faqSection,
        packageType, destination,
        isFeatured, isActive,
    } = req.body;

    const slug = title.trim().toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    const existingPackage = await TravelPackage.findOne({ slug });
    if (existingPackage) throw new ApiError(409, "A package with this title already exists");

    const willBeFeatured = isFeatured !== undefined ? JSON.parse(isFeatured) : false;
    if (willBeFeatured) await guardFeaturedIncrease();

    const uploadedThumbnail = await uploadImageToCloud(thumbnailFile, "packages/thumbnails");
    const uploadedGallery = await Promise.all(
        galleryFiles.map((file: Express.Multer.File) =>
            uploadImageToCloud(file, `packages/gallery/${slug}`)
        )
    );

    const travelPackage = await TravelPackage.create({
        title: title.trim(),
        slug,
        badge: badge?.trim(),
        overviewTitle: overviewTitle?.trim(),
        description: description.trim(),
        thumbnail: uploadedThumbnail.url,
        thumbnailPublicId: uploadedThumbnail.publicId,
        gallery: uploadedGallery.map((g) => g.url),
        galleryPublicIds: uploadedGallery.map((g) => g.publicId),
        price: Number(price),
        currency: currency ?? "Rs",
        priceLabel: priceLabel ?? "per person",
        durationDays: Number(durationDays),
        maxAltitude: maxAltitude?.trim(),
        difficulty,
        groupSize: groupSize ? Number(groupSize) : undefined,
        highlights: parse(highlights),
        inclusions: parse(inclusions),
        exclusions: parse(exclusions),
        itinerary: parse(itinerary),
        supportContacts: parse(supportContacts),
        termsAndConditions: parse(termsAndConditions),
        faqSection: parseOptional(faqSection),
        packageType,
        destination,
        isFeatured: willBeFeatured,
        isActive: isActive !== undefined ? JSON.parse(isActive) : true,
    });

    return res.status(201).json({
        success: true,
        message: "Travel package created successfully",
        data: travelPackage,
    });
});

export const updateTravelPackage = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
    if (!id) throw new ApiError(400, "Id is required");

    const existingPackage = await TravelPackage.findById(id);
    if (!existingPackage) throw new ApiError(404, "Travel package not found");

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const thumbnailFile = files?.thumbnail?.[0];
    const galleryFiles = files?.gallery ?? [];

    const {
        title, badge, overviewTitle, description,
        price, currency, priceLabel,
        durationDays, maxAltitude, difficulty, groupSize,
        highlights, inclusions, exclusions,
        itinerary, supportContacts, termsAndConditions, faqSection,
        packageType, destination,
        isFeatured, isActive,
    } = req.body;

    const updateData: any = {};

    if (title) {
        updateData.title = title.trim();
        updateData.slug = title.trim().toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        const slugConflict = await TravelPackage.findOne({
            slug: updateData.slug,
            _id: { $ne: id },
        });
        if (slugConflict) throw new ApiError(409, "A package with this title already exists");
    }

    if (badge !== undefined) updateData.badge = badge.trim();
    if (overviewTitle !== undefined) updateData.overviewTitle = overviewTitle.trim();
    if (description) updateData.description = description.trim();
    if (price !== undefined) updateData.price = Number(price);
    if (currency) updateData.currency = currency;
    if (priceLabel) updateData.priceLabel = priceLabel;
    if (durationDays !== undefined) updateData.durationDays = Number(durationDays);
    if (maxAltitude !== undefined) updateData.maxAltitude = maxAltitude.trim();
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (groupSize !== undefined) updateData.groupSize = Number(groupSize);
    if (highlights !== undefined) updateData.highlights = parse(highlights);
    if (inclusions !== undefined) updateData.inclusions = parse(inclusions);
    if (exclusions !== undefined) updateData.exclusions = parse(exclusions);
    if (itinerary !== undefined) updateData.itinerary = parse(itinerary);
    if (supportContacts !== undefined) updateData.supportContacts = parse(supportContacts);
    if (termsAndConditions !== undefined) updateData.termsAndConditions = parse(termsAndConditions);
    if (faqSection !== undefined) updateData.faqSection = parseOptional(faqSection);
    if (packageType) updateData.packageType = packageType;
    if (destination) updateData.destination = destination;
    if (isActive !== undefined) updateData.isActive = JSON.parse(isActive);

    if (isFeatured !== undefined) {
        const newValue = JSON.parse(isFeatured as string);
        const currentValue = existingPackage.isFeatured;

        if (newValue === true && currentValue === false) await guardFeaturedIncrease(id);
        if (newValue === false && currentValue === true) await guardFeaturedDecrease(id);

        updateData.isFeatured = newValue;
    }

    if (thumbnailFile) {
        const uploadedThumbnail = await uploadImageToCloud(thumbnailFile, "packages/thumbnails");
        updateData.thumbnail = uploadedThumbnail.url;
        updateData.thumbnailPublicId = uploadedThumbnail.publicId;
        if (existingPackage.thumbnailPublicId) {
            await deleteFromCloud(existingPackage.thumbnailPublicId, "image");
        }
    }

    if (galleryFiles.length > 0) {
        if (existingPackage.galleryPublicIds?.length) {
            await Promise.all(
                existingPackage.galleryPublicIds.map((pid) => deleteFromCloud(pid, "image"))
            );
        }
        const uploadedGallery = await Promise.all(
            galleryFiles.map((file: Express.Multer.File) =>
                uploadImageToCloud(file, "packages/gallery")
            )
        );
        updateData.gallery = uploadedGallery.map((g) => g.url);
        updateData.galleryPublicIds = uploadedGallery.map((g) => g.publicId);
    }

    updateData.updatedAt = new Date();

    const updated = await TravelPackage.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });

    return res.status(200).json({
        success: true,
        message: "Travel package updated successfully",
        data: updated,
    });
});

export const deleteTravelPackage = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
    if (!id) throw new ApiError(400, "Id is required");

    const travelPackage = await TravelPackage.findById(id);
    if (!travelPackage) throw new ApiError(404, "Travel package not found");

    if (travelPackage.isFeatured) {
        await guardFeaturedDecrease(id);
    }

    if (travelPackage.thumbnailPublicId) {
        await deleteFromCloud(travelPackage.thumbnailPublicId, "image");
    }

    if (travelPackage.galleryPublicIds?.length) {
        await Promise.all(
            travelPackage.galleryPublicIds.map((pid) => deleteFromCloud(pid, "image"))
        );
    }

    await TravelPackage.findByIdAndDelete(id);

    return res.status(200).json({
        success: true,
        message: "Travel package deleted successfully",
        data: {
            _id: travelPackage._id,
            title: travelPackage.title,
            deletedAt: new Date(),
        },
    });
});

export const toggleFeaturedStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string> ;
    if (!id) throw new ApiError(400, "Id is required");

    const travelPackage = await TravelPackage.findById(id);
    if (!travelPackage) throw new ApiError(404, "Travel package not found");

    if (!travelPackage.isFeatured) {
        await guardFeaturedIncrease(id);
    } else {
        await guardFeaturedDecrease(id);
    }

    const updated = await TravelPackage.findByIdAndUpdate(
        id,
        { isFeatured: !travelPackage.isFeatured },
        { new: true }
    );

    const featuredCount = await getFeaturedCount();

    return res.status(200).json({
        success: true,
        message: `Package ${updated?.isFeatured ? "featured" : "unfeatured"} successfully`,
        data: {
            _id: travelPackage._id,
            title: travelPackage.title,
            isFeatured: updated?.isFeatured,
        },
        featuredCount,
        featuredMin: FEATURED_MIN,
        featuredMax: FEATURED_MAX,
        slotsRemaining: FEATURED_MAX - featuredCount,
    });
});

export const toggleActiveStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Id is required");

    const travelPackage = await TravelPackage.findById(id);
    if (!travelPackage) throw new ApiError(404, "Travel package not found");

    const updated = await TravelPackage.findByIdAndUpdate(
        id,
        { isActive: !travelPackage.isActive },
        { new: true }
    );

    return res.status(200).json({
        success: true,
        message: `Package ${updated?.isActive ? "activated" : "deactivated"} successfully`,
        data: {
            _id: travelPackage._id,
            title: travelPackage.title,
            isActive: updated?.isActive,
        },
    });
});

export const getTravelPackageBySlug = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    if (!slug) throw new ApiError(400, "Slug is required");

    const travelPackage = await TravelPackage.findOneAndUpdate(
        { slug, isActive: true },
        { $inc: { views: 1 } },
        { new: true }
    )
        .populate("packageType", "name slug icon themeColor hasDifficultyLevels")
        .populate("destination", "name slug");

    if (!travelPackage) throw new ApiError(404, "Travel package not found");

    return res.status(200).json({
        success: true,
        message: "Travel package fetched successfully",
        data: travelPackage,
    });
});

export const getAllActiveTravelPackages = asyncHandler(async (req: Request, res: Response) => {
    const {
        packageType, destination, difficulty,
        minPrice, maxPrice, minDays, maxDays,
        isFeatured, search, page, limit,
        sortBy, sortOrder,
    } = req.query as Record<string, string | undefined>;

    const filter: Record<string, any> = { isActive: true };

    if (packageType) filter.packageType = packageType;
    if (destination) filter.destination = destination;
    if (difficulty) filter.difficulty = difficulty;
    if (isFeatured !== undefined) filter.isFeatured = JSON.parse(isFeatured as string);

    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (minDays || maxDays) {
        filter.durationDays = {};
        if (minDays) filter.durationDays.$gte = Number(minDays);
        if (maxDays) filter.durationDays.$lte = Number(maxDays);
    }

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sortField = (sortBy as string) || "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const [packages, total, featuredCount] = await Promise.all([
        TravelPackage.find(filter)
            .populate("packageType", "name slug icon themeColor")
            .populate("destination", "name slug")
            .sort({ [sortField]: sortDirection })
            .skip(skip)
            .limit(limitNum)
            .select("-galleryPublicIds -thumbnailPublicId"),
        TravelPackage.countDocuments(filter),
        TravelPackage.countDocuments({ isFeatured: true }),
    ]);

    return res.status(200).json({
        success: true,
        message: "Travel packages fetched successfully",
        data: packages,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            hasNextPage: pageNum * limitNum < total,
            hasPrevPage: pageNum > 1,
        },
        featuredCount,
        featuredMin: FEATURED_MIN,
        featuredMax: FEATURED_MAX,
        slotsRemaining: FEATURED_MAX - featuredCount,
    });
});

export const getAllTravelPackages = asyncHandler(async (req: Request, res: Response) => {
    const {
        packageType, destination, difficulty,
        minPrice, maxPrice, minDays, maxDays,
        isFeatured, search, page, limit,
        sortBy, sortOrder,
    } = req.query as Record<string, string | undefined>;

    const filter: Record<string, any> ={} ;

    if (packageType) filter.packageType = packageType;
    if (destination) filter.destination = destination;
    if (difficulty) filter.difficulty = difficulty;
    if (isFeatured !== undefined) filter.isFeatured = JSON.parse(isFeatured as string);

    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (minDays || maxDays) {
        filter.durationDays = {};
        if (minDays) filter.durationDays.$gte = Number(minDays);
        if (maxDays) filter.durationDays.$lte = Number(maxDays);
    }

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sortField = (sortBy as string) || "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const [packages, total, featuredCount] = await Promise.all([
        TravelPackage.find(filter)
            .populate("packageType", "name slug icon themeColor")
            .populate("destination", "name slug")
            .sort({ [sortField]: sortDirection })
            .skip(skip)
            .limit(limitNum)
            .select("-galleryPublicIds -thumbnailPublicId"),
        TravelPackage.countDocuments(filter),
        TravelPackage.countDocuments({ isFeatured: true }),
    ]);

    return res.status(200).json({
        success: true,
        message: "Travel packages fetched successfully",
        data: packages,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            hasNextPage: pageNum * limitNum < total,
            hasPrevPage: pageNum > 1,
        },
        featuredCount,
        featuredMin: FEATURED_MIN,
        featuredMax: FEATURED_MAX,
        slotsRemaining: FEATURED_MAX - featuredCount,
    });
});