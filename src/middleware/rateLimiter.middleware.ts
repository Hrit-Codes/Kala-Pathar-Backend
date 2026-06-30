import { RateLimiterRedis } from "rate-limiter-flexible";
import { redisClient } from "../config/redis";
import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

const loginLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "rl_login",
    points: 5, // 5 login attempts
    duration: 60, // per minute
    blockDuration: 300, // block for 5 minutes after limit hit
});

const inquiryLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "rl_inquiry",
    points: 3, // 3 inquiries
    duration: 3600, // per hour
    blockDuration: 3600, // block for 1 hour after limit hit
});

const globalLimiter= new RateLimiterRedis({
    storeClient:redisClient,
    keyPrefix:"rl_global",
    points:300, // 300 request  
    duration:60, // per minute
    blockDuration:180 // block if 3 minutes if exceeded
})

const createLimiterMiddleware = (limiter: RateLimiterRedis, message: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const key = req.ip ?? "unknown";
            await limiter.consume(key);
            next();
        } catch (rejRes: any) {
            const retrySecs = Math.ceil((rejRes?.msBeforeNext ?? 60000) / 1000);
            res.set("Retry-After", String(retrySecs));
            next(new ApiError(429, `${message} (retry after ${retrySecs}/s)`));
        }
    };
};

export const loginRateLimiter = createLimiterMiddleware(
    loginLimiter,
    "Too many login attempts. Please try again later"
);

export const inquiryRateLimiter = createLimiterMiddleware(
    inquiryLimiter,
    "Too many inquiries submitted. Please try again later"
);

export const globalRateLimiter= createLimiterMiddleware(
    globalLimiter,
    "Too many requests. Please slow down"
)