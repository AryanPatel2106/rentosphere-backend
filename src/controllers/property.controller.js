import { User } from "../models/user.model.js";
import { Property } from "../models/property.model.js";
import { ApiResponse } from "../utils/api-response.js"
import { ApiError } from "../utils/api-error.js"
import { asyncHandler } from "../utils/async-handler.js"


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

    const property = await Property.create({
        owner: user._id,
        title,
        locality: Locality,
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
    const limit = Math.min(
        Number(req.query.limit) || 10,
        20
    );

    const lastId = req.query.lastId;

    const {
        placeId,
        bhkType,
        furnishing,
        tenantType,
        availability,
        parking,
        petFriendly,
        minRent,
        maxRent,
        propertyType,
        city
    } = req.query;

    const filter = {
        status: "available"
    };

    if (lastId) {
        if (!mongoose.Types.ObjectId.isValid(lastId)) {
            throw new ApiError(400, "Invalid cursor");
        }

        filter._id = {
            $lt: lastId
        };
    }

    if (placeId) {
        filter["locality.placeId"] = placeId;
    }

    if (bhkType) {
        filter.bhkType = bhkType;
    }

    if (furnishing) {
        filter.furnishing = furnishing;
    }

    if (tenantType) {
        filter.tenantType = tenantType;
    }

    if (availability) {
        filter.availability = availability;
    }

    if (parking !== undefined) {
        filter.parking = parking === "true";
    }

    if (petFriendly !== undefined) {
        filter.petFriendly = petFriendly === "true";
    }

    if (propertyType) {
        filter.propertyType = propertyType;
    }

    if (city) {
        filter.city = city;
    }

    if (minRent || maxRent) {
        filter.rent = {};

        if (minRent) {
            filter.rent.$gte = Number(minRent);
        }

        if (maxRent) {
            filter.rent.$lte = Number(maxRent);
        }
    }

    const properties = await Property.find(filter)
        .select(
            "_id title propertyType locality city rent bhkType furnishing tenantType availability parking petFriendly images status"
        )
        .sort({
            _id: -1
        })
        .limit(limit);

    const hasMore = properties.length === limit;

    const nextCursor = hasMore
        ? properties[properties.length - 1]._id
        : null;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                properties,
                nextCursor,
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