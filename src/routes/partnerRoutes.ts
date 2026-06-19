import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware";
import { uploadImage } from "../middleware/upload.middleware";
import { validate } from "../middleware/validate.middleware";
import { addAffiliation, createPartnerSection, deleteAffiliation, getPartnerSection, updateAffiliation, updatePartnerSection } from "../controller/partner.controller";
import { addAffiliationSchema, createPartnerSectionSchema, updateAffiliationSchema, updatePartnerSectionSchema } from "../validator/partner.validate";

const router = Router();

// Section-level
router.post("/create", isAuthenticated, isAdmin, validate(createPartnerSectionSchema), createPartnerSection);
router.get("/getSection", getPartnerSection);
router.put("/update", isAuthenticated, isAdmin, validate(updatePartnerSectionSchema), updatePartnerSection);

// Affiliation item-level
router.post("/affiliation/add", isAuthenticated, isAdmin, uploadImage.single("logo"), validate(addAffiliationSchema), addAffiliation);
router.put("/affiliation/update/:id", isAuthenticated, isAdmin, uploadImage.single("logo"), validate(updateAffiliationSchema), updateAffiliation);
router.delete("/affiliation/delete/:id", isAuthenticated, isAdmin, deleteAffiliation);

export default router;