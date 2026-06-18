import { Router } from "express";
import { validate } from "../middleware/validate.middleware";
import { createWhyChooseUsSchema, updateWhyChooseUsSchema } from "../validator/whyChooseUs.validate";
import { createWhyChooseUs,  getAllWhyChooseUs, updateWhyChooseUs } from "../controller/whyChooseUs.controller";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware";

const router=Router();

router.post("/create",isAuthenticated, isAdmin, validate(createWhyChooseUsSchema),createWhyChooseUs);
router.put("/update/:id",isAuthenticated, isAdmin, validate(updateWhyChooseUsSchema),updateWhyChooseUs);
router.get("/getAll",getAllWhyChooseUs);

export default router;