import { Router } from "express";
import { createPackageType, deletePackageType, getPackageTypeById, getPackageTypes, toggleActiveStatus, updatePackageType } from "../controller/packagetype.controller";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware";

const router=Router();

router.post("/create",isAuthenticated,isAdmin,createPackageType);
router.delete("/delete/:id",isAuthenticated,isAdmin,deletePackageType);
router.patch("/toggleActiveStatus/:id",isAuthenticated,isAdmin,toggleActiveStatus);
router.put("/updatePackageType/:id",isAuthenticated,isAdmin,updatePackageType);
router.get("/getPackageTypeById/:id",isAuthenticated,isAdmin,getPackageTypeById);
router.get("/getPackageTypes",getPackageTypes);

export default router;