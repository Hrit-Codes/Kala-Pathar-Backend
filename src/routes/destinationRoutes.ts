import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { createDestination } from "../controller/destination.controller";

const router=Router();

router.post("/create",isAuthenticated,createDestination);

export default router;