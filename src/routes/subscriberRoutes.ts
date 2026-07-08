import { Router } from "express";
import { getAllSubscribers, subscribe, unsubscribeByEmail } from "../controller/subscriber.controller";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware";

const router=Router();

router.post("/subscribe",subscribe);
router.get("/unsubscribe/:token",unsubscribeByEmail);
router.get("/",isAuthenticated, isAdmin, getAllSubscribers);

export default router;