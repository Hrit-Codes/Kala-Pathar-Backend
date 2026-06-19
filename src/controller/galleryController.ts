import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { Gallery } from "../model/gallery.model";
import { ApiError } from "../utils/apiError";
import { deleteFromCloud, uploadImageToCloud } from "../helpers/cloudinaryUpload";

const GALLERY_COUNT= 4;

export const createGallery= asyncHandler(async(req:Request,res:Response)=>{
    const existingCount= await Gallery.countDocuments();

    if(existingCount>=GALLERY_COUNT){
        throw new ApiError(
            409,`Exactly ${GALLERY_COUNT} gallery items must exist. Delete one before creating a new one.`
        )
    }

    const file= req.file;

    if(!file){
        throw new ApiError(400,"Gallery image is required");
    }

    const {subtitle,title,description,order}=req.body;

    const uploadedImage= await uploadImageToCloud(file,"gallery");

    const gallery = await Gallery.create({
        subtitle:subtitle.trim(),
        title:title.trim(),
        description:description.trim(),
        image:uploadedImage.url,
        imagePublicId:uploadedImage.publicId,
        order
    })

    const totalAfterCreate= await Gallery.countDocuments();

    return res.status(200).json({
        success:true,
        message:`Gallery item created successfully. ${totalAfterCreate}/${GALLERY_COUNT} slots filled.`,
        data: gallery,
        slotsRemaining: GALLERY_COUNT - totalAfterCreate,
    })
})

export const updateGallery = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Id is required");
    }

    const existingGallery = await Gallery.findById(id);

    if (!existingGallery) {
        throw new ApiError(404, "Gallery item not found");
    }

    const { subtitle, title, description, order } = req.body;

    const updateData: any = {};

    if (subtitle) updateData.subtitle = subtitle.trim();
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (order !== undefined) updateData.order = order;

    if (req.file) {
        const uploadedImage = await uploadImageToCloud(req.file, "gallery");
        updateData.image = uploadedImage.url;
        updateData.imagePublicId = uploadedImage.publicId;

        if (existingGallery.imagePublicId) {
            await deleteFromCloud(existingGallery.imagePublicId, "image");
        }
    }

    updateData.updatedAt = new Date();

    const updatedGallery = await Gallery.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );

    return res.status(200).json({
        success: true,
        message: "Gallery item updated successfully",
        data: updatedGallery,
    });
});

export const getGalleryById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Id is required");
    }

    const gallery = await Gallery.findById(id);

    if (!gallery) {
        throw new ApiError(404, "Gallery item not found");
    }

    return res.status(200).json({
        success: true,
        message: "Gallery item fetched successfully",
        data: gallery,
    });
});

export const getAllGallery= asyncHandler(async(req:Request,res:Response)=>{
    const galleries= await Gallery.find().sort({order:1, createdAt:-1});

    return res.status(200).json({
        success:true,
        message:"Gallery item fetched successfully",
        data:galleries,
        total:galleries.length,
        isFull:galleries.length===GALLERY_COUNT
    })
})