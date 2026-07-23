import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { Subscriber } from "../model/subscriber.model";

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required"
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email format"
        });
    }

    const existing = await Subscriber.findOne({ email });

    if (existing) {
        if (existing.isActive) {
            return res.status(409).json({
                success: false,
                message: "This email is already subscribed",
                alreadySubscribed: true
            });
        }

        existing.isActive = true;
        existing.unsubscribedAt = undefined;
        await existing.save();

        return res.status(200).json({
            success: true,
            message: "You have been re-subscribed successfully",
            data: {
                email: existing.email,
                isSubscribed: true,
                token: existing.unsubscribeToken
            }
        });
    }

    const subscriber = await Subscriber.create({
        email: email.toLowerCase().trim()
    });

    return res.status(200).json({
        success: true,
        message: "Subscribed successfully",
        data: {
            email: subscriber.email,
            isSubscribed: true,
            token: subscriber.unsubscribeToken
        }
    });
});

export const checkSubscriptionStatus = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required"
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email as string)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address"
        });
    }

    const subscriber = await Subscriber.findOne({
        email: (email as string).toLowerCase().trim()
    });

    if (!subscriber) {
        return res.status(404).json({
            success: false,
            message: "Email not subscribed yet"
        });
    }

    return res.status(200).json({
        success: true,
        data: {
            email: email,
            isSubscribed: subscriber.isActive,
            isActive: subscriber.isActive,
            subscribedAt: subscriber.subscribedAt || null,
        }
    });
});

export const unsubscribe = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required"
        });
    }

    // if (!token) {
    //     return res.status(400).json({
    //         success: false,
    //         message: "Unsubscribe token is required"
    //     });
    // }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email as string)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address"
        });
    }

    const subscriber = await Subscriber.findOne({
        email: email.toLowerCase().trim()
    });

    if (!subscriber) {
        return res.status(404).json({
            success: false,
            message: "Email not found in our subscription list"
        });
    }

    if (!subscriber.isActive) {
        return res.status(200).json({
            success: true,
            message: "You are already unsubscribed",
            data: { isSubscribed: false }
        });
    }

    // if (subscriber.unsubscribeToken !== token) {
    //     return res.status(401).json({
    //         success: false,
    //         message: "Invalid or expired unsubscribe token"
    //     });
    // }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    return res.status(200).json({
        success: true,
        message: "You have been unsubscribed successfully",
        data: { isSubscribed: false }
    });
});

export const getAllSubscribers = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [subscribers, total] = await Promise.all([
        Subscriber.find({ isActive: true })
            .sort({ subscribedAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("-unsubscribeToken"),
        Subscriber.countDocuments({ isActive: true }),
    ]);

    return res.status(200).json({
        success: true,
        message: "Active subscribers fetched successfully",
        data: subscribers,
        pagination: {
            total,
            page,
            limit,
            totalPage: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1
        }
    });
});