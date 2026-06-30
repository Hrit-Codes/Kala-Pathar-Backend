import { Router } from "express";
import { createInquiry, deleteInquiry, getAllInquiry, getInquiryById, replyToInquiry } from "../controller/inquiry.controller";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createInquirySchema, replyToInquirySchema } from "../validator/inquiry.validate";
import { inquiryRateLimiter } from "../middleware/rateLimiter.middleware";

const router=Router();

router.post("/create",inquiryRateLimiter, validate(createInquirySchema), createInquiry);
router.delete("/:id",isAuthenticated,isAdmin, deleteInquiry);
router.get("/getById/:id",isAuthenticated,isAdmin,getInquiryById);
router.get("/getAll",isAuthenticated,isAdmin,getAllInquiry);
router.post("/reply/:id",isAuthenticated,isAdmin,validate(replyToInquirySchema),replyToInquiry);

export default router;