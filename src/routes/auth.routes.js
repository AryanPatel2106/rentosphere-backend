import { Router } from "express";
import {
    registerUser,
    verifyEmail, 
    createUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    updateCurrentUser,
    udateUserEmail,
    changeUserPassword,
    forgotPassword,
    resetPassword,
    contactUs
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    registerUser
);

router.route("/contact-us").post(
    contactUs
);

router.route("/verify-email").post(
    verifyEmail
);

router.route("/create-user").post(
    createUser
);

router.route("/login").post(
    loginUser
);

router.route("/logout").post(
    logoutUser
);

router.route("/forgot-password").post(
    forgotPassword
)

router.route("/reset-password").post(
    resetPassword
)

// protected route, requires valid JWT token
router.route("/current-user").get(
    verifyJWT,
    getCurrentUser
)

router.route("/update-current-user").put(
    verifyJWT,
    updateCurrentUser
)

router.route("/update-user-email").put(
    verifyJWT,
    udateUserEmail
)

router.route("/change-user-password").put(
    verifyJWT,
    changeUserPassword
)

export default router;