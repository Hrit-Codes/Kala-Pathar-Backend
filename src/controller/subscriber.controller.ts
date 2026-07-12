import type { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Subscriber } from "../model/subscriber.model";

export const subscribe=asyncHandler(async(req:Request,res:Response)=>{
    const { email }= req.body;
    if(!email) throw new ApiError(400,"Email is required");

    const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){
        throw new ApiError(400,"Invalid email format")
    }

    const existing= await Subscriber.findOne({email});

    if(existing){
        if(existing.isActive){
            throw new ApiError(409,"This email is already subsribed");
        }

        // Re-subscribe if previously unsubscribed
        existing.isActive=true;
        existing.unsubscribedAt=undefined;

        await existing.save();

        return res.status(200).json({
            success:true,
            message:"You have been re-subscribed successfully",
            data:{
                email:existing.email,
                isSubscribed:true,
                token:existing.unsubscribeToken
            }
        });
    }

    const subscriber = await Subscriber.create({
        email:email.toLowerCase().trim()
    });

    return res.status(200).json({
        success:true,
        message:"Subscribed successfully",
        data:{
            email:subscriber.email,
            isSubscribed:true,
            token:subscriber.unsubscribeToken
        }
    })
})

export const checkSubscriptionStatus=asyncHandler(async(req:Request,res:Response)=>{
    const { email }= req.body;

    if(!email){
        throw new ApiError(400,"Email is required");
    }

    const emailRegex= /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email as string)){
        throw new ApiError(400,"Please provide a valid email address");
    }

    const subscriber=await Subscriber.findOne({
        email:(email as string).toLowerCase().trim()
    })

    if(!subscriber){
        throw new ApiError(404,"Email not subscribed yet");
    }

    const isSubscribed=subscriber?subscriber.isActive:false;
    const isActive=subscriber?.isActive??false;

    return res.status(200).json({
        success:true,
        data:{
            email:email,
            isSubscribed:isSubscribed,
            isActive:isActive,
            subscribedAt:subscriber?.subscribedAt || null,

            // Return token only if subscribed ( for unsubscribe link )
            token:subscriber?.unsubscribeToken || null
        }
    })
})

export const unsubscribe=asyncHandler(async(req:Request,res:Response)=>{
    const { email , token }=req.body;
    if(!email){
        throw new ApiError(400,"Email is required");
    }

    if(!token){
        throw new ApiError(400,"Email is required");
    }

    const emailRegex= /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email as string)){
        throw new ApiError(400,"Please provide a valid email address");
    }

    const subscriber=await Subscriber.findOne({
        email:email.toLowerCase().trim()
    })

    if(!subscriber){
        throw new ApiError(404,"Email not found in out subscription list");
    }

    if(!subscriber.isActive){
        return res.status(200).json({
            success:true,
            message:"You are already unsubscribed",
            data:{isSubscribed:false}
        })
    }

    if(subscriber.unsubscribeToken!==token){
        throw new ApiError(401,"Invalid or expired unsubscribe token");
    }

    subscriber.isActive=false;
    subscriber.unsubscribedAt= new Date();
    await subscriber.save();

    return res.status(200).json({
        success:true,
        message:"You have been unsubscribed successfully",
        data:{ isSubscribed:false}
    })
})

export const getAllSubscribers=asyncHandler(async(req:Request,res:Response)=>{
    const page= parseInt(req.query.page as string) || 1;
    const limit= parseInt(req.query.limit as string) || 10;
    const skip= (page-1)* limit;

    const [subscribers, total] = await Promise.all([
        Subscriber.find({isActive:true})
            .sort({subscribedAt:-1})
            .skip(skip)
            .limit(limit)
            .select("-unsubscribeToken"),
        Subscriber.countDocuments({ isActive: true }),
    ]);

    return res.status(200).json({
        success:true,
        message:"Active subscribers fetched successfully",
        data:subscribers,
        pagination:{
            total,
            page,
            limit,
            totalPage:Math.ceil(total/limit),
            hasNextPage:page*limit<total,
            hasPrevPage:page>1
        }
    })
})