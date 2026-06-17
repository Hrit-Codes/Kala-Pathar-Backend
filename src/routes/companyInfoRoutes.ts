import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware";
import { uploadImage} from "../middleware/upload.middleware";
import { createCompanyInfo, deleteCompanyInfo, getCompanyInfo, updateCompanyInfo } from "../controller/companyInfo.controller";
import { createCompanyInfoSchema, updateCompanyInfoSchema } from "../validator/companyInfo.validate";
import { validate } from "../middleware/validate.middleware";

const router=Router();

router.post("/create",isAuthenticated,isAdmin, uploadImage.single("logo"),validate(createCompanyInfoSchema),createCompanyInfo);
router.get("/getInfo",getCompanyInfo);
router.patch("/update",isAuthenticated,isAdmin,uploadImage.single("logo"),validate(updateCompanyInfoSchema),updateCompanyInfo);
router.delete("/delete",isAuthenticated,isAdmin,deleteCompanyInfo);

export default router;