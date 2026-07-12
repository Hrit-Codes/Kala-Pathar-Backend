import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware";
import { uploadImage } from "../middleware/upload.middleware";
import { validate } from "../middleware/validate.middleware";
import {
    createTravelPackage,
    updateTravelPackage,
    deleteTravelPackage,
    toggleFeaturedStatus,
    toggleActiveStatus,
    getTravelPackageBySlug,
    getAllTravelPackages,
    getAllActiveTravelPackages,
    getTravelPackageById,
} from "../controller/package.controller";
import {
    createTravelPackageSchema,
    updateTravelPackageSchema,
} from "../validator/travelPackage.validate";

const router = Router();

// Public
router.get("/getActivePackages", getAllActiveTravelPackages);
router.get("/slug/:slug", getTravelPackageBySlug);

// Admin - Package CRUD
router.post(
    "/create",
    isAuthenticated,
    isAdmin,
    uploadImage.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "gallery", maxCount: 10 },
    ]),
    validate(createTravelPackageSchema),
    createTravelPackage
);

router.put(
    "/update/:id",
    isAuthenticated,
    isAdmin,
    uploadImage.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "gallery", maxCount: 10 },
    ]),
    validate(updateTravelPackageSchema),
    updateTravelPackage
);

router.delete("/delete/:id", isAuthenticated, isAdmin, deleteTravelPackage);

// Admin - Toggle actions
router.patch("/featured/:id", isAuthenticated, isAdmin, toggleFeaturedStatus);
router.patch("/active/:id", isAuthenticated, isAdmin, toggleActiveStatus);

//Admin - Get
router.get("/getAllPackages",isAuthenticated,isAdmin,getAllTravelPackages);
router.get(`/:id`,isAuthenticated,isAdmin,getTravelPackageById);

export default router;