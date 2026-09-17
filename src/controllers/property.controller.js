import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Property } from "../models/property.model.js";
import { RentalRequest } from "../models/rentalRequest.model.js";
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
        status: "active"
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


    const updateData = { ...req.body };
    if (updateData.bhkType || updateData.BHKType) {
        updateData.BHKType = normalizeBhk(updateData.BHKType || updateData.bhkType);
    }
    if (updateData.furnishing || updateData.Furnishing) {
        updateData.Furnishing = normalizeFurnishing(updateData.Furnishing || updateData.furnishing);
    }
    if (updateData.rent !== undefined) updateData.rent = Number(updateData.rent);
    if (updateData.deposit !== undefined) updateData.deposit = Number(updateData.deposit);
    if (updateData.builtUpArea !== undefined) updateData.builtUpArea = Number(updateData.builtUpArea);
    if (updateData.bathrooms !== undefined) updateData.bathrooms = Number(updateData.bathrooms);
    if (updateData.balconies !== undefined) updateData.balconies = Number(updateData.balconies);
    if (updateData.floor !== undefined) updateData.floor = Number(updateData.floor);
    if (updateData.totalFloors !== undefined) updateData.totalFloors = Number(updateData.totalFloors);

    const updatedProperty = await Property.findByIdAndUpdate(
        propertyId,
        {
            $set: updateData
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

    const property = await Property.findById(propertyId);

    if (!property) {
        throw new ApiError(404, "Property not found");
    }

    if (property.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this property");
    }

    await Property.findByIdAndUpdate(propertyId, {
        status: "inactive"
    });

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


// ── Shortlist Controllers ──────────────────────────────────────────────
const toggleShortlist = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const property = await Property.findById(propertyId);
    if (!property) {
        throw new ApiError(404, "Property not found");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const currentShortlists = (user.shortlists || []).map((id) => id.toString());
    const isShortlisted = currentShortlists.includes(propertyId.toString());

    let updatedUser;
    if (isShortlisted) {
        updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { shortlists: propertyId } },
            { new: true }
        );
    } else {
        updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $addToSet: { shortlists: propertyId } },
            { new: true }
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                isShortlisted: !isShortlisted,
                shortlists: updatedUser.shortlists
            },
            !isShortlisted
                ? "Property added to shortlists"
                : "Property removed from shortlists"
        )
    );
});

const getShortlists = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: "shortlists",
        match: { status: { $ne: "inactive" } },
        populate: { path: "owner", select: "fullName email mobileNumber" }
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, user.shortlists || [], "Shortlists fetched successfully")
    );
});


// ── Rental Request & Booking Flow ──────────────────────────────────────
const createRentalRequest = asyncHandler(async (req, res) => {
    const { propertyId, moveInDate, message } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
        throw new ApiError(404, "Property not found");
    }

    if (property.owner.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot request your own property");
    }

    if (property.status === "rented") {
        throw new ApiError(400, "Property is already rented and not available");
    }

    const existing = await RentalRequest.findOne({
        property: propertyId,
        tenant: req.user._id,
        status: { $in: ["pending", "accepted"] }
    });

    if (existing) {
        throw new ApiError(400, `You already have an active/pending request for this property (${existing.status})`);
    }

    const request = await RentalRequest.create({
        property: property._id,
        owner: property.owner,
        tenant: req.user._id,
        monthlyRent: property.rent,
        deposit: property.deposit,
        moveInDate: moveInDate || null,
        message: message || "Interested in renting this property",
        status: "pending"
    });

    const populated = await RentalRequest.findById(request._id)
        .populate("property")
        .populate("tenant", "fullName email mobileNumber");

    return res.status(201).json(
        new ApiResponse(201, populated, "Rental request submitted successfully")
    );
});

const getOwnerRentalRequests = asyncHandler(async (req, res) => {
    const requests = await RentalRequest.find({ owner: req.user._id })
        .populate("property")
        .populate("tenant", "fullName email mobileNumber")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, requests, "Owner rental requests fetched successfully")
    );
});

const getTenantRentalRequests = asyncHandler(async (req, res) => {
    const requests = await RentalRequest.find({ tenant: req.user._id })
        .populate("property")
        .populate("owner", "fullName email mobileNumber")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, requests, "Tenant rental requests fetched successfully")
    );
});

const acceptRentalRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const request = await RentalRequest.findById(requestId);
    if (!request) {
        throw new ApiError(404, "Rental request not found");
    }

    if (request.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to accept this request");
    }

    request.status = "accepted";
    await request.save();

    // Mark property rented and assign currentTenant -> this automatically removes property from public search!
    await Property.findByIdAndUpdate(request.property, {
        status: "rented",
        currentTenant: request.tenant
    });

    // Automatically decline other pending requests for this property
    await RentalRequest.updateMany(
        {
            property: request.property,
            _id: { $ne: request._id },
            status: "pending"
        },
        { status: "rejected" }
    );

    const populated = await RentalRequest.findById(request._id)
        .populate("property")
        .populate("tenant", "fullName email mobileNumber");

    return res.status(200).json(
        new ApiResponse(200, populated, "Rental request accepted. Property is now rented!")
    );
});

const rejectRentalRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const request = await RentalRequest.findById(requestId);
    if (!request) {
        throw new ApiError(404, "Rental request not found");
    }

    if (request.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to reject this request");
    }

    request.status = "rejected";
    await request.save();

    return res.status(200).json(
        new ApiResponse(200, request, "Rental request rejected")
    );
});


// ── Active Rented Properties for Owner ─────────────────────────────────
const getActiveRentedProperties = asyncHandler(async (req, res) => {
    // Find all rented properties for this owner
    const rentedProperties = await Property.find({
        owner: req.user._id,
        status: "rented"
    }).populate("currentTenant", "fullName email mobileNumber");

    const propertyIds = rentedProperties.map((p) => p._id);
    const activeRequests = await RentalRequest.find({
        property: { $in: propertyIds },
        status: "accepted"
    }).populate("tenant", "fullName email mobileNumber");

    const requestMap = {};
    activeRequests.forEach((r) => {
        requestMap[r.property.toString()] = r;
    });

    const result = rentedProperties.map((p) => {
        const reqObj = requestMap[p._id.toString()] || null;
        return {
            property: p,
            rentalRequest: reqObj
        };
    });

    return res.status(200).json(
        new ApiResponse(200, result, "Active rented properties fetched successfully")
    );
});

const endLease = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const property = await Property.findById(propertyId);
    if (!property) {
        throw new ApiError(404, "Property not found");
    }

    if (property.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to manage lease for this property");
    }

    // Set property status back to active so it appears in search again
    property.status = "active";
    property.currentTenant = null;
    await property.save();

    // Update active rental request to completed
    await RentalRequest.updateMany(
        { property: propertyId, status: "accepted" },
        { status: "completed" }
    );

    return res.status(200).json(
        new ApiResponse(200, property, "Lease ended successfully. Property is now active and re-listed!")
    );
});


// ── Payment Tracking: Online (Razorpay Simulated) & Offline ────────────
const recordOfflinePayment = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { month, year, amount, method, notes } = req.body;

    const request = await RentalRequest.findById(requestId);
    if (!request) {
        throw new ApiError(404, "Rental request / booking not found");
    }

    if (request.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the owner can record offline payments");
    }

    if (!month || !year || !amount) {
        throw new ApiError(400, "Month, year, and amount are required");
    }

    const newPayment = {
        month: Number(month),
        year: Number(year),
        amount: Number(amount),
        method: method || "offline",
        status: "paid",
        transactionId: `OFFLINE-${Date.now()}`,
        paidAt: new Date(),
        notes: notes || `Recorded by owner via ${method || "Cash"}`
    };

    request.payments.push(newPayment);
    await request.save();

    return res.status(200).json(
        new ApiResponse(200, request, "Offline payment recorded successfully")
    );
});

const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { requestId, amount, month, year } = req.body;
    const request = await RentalRequest.findById(requestId);
    if (!request) {
        throw new ApiError(404, "Rental request not found");
    }

    const payAmount = Number(amount) || request.monthlyRent;
    const amountInPaise = Math.round(payAmount * 100);

    // If live/test Razorpay keys are configured, create a real order via Razorpay API
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        try {
            const authHeader = 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
            const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify({
                    amount: amountInPaise,
                    currency: 'INR',
                    receipt: `rcpt_${requestId.toString().slice(-8)}_${month}_${year}`,
                    notes: {
                        requestId: request._id.toString(),
                        month: String(month),
                        year: String(year)
                    }
                })
            });

            if (rzpRes.ok) {
                const liveOrder = await rzpRes.json();
                return res.status(200).json(
                    new ApiResponse(200, {
                        ...liveOrder,
                        keyId: process.env.RAZORPAY_KEY_ID,
                        isSimulated: false
                    }, "Razorpay live order created successfully")
                );
            } else {
                const errBody = await rzpRes.text();
                console.error("Razorpay order API response error:", errBody);
            }
        } catch (err) {
            console.error("Error creating live Razorpay order:", err);
        }
    }

    // Fallback: Simulated order
    const orderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const orderData = {
        id: orderId,
        entity: "order",
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${requestId}_${month}_${year}`,
        status: "created",
        isSimulated: true,
        notes: {
            requestId: request._id.toString(),
            month: String(month),
            year: String(year)
        }
    };

    return res.status(200).json(
        new ApiResponse(200, orderData, "Razorpay simulated order created successfully")
    );
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const { requestId, orderId, paymentId, signature, amount, month, year, method } = req.body;

    const request = await RentalRequest.findById(requestId);
    if (!request) {
        throw new ApiError(404, "Rental request not found");
    }

    // Verify signature if real Razorpay secret is configured and order is not simulated
    if (process.env.RAZORPAY_KEY_SECRET && signature && !orderId?.startsWith('order_sim_')) {
        const crypto = await import('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        if (expectedSignature !== signature) {
            throw new ApiError(400, "Invalid Razorpay payment signature");
        }
    }

    const payAmount = Number(amount) || request.monthlyRent;
    const finalPaymentId = paymentId || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const newPayment = {
        month: Number(month) || new Date().getMonth() + 1,
        year: Number(year) || new Date().getFullYear(),
        amount: payAmount,
        method: method || "online",
        status: "paid",
        transactionId: finalPaymentId,
        orderId: orderId || `order_${Date.now()}`,
        paidAt: new Date(),
        notes: orderId?.startsWith('order_sim_')
            ? "Paid online via Razorpay Gateway (Test Mode)"
            : "Paid online via Razorpay Payment Gateway"
    };

    request.payments.push(newPayment);
    await request.save();

    return res.status(200).json(
        new ApiResponse(200, request, "Payment processed and recorded successfully")
    );
});


export {
    createProperty,
    getProperties,
    getPropertyById,
    getMyProperties,
    updateProperty,
    deleteProperty,
    toggleShortlist,
    getShortlists,
    createRentalRequest,
    getOwnerRentalRequests,
    getTenantRentalRequests,
    acceptRentalRequest,
    rejectRentalRequest,
    getActiveRentedProperties,
    endLease,
    recordOfflinePayment,
    createRazorpayOrder,
    verifyRazorpayPayment
};