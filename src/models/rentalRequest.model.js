import mongoose from "mongoose";

const paymentRecordSchema = new mongoose.Schema(
    {
        month: {
            type: Number, // 1 - 12
            required: true
        },
        year: {
            type: Number,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        method: {
            type: String,
            enum: ["online", "offline", "cash", "upi", "bank_transfer"],
            default: "online"
        },
        status: {
            type: String,
            enum: ["paid", "pending", "failed"],
            default: "paid"
        },
        transactionId: {
            type: String,
            default: null
        },
        orderId: {
            type: String,
            default: null
        },
        paidAt: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String,
            default: ""
        }
    },
    { _id: true, timestamps: true }
);

const rentalRequestSchema = new mongoose.Schema(
    {
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true
        },
        tenant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
            default: "pending"
        },
        moveInDate: {
            type: Date,
            default: null
        },
        message: {
            type: String,
            default: ""
        },
        monthlyRent: {
            type: Number,
            default: 0
        },
        deposit: {
            type: Number,
            default: 0
        },
        payments: [paymentRecordSchema]
    },
    { timestamps: true }
);

rentalRequestSchema.index({ property: 1, tenant: 1 });
rentalRequestSchema.index({ owner: 1, status: 1 });
rentalRequestSchema.index({ tenant: 1, status: 1 });

const RentalRequest = mongoose.model("RentalRequest", rentalRequestSchema);

export { RentalRequest };
