import { Router } from "express";
import { createInquiry, deleteInquiry, getAllInquiry, getInquiryById } from "../controller/inquiry.controller";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createInquirySchema } from "../validator/inquiry.validate";

const router=Router();

router.post("/create",isAuthenticated, isAdmin, validate(createInquirySchema), createInquiry);
router.delete("/:id",isAuthenticated,isAdmin, deleteInquiry);
router.get("/getById/:id",isAuthenticated,isAdmin,getInquiryById);
router.get("/getAll",isAuthenticated,isAdmin,getAllInquiry);