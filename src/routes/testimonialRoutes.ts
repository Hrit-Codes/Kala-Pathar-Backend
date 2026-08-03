import { Router } from "express";
import { isAuthenticated, isAdmin } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createTestimonialSchema, updateTestimonialSchema } from "../validator/testimonial.validate";
import {
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    reorderTestimonials,
    toggleTestimonialActive,
    getAllTestimonials,
    getActiveTestimonials,
} from "../controller/testimonial.controller";

const router = Router();

router.get("/getActive",       getActiveTestimonials);
router.get("/getAll",          isAuthenticated, isAdmin, getAllTestimonials);
router.post("/create",         isAuthenticated, isAdmin, validate(createTestimonialSchema), createTestimonial);
router.put("/update/:id",      isAuthenticated, isAdmin, validate(updateTestimonialSchema), updateTestimonial);
router.delete("/delete/:id",   isAuthenticated, isAdmin, deleteTestimonial);
router.patch("/toggle/:id",    isAuthenticated, isAdmin, toggleTestimonialActive);
router.patch("/reorder",       isAuthenticated, isAdmin, reorderTestimonials);

export default router;