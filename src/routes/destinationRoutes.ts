import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware";
import { createDestination, deleteDestination, getDestinationById, getDestinations, toggleDestinationActiveStatus, updateDestination } from "../controller/destination.controller";

const router=Router();

router.post("/create",isAuthenticated,isAdmin,createDestination);
router.delete("/delete/:id",isAuthenticated,isAdmin,deleteDestination);
router.patch("/toggleActiveStatus/:id",isAuthenticated,isAdmin,toggleDestinationActiveStatus);
router.put("/updateDestination/:id",isAuthenticated,isAdmin,updateDestination);
router.get("/getDestinationById/:id",isAuthenticated,isAdmin,getDestinationById);
router.get("/getDestinations",isAuthenticated,isAdmin,getDestinations);

export default router;