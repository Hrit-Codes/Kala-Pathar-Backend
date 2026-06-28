import { Router } from "express";
import { uploadImage } from "../middleware/upload.middleware";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware";
import { createAboutUsSchema, updateAboutUsSchema } from "../validator/aboutUs.validate";
import { createAboutUs, getAboutUs, updateAboutUs } from "../controller/aboutUs.controller";
import { validate } from "../middleware/validate.middleware";

const router= Router();

const aboutUsUpload= uploadImage.fields([
    {name:"heroImage",maxCount:1},
    {name:"ceoPhoto",maxCount:1}
]);

router.post("/create",isAuthenticated, isAdmin, aboutUsUpload, validate(createAboutUsSchema), createAboutUs);
router.put("/update",isAuthenticated,isAdmin, aboutUsUpload, validate(updateAboutUsSchema), updateAboutUs);
router.get("/getInfo",getAboutUs)

export default router;