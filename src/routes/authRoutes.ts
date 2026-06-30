import { Router } from "express";
import { authLogin, authLogout } from "../controller/auth.controller";
import { isAuthenticated } from "../middleware/auth.middleware";
import { loginRateLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();

router.post("/login",loginRateLimiter, authLogin);

router.post("/logout",isAuthenticated, authLogout);

export default router;
