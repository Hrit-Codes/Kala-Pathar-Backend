import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { CompanyInfo } from "../model/companyInfo.model";
import { uploadImageToCloud, deleteFromCloud } from "../helpers/cloudinaryUpload";
import { redisClient } from "../config/redis";
import { ImageResolver } from "../utils/imageResolver";

const COMPANY_INFO_CACHE_KEY="company:info";
const COMPANY_INFO_CACHE_TTL=30*60;

export const createCompanyInfo = asyncHandler(async (req: Request, res: Response) => {
    const existing = await CompanyInfo.findOne();
    if (existing) {
        throw new ApiError(409, "Company info already exists. Use update instead.");
    }

    if (!req.file) {
        throw new ApiError(400, "Logo image is required");
    }

    const {
        companyName, officeAddress, officeTelephone,
        emails, phones, description, socialLinks,
        mapLatitude, mapLongitude, mapEmbedUrl,
    } = req.body;

    const uploadedLogo = await uploadImageToCloud(req.file, "company");

    const companyInfo = await CompanyInfo.create({
        companyName: companyName.trim(),
        officeAddress: officeAddress.trim(),
        officeTelephone: officeTelephone.trim(),
        emails: typeof emails === "string" ? JSON.parse(emails) : emails,
        phones: typeof phones === "string" ? JSON.parse(phones) : phones,
        description,
        logo: uploadedLogo.cloudinaryUrl || uploadedLogo.localUrl,  
        logoPublicId: uploadedLogo.cloudinaryPublicId,               
        logoLocalPath: uploadedLogo.localPath,                       
        logoLocalUrl: uploadedLogo.localUrl,                      
        socialLinks: typeof socialLinks === "string" ? JSON.parse(socialLinks) : socialLinks,
        mapLatitude: Number(mapLatitude),
        mapLongitude: Number(mapLongitude),
        mapEmbedUrl: mapEmbedUrl?.trim(),
    });

    await redisClient.del(COMPANY_INFO_CACHE_KEY);

    return res.status(201).json({
        success: true,
        message: "Company info created successfully",
        data: companyInfo,
    });
});

export const getCompanyInfo = asyncHandler(async (req: Request, res: Response) => {
    const cached= await redisClient.get(COMPANY_INFO_CACHE_KEY);
    if(cached){
        return res.status(200).json({
            success:true,
            message:"Company info fetched successfully",
            data:JSON.parse(cached),
        })
    }
    const companyInfo = await CompanyInfo.findOne().select("-logoPublicId -logoLocalPath");

    if (!companyInfo) {
        throw new ApiError(404, "Company info has not been set up yet");
    }

    const data=companyInfo.toObject();

    const responseData={
        ...data,
        logo:await ImageResolver.resolveSingle(data.logo,data.logoLocalUrl),
    }

    await redisClient.set(
        COMPANY_INFO_CACHE_KEY,
        JSON.stringify(responseData),
        "EX",
        COMPANY_INFO_CACHE_TTL
    )

    return res.status(200).json({
        success: true,
        message: "Company info fetched successfully",
        data: responseData
    });
});

export const updateCompanyInfo = asyncHandler(async (req: Request, res: Response) => {
    const existing = await CompanyInfo.findOne();

    if (!existing) {
        throw new ApiError(404, "Company info has not been set up yet. Use create instead.");
    }

    const {
        companyName, officeAddress, officeTelephone,
        emails, phones, description, socialLinks,
        mapLatitude, mapLongitude, mapEmbedUrl,
    } = req.body;

    const updateData: any = {};

    if (companyName) updateData.companyName = companyName.trim();
    if (officeAddress) updateData.officeAddress = officeAddress.trim();
    if (officeTelephone) updateData.officeTelephone = officeTelephone.trim();
    if (description) updateData.description = description.trim();

    if (emails !== undefined) {
        updateData.emails = typeof emails === "string" ? JSON.parse(emails) : emails;
    }
    if (phones !== undefined) {
        updateData.phones = typeof phones === "string" ? JSON.parse(phones) : phones;
    }
    if (socialLinks !== undefined) {
        updateData.socialLinks = typeof socialLinks === "string" ? JSON.parse(socialLinks) : socialLinks;
    }

    if (mapLatitude !== undefined) updateData.mapLatitude = Number(mapLatitude);
    if (mapLongitude !== undefined) updateData.mapLongitude = Number(mapLongitude);
    if (mapEmbedUrl !== undefined) updateData.mapEmbedUrl = mapEmbedUrl.trim();

    if (req.file) {
        const uploadedLogo = await uploadImageToCloud(req.file, "company");

        updateData.logo = uploadedLogo.cloudinaryUrl || uploadedLogo.localUrl; 
        updateData.logoPublicId = uploadedLogo.cloudinaryPublicId;            
        updateData.logoLocalPath = uploadedLogo.localPath;                     
        updateData.logoLocalUrl = uploadedLogo.localUrl;                  

        // Delete old logo from both stores
        await deleteFromCloud(
            existing.logoPublicId,
            existing.logoLocalPath,   // 👈
            "image"
        );
    }

    updateData.updatedAt = new Date();

    const updatedCompanyInfo = await CompanyInfo.findByIdAndUpdate(
        existing._id,
        updateData,
        { returnDocument: "after", runValidators: true }
    );

    await redisClient.del(COMPANY_INFO_CACHE_KEY);

    return res.status(200).json({
        success: true,
        message: "Company info updated successfully",
        data: updatedCompanyInfo,
    });
});

export const deleteCompanyInfo = asyncHandler(async (req: Request, res: Response) => {
    const existing = await CompanyInfo.findOne();

    if (!existing) {
        throw new ApiError(404, "No existing company info to delete");
    }

    await deleteFromCloud(
        existing.logoPublicId,
        existing.logoLocalPath,  
        "image"
    );

    await CompanyInfo.deleteOne();

    await redisClient.del(COMPANY_INFO_CACHE_KEY);

    return res.status(200).json({
        success: true,
        message: "Company info deleted successfully",
        deletedAt: new Date(),
    });
});