import { Router } from "express";
import { isAuthenticated, isAdmin } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { uploadMedia } from "../middleware/upload.middleware";
import { createHeroSectionSchema, updateHeroSectionSchema } from "../validator/heroSection.validate";
import {
    createHeroSection,
    getAllHeroSections,
    getHeroSectionById,
    updateHeroSection,
    deleteHeroSection,
    toggleHeroSectionActive,
    getActiveHeroSections,
} from "../controller/heroSection.controller";

const router = Router();

router.get("/getActive",getActiveHeroSections);
router.get("/getAll",   isAuthenticated,isAdmin, getAllHeroSections);
router.get("/get/:id",  isAuthenticated,isAdmin,getHeroSectionById);

router.post(
    "/create",
    isAuthenticated,
    isAdmin,
    uploadMedia.single("media"),
    validate(createHeroSectionSchema),
    createHeroSection
);

router.put(
    "/update/:id",
    isAuthenticated,
    isAdmin,
    uploadMedia.single("media"),
    validate(updateHeroSectionSchema),
    updateHeroSection
);

router.delete("/delete/:id",  isAuthenticated, isAdmin, deleteHeroSection);
router.patch("/toggle/:id",   isAuthenticated, isAdmin, toggleHeroSectionActive);

export default router;
