import { Router } from "express";
import { getDashboardAnalytics } from "../controller/analytics.controller";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware";

const router=Router();

router.get("/dashboard",isAuthenticated,isAdmin,getDashboardAnalytics);

export default router;