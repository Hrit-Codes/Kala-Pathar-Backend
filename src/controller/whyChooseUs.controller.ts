import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { WhyChooseUs } from "../model/whyChooseUs.model";
import { count } from "console";

const MAX_WHY_CHOOSE_US_ENTRIES=3;

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

    return res.status(200).json({
        success: true,
        message: "Why Choose Us entry created successfully",
        data: whyChooseUs
    });
});

export const deleteWhyChooseUs = asyncHandler(async(req:Request, res:Response)=>{
    const {id}= req.params;

    if(!id){
        throw new ApiError(400,"Id is required");
    }

    const whyChooseUs= await WhyChooseUs.findById(id);

    if(!whyChooseUs){
        throw new ApiError(404,"Why choose us entry not found");
    }

    const existingCount= await WhyChooseUs.countDocuments();

    if(existingCount<= MAX_WHY_CHOOSE_US_ENTRIES){
        throw new ApiError(409,`Exactly ${MAX_WHY_CHOOSE_US_ENTRIES} "Why Choose Us" entries are allowed. Update this entry instead of deleting it, or create a replacement first`)
    }

    await WhyChooseUs.findByIdAndDelete(id);

    return res.status(200).json({
        success:true,
        message:"Why choose use entry deleted successfully",
        data:{
            _id:whyChooseUs._id,
            title:whyChooseUs.title,
            deletedAt: new Date()
        }
    })
})

export const toggleActiveStatus= asyncHandler(async (req:Request, res:Response)=>{
    const {id}= req.params;

    if(!id){
        throw new ApiError(400,"Id is required");
    }

    const whyChooseUs= await WhyChooseUs.findById(id);

    if(!whyChooseUs){
        throw new ApiError(404,"Why choose us entry not found");
    }

    whyChooseUs.isActive = !whyChooseUs.isActive;
    await whyChooseUs.save();

    return res.status(200).json({
        success:true,
        message:`Entry ${whyChooseUs.isActive?"activated" : "deactivated"} sucessfully`,
        data:whyChooseUs
    })
})

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

    return res.status(200).json({
        success:true,
        message:"Why Choose Us entry updated successfully",
        data:whyChooseUs
    })
})

export const getActiveWhyChooseUs=asyncHandler(async(req:Request,res:Response)=>{
    const entries= await WhyChooseUs.find({isActive:true}).sort({order:1});

    return res.status(200).json({
        success:true,
        message:"Active Why Choose Us entries fetched successfully",
        data:entries
    })

})

export const getAllWhyChooseUs=asyncHandler(async(req:Request,res:Response)=>{
    const entries= await WhyChooseUs.find().sort({order:1});

    return res.status(200).json({
        success:true,
        message:"All Why Choose Us entries fetched successfully",
        count:entries.length,
        data:entries
    })

})