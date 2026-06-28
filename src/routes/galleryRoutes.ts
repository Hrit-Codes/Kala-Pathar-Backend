import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware";
import { uploadImage } from "../middleware/upload.middleware";
import { createGallery, getAllGallery, getGalleryById, updateGallery } from "../controller/gallery.Controller";
import { createGallerySchema, updateGallerySchema } from "../validator/gallery.validate";
import { validate } from "../middleware/validate.middleware";

const router=Router();

router.post("/create", isAuthenticated, isAdmin, uploadImage.single("image"),validate(createGallerySchema), createGallery);
router.put("/update/:id",isAuthenticated,isAdmin,uploadImage.single("image"),validate(updateGallerySchema), updateGallery);
router.get("/getById/:id",isAuthenticated,isAdmin,getGalleryById);
router.get("/getAll", getAllGallery);

export default router;

