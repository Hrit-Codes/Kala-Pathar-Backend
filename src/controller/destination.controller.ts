import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Destination } from "../model/destinationModel";

export const createDestination= asyncHandler(async (req: Request,res: Response) =>{
    const {name,description, isActive, order}=req.body;
    if(!name?.trim()){
        throw new ApiError(400,"Destination name is required");
    }

    const slug= name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const existingDestination = await Destination.findOne({slug});

    if(existingDestination){
        throw new ApiError(409,"A destination with this name already exists");
    }

    const destination= await Destination.create({
        name:name.trim(),
        slug,
        description,
        order,
        isActive
    })

    return res.status(201).json({
        success:true,
        message:"Destination created successfully",
        data:destination,

    });
}
);

export const deleteDestination=asyncHandler(async(req:Request, res:Response)=>{
    const {id} = req.params;

    if(!id){
        throw new ApiError(400,"Id is required");
    }

    const destination=await Destination.findById(id);

    if(!destination){
        throw new ApiError(404,"Destination not found");
    }

    await Destination.findByIdAndDelete(id);

    return res.status(200).json({
        success:true,
        message:"Destination deleted successfully",
        data:{
            _id:destination._id,
            name:destination.name,
            deletedAt:new Date(),
        }
    })
})

export const toggleDestinationActiveStatus=asyncHandler(async(req:Request,res:Response)=>{
    const {id}= req.params;

    if(!id){
        throw new ApiError(400,"Id is required");
    }

    const destination= await Destination.findById(id);

    if(!destination){
        throw new ApiError(404,"Destination not found");
    }

    const updatedDestination= await Destination.findByIdAndUpdate(
        id,
        {
            isActive:!destination.isActive,
            updatedAt:new Date,
        },
        {
            new:true,
            runValidators:true
        }
    )

    const statusMessage= updatedDestination?.isActive? "activated" : "deactivated";

    return res.status(200).json({
        success:true,
        message:`Destination ${statusMessage} successfully`,
        data:{
            _id:destination._id,
            name:destination.name,
            slug:updatedDestination?.slug,
            isActive:updatedDestination?.isActive,
        }
    })
})

export const updateDestination=asyncHandler(async(req:Request,res:Response)=>{
    const {id}=req.params;

    if(!id){
        throw new ApiError(400,"Id is required");
    }

    const {name,description,order,isActive}=req.body;

    const existingDestination= await Destination.findById(id);

    if(!existingDestination){
        throw new ApiError(404,"Destination not found");
    }

    const updateData:any={};

    if(name){ 
        updateData.name= name.trim();
        updateData.slug= name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }
    if(description) updateData.description= name.trim();
    if(order!==undefined) updateData.order= order;
    if(isActive !==undefined) updateData.isActive= isActive;
    
    updateData.updatedAt= new Date();

    const updatedDestination= await Destination.findByIdAndUpdate(
        id,
        updateData,
        {
            new:true,
            runValidators:true,
        }
    )

    return res.status(200).json({
        success:true,
        message:"Destination updated successfully",
        data:updatedDestination
    })    
})

export const getDestinationById=asyncHandler(async(req:Request, res:Response)=>{
    const {id}= req.params;

    if(!id){
        throw new ApiError(400,"Id is required");
    }

    const destination= await Destination.findById(id);

    return res.status(200).json({
        success:true,
        message:"Destination data fetched successfully",
        data:destination
    })
})

export const getDestinations=asyncHandler(async(req:Request, res:Response)=>{
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip= (page-1) * limit;

    const [destinations, total]= await Promise.all([
        Destination.find()
        .sort({order:1, createdAt:-1})
        .skip(skip)
        .limit(limit),
        Destination.countDocuments()
    ]);

    return res.status(200).json({
        success:true,
        message:"Destinations fetched successfully",
        data:destinations,
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