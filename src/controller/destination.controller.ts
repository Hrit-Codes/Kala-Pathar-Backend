import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { isAdmin } from "../utils/roleCheck";
import { Destination } from "../model/destinationModel";

export const createDestination= asyncHandler(async (req: Request,res: Response) =>{
    const admin=true;
    if(!admin){
        throw new ApiError(403,"Only Admin Are Allowed");
    }
    const {name,description, isActive, order}=req.body;
    if(!name?.trim()){
        throw new ApiError(400,"Destination name is required");
    }

    const slug= name.trim().toLowerCase.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

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