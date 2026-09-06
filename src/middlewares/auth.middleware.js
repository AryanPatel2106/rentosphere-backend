import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken"


export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken

    if(!token){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -twoFactorSecret")
        
        if(!user){
            throw new ApiError(401, "invalid Access Token")
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, "invalid Access Token")
    }
})
