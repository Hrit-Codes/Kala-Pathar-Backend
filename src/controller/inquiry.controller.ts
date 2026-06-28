import type { Request, Response } from "express";
import { Inquiry } from "../model/inquiry.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

export const createInquiry = asyncHandler(async (req: Request, res: Response) => {
    const { fullname, email, phone, subject, description } = req.body;

    const inquiry = await Inquiry.create({
        fullname: fullname.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: subject.trim(),
        description: description.trim(),
    });

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

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) throw new ApiError(404, "Inquiry not found");

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

    const skip= (page-1)* limit;

    const [inquiries, total]= await Promise.all([
        Inquiry.find()
        .sort({order:1, createdAt:-1})
        .skip(skip)
        .limit(limit),
        Inquiry.countDocuments()
    ]);

    return res.status(200).json({
        success:true,
        message:"Inquiries fetched successfully",
        data:inquiries,
        pagination:{
            total,
            page,
            limit,
            totalPages:Math.ceil(total/limit),
            hasNextPage:page*limit<total,
            hasPrevPage:page>1
        }
    })
})