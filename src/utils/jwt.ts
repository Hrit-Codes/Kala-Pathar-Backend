import jwt from "jsonwebtoken";
import * as crypto from "crypto";

import type { userTokenDetails } from "../types";
import { loadEnv } from "../config/env";

export const generateAccessToken = (userDetails: userTokenDetails): string => {
  try {
    const payload = {
      _id: userDetails._id,
      role: userDetails.role,
    };

    const secret = loadEnv.ACCESS_TOKEN_SECRET;
    const expiry = loadEnv.ACCESS_TOKEN_EXPIRY as any;

    if (!secret) {
      throw new Error("Token Generation Secret Credentials Not Found");
    }

    if (!expiry) {
      throw new Error("Token Expiry Time Not Available");
    }
    const accessToken = jwt.sign(payload, secret, {
      expiresIn: expiry,
    });
    return accessToken;
  } catch (error) {
    throw new Error("Access Token Generation Failed");
  }
};

export const generateRefreshToken = (): string => {
  try {
    const refreshToken = crypto.randomBytes(64).toString("hex");
    return refreshToken;
  } catch (error) {
    throw new Error();
  }
};
