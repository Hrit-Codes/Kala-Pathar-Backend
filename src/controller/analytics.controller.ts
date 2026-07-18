import type { Request, Response } from "express";
import { redisClient } from "../config/redis";
import { Inquiry } from "../model/inquiry.model";
import { TravelPackage } from "../model/package.model";
import { Subscriber } from "../model/subscriber.model";
import { asyncHandler } from "../utils/asyncHandler";

const ANALYTICS_CACHE_KEY = "analytics:dashboard";
const ANALYTICS_CACHE_TTL = 5 * 60;

const getDateRanges = () => {
    const now = new Date();

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    return { thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd };
};

const getPercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
};

export const getDashboardAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const cached = await redisClient.get(ANALYTICS_CACHE_KEY);
    if (cached) {
        return res.status(200).json({
            success: true,
            message: "Dashboard analytics fetched successfully",
            data: JSON.parse(cached),
        });
    }

    const { thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd } = getDateRanges();

    const [
        // Inquiries
        inquiriesThisMonth,
        inquiriesLastMonth,
        totalInquiries,
        pendingInquiries,

        // Package views
        viewsThisMonth,
        viewsLastMonth,
        totalViews,

        // Subscribers
        subscribersThisMonth,
        subscribersLastMonth,
        totalSubscribers,
        activeSubscribers,

        // Packages
        totalPackages,
        activePackages,
    ] = await Promise.all([
        // Inquiries this month
        Inquiry.countDocuments({
            createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
        }),

        // Inquiries last month
        Inquiry.countDocuments({
            createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        }),

        // Total Inquiries
        Inquiry.countDocuments(),

        // Pending Inquiries
        Inquiry.countDocuments({ isReplied: false }),

        // Views this month
        TravelPackage.aggregate([
            {
                $match: {
                    updatedAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
                },
            },
            { $group: { _id: null, total: { $sum: "$views" } } },
        ]).then((res) => res[0]?.total ?? 0),

        // Views last month (approximation using updatedAt)
        TravelPackage.aggregate([
            {
                $match: {
                    updatedAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
                },
            },
            { $group: { _id: null, total: { $sum: "$views" } } },
        ]).then((res) => res[0]?.total ?? 0),

        // Total views across all packages
        TravelPackage.aggregate([
            { $group: { _id: null, total: { $sum: "$views" } } },
        ]).then((res) => res[0]?.total ?? 0),

        // Subscribers this month
        Subscriber.countDocuments({
            subscribedAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
        }),

        // Subscribers last month
        Subscriber.countDocuments({
            subscribedAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        }),

        // Total subscribers
        Subscriber.countDocuments(),

        // Active subscribers
        Subscriber.countDocuments({ isActive: true }),

        // Total packages
        TravelPackage.countDocuments(),

        // Active packages
        TravelPackage.countDocuments({ isActive: true }),
    ]);

    const responseData = {
        inquiries: {
            thisMonth: inquiriesThisMonth,
            lastMonth: inquiriesLastMonth,
            total: totalInquiries,
            pending: pendingInquiries,
            percentageChange: getPercentageChange(inquiriesThisMonth, inquiriesLastMonth),
            trend: inquiriesThisMonth >= inquiriesLastMonth ? "up" : "down",
        },
        views: {
            thisMonth: viewsThisMonth,
            lastMonth: viewsLastMonth,
            total: totalViews,
            percentageChange: getPercentageChange(viewsThisMonth, viewsLastMonth),
            trend: viewsThisMonth >= viewsLastMonth ? "up" : "down",
        },
        subscribers: {
            thisMonth: subscribersThisMonth,
            lastMonth: subscribersLastMonth,
            total: totalSubscribers,
            active: activeSubscribers,
            percentageChange: getPercentageChange(subscribersThisMonth, subscribersLastMonth),
            trend: subscribersThisMonth >= subscribersLastMonth ? "up" : "down",
        },
        packages: {
            total: totalPackages,
            active: activePackages,
            inactive: totalPackages - activePackages,
        },
        generatedAt: new Date().toISOString(),
    };

    await redisClient.set(
        ANALYTICS_CACHE_KEY,
        JSON.stringify(responseData),
        "EX",
        ANALYTICS_CACHE_TTL
    );

    return res.status(200).json({
        success: true,
        message: "Dashboard analytics fetched successfully",
        data: responseData,
    });
});