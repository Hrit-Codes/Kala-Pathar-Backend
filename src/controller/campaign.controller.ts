import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { Subscriber } from "../model/subscriber.model";
import { Campaign } from "../model/campaign.model";
import { emailQueue } from "../queue/emailQueue";

export const sendCampaign=asyncHandler(async(req:Request,res:Response)=>{
    const {subject,body}=req.body;
    const files=req.files as Express.Multer.File[] | undefined;

    if(!subject?.trim()) throw new ApiError(400,"Subject is required");
    if(!body?.trim()) throw new ApiError(400,"Body is required");
    if(!files || files.length===0) throw new ApiError(400,"At least one attachment is required");
    if(files.length>3) throw new ApiError(400,"Maximum of 3 attachments allowed");

    const activeSubscribers= await Subscriber.find({ isActive:true}).select("email unsubscribeToken");

    if(activeSubscribers.length===0){
        throw new ApiError(400,"No active subscribers to send to");
    }

    const attachments=files.map((file)=>({
        fileName:file.originalname,
        localPath:file.path,
        mimeType:file.mimetype
    }))

    const campaign=await Campaign.create({
        subject:subject.trim(),
        body:body.trim(),
        sentBy:req.user?._id,
        status:"processing",
        totalRecipients:activeSubscribers.length,
        attachments,
        startedAt:new Date()
    })

    const jobs=activeSubscribers.map((subscriber)=>({
        name:"send-email",
        data:{
            campaignId:String(campaign._id),
            email:subscriber.email,
            subject:subject.trim,
            body:body.trim(),
            unsubscribeToken:subscriber.unsubscribeToken,
            attachments
        }
    }))

    await emailQueue.addBulk(jobs);

    return res.status(202).json({
        success:true,
        message:`Campaign queued for ${activeSubscribers.length} subscribers`,
        data:{
            campaignId:campaign._id,
            totalRecipients:activeSubscribers.length,
            attachments:attachments.map((a)=>a.fileName),
            status:"processing"
        }
    })
})

export const getAllCampaigns=asyncHandler(async(req:Request,res:Response)=>{
    const page= parseInt(req.query.page as string) || 1;
    const limit= parseInt(req.query.limit as string) || 10;

    const skip=(page-1)*limit;

    const [campaigns,total]=await Promise.all([
        Campaign.find()
            .populate("sentBy","email")
            .sort({createdAt:-1})
            .skip(skip)
            .limit(limit),
        Campaign.countDocuments()
    ])

    return res.status(200).json({
        success:true,
        message:"Campaigns fetched successfully",
        data:campaigns,
        pagination: {
            total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
        },
    })
})

export const getCampaignById=asyncHandler(async(req:Request, res:Response)=>{
    const {id}=req.params;
    if(!id) throw new ApiError(400,"Id is required");

    const campaign= await Campaign.findById(id).populate("sentBy","email");
    if(!campaign) throw new ApiError(404,"Campaign not found");

    return res.status(200).json({
        success:true,
        message:"Campaign fetched successfully",
        data:campaign
    })
})