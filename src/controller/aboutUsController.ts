import type { Request, Response } from "express";
import { AboutUs } from "../model/aboutUs.model";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { deleteFromCloud, uploadImageToCloud } from "../helpers/cloudinaryUpload";

export const createAboutUs = asyncHandler(async (req: Request, res: Response) => {
    const existing = await AboutUs.findOne();
    if (existing) {
        throw new ApiError(409, "About us content already exists. Use update instead.");
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const heroImageFile = files?.heroImage?.[0];
    const ceoPhotoFile = files?.ceoPhoto?.[0];

    if (!heroImageFile) {
        throw new ApiError(400, "Hero image is required");
    }

    const { heading, tagline, description, ceoQuote, stats } = req.body;

    const parsedCeoQuote = typeof ceoQuote === "string" ? JSON.parse(ceoQuote) : ceoQuote;
    const parsedStats = typeof stats === "string" ? JSON.parse(stats) : stats;

    if (!Array.isArray(parsedStats) || parsedStats.length !== 4) {
        throw new ApiError(400, "Exactly 4 stats must be provided");
    }

    const uploadedHeroImage = await uploadImageToCloud(heroImageFile, "about-us");

    let ceoPhotoUrl: string | undefined;
    let ceoPhotoPublicId: string | undefined;

    if (ceoPhotoFile) {
        const uploadedCeoPhoto = await uploadImageToCloud(ceoPhotoFile, "about-us");
        ceoPhotoUrl = uploadedCeoPhoto.url;
        ceoPhotoPublicId = uploadedCeoPhoto.publicId;
    }

    const aboutUs = await AboutUs.create({
        heading: heading.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        heroImage: uploadedHeroImage.url,
        heroImagePublicId: uploadedHeroImage.publicId,
        ceoQuote: {
            ...parsedCeoQuote,
            ceoPhoto: ceoPhotoUrl,
            ceoPhotoPublicId,
        },
        stats: parsedStats,
    });

    return res.status(201).json({
        success: true,
        message: "About us content created successfully",
        data: aboutUs,
    });
});

export const getAboutUs = asyncHandler(async (req: Request, res: Response) => {
    const aboutUs = await AboutUs.findOne();

    if (!aboutUs) {
        throw new ApiError(404, "About us content has not been set up yet");
    }

    return res.status(200).json({
        success: true,
        message: "About us content fetched successfully",
        data: aboutUs,
    });
});

export const updateAboutUs = asyncHandler(async (req: Request, res: Response) => {
    const existing = await AboutUs.findOne();

    if (!existing) {
        throw new ApiError(404, "About us content has not been set up yet. Use create instead.");
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const heroImageFile = files?.heroImage?.[0];
    const ceoPhotoFile = files?.ceoPhoto?.[0];

    const { heading, tagline, description, ceoQuote, stats } = req.body;

    const updateData: any = {};

    if (heading) updateData.heading = heading.trim();
    if (tagline) updateData.tagline = tagline.trim();
    if (description) updateData.description = description.trim();

    if (ceoQuote !== undefined) {
        const parsedCeoQuote = typeof ceoQuote === "string" ? JSON.parse(ceoQuote) : ceoQuote;
        updateData.ceoQuote = { ...existing.ceoQuote, ...parsedCeoQuote };
    }

    if (stats !== undefined) {
        const parsedStats = typeof stats === "string" ? JSON.parse(stats) : stats;

        if (!Array.isArray(parsedStats) || parsedStats.length !== 4) {
            throw new ApiError(400, "Exactly 4 stats must be provided");
        }

        updateData.stats = parsedStats;
    }

    if (heroImageFile) {
        const uploadedHeroImage = await uploadImageToCloud(heroImageFile, "about-us");
        updateData.heroImage = uploadedHeroImage.url;
        updateData.heroImagePublicId = uploadedHeroImage.publicId;

        if (existing.heroImagePublicId) {
            await deleteFromCloud(existing.heroImagePublicId, "image");
        }
    }

    if (ceoPhotoFile) {
        const uploadedCeoPhoto = await uploadImageToCloud(ceoPhotoFile, "about-us");

        updateData.ceoQuote = {
            ...(updateData.ceoQuote || existing.ceoQuote),
            ceoPhoto: uploadedCeoPhoto.url,
            ceoPhotoPublicId: uploadedCeoPhoto.publicId,
        };

        if (existing.ceoQuote?.ceoPhotoPublicId) {
            await deleteFromCloud(existing.ceoQuote.ceoPhotoPublicId, "image");
        }
    }

    updateData.updatedAt = new Date();

    const updatedAboutUs = await AboutUs.findByIdAndUpdate(
        existing._id,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );

    return res.status(200).json({
        success: true,
        message: "About us content updated successfully",
        data: updatedAboutUs,
    });
});