import type { Request, Response } from "express";
import { Inquiry } from "../model/inquiry.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { sendMail } from "../helpers/mailsend";
import { inquiryReplyTemplate } from "../helpers/mailTemplate";
import { redisClient } from "../config/redis";

const INQUIRY_CACHE_TTL=30*60;

const getPaginationKey = (page: number, limit: number, status: string) =>
  `inquiries:list:page:${page}:limit:${limit}:status:${status}`;
const getSingleCacheKey = (id: string) => `inquiries:single:${id}`;

const clearInquiryListCache = async () => {
  const stream = redisClient.scanStream({ match: "inquiries:list:*" });
  const pipeline = redisClient.pipeline();
  let found = false;

  for await (const keys of stream) {
    if (keys.length) {
      found = true;
      keys.forEach((key: string) => pipeline.del(key));
    }
  }

  if (found) await pipeline.exec();
};

export const createInquiry = asyncHandler(async (req: Request, res: Response) => {
    const { fullname, email, phone, subject, description } = req.body;

    const inquiry = await Inquiry.create({
        fullname: fullname.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: subject.trim(),
        description: description.trim(),
    });

    await clearInquiryListCache();

    return res.status(201).json({
        success: true,
        message: "Inquiry submitted successfully",
        data: inquiry,
    });
});

export const getInquiryById=asyncHandler(async(req:Request,res:Response)=>{
    const {id}= req.params;

    if(!id){
        throw new ApiError(400,"Id is required");
    }

    const cacheKey= getSingleCacheKey(id as string);
    const cached= await redisClient.get(cacheKey);

    if(cached){
        return res.status(200).json({
            success:true,
            message:"Inquiry fetched successfully",
            data:JSON.parse(cached),
        })
    }

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) throw new ApiError(404, "Inquiry not found");

    await redisClient.set(
        cacheKey,
        JSON.stringify(inquiry),
        "EX",
        INQUIRY_CACHE_TTL
    )

    return res.status(200).json({
        success: true,
        message: "Inquiry fetched successfully",
        data: inquiry,
    });
       
})

export const deleteInquiry=asyncHandler(async(req:Request,res:Response)=>{
    const {id}=req.params;

    if(!id){
        throw new ApiError(400,"Id is required");
    }

    const inquiry= await Inquiry.findById(id);

    if(!inquiry){
        throw new ApiError(404,"Inquiry not found");
    }

    await Inquiry.findByIdAndDelete(id);

    await redisClient.del(getSingleCacheKey(id as string));

    await clearInquiryListCache();

    return res.status(200).json({
        success:true,
        message:"Inquiry deleted successfully",
        data:{
            _id: inquiry._id,
            fullname: inquiry.fullname,
            deletedAt: new Date(),
        }
    })
})

export const getAllInquiry=asyncHandler(async(req:Request,res:Response)=>{
    const page= parseInt(req.query.page as string) || 1;
    const limit= parseInt(req.query.limit as string) || 10;
    const statusParam= (req.query.status as string) || "all";

    let filter:Record<string,any>={};
    const normalized=statusParam.toLowerCase();
    if(normalized==="pending"){
        filter.isReplied=false
    }else if(normalized==="replied"){
        filter.isReplied=true;
    }

    const cacheKey=getPaginationKey(page,limit,normalized);

    const cached=await redisClient.get(cacheKey);

    if (cached){
        return res.status(200).json({
            success:true,
            message:"Inquiries fetched successfully",
            data:JSON.parse(cached).inquiries,
            pagination:JSON.parse(cached).pagination
        })
    }

    const skip= (page-1)* limit;

    const [inquiries, total,pendingCount,repliedCount]= await Promise.all([
        Inquiry.find(filter)
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit),
        Inquiry.countDocuments(filter),
        Inquiry.countDocuments({isReplied:false}),
        Inquiry.countDocuments({isReplied:true})
    ]);

    const paginationDetails={
        total,
        page,
        limit,
        totalPage:Math.ceil(total/limit),
        hasNextPage:page*limit<total,
        hasPrevPage:page>1
    }

    const tabCounts={
        all:pendingCount+repliedCount,
        pending:pendingCount,
        replied:repliedCount
    }

    const cachePayload={
        inquiries,
        pagination:paginationDetails,
        tabCounts
    }

    await redisClient.set(
        cacheKey,
        JSON.stringify(cachePayload),
        "EX",
        INQUIRY_CACHE_TTL
    )

    return res.status(200).json({
        success:true,
        message:"Inquiries fetched successfully",
        data:inquiries,
        pagination:paginationDetails,
        tabCounts
    })
})

export const replyToInquiry=asyncHandler(async(req:Request,res:Response)=>{
    const {id}=req.params;

    if(!id){
        throw new ApiError(400,"Id is required");
    }

    const inquiry= await Inquiry.findById(id);

    if(!inquiry){
        throw new ApiError(404,"Inquiry not found");
    }

    if(inquiry.isReplied){
        throw new ApiError(409,"This inquiry has already been replied to");
    }

    const {message}=req.body;

    await sendMail({
        to:inquiry.email,
        subject:`Re: ${inquiry.subject}`,
        html:inquiryReplyTemplate(inquiry.fullname, inquiry.subject, message.trim())
    })

    const updated= await Inquiry.findByIdAndUpdate(
        id,
        {
            isReplied:true,
            repliedAt:new Date(),
            replyMessage:message.trim()
        },
        {
            returnDocument: "after"
        }
    )

    await redisClient.del(getSingleCacheKey(id as string));

    await clearInquiryListCache();

    return res.status(200).json({
        success:true,
        message:`Reply sent successfully to ${inquiry.email}`,
        data:updated
    })
})