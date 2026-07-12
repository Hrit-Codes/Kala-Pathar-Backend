import { Router } from "express";
import { checkSubscriptionStatus, getAllSubscribers, subscribe, unsubscribe } from "../controller/subscriber.controller";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware";

const router=Router();

router.post("/subscribe",subscribe);
router.get("/check",checkSubscriptionStatus);
router.patch("/unsubscribe",unsubscribe);
router.get("/",isAuthenticated, isAdmin, getAllSubscribers);

export default router;