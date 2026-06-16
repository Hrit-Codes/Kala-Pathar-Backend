import { Router } from "express";
import { authLogin, authLogout } from "../controller/auth.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

const router = Router();

router.post("/login",authLogin);

router.post("/logout",isAuthenticated, authLogout);

export default router;
