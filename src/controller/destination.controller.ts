import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Destination } from "../model/destinationModel";
import { redisClient } from "../config/redis";

const DESTINATIONS_CACHE_TTL = 30 * 60;
const DESTINATIONS_CACHE_KEY = "destinations:all";

const invalidateDestinationsCache = async () => {
    await redisClient.del(DESTINATIONS_CACHE_KEY);
};

export const createDestination = asyncHandler(async (req: Request, res: Response) => {
    const { name, description, isActive, order } = req.body;
    if (!name?.trim()) {
        throw new ApiError(400, "Destination name is required");
    }

    const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const existingDestination = await Destination.findOne({ slug });

    if (existingDestination) {
        throw new ApiError(409, "A destination with this name already exists");
    }

    const destination = await Destination.create({
        name: name.trim(),
        slug,
        description,
        order,
        isActive
    });

    await invalidateDestinationsCache();

    return res.status(201).json({
        success: true,
        message: "Destination created successfully",
        data: destination,
    });
});

export const deleteDestination = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Id is required");
    }

    const destination = await Destination.findById(id);

    if (!destination) {
        throw new ApiError(404, "Destination not found");
    }

    await Destination.findByIdAndDelete(id);

    await invalidateDestinationsCache();

    return res.status(200).json({
        success: true,
        message: "Destination deleted successfully",
        data: {
            _id: destination._id,
            name: destination.name,
            deletedAt: new Date(),
        }
    });
});

export const toggleDestinationActiveStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Id is required");
    }

    const destination = await Destination.findById(id);

    if (!destination) {
        throw new ApiError(404, "Destination not found");
    }

    const updatedDestination = await Destination.findByIdAndUpdate(
        id,
        {
            isActive: !destination.isActive,
            updatedAt: new Date(),
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    );

    await invalidateDestinationsCache();

    const statusMessage = updatedDestination?.isActive ? "activated" : "deactivated";

    return res.status(200).json({
        success: true,
        message: `Destination ${statusMessage} successfully`,
        data: {
            _id: destination._id,
            name: destination.name,
            slug: updatedDestination?.slug,
            isActive: updatedDestination?.isActive,
        }
    });
});

export const updateDestination = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Id is required");
    }

    const { name, description, order, isActive } = req.body;

    const existingDestination = await Destination.findById(id);

    if (!existingDestination) {
        throw new ApiError(404, "Destination not found");
    }

    const updateData: any = {};

    if (name) {
        updateData.name = name.trim();
        updateData.slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }
    if (description) updateData.description = description.trim();
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    updateData.updatedAt = new Date();

    const updatedDestination = await Destination.findByIdAndUpdate(
        id,
        updateData,
        {
            returnDocument: "after",
            runValidators: true,
        }
    );

    await invalidateDestinationsCache();

    return res.status(200).json({
        success: true,
        message: "Destination updated successfully",
        data: updatedDestination
    });
});

export const getDestinationById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Id is required");
    }

    const destination = await Destination.findById(id);

    if (!destination) {
        throw new ApiError(404, "Destination not found");
    }

    return res.status(200).json({
        success: true,
        message: "Destination data fetched successfully",
        data: destination
    });
});

export const getAllDestinations = asyncHandler(async (req: Request, res: Response) => {
    // Check cache first
    const cached = await redisClient.get(DESTINATIONS_CACHE_KEY);

    if (cached) {
        return res.status(200).json({
            success: true,
            message: "Destinations fetched successfully (cached)",
            data: JSON.parse(cached),
        });
    }

    // Fetch all destinations from database
    const destinations = await Destination.find()
        .sort({ order: 1, createdAt: -1 });

    // Cache the result
    await redisClient.set(
        DESTINATIONS_CACHE_KEY,
        JSON.stringify(destinations),
        "EX",
        DESTINATIONS_CACHE_TTL
    );

    return res.status(200).json({
        success: true,
        message: "Destinations fetched successfully",
        data: destinations,
    });
});

export const getActiveDestinations=asyncHandler(async(req:Request,res:Response)=>{
    const cached=await redisClient.get("destinations:active");

    if(cached){
        return res.status(200).json({
            success:true,
            message:"Active destinations fetched successfully",
            ...JSON.parse(cached)
        });
    }

    const destinations=await Destination.find({isActive:true})
            .sort({order:1,createdAt:-1})
            .select("_id name slug description");

    const responsePayload={
        data:destinations,
        total:destinations.length
    }

    await redisClient.set("destinations:active",JSON.stringify(responsePayload),"EX",DESTINATIONS_CACHE_TTL);

    return res.status(200).json({
        success:true,
        message:"ACtive destinations fetched successfully",
        ...responsePayload
    })
})