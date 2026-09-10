import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Property } from "../models/property.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getPlaceCoordinates, searchPlaceCoordinates } from "../services/location.service.js";


const createProperty = asyncHandler(async (req, res) => {

    const {
        owner,
        title,
        Locality,
        bhkType,
        Furnishing,
        Availability,
        parking,
        petFriendly,
        description,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    let location = undefined;
    if (Locality?.location?.coordinates?.length === 2) {
        location = Locality.location;
    } else if (Locality?.placeId) {
        const coords = await getPlaceCoordinates(Locality.placeId);
        if (coords?.longitude !== undefined && coords?.latitude !== undefined) {
            location = {
                type: "Point",
                coordinates: [coords.longitude, coords.latitude]
            };
        }
    }

    const property = await Property.create({
        owner: user._id,
        title,
        locality: Locality,
        location,
        BHKType: bhkType,
        Furnishing,
        Availability,
        Parking: parking,
        PetFriendly: petFriendly,
        description,
    });


    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                property,
                "Property created successfully"
            )
        );
});


const getProperties = asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), 50);
    const skip = (page - 1) * limit;

    const {
        placeId,
        place,
        query,
        q,
        lat,
        lng,
        latitude,
        longitude
    } = req.query;

    let searchCoordinates = null;

    // 1. Direct coordinates passed
    const userLat = lat || latitude;
    const userLng = lng || longitude;
    if (userLat !== undefined && userLng !== undefined && !isNaN(Number(userLat)) && !isNaN(Number(userLng))) {
        searchCoordinates = {
            latitude: Number(userLat),
            longitude: Number(userLng)
        };
    }

    // 2. If placeId passed, get coordinates
    if (!searchCoordinates && placeId) {
        searchCoordinates = await getPlaceCoordinates(placeId);
    }

    // 3. If place or text query passed, get coordinates
    const searchText = place || query || q;
    if (!searchCoordinates && searchText) {
        searchCoordinates = await searchPlaceCoordinates(searchText);
    }

    // If coordinates are available, perform $geoNear to return nearest properties
    if (searchCoordinates?.latitude !== undefined && searchCoordinates?.longitude !== undefined) {
        const pipeline = [
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [Number(searchCoordinates.longitude), Number(searchCoordinates.latitude)]
                    },
                    distanceField: "distance",
                    spherical: true,
                    query: {
                        owner: { $exists: true, $ne: null }
                    }
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    locality: 1,
                    location: 1,
                    BHKType: 1,
                    Furnishing: 1,
                    Availability: 1,
                    Parking: 1,
                    PetFriendly: 1,
                    description: 1,
                    distance: 1,
                    owner: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ];

        const properties = await Property.aggregate(pipeline);
        const total = await Property.countDocuments({
            owner: { $exists: true, $ne: null },
            "location.coordinates": { $exists: true }
        });
        const hasMore = skip + properties.length < total;

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    properties,
                    page,
                    limit,
                    total,
                    hasMore,
                    searchLocation: searchCoordinates
                },
                "Nearest properties fetched successfully"
            )
        );
    }

    // Default fallback when no place or coordinates provided: return latest properties created by users
    const properties = await Property.find({
        owner: { $exists: true, $ne: null }
    })
        .sort({
            createdAt: -1
        })
        .skip(skip)
        .limit(limit);

    const total = await Property.countDocuments({
        owner: { $exists: true, $ne: null }
    });
    const hasMore = skip + properties.length < total;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                properties,
                page,
                limit,
                total,
                hasMore
            },
            "Properties fetched successfully"
        )
    );
});



const getPropertyById = asyncHandler(async (req, res) => {

    const { propertyId } = req.params;


    const property = await Property.findById(propertyId);


    if (!property) {
        throw new ApiError(
            404,
            "Property not found"
        );
    }


    await Property.findByIdAndUpdate(
        propertyId,
        {
            $inc: {
                views: 1
            }
        }
    );


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                property,
                "Property fetched successfully"
            )
        );
});


const getMyProperties = asyncHandler(async (req, res) => {

    const properties = await Property
        .find({
            owner: req.user._id
        })
        .sort({
            createdAt: -1
        });


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                properties,
                "Your properties fetched successfully"
            )
        );
});


const updateProperty = asyncHandler(async (req, res) => {

    const { propertyId } = req.params;


    const property = await Property.findById(
        propertyId
    );


    if (!property) {
        throw new ApiError(
            404,
            "Property not found"
        );
    }


    if (
        property.owner.toString() !==
        req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "You are not allowed to update this property"
        );
    }


    const updatedProperty =
        await Property.findByIdAndUpdate(
            propertyId,
            {
                $set: req.body
            },
            {
                new: true,
                runValidators: true
            }
        );


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedProperty,
                "Property updated successfully"
            )
        );
});


const deleteProperty = asyncHandler(async (req, res) => {

    const { propertyId } = req.params;


    const property = await Property.findById(
        propertyId
    );


    if (!property) {
        throw new ApiError(
            404,
            "Property not found"
        );
    }


    if (
        property.owner.toString() !==
        req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "You are not allowed to delete this property"
        );
    }


    await Property.findByIdAndUpdate(
        propertyId,
        {
            status: "inactive"
        }
    );


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Property deleted successfully"
            )
        );
});


export {
    createProperty,
    getProperties,
    getPropertyById,
    getMyProperties,
    updateProperty,
    deleteProperty
};