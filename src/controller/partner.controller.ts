import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { PartnerSection } from "../model/partner.model";
import { ApiError } from "../utils/apiError";
import { deleteFromCloud, uploadImageToCloud } from "../helpers/cloudinaryUpload";
import { ImageResolver } from "../utils/imageResolver";
import { redisClient } from "../config/redis";

const MAX_AFFILIATIONS = 5;
const PARTNER_CACHE_KEY = "partner:section";
const PARTNER_CACHE_TTL = 30 * 60;

// ─── CREATE PARTNER SECTION ───────────────────────────────────────────────────
export const createPartnerSection = asyncHandler(async (req: Request, res: Response) => {
    const existing = await PartnerSection.findOne();
    if (existing) {
        throw new ApiError(409, "Partner section already exists. Use update instead");
    }

    const { sectionTitle, sectionTagline, badges } = req.body;
    const parsedBadges = typeof badges === "string" ? JSON.parse(badges) : badges;

    if (!Array.isArray(parsedBadges) || parsedBadges.length < 2 || parsedBadges.length > 6) {
        throw new ApiError(400, "Between 2 and 6 badges are required");
    }

    const partnerSection = await PartnerSection.create({
        sectionTitle: sectionTitle.trim(),
        sectionTagline: sectionTagline.trim(),
        affiliations: [],
        badges: parsedBadges,
    });

    await redisClient.del(PARTNER_CACHE_KEY);

    return res.status(201).json({
        success: true,
        message: "Partner section created successfully",
        data: partnerSection,
    });
});

// ─── GET PARTNER SECTION ─────────────────────────────────────────────────────
export const getPartnerSection = asyncHandler(async (req: Request, res: Response) => {
    const cached = await redisClient.get(PARTNER_CACHE_KEY);

    if (cached) {
        return res.status(200).json({
            success: true,
            message: "Partner section fetched successfully",
            data: JSON.parse(cached),
        });
    }

    const partnerSection = await PartnerSection.findOne().select(
        "-affiliations.logoPublicId -affiliations.logoLocalPath"
    );

    if (!partnerSection) {
        throw new ApiError(404, "Partner section has not been set up yet");
    }

    const data = partnerSection.toObject();

    const resolved = ImageResolver.prepare({
        ...data,
        affiliations: await ImageResolver.resolveSubdocumentArray(
            data.affiliations,
            "logo",
            "logoLocalUrl"
        ),
    });

    await redisClient.set(
        PARTNER_CACHE_KEY,
        JSON.stringify(resolved),
        "EX",
        PARTNER_CACHE_TTL
    );

    return res.status(200).json({
        success: true,
        message: "Partner section fetched successfully",
        data: resolved,
    });
});

// ─── UPDATE PARTNER SECTION ───────────────────────────────────────────────────
export const updatePartnerSection = asyncHandler(async (req: Request, res: Response) => {
    const existing = await PartnerSection.findOne();
    if (!existing) {
        throw new ApiError(404, "Partner section has not been set up yet. Use create instead");
    }

    const { sectionTitle, sectionTagline, badges } = req.body;
    const updateData: Record<string, unknown> = {};

    if (sectionTitle !== undefined) updateData.sectionTitle = sectionTitle.trim();
    if (sectionTagline !== undefined) updateData.sectionTagline = sectionTagline.trim();

    if (badges !== undefined) {
        const parsedBadges = typeof badges === "string" ? JSON.parse(badges) : badges;
        if (!Array.isArray(parsedBadges) || parsedBadges.length < 2 || parsedBadges.length > 6) {
            throw new ApiError(400, "Between 2 and 6 badges are required");
        }
        updateData.badges = parsedBadges;
    }

    updateData.updatedAt = new Date();

    const updated = await PartnerSection.findByIdAndUpdate(
        existing._id,
        updateData,
        { new: true, runValidators: true }
    );

    await redisClient.del(PARTNER_CACHE_KEY);

    const data = updated?.toObject() ?? {};

    return res.status(200).json({
        success: true,
        message: "Partner section updated successfully",
        data: ImageResolver.prepare(data),
    });
});

// ─── ADD AFFILIATION ──────────────────────────────────────────────────────────
export const addAffiliation = asyncHandler(async (req: Request, res: Response) => {
    const existing = await PartnerSection.findOne();
    if (!existing) {
        throw new ApiError(404, "Partner section has not been set up yet. Create the section first.");
    }

    if (existing.affiliations.length >= MAX_AFFILIATIONS) {
        throw new ApiError(
            409,
            `Maximum of ${MAX_AFFILIATIONS} affiliation entries allowed. Delete one before adding a new one.`
        );
    }

    if (!req.file) {
        throw new ApiError(400, "Affiliation logo is required");
    }

    const { abbreviation, name, order } = req.body;

    const uploadedLogo = await uploadImageToCloud(req.file, "affiliations");

    const newAffiliation = {
        abbreviation: abbreviation.trim(),
        name: name.trim(),
        logo: uploadedLogo.cloudinaryUrl || uploadedLogo.localUrl,
        logoPublicId: uploadedLogo.cloudinaryPublicId || "",
        logoLocalPath: uploadedLogo.localPath,
        logoLocalUrl: uploadedLogo.localUrl,
        order: order !== undefined ? Number(order) : existing.affiliations.length,
    };

    const updated = await PartnerSection.findByIdAndUpdate(
        existing._id,
        { $push: { affiliations: newAffiliation } },
        { new: true, runValidators: true }
    );

    await redisClient.del(PARTNER_CACHE_KEY);

    const addedItem = updated?.affiliations[updated.affiliations.length - 1];

    return res.status(201).json({
        success: true,
        message: `Affiliation added successfully. ${updated?.affiliations.length}/${MAX_AFFILIATIONS} slots filled.`,
        data: ImageResolver.prepare(addedItem ? (addedItem as any).toObject() : {}),
        slotsRemaining: MAX_AFFILIATIONS - (updated?.affiliations.length ?? 0),
    });
});

// ─── UPDATE AFFILIATION ───────────────────────────────────────────────────────
export const updateAffiliation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Affiliation id is required");

    const existing = await PartnerSection.findOne({ "affiliations._id": id });
    if (!existing) throw new ApiError(404, "Affiliation item not found");

    const { abbreviation, name, order } = req.body;
    const affiliationUpdate: Record<string, unknown> = {};

    if (abbreviation !== undefined) affiliationUpdate["affiliations.$.abbreviation"] = abbreviation.trim();
    if (name !== undefined) affiliationUpdate["affiliations.$.name"] = name.trim();
    if (order !== undefined) affiliationUpdate["affiliations.$.order"] = Number(order);

    if (req.file) {
        const uploadedLogo = await uploadImageToCloud(req.file, "affiliations");

        affiliationUpdate["affiliations.$.logo"] = uploadedLogo.cloudinaryUrl || uploadedLogo.localUrl;
        affiliationUpdate["affiliations.$.logoPublicId"] = uploadedLogo.cloudinaryPublicId || "";
        affiliationUpdate["affiliations.$.logoLocalPath"] = uploadedLogo.localPath;
        affiliationUpdate["affiliations.$.logoLocalUrl"] = uploadedLogo.localUrl;

        const currentAffiliation = existing.affiliations.find(
            (a) => a._id?.toString() === id
        );

        if (currentAffiliation) {
            await deleteFromCloud(
                currentAffiliation.logoPublicId,
                currentAffiliation.logoLocalPath,
                "image"
            );
        }
    }

    const updated = await PartnerSection.findOneAndUpdate(
        { "affiliations._id": id },
        { $set: affiliationUpdate },
        { new: true, runValidators: true }
    );

    await redisClient.del(PARTNER_CACHE_KEY);

    const updatedAffiliation = updated?.affiliations.find(
        (a) => a._id?.toString() === id
    );

    return res.status(200).json({
        success: true,
        message: "Affiliation updated successfully",
        data: ImageResolver.prepare(updatedAffiliation ? (updatedAffiliation as any).toObject() : {}),
    });
});

// ─── DELETE AFFILIATION ───────────────────────────────────────────────────────
export const deleteAffiliation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Affiliation ID is required");

    const existing = await PartnerSection.findOne({ "affiliations._id": id });
    if (!existing) throw new ApiError(404, "Affiliation item not found");

    const targetAffiliation = existing.affiliations.find(
        (a) => a._id?.toString() === id
    );

    if (!targetAffiliation) throw new ApiError(404, "Affiliation item not found");

    await deleteFromCloud(
        targetAffiliation.logoPublicId,
        targetAffiliation.logoLocalPath,
        "image"
    );

    const updated = await PartnerSection.findByIdAndUpdate(
        existing._id,
        { $pull: { affiliations: { _id: id } } },
        { new: true }
    );

    await redisClient.del(PARTNER_CACHE_KEY);

    return res.status(200).json({
        success: true,
        message: "Affiliation deleted successfully",
        data: {
            deletedId: id,
            remainingAffiliations: updated?.affiliations.length,
            slotsRemaining: MAX_AFFILIATIONS - (updated?.affiliations.length ?? 0),
        },
    });
});