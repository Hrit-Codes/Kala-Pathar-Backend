import { redisClient } from "../config/redis";
import { Auth } from "../model/auth.model";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

export const authLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await Auth.findOne({ email: email.toLowerCase().trim() }).select(
    "+password"
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated. Please contact support.");
  }

  const accessToken = generateAccessToken({
    _id: user._id,
    role: user.role,
  });

  const refreshToken = generateRefreshToken();

  await redisClient.set(
    `refresh:${refreshToken}`,
    String(user._id),
    "EX",
    7*24*60*60
  )

  const secureUser = user.toObject();
  delete (secureUser as { password?: string }).password;

  const accessTokenCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 15 * 60 * 1000, // 15 minutes — short-lived
  };

  const refreshTokenCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — long-lived
  };

  return res
    .status(200)
    .cookie("access_token", accessToken, accessTokenCookieOptions)
    .cookie("refresh_token", refreshToken, refreshTokenCookieOptions)
    .json({
      success: true,
      message: "Login successful",
      user: secureUser,
      accessToken,
    });
});


export const authLogout = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refresh_token;

  if(incomingRefreshToken){
    await redisClient.del(`refresh:${incomingRefreshToken}`)
  }
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken",cookieOptions)
    .json({
      success: true,
      message: "Logout successful",
    });
});