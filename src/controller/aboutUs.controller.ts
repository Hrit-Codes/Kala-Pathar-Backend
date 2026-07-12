import type { Request, Response } from "express";
import { AboutUs, type IStat } from "../model/aboutUs.model";
import { asyncHandler } from "../utils/asyncHandler";
import { deleteFromCloud, uploadImageToCloud } from "../helpers/cloudinaryUpload";
import { ApiError } from "../utils/apiError";
import { redisClient } from "../config/redis";
import { ImageResolver } from "../utils/imageResolver";

const ABOUT_US_CACHE_KEY="aboutus:all";
const ABOUT_US_CACHE_TTL=30*60;

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
    let ceoPhotoLocalPath: string | undefined;
    let ceoPhotoLocalUrl: string | undefined;

    if (ceoPhotoFile) {
        const uploadedCeoPhoto = await uploadImageToCloud(ceoPhotoFile, "about-us");
        ceoPhotoUrl = uploadedCeoPhoto.cloudinaryUrl || uploadedCeoPhoto.localUrl;
        ceoPhotoPublicId = uploadedCeoPhoto.cloudinaryPublicId;
        ceoPhotoLocalPath = uploadedCeoPhoto.localPath;
        ceoPhotoLocalUrl = uploadedCeoPhoto.localUrl;
    }

    const aboutUs = await AboutUs.create({
        heading: heading.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        heroImage: uploadedHeroImage.cloudinaryUrl || uploadedHeroImage.localUrl,
        heroImagePublicId: uploadedHeroImage.cloudinaryPublicId,
        heroImageLocalPath: uploadedHeroImage.localPath,
        heroImageLocalUrl: uploadedHeroImage.localUrl,
        ceoQuote: {
            ...parsedCeoQuote,
            ceoPhoto: ceoPhotoUrl,
            ceoPhotoPublicId,
            ceoPhotoLocalPath,
            ceoPhotoLocalUrl,
        },
        stats: parsedStats,
    });

    await redisClient.del(ABOUT_US_CACHE_KEY);

    return res.status(201).json({
        success: true,
        message: "About us content created successfully",
        data: aboutUs,
    });
});

export const getAboutUs = asyncHandler(async (req: Request, res: Response) => {
    const cached= await redisClient.get(ABOUT_US_CACHE_KEY);
    if(cached){
        return res.status(200).json({
            success:true,
            message:"About us content fetched successfully",
            data:JSON.parse(cached)
        })
    }
    const aboutUs = await AboutUs.findOne().select(
        "-heroImagePublicId -heroImageLocalPath -ceoQuote.ceoPhotoPublicId -ceoQuote.ceoPhotoLocalPath"
    );

    if (!aboutUs) {
        throw new ApiError(404, "About us content has not been set up yet");
    }

    const data=aboutUs.toObject();

    const responseData={
        ...data,
        heroImage:await ImageResolver.resolveSingle(data.heroImage, data.heroImageLocalUrl),
        ceoQuote:await ImageResolver.resolveSubdocument(
            data.ceoQuote,
            "ceoPhoto",
            "ceoPhotoLocalUrl"
        )
    }

    await redisClient.set(
        ABOUT_US_CACHE_KEY,
        JSON.stringify(responseData),
        "EX",
        ABOUT_US_CACHE_TTL
    )

    return res.status(200).json({
        success: true,
        message: "About us content fetched successfully",
        data: responseData
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
        const existingCeoQuote = existing.ceoQuote
            ? JSON.parse(JSON.stringify(existing.ceoQuote))
            : {};
        updateData.ceoQuote = { ...existingCeoQuote, ...parsedCeoQuote };
    }

    if (stats !== undefined) {
        const parsedStats = typeof stats === "string" ? JSON.parse(stats) : stats;

        if (!Array.isArray(parsedStats)) {
            throw new ApiError(400, "Stats must be an array");
        }

        if (parsedStats.length !== 4) {
            throw new ApiError(400, "Exactly 4 stats must be provided");
        }

        parsedStats.forEach((stat:IStat)=>{
            if(!stat.label || !stat.value){
                throw new ApiError(400,"Each stat must have both label and value");
            }
            if(typeof stat.label!=="string" || typeof stat.value!== "string"){
                throw new ApiError(400,"Stat label and value must be string");
            }
        })

        updateData.stats = parsedStats;
    }

    if (heroImageFile) {
        const uploadedHeroImage = await uploadImageToCloud(heroImageFile, "about-us");

        updateData.heroImage = uploadedHeroImage.cloudinaryUrl || uploadedHeroImage.localUrl;
        updateData.heroImagePublicId = uploadedHeroImage.cloudinaryPublicId;
        updateData.heroImageLocalPath = uploadedHeroImage.localPath;
        updateData.heroImageLocalUrl = uploadedHeroImage.localUrl;

        await deleteFromCloud(
            existing.heroImagePublicId,
            existing.heroImageLocalPath,
            "image"
        );
    }

    if (ceoPhotoFile) {
        const uploadedCeoPhoto = await uploadImageToCloud(ceoPhotoFile, "about-us");
        const baseCeoQuote = updateData.ceoQuote
            ?? (existing.ceoQuote ? JSON.parse(JSON.stringify(existing.ceoQuote)) : {});

        updateData.ceoQuote = {
            ...baseCeoQuote,
            ceoPhoto: uploadedCeoPhoto.cloudinaryUrl || uploadedCeoPhoto.localUrl,
            ceoPhotoPublicId: uploadedCeoPhoto.cloudinaryPublicId,
            ceoPhotoLocalPath: uploadedCeoPhoto.localPath,
            ceoPhotoLocalUrl: uploadedCeoPhoto.localUrl,
        };

        if (existing.ceoQuote?.ceoPhotoPublicId) {
            await deleteFromCloud(
                existing.ceoQuote.ceoPhotoPublicId,
                existing.ceoQuote.ceoPhotoLocalPath ?? "",
                "image"
            );
        }
    }

    updateData.updatedAt = new Date();

    const updatedAboutUs = await AboutUs.findByIdAndUpdate(
        existing._id,
        updateData,
        { returnDocument: "after", runValidators: true }
    ).select(
        "-heroImagePublicId -heroImageLocalPath -ceoQuote.ceoPhotoPublicId -ceoQuote.ceoPhotoLocalPath"
    );

    await redisClient.del(ABOUT_US_CACHE_KEY);

    return res.status(200).json({
        success: true,
        message: "About us content updated successfully",
        data: updatedAboutUs,
    });
});