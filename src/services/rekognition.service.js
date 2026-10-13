import { RekognitionClient, DetectLabelsCommand, DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";

const region = process.env.AWS_REGION || "ap-south-1";
const bucketName = process.env.MEDIA_S3_BUCKET || "rentosphere-media-260543925645";

const rekognitionConfig = {
    region,
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    rekognitionConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
}

export const rekognitionClient = new RekognitionClient(rekognitionConfig);

// Mapping of Rekognition detected labels to property room categories
const ROOM_LABEL_MAP = {
    Kitchen: ["Kitchen", "Cooktop", "Stove", "Sink", "Refrigerator", "Oven", "Countertop"],
    Bedroom: ["Bedroom", "Bed", "Mattress", "Pillow", "Wardrobe", "Headboard"],
    Bathroom: ["Bathroom", "Toilet", "Shower", "Bathtub", "Washbasin", "Plumbing"],
    "Living Room": ["Living Room", "Sofa", "Couch", "Lounge", "Television", "Coffee Table"],
    Balcony: ["Balcony", "Terrace", "Patio", "Veranda", "Porch", "Railing"],
    "Dining Room": ["Dining Room", "Dining Table"],
    "Swimming Pool": ["Swimming Pool", "Pool"],
    Gym: ["Gym", "Fitness", "Exercise Equipment", "Treadmill", "Dumbbell"],
    Garden: ["Garden", "Yard", "Lawn", "Plant", "Vegetation"]
};

// Amenities mapped to Rekognition labels
const AMENITY_LABEL_MAP = {
    "Swimming Pool": ["Swimming Pool", "Pool"],
    Gym: ["Gym", "Fitness", "Exercise Equipment"],
    Park: ["Garden", "Yard", "Lawn", "Park"],
    "Gated Security": ["Security", "Gate", "Fence"],
    Clubhouse: ["Clubhouse", "Community Center"]
};

/**
 * Extracts S3 key from full S3 URL or returns the key directly
 */
function extractS3Key(keyOrUrl) {
    if (!keyOrUrl) return "";
    if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
        try {
            const url = new URL(keyOrUrl);
            const path = url.pathname;
            return path.startsWith("/") ? path.substring(1) : path;
        } catch {
            return keyOrUrl;
        }
    }
    return keyOrUrl;
}

/**
 * Analyzes a property photo using AWS Rekognition
 * @param {string} photoKeyOrUrl - S3 Key or complete HTTPS S3 URL
 * @returns {Promise<{
 *   roomType: string,
 *   confidence: number,
 *   labels: Array<{ name: string, confidence: number }>,
 *   suggestedAmenities: Array<string>,
 *   isSafe: boolean,
 *   moderationLabels: Array<string>
 * }>}
 */
export async function analyzePropertyPhoto(photoKeyOrUrl) {
    const key = extractS3Key(photoKeyOrUrl);
    if (!key) {
        throw new Error("Invalid S3 photo key or URL");
    }

    try {
        // 1. Detect object labels (Room classification & amenities)
        const labelCommand = new DetectLabelsCommand({
            Image: {
                S3Object: {
                    Bucket: bucketName,
                    Name: key,
                },
            },
            MaxLabels: 25,
            MinConfidence: 65,
        });

        // 2. Detect moderation labels (Safety check)
        const modCommand = new DetectModerationLabelsCommand({
            Image: {
                S3Object: {
                    Bucket: bucketName,
                    Name: key,
                },
            },
            MinConfidence: 60,
        });

        const [labelRes, modRes] = await Promise.allSettled([
            rekognitionClient.send(labelCommand),
            rekognitionClient.send(modCommand),
        ]);

        const rawLabels = labelRes.status === "fulfilled" ? labelRes.value.Labels || [] : [];
        const rawModLabels = modRes.status === "fulfilled" ? modRes.value.ModerationLabels || [] : [];

        // Check content moderation
        const isSafe = rawModLabels.length === 0;
        const moderationLabels = rawModLabels.map(m => m.Name).filter(Boolean);

        // Classify Room Type
        const detectedLabels = rawLabels.map(l => ({
            name: l.Name,
            confidence: Math.round(l.Confidence || 0),
        }));

        let primaryRoomType = "Interior";
        let highestScore = 0;

        for (const [room, keywords] of Object.entries(ROOM_LABEL_MAP)) {
            for (const item of detectedLabels) {
                if (keywords.some(k => k.toLowerCase() === item.name.toLowerCase())) {
                    if (item.confidence > highestScore) {
                        highestScore = item.confidence;
                        primaryRoomType = room;
                    }
                }
            }
        }

        // Detect suggested amenities
        const suggestedAmenities = [];
        for (const [amenity, keywords] of Object.entries(AMENITY_LABEL_MAP)) {
            if (detectedLabels.some(l => keywords.some(k => k.toLowerCase() === l.name.toLowerCase()))) {
                suggestedAmenities.push(amenity);
            }
        }

        return {
            roomType: primaryRoomType,
            confidence: highestScore || 85,
            labels: detectedLabels.slice(0, 10),
            suggestedAmenities,
            isSafe,
            moderationLabels,
            provider: "aws-rekognition",
        };
    } catch (err) {
        console.warn(`[AWS Rekognition] Photo analysis failed (${err.message}). Using local heuristic fallback.`);
        // Graceful fallback if S3 object is local or Rekognition hits permission/rate limit
        const lowerKey = key.toLowerCase();
        let fallbackRoom = "Interior";
        if (lowerKey.includes("kitchen")) fallbackRoom = "Kitchen";
        else if (lowerKey.includes("bed") || lowerKey.includes("room")) fallbackRoom = "Bedroom";
        else if (lowerKey.includes("bath")) fallbackRoom = "Bathroom";
        else if (lowerKey.includes("hall") || lowerKey.includes("living")) fallbackRoom = "Living Room";
        else if (lowerKey.includes("balcony")) fallbackRoom = "Balcony";

        return {
            roomType: fallbackRoom,
            confidence: 80,
            labels: [{ name: fallbackRoom, confidence: 80 }],
            suggestedAmenities: [],
            isSafe: true,
            moderationLabels: [],
            provider: "local-fallback",
        };
    }
}
