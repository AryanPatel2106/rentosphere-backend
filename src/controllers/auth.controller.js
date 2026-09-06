import { PendingVerification } from "../models/pendingVerification.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/api-response.js"
import { ApiError } from "../utils/api-error.js"
import { asyncHandler } from "../utils/async-handler.js"
import { sendEmail, emailVerificationMailgenContent, forgotPasswordMailgenContent, contactUsSendEmail, contactUsMailgenContent } from "../utils/sendEmail.js"
import crypto from "crypto"

const registerUser = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if(!email) {
        throw new ApiError(400, "Email is required")
    }

    const existingUser = await User.findOne({ email });

    if(existingUser) {
        throw new ApiError(400, "User with this email already exists")
    }

    await PendingVerification.deleteMany({ email });

    
    const pendingVerification = new PendingVerification({
        email,
    })

    const { unHashedToken, hashedToken, tokenExpiry } = pendingVerification.generateTemporaryToken();

    pendingVerification.tokenHash = hashedToken;
    pendingVerification.expiresAt = new Date(tokenExpiry);
    await pendingVerification.save()

    await pendingVerification.save()

    await sendEmail({
        email,
        subject: "Email Verification",
        mailgenContent: emailVerificationMailgenContent(email, unHashedToken)
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                {email: email},
                "OTP sent successfully. You have 5 minutes to verify."
            )
        )
})

const contactUs = asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    await contactUsSendEmail({
        name,
        email,
        subject,
        mailgenContent: contactUsMailgenContent(name, email, message)
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Message sent successfully."
            )
        );
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { email, token } = req.body;

    if(!email || !token) {
        throw new ApiError(400, "Email and token are required")
    }

    const pendingVerification = await PendingVerification.findOne({ email });

    if(!pendingVerification) {
        throw new ApiError(400, "No pending verification found for this email")
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    if(hashedToken !== pendingVerification.tokenHash) {
        throw new ApiError(400, "Invalid token")
    }

    pendingVerification.isVerified = true;
    await pendingVerification.save()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                {email: email},
                "Email verified successfully."
            )
        )
})

const createUser = asyncHandler(async (req, res) => {
    const { token, password, confirmPassword } = req.body;

    if(!token || !password || !confirmPassword) {
        throw new ApiError(400, "Token, password and confirm password are required")
    }

    if(password !== confirmPassword) {
        throw new ApiError(400, "Password and confirm password do not match")
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const pendingVerification = await PendingVerification.findOne({ tokenHash: hashedToken });

    if(!pendingVerification) {
        throw new ApiError(400, "Invalid token")
    }

    if(!pendingVerification.isVerified) {
        throw new ApiError(400, "Email not verified yet")
    }

    const existingUser = await User.findOne({ email: pendingVerification.email });

    if(existingUser) {
        throw new ApiError(400, "User with this email already exists")
    }

    const newUser = new User({
        email: pendingVerification.email,
        password: password
    })

    await newUser.save()

    await PendingVerification.deleteMany({ email: pendingVerification.email });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201, 
                {email: newUser.email},
                "User registered successfully."
            )
        )
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if(!email || !password) {
        throw new ApiError(400, "Email and password are required")
    }

    const user = await User.findOne({ email });

    if(!user) {
        throw new ApiError(400, "Invalid email or password")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if(!isPasswordCorrect) {
        throw new ApiError(400, "Invalid email or password")
    }

    const accessToken = user.generateAccessToken();

    return res
        .status(200)
        .cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true
        })
        .json(
            new ApiResponse(
                200, 
                {accessToken},
                "User logged in successfully."
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .clearCookie("accessToken")
        .json(
            new ApiResponse(
                200, 
                {},
                "User logged out successfully."
            )
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if(!user) {
        throw new ApiError(404, "User not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                {email: user.email, fullName: user.fullName, mobileNumber: user.mobileNumber, getUpdateOnWhatsApp: user.getUpdateOnWhatsApp},
                "User fetched successfully."
            )
        )
})

const updateCurrentUser = asyncHandler(async (req, res) => {
    const { fullName, mobileNumber, getUpdateOnWhatsApp, email } = req.body;

    const user = await User.findById(req.user._id);

    if(!user) {
        throw new ApiError(404, "User not found")
    }

    if(email && email !== user.email) {

        user.fullName = fullName || user.fullName;
        user.mobileNumber = mobileNumber || user.mobileNumber;
        user.getUpdateOnWhatsApp = getUpdateOnWhatsApp !== undefined ? getUpdateOnWhatsApp : user.getUpdateOnWhatsApp;

        await user.save()

        const existingUser = await User.findOne({ email });

        if(existingUser) {
            throw new ApiError(400, "User with this email already exists")
        }

        await PendingVerification.deleteMany({ email });

        const pendingVerification = new PendingVerification({
            email,
        })

        const { unHashedToken, hashedToken, tokenExpiry } = pendingVerification.generateTemporaryToken();

        pendingVerification.tokenHash = hashedToken;
        pendingVerification.expiresAt = new Date(tokenExpiry);
        await pendingVerification.save()

        await sendEmail({
            email,
            subject: "Email Verification",
            mailgenContent: emailVerificationMailgenContent(email, unHashedToken)
        })

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200, 
                    {email: email, fullName: user.fullName, mobileNumber: user.mobileNumber, getUpdateOnWhatsApp: user.getUpdateOnWhatsApp, emailChanged: true},
                    "OTP sent successfully. You have 5 minutes to verify."
                )
            )

    }

    user.fullName = fullName || user.fullName;
    user.mobileNumber = mobileNumber || user.mobileNumber;
    user.getUpdateOnWhatsApp = getUpdateOnWhatsApp !== undefined ? getUpdateOnWhatsApp : user.getUpdateOnWhatsApp;

    await user.save()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                {email: user.email, fullName: user.fullName, mobileNumber: user.mobileNumber, getUpdateOnWhatsApp: user.getUpdateOnWhatsApp, emailChanged: false},
                "User updated successfully."
            )
        )
})

const udateUserEmail = asyncHandler(async (req, res) => {
    const { token, email } = req.body;

    if(!token || !email) {
        throw new ApiError(400, "Token and email are required")
    }

    const pendingVerification = await PendingVerification.findOne({ email });

    if(!pendingVerification) {
        throw new ApiError(400, "No pending verification found for this email")
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    if(hashedToken !== pendingVerification.tokenHash) {
        throw new ApiError(400, "Invalid token")
    }

    const user = await User.findById(req.user._id);

    if(!user) {
        throw new ApiError(404, "User not found")
    }

    const existingUser = await User.findOne({ email });

    if(existingUser) {
        throw new ApiError(400, "User with this email already exists")
    }


    user.email = email;
    await user.save()

    await PendingVerification.deleteMany({ email: pendingVerification.email });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                {email: user.email},
                "User email updated successfully."
            )
        )
})

const changeUserPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if(!currentPassword || !newPassword || !confirmNewPassword) {
        throw new ApiError(400, "Current password, new password and confirm new password are required")
    }

    const user = await User.findById(req.user._id);

    if(!user) {
        throw new ApiError(404, "User not found")
    }

    const isCurrentPasswordCorrect = await user.isPasswordCorrect(currentPassword);

    if(!isCurrentPasswordCorrect) {
        throw new ApiError(400, "Current password is incorrect")
    }

    if(newPassword !== confirmNewPassword) {
        throw new ApiError(400, "New password and confirm new password do not match")
    }

    user.password = newPassword;
    await user.save()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                {},
                "User password updated successfully."
            )
        )
})

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if(!email) {
        throw new ApiError(400, "Email is required")
    }

    const user = await User.findOne({ email });

    if(!user) {
        throw new ApiError(404, "User not found")
    }

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

    user.passwordResetTokenHash = hashedToken;
    user.passwordResetTokenExpiry = new Date(tokenExpiry);
    await user.save()

    sendEmail({
        email,
        subject: "Forgot Password",
        mailgenContent: forgotPasswordMailgenContent(
            user.fullName, 
            `${process.env.CLIENT_URL || "http://localhost:5000"}/reset-password?token=${unHashedToken}`
        )
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {email: user.email},
                "Password reset email sent successfully. You have 5 minutes to reset your password."
            )
        )
})

const resetPassword = asyncHandler(async (req, res) => {
    const { newPassword, confirmNewPassword, token } = req.body;

    if(!token || !newPassword || !confirmNewPassword) {
        throw new ApiError(400, "Token, new password and confirm new password are required")
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({ passwordResetTokenHash: hashedToken, passwordResetTokenExpiry: { $gt: new Date() } });

    if(!user) {
        throw new ApiError(400, "Invalid or expired token")
    }

    if(newPassword !== confirmNewPassword) {
        throw new ApiError(400, "New password and confirm new password do not match")
    }

    user.password = newPassword;
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpiry = null;
    await user.save()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset successfully."
            )
        )
})

export { registerUser, verifyEmail, createUser, loginUser, logoutUser, getCurrentUser, updateCurrentUser, udateUserEmail, changeUserPassword, forgotPassword, resetPassword, contactUs }
