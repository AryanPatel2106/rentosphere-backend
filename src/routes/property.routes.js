import { Router } from "express";

import {
    createProperty,
    getProperties,
    getPropertyById,
    getMyProperties,
    updateProperty,
    deleteProperty,
    toggleShortlist,
    getShortlists,
    createRentalRequest,
    getOwnerRentalRequests,
    getTenantRentalRequests,
    acceptRentalRequest,
    rejectRentalRequest,
    getActiveRentedProperties,
    endLease,
    recordOfflinePayment,
    createRazorpayOrder,
    verifyRazorpayPayment,
    getUploadPresignedUrl,
    uploadImageDirect
} from "../controllers/property.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = Router();

// Public routes
router.get("/get-properties", getProperties);
router.get("/property-info/:propertyId", getPropertyById);

// Protected routes
router.post("/", verifyJWT, createProperty);
router.get("/my-properties", verifyJWT, getMyProperties);
router.put("/:propertyId", verifyJWT, updateProperty);
router.delete("/:propertyId", verifyJWT, deleteProperty);

// Shortlist routes
router.post("/shortlist/:propertyId", verifyJWT, toggleShortlist);
router.get("/shortlists", verifyJWT, getShortlists);

// Rental Request & Booking routes
router.post("/rental-request", verifyJWT, createRentalRequest);
router.get("/owner-requests", verifyJWT, getOwnerRentalRequests);
router.get("/tenant-requests", verifyJWT, getTenantRentalRequests);
router.put("/rental-request/:requestId/accept", verifyJWT, acceptRentalRequest);
router.put("/rental-request/:requestId/reject", verifyJWT, rejectRentalRequest);

// Active Rented & Lease management
router.get("/active-rented", verifyJWT, getActiveRentedProperties);
router.put("/:propertyId/end-lease", verifyJWT, endLease);

// Payment tracking (Offline + Razorpay Simulated Online)
router.post("/rental-request/:requestId/record-payment", verifyJWT, recordOfflinePayment);
router.post("/payment/create-order", verifyJWT, createRazorpayOrder);
router.post("/payment/verify", verifyJWT, verifyRazorpayPayment);

// Image Upload routes (S3)
router.post("/upload-url", verifyJWT, getUploadPresignedUrl);
router.post("/upload-image", verifyJWT, upload.single("image"), uploadImageDirect);

export default router;