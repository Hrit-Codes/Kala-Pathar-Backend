import { response, type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { WhyChooseUs } from "../model/whyChooseUs.model";
import { redisClient } from "../config/redis";

const MAX_WHY_CHOOSE_US_ENTRIES=3;
const WHY_CHOOSE_US_CACHE_KEY="why-choose-us:all";
const WHY_CHOOSE_US_CACHE_TTL=30*60;

export const createWhyChooseUs = asyncHandler(async (req: Request, res: Response) => {
    const { title, description, icon, order, isActive } = req.body;  // add icon

    // Validate icon
    if (!icon) {
        throw new ApiError(400, "Icon is required");
    }

    const existingCount = await WhyChooseUs.countDocuments();

    if (existingCount >= MAX_WHY_CHOOSE_US_ENTRIES) {
        throw new ApiError(409, `Only ${MAX_WHY_CHOOSE_US_ENTRIES} "Why Choose Us" entries are allowed`);
    }

    const whyChooseUs = await WhyChooseUs.create({
        title: title.trim(),
        description: description.trim(),
        icon: icon.trim(),    // add icon
        order,
        isActive
    });

    await redisClient.del(WHY_CHOOSE_US_CACHE_KEY);

    return res.status(200).json({
        success: true,
        message: "Why Choose Us entry created successfully",
        data: whyChooseUs
    });
});

export const updateWhyChooseUs= asyncHandler(async(req:Request, res:Response)=>{
    const {id} = req.params;

    const {title, description, icon, order, isActive}=req.body;

    if(!id){
        throw new ApiError(400,"Id is required");
    }

    const whyChooseUs= await WhyChooseUs.findById(id);

    if(!whyChooseUs){
        throw new ApiError(404,"Why Choose Us entry not found");
    }

    if(title !==undefined) whyChooseUs.title= title.trim();
    if(description !==undefined) whyChooseUs.description = description.trim();
    if(icon !==undefined) whyChooseUs.icon= icon.trim();
    if(order !==undefined) whyChooseUs.order = order;
    if(isActive !==undefined) whyChooseUs.isActive = isActive;

    await whyChooseUs.save();

    await redisClient.del(WHY_CHOOSE_US_CACHE_KEY);

    return res.status(200).json({
        success:true,
        message:"Why Choose Us entry updated successfully",
        data:whyChooseUs
    })
})

export const getAllWhyChooseUs=asyncHandler(async(req:Request,res:Response)=>{
    const cached= await redisClient.get(WHY_CHOOSE_US_CACHE_KEY);

    if(cached){
        return res.status(200).json({
            success:true,
            message:"All Why Choose Us entries fetched successfully",
            ...JSON.parse(cached)
        })
    }

    const entries= await WhyChooseUs.find().sort({order:1});

    const responsePayload={
        count:entries.length,
        data:entries
    }

    await redisClient.set(
        WHY_CHOOSE_US_CACHE_KEY,
        JSON.stringify(responsePayload),
        "EX",
        WHY_CHOOSE_US_CACHE_TTL
    )

    return res.status(200).json({
        success:true,
        message:"All Why Choose Us entries fetched successfully",
        ...responsePayload
    })

})