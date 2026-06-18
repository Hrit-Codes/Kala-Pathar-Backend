import { Router } from "express";
import { validate } from "../middleware/validate.middleware";
import { createWhyChooseUsSchema, updateWhyChooseUsSchema } from "../validator/whyChooseUs.validate";
import { createWhyChooseUs, deleteWhyChooseUs, getActiveWhyChooseUs, getAllWhyChooseUs, updateWhyChooseUs } from "../controller/whyChooseUs.controller";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware";
import { toggleActiveStatus } from "../controller/packagetype.controller";

const router=Router();

router.post("/create",isAuthenticated, isAdmin, validate(createWhyChooseUsSchema),createWhyChooseUs);
router.put("/update/:id",isAuthenticated, isAdmin, validate(updateWhyChooseUsSchema),updateWhyChooseUs);
router.delete("/delete/:id",isAuthenticated, isAdmin, deleteWhyChooseUs);
router.patch("/toggleActiveStatus/:id",isAuthenticated,isAdmin, toggleActiveStatus);
router.get("/getAll",isAuthenticated,isAdmin,getAllWhyChooseUs);
router.get("/getActive",getActiveWhyChooseUs)

export default router;