import mongoose, {Schema} from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { type } from "os";

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        default: null
    },
    fullName: {
        type: String,
        default: null
    },
    mobileNumber: {
        type: String,
        default: null
    },
    getUpdateOnWhatsApp: {
        type: Boolean,
        default: false
    },
    passwordResetTokenHash: {
        type: String,
        default: null
    },
    passwordResetTokenExpiry: {
        type: Date,
        default: null
    }
}, {timestamps: true});

userSchema.pre("save", async function(){
    if(!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10)

})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
    )
}

userSchema.methods.generateTemporaryToken = function(){
    const unHashedToken = crypto.randomBytes(6).toString("hex")

    const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex")

    const tokenExpiry = Date.now() + (5*60*1000)  // 5 min

    return {unHashedToken, hashedToken, tokenExpiry}
}

export const User = mongoose.model('User', userSchema);