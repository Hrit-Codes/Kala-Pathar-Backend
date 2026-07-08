import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware";
import { getAllCampaigns, getCampaignById, sendCampaign } from "../controller/campaign.controller";
import { uploadCampaignAttachments } from "../middleware/upload.middleware";

const router=Router();

router.post("/send",isAuthenticated, isAdmin,uploadCampaignAttachments.array("attachments",3), sendCampaign);
router.get("/",isAuthenticated, isAdmin, getAllCampaigns);
router.get(':id',isAuthenticated,isAdmin,getCampaignById);

export default router;
