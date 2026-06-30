import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import type { userTokenDetails } from "../types/index";
import { loadEnv } from "../config/env";
import jwt from "jsonwebtoken";
import { Auth } from "../model/auth.model";


export const isAuthenticated = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Get token from cookies or Authorization header
    const authHeader = req.headers.authorization;
    
    const token =
      req.cookies?.access_token || 
      req.cookies?.accessToken ||
      (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined);

    // 2. Check if token exists
    if (!token) {
      throw new ApiError(401, "Access token missing. Please login first.");
    }

    let decoded: userTokenDetails;

    // 3. Verify token
    try {
      decoded = jwt.verify(
        token,
        loadEnv.ACCESS_TOKEN_SECRET
      ) as unknown as userTokenDetails;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(401, "Access token expired. Please login again.");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, "Invalid access token.");
      }
      throw new ApiError(401, "Authentication failed.");
    }

    // 4. Validate decoded token has required fields
    if (!decoded._id || !decoded.role) {
      throw new ApiError(401, "Invalid token payload.");
    }

    // 5. Check if user still exists in database
    const user = await Auth.findById(decoded._id)
      .select("-password ");

    if (!user) {
      throw new ApiError(401, "User no longer exists.");
    }

    // 6. Check if user is active
    if (!user.isActive) {
      throw new ApiError(403, "Your account has been deactivated. Please contact support.");
    }

    // 7. Attach user to request
    req.auth = decoded;
    req.user = user;

    next();
  }
);

export const isAdmin = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      throw new ApiError(401, "Authentication required");
    }

    if (req.auth.role !== "admin") {
      throw new ApiError(403, "Access denied. Admin privileges required.");
    }

    next();
  }
);