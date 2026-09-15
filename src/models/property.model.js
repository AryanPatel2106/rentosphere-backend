import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
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
        rent: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        deposit: {
            type: Number,
            default: 0,
            min: 0
        },
        propertyType: {
            type: String,
            enum: ["Apartment", "Independent House", "Villa", "Builder Floor", "Studio", "PG/Co-living"],
            default: "Apartment"
        },
        BHKType: {
            type: String,
            enum: ["1RK", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK+"],
            required: true
        },
        Furnishing: {
            type: String,
            enum: ["Fully Furnished", "Semi-Furnished", "Unfurnished"],
            required: true
        },
        preferredTenant: {
            type: String,
            enum: ["Anyone", "Family", "Bachelors", "Company"],
            default: "Anyone"
        },
        Availability: {
            type: String,
            enum: ["Immediate", "Within 15 Days", "Within 30 Days", "After 30 Days"],
            default: "Immediate",
            required: true
        },
        builtUpArea: {
            type: Number,
            default: 0,
            min: 0
        },
        bathrooms: {
            type: Number,
            default: 1,
            min: 1
        },
        balconies: {
            type: Number,
            default: 0,
            min: 0
        },
        floor: {
            type: Number,
            default: 0
        },
        totalFloors: {
            type: Number,
            default: 0
        },
        Parking: {
            type: Boolean,
            default: false
        },
        PetFriendly: {
            type: Boolean,
            default: false
        },
        photos: {
            type: [String],
            default: []
        },
        amenities: {
            type: [String],
            default: []
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: ["active", "inactive", "rented"],
            default: "active"
        },
        views: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

propertySchema.index({ location: "2dsphere" }, { sparse: true });
propertySchema.index({
    title: "text",
    description: "text",
    "locality.text": "text",
    "locality.label": "text"
});
propertySchema.index({ rent: 1, BHKType: 1, status: 1 });
propertySchema.index({ status: 1, createdAt: -1 });

const Property = mongoose.model("Property", propertySchema);

export { Property };