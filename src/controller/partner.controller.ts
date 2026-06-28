import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { PartnerSection } from "../model/partner.model";
import { ApiError } from "../utils/apiError";
import { deleteFromCloud, uploadImageToCloud } from "../helpers/cloudinaryUpload";
import { ImageResolver } from "../utils/imageResolver";

const MAX_AFFILIATIONS = 5;

export const createPartnerSection = asyncHandler(async (req: Request, res: Response) => {
    const existing = await PartnerSection.findOne();
    if (existing) {
        throw new ApiError(409, "Partner section already exists. Use update instead");
    }

    const { sectionTitle, sectionTagline, badges } = req.body;
    const parsedBadges = typeof badges === "string" ? JSON.parse(badges) : badges ?? [];

    const partnerSection = await PartnerSection.create({
        sectionTitle: sectionTitle.trim(),
        sectionTagline: sectionTagline.trim(),
        affiliations: [],
        badges: parsedBadges,
    });

    return res.status(201).json({
        success: true,
        message: "Partner section created successfully",
        data: partnerSection,
    });
});

export const getPartnerSection = asyncHandler(async (req: Request, res: Response) => {
    const partnerSection = await PartnerSection.findOne().select(
        "-affiliations.logoPublicId -affiliations.logoLocalPath"
    );

    if (!partnerSection) {
        throw new ApiError(404, "Partner section has not been set up yet");
    }

    const data = partnerSection.toObject();

    return res.status(200).json({
        success: true,
        message: "Partner section fetched successfully",
        data: ImageResolver.prepare({
            ...data,
            affiliations: await ImageResolver.resolveSubdocumentArray(
                data.affiliations,
                "logo",
                "logoLocalUrl"
            ),
        }),
    });
});

export const updatePartnerSection = asyncHandler(async (req: Request, res: Response) => {
    const existing = await PartnerSection.findOne();
    if (!existing) {
        throw new ApiError(404, "Partner section has not been set up yet. Use create instead");
    }

    const { sectionTitle, sectionTagline, badges } = req.body;
    const updateData: any = {};

    if (sectionTitle) updateData.sectionTitle = sectionTitle.trim();
    if (sectionTagline) updateData.sectionTagline = sectionTagline.trim();

    if (badges !== undefined) {
        const parsedBadges = typeof badges === "string" ? JSON.parse(badges) : badges;
        if (!Array.isArray(parsedBadges)) {
            throw new ApiError(400, "Badges must be an array of strings");
        }
        updateData.badges = parsedBadges;
    }

    updateData.updatedAt = new Date();

    const updated = await PartnerSection.findByIdAndUpdate(
        existing._id,
        updateData,
        { new: true, runValidators: true }
    );

    const data = updated?.toObject() ?? {};

    return res.status(200).json({
        success: true,
        message: "Partner section updated successfully",
        data: ImageResolver.prepare(data),
    });
});

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
        logoPublicId: uploadedLogo.cloudinaryPublicId,
        logoLocalPath: uploadedLogo.localPath,
        logoLocalUrl: uploadedLogo.localUrl,
        order: order ?? existing.affiliations.length,
    };

    const updated = await PartnerSection.findByIdAndUpdate(
        existing._id,
        { $push: { affiliations: newAffiliation } },
        { new: true, runValidators: true }
    );

    const addedItem = updated?.affiliations[updated.affiliations.length - 1];

    return res.status(201).json({
        success: true,
        message: `Affiliation added successfully. ${updated?.affiliations.length}/${MAX_AFFILIATIONS} slots filled.`,
        data: ImageResolver.prepare(addedItem ? (addedItem as any).toObject() : {}),
        slotsRemaining: MAX_AFFILIATIONS - (updated?.affiliations.length ?? 0),
    });
});

export const updateAffiliation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Affiliation id is required");

    const existing = await PartnerSection.findOne({ "affiliations._id": id });
    if (!existing) throw new ApiError(404, "Affiliation item not found");

    const { abbreviation, name, order } = req.body;
    const affiliationUpdate: any = {};

    if (abbreviation) affiliationUpdate["affiliations.$.abbreviation"] = abbreviation.trim();
    if (name) affiliationUpdate["affiliations.$.name"] = name.trim();
    if (order !== undefined) affiliationUpdate["affiliations.$.order"] = order;

    if (req.file) {
        const uploadedLogo = await uploadImageToCloud(req.file, "affiliations");

        affiliationUpdate["affiliations.$.logo"] = uploadedLogo.cloudinaryUrl || uploadedLogo.localUrl;
        affiliationUpdate["affiliations.$.logoPublicId"] = uploadedLogo.cloudinaryPublicId;
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

    const updatedAffiliation = updated?.affiliations.find(
        (a) => a._id?.toString() === id
    );

    return res.status(200).json({
        success: true,
        message: "Affiliation updated successfully",
        data: ImageResolver.prepare(updatedAffiliation ? (updatedAffiliation as any).toObject() : {}),
    });
});

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