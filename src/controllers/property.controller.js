import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Property } from "../models/property.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getPlaceCoordinates, searchPlaceCoordinates } from "../services/location.service.js";


const normalizeBhk = (val) => {
    if (!val) return undefined;
    const clean = val.replace(/\s+/g, "").toUpperCase();
    return clean;
};

const normalizeFurnishing = (val) => {
    if (!val) return undefined;
    if (val.toLowerCase().includes("semi")) return "Semi-Furnished";
    if (val.toLowerCase().includes("fully")) return "Fully Furnished";
    if (val.toLowerCase().includes("unfurn")) return "Unfurnished";
    return val;
};

const createProperty = asyncHandler(async (req, res) => {
    const {
        title,
        Locality,
        locality,
        rent,
        deposit,
        propertyType,
        bhkType,
        BHKType,
        Furnishing,
        furnishing,
        Availability,
        availability,
        preferredTenant,
        tenantType,
        builtUpArea,
        bathrooms,
        balconies,
        floor,
        totalFloors,
        parking,
        Parking,
        petFriendly,
        PetFriendly,
        photos,
        amenities,
        description,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const selectedLocality = Locality || locality;
    if (!selectedLocality) {
        throw new ApiError(400, "Locality is required");
    }

    let location = undefined;
    if (selectedLocality?.location?.coordinates?.length === 2) {
        location = selectedLocality.location;
    } else if (selectedLocality?.placeId) {
        const coords = await getPlaceCoordinates(selectedLocality.placeId);
        if (coords?.longitude !== undefined && coords?.latitude !== undefined) {
            location = {
                type: "Point",
                coordinates: [coords.longitude, coords.latitude]
            };
        }
    }

    const cleanBhk = normalizeBhk(bhkType || BHKType) || "1BHK";
    const cleanFurn = normalizeFurnishing(Furnishing || furnishing) || "Unfurnished";
    const cleanAvail = Availability || availability || "Immediate";
    const cleanType = propertyType || "Apartment";
    const cleanTenant = preferredTenant || tenantType || "Anyone";
    const hasParking = parking !== undefined ? Boolean(parking) : (Parking !== undefined ? Boolean(Parking) : false);
    const isPetFriendly = petFriendly !== undefined ? Boolean(petFriendly) : (PetFriendly !== undefined ? Boolean(PetFriendly) : false);

    const property = await Property.create({
        owner: user._id,
        title: title?.trim() || "Rental Property",
        locality: selectedLocality,
        location,
        rent: Number(rent) || 0,
        deposit: Number(deposit) || 0,
        propertyType: cleanType,
        BHKType: cleanBhk,
        Furnishing: cleanFurn,
        preferredTenant: cleanTenant,
        Availability: cleanAvail,
        builtUpArea: Number(builtUpArea) || 0,
        bathrooms: Math.max(1, Number(bathrooms) || 1),
        balconies: Number(balconies) || 0,
        floor: Number(floor) || 0,
        totalFloors: Number(totalFloors) || 0,
        Parking: hasParking,
        PetFriendly: isPetFriendly,
        photos: Array.isArray(photos) ? photos : (photos ? [photos] : []),
        amenities: Array.isArray(amenities) ? amenities : [],
        description: description?.trim() || "No description provided",
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
        longitude,
        search,
        keyword,
        bhkType,
        furnishing,
        propertyType,
        preferredTenant,
        tenantType,
        availability,
        minRent,
        maxRent,
        parking,
        petFriendly,
        sortBy
    } = req.query;

    // ── Build Filter Query ──────────────────────────────────────────────────────
    const filterQuery = {
        owner: { $exists: true, $ne: null },
        status: { $ne: "inactive" }
    };

    // Text / keyword filter
    const textSearch = search || keyword;
    if (textSearch && textSearch.trim()) {
        const regex = new RegExp(textSearch.trim(), "i");
        filterQuery.$or = [
            { title: { $regex: regex } },
            { description: { $regex: regex } },
            { "locality.label": { $regex: regex } },
            { "locality.text": { $regex: regex } },
            { "locality.city": { $regex: regex } }
        ];
    }

    // BHK Type filter (supports multi-select comma separated)
    if (bhkType && bhkType !== "All" && bhkType !== "BHK Type") {
        const bhkArr = bhkType
            .split(",")
            .map((b) => normalizeBhk(b.trim()))
            .filter(Boolean);
        if (bhkArr.length > 0) {
            filterQuery.BHKType = { $in: bhkArr };
        }
    }

    // Furnishing filter
    const activeFurnishing = furnishing;
    if (activeFurnishing && activeFurnishing !== "All" && activeFurnishing !== "Furnishing") {
        const furnArr = activeFurnishing
            .split(",")
            .map((f) => normalizeFurnishing(f.trim()))
            .filter(Boolean);
        if (furnArr.length > 0) {
            filterQuery.Furnishing = { $in: furnArr };
        }
    }

    // Property Type filter
    if (propertyType && propertyType !== "All") {
        const typeArr = propertyType
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        if (typeArr.length > 0) {
            filterQuery.propertyType = { $in: typeArr };
        }
    }

    // Preferred Tenant filter
    const activeTenant = preferredTenant || tenantType;
    if (activeTenant && activeTenant !== "All" && activeTenant !== "Anyone") {
        filterQuery.preferredTenant = { $in: [activeTenant, "Anyone"] };
    }

    // Availability filter
    if (availability && availability !== "All" && availability !== "Availability") {
        const availArr = availability
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean);
        if (availArr.length > 0) {
            filterQuery.Availability = { $in: availArr };
        }
    }

    // Rent / Budget range filter
    if (minRent !== undefined && minRent !== "" && !isNaN(Number(minRent))) {
        filterQuery.rent = filterQuery.rent || {};
        filterQuery.rent.$gte = Number(minRent);
    }
    if (maxRent !== undefined && maxRent !== "" && !isNaN(Number(maxRent))) {
        filterQuery.rent = filterQuery.rent || {};
        filterQuery.rent.$lte = Number(maxRent);
    }

    // Parking filter
    if (parking !== undefined && parking !== "") {
        filterQuery.Parking = parking === "true" || parking === true;
    }

    // Pet Friendly filter
    if (petFriendly !== undefined && petFriendly !== "") {
        filterQuery.PetFriendly = petFriendly === "true" || petFriendly === true;
    }

    // ── Location Resolution ───────────────────────────────────────────────────
    let searchCoordinates = null;

    const userLat = lat || latitude;
    const userLng = lng || longitude;
    if (userLat !== undefined && userLng !== undefined && !isNaN(Number(userLat)) && !isNaN(Number(userLng))) {
        searchCoordinates = {
            latitude: Number(userLat),
            longitude: Number(userLng)
        };
    }

    if (!searchCoordinates && placeId) {
        searchCoordinates = await getPlaceCoordinates(placeId);
    }

    const searchText = place || query || q;
    if (!searchCoordinates && searchText) {
        searchCoordinates = await searchPlaceCoordinates(searchText);
    }

    // Projection fields
    const projection = {
        _id: 1,
        title: 1,
        locality: 1,
        location: 1,
        rent: 1,
        deposit: 1,
        propertyType: 1,
        BHKType: 1,
        Furnishing: 1,
        preferredTenant: 1,
        Availability: 1,
        builtUpArea: 1,
        bathrooms: 1,
        balconies: 1,
        floor: 1,
        totalFloors: 1,
        Parking: 1,
        PetFriendly: 1,
        photos: 1,
        amenities: 1,
        description: 1,
        views: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1
    };

    // ── 1. Proximity-Based Search with Filters ($geoNear) ──────────────────────
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
                    query: filterQuery
                }
            }
        ];

        // Custom sort on top of geoNear if requested
        if (sortBy === "rent_asc") {
            pipeline.push({ $sort: { rent: 1, distance: 1 } });
        } else if (sortBy === "rent_desc") {
            pipeline.push({ $sort: { rent: -1, distance: 1 } });
        } else if (sortBy === "newest") {
            pipeline.push({ $sort: { createdAt: -1 } });
        }

        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });
        pipeline.push({
            $project: {
                ...projection,
                distance: 1
            }
        });

        const properties = await Property.aggregate(pipeline);

        const total = await Property.countDocuments({
            ...filterQuery,
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
                "Properties fetched successfully"
            )
        );
    }

    // ── 2. Standard Search without Coordinates ────────────────────────────────
    let sortObj = { createdAt: -1 };
    if (sortBy === "rent_asc") {
        sortObj = { rent: 1, createdAt: -1 };
    } else if (sortBy === "rent_desc") {
        sortObj = { rent: -1, createdAt: -1 };
    } else if (sortBy === "newest") {
        sortObj = { createdAt: -1 };
    }

    const properties = await Property.find(filterQuery)
        .select(projection)
        .sort(sortObj)
        .skip(skip)
        .limit(limit);

    const total = await Property.countDocuments(filterQuery);
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

    const property = await Property.findById(propertyId).populate(
        "owner",
        "fullName email mobileNumber"
    );

    if (!property) {
        throw new ApiError(404, "Property not found");
    }

    await Property.findByIdAndUpdate(propertyId, {
        $inc: { views: 1 }
    });

    return res.status(200).json(
        new ApiResponse(200, property, "Property fetched successfully")
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