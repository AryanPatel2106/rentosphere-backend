import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

// basic configuration
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// cors configuration
app.use(
    cors({
        origin: process.env.CORS_ORIGIN?.split(',') || 'https://rentosphere.clouddrive.page', // for vite application
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Authorization', 'Content-Type'],
    })
)

// health check
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK"
    });
});
// route
import authRoutes from "./routes/auth.routes.js";
import locationRouter from "./routes/location.routes.js";
import propertyRouter from "./routes/property.routes.js";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/location", locationRouter);
app.use("/api/v1/property", propertyRouter);


export default app;