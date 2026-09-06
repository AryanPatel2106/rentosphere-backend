import { Router } from "express";

import {
    createProperty,
    getProperties,
    getPropertyById,
    getMyProperties,
    updateProperty,
    deleteProperty
} from "../controllers/property.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();


// Public routes

router.get(
    "/get-properties",
    getProperties
);


router.get(
    "/property-info/:propertyId",
    getPropertyById
);


// Protected routes

router.post(
    "/",
    verifyJWT,
    createProperty
);


router.get(
    "/my-properties",
    verifyJWT,
    getMyProperties
);


router.put(
    "/:propertyId",
    verifyJWT,
    updateProperty
);


router.delete(
    "/:propertyId",
    verifyJWT,
    deleteProperty
);


export default router;