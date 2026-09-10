import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    locality: {
        type: Object,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: undefined
        }
    },
    BHKType: {
        type: String,
        enum: ["","BHK Type","1RK","1BHK", "2BHK", "3BHK", "4BHK"],
        required: true
    },
    Furnishing: {
        type: String,
        enum: ["","Furnishing", "Fully Furnished", "Semi-Furnished", "Unfurnished"],
        required: true
    },
    Availability: {
        type: String,
        enum: ["Availability", "Immediate", "Within 15 Days", "Within 30 Days"],
        required: true
    },
    Parking: {
        type: Boolean,
        default: false,
        required: true
    },
    PetFriendly: {
        type: Boolean,
        default: false,
        required: true
    },
    description: {
        type: String,
        required: true
    },

}, { timestamps: true });

propertySchema.index({ location: "2dsphere" }, { sparse: true });

const Property = mongoose.model("Property", propertySchema);

export { Property };