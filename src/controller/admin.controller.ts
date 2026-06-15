import { Auth } from "../model/auth.model.js";
import { asyncHandler } from "../utils/asyncHandler.js"; 
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

export const authLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Validation: Ensure both fields are provided
  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  // 2. Find user & explicitly select the hidden password field
  const user = await Auth.findOne({ email: email.toLowerCase().trim() }).select("+password");

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password"); 
  }

  // 3. Verify the password using your schema's instance method
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // 4. Ensure the account is active
  if (!user.isActive) {
    res.status(403);
    throw new Error("Your account has been deactivated. Please contact support.");
  }

  // 5. Generate Access and Refresh Tokens
  const accessToken = generateAccessToken({
    _id: user._id as string,
    role: user.role
  });
  
  const refreshToken = generateRefreshToken();

  // 6. Save the refresh token to the database
  user.refresh_token = refreshToken;
  await user.save();

  // 7. Strip the sensitive fields before sending the response
  const secureUser = user.toObject();
  delete secureUser.password;
  delete secureUser.refresh_token;

  // 8. OPTIONAL: Send refresh token inside an HTTP-Only cookie for enhanced security
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true in production
    sameSite: "strict" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days matching your token strategy
  };

  // 9. Send the clean HTTP response back to your client
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions) 
    .json({
      success: true,
      message: "Login successful",
      user: secureUser,
      accessToken 
    });
});