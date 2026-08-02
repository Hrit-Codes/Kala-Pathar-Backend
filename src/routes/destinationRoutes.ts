import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware";
import { createDestination, deleteDestination, getActiveDestinations, getAllDestinations, getDestinationById, toggleDestinationActiveStatus, updateDestination } from "../controller/destination.controller";
import { validate } from "../middleware/validate.middleware";
import { createDestinationSchema, updateDestinationSchema } from "../validator/destination.validate";

const router=Router();

router.post("/create",isAuthenticated,isAdmin,validate(createDestinationSchema), createDestination);
router.delete("/delete/:id",isAuthenticated,isAdmin,deleteDestination);
router.patch("/toggleActiveStatus/:id",isAuthenticated,isAdmin,toggleDestinationActiveStatus);
router.put("/updateDestination/:id",isAuthenticated,isAdmin,validate(updateDestinationSchema), updateDestination);
router.get("/getDestinationById/:id",isAuthenticated,isAdmin,getDestinationById);
router.get("/getAllDestinations",isAuthenticated,isAdmin,getAllDestinations);
router.get("/getActiveDestinations",getActiveDestinations);

export default router;