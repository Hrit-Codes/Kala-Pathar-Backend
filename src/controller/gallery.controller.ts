import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { Gallery } from "../model/gallery.model";
import { ApiError } from "../utils/apiError";
import { deleteFromCloud, uploadImageToCloud } from "../helpers/cloudinaryUpload";
import { resolveImageUrl } from "../utils/resolveImageUrl";
import { ImageResolver } from "../utils/imageResolver";

const GALLERY_COUNT = 4;

export const createGallery = asyncHandler(async (req: Request, res: Response) => {
    const existingCount = await Gallery.countDocuments();

    if (existingCount >= GALLERY_COUNT) {
        throw new ApiError(
            409,
            `Exactly ${GALLERY_COUNT} gallery items must exist. Delete one before creating a new one.`
        );
    }

    if (!req.file) {
        throw new ApiError(400, "Gallery image is required");
    }

    const { subtitle, title, description, order } = req.body;

    const uploadedImage = await uploadImageToCloud(req.file, "gallery");

    const gallery = await Gallery.create({
        subtitle: subtitle.trim(),
        title: title.trim(),
        description: description.trim(),
        image: uploadedImage.cloudinaryUrl || uploadedImage.localUrl,
        imagePublicId: uploadedImage.cloudinaryPublicId,
        imageLocalPath: uploadedImage.localPath,
        imageLocalUrl: uploadedImage.localUrl,
        order,
    });

    const totalAfterCreate = await Gallery.countDocuments();

    return res.status(201).json({
        success: true,
        message: `Gallery item created successfully. ${totalAfterCreate}/${GALLERY_COUNT} slots filled.`,
        data: gallery,
        slotsRemaining: GALLERY_COUNT - totalAfterCreate,
    });
});

export const updateGallery = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Id is required");

    const existingGallery = await Gallery.findById(id).select("-imagePublicId -imageLocalPath -imageLocalUrl");
    if (!existingGallery) throw new ApiError(404, "Gallery item not found");

    const { subtitle, title, description, order } = req.body;
    const updateData: any = {};

    if (subtitle) updateData.subtitle = subtitle.trim();
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (order !== undefined) updateData.order = order;

    if (req.file) {
        const uploadedImage = await uploadImageToCloud(req.file, "gallery");

        updateData.image = uploadedImage.cloudinaryUrl || uploadedImage.localUrl;
        updateData.imagePublicId = uploadedImage.cloudinaryPublicId;
        updateData.imageLocalPath = uploadedImage.localPath;
        updateData.imageLocalUrl = uploadedImage.localUrl;

        await deleteFromCloud(
            existingGallery.imagePublicId,
            existingGallery.imageLocalPath,
            "image"
        );
    }

    updateData.updatedAt = new Date();

    const updatedGallery = await Gallery.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    }).select("-imagePublicId -imageLocalPath -imageLocalUrl");

    return res.status(200).json({
        success: true,
        message: "Gallery item updated successfully",
        data: updatedGallery,
    });
});

export const deleteGallery = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Id is required");

    const gallery = await Gallery.findById(id).select("-imagePublicId -imageLocalPath -imageLocalUrl");
    if (!gallery) throw new ApiError(404, "Gallery item not found");

    await deleteFromCloud(gallery.imagePublicId, gallery.imageLocalPath, "image");
    await Gallery.findByIdAndDelete(id);

    const remaining = await Gallery.countDocuments();

    return res.status(200).json({
        success: true,
        message: "Gallery item deleted successfully",
        data: { _id: gallery._id, title: gallery.title, deletedAt: new Date() },
        slotsRemaining: GALLERY_COUNT - remaining,
    });
});

export const getGalleryById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Id is required");

    const gallery = await Gallery.findById(id).select("-imagePublicId -imageLocalPath -imageLocalUrl");
    if (!gallery) throw new ApiError(404, "Gallery item not found");

    const image = await resolveImageUrl(gallery.image, gallery.imageLocalUrl);

    const data = gallery.toObject();
    return res.status(200).json({
        success: true,
        message: "Gallery item fetched successfully",
        data: ImageResolver.prepare({
            ...data,
            image: await ImageResolver.resolveSingle(data.image, data.imageLocalUrl),
        }),
    });
});

export const getAllGallery = asyncHandler(async (req: Request, res: Response) => {
    const galleries = await Gallery.find({ isActive: true })
        .sort({ order: 1, createdAt: -1 })
        .select("-imagePublicId -imageLocalPath -imageLocalUrl");

    const resolved = await Promise.all(
        galleries.map(async (g) => {
            const data = g.toObject();
            return ImageResolver.prepare({
                ...data,
                image: await ImageResolver.resolveSingle(data.image, data.imageLocalUrl),
            });
        })
    );

    return res.status(200).json({
        success: true,
        message: "Gallery items fetched successfully",
        data: resolved,
        total: resolved.length,
        isFull: resolved.length === GALLERY_COUNT,
    });
});