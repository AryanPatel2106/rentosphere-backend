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
const allowedOrigins = [
    'https://rentosphere.clouddrive.page',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : [])
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],
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