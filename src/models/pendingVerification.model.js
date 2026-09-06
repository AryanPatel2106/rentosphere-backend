import mongoose from "mongoose";
import crypto from "crypto";

const pendingVerificationSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        tokenHash: {
            type: String,
            required: true
        },

        expiresAt: {
            type: Date,
            required: true,
            expires: 0
        }
    },
    {
        timestamps: true
    }
);

pendingVerificationSchema.methods.generateTemporaryToken = function(){
    const unHashedToken = crypto.randomBytes(6).toString("hex")

    const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex")

    const tokenExpiry = Date.now() + (5*60*1000)  // 5 min

    return {unHashedToken, hashedToken, tokenExpiry}
}

export const PendingVerification = mongoose.model(
    "PendingVerification",
    pendingVerificationSchema
);