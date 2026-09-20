import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "ap-south-1";
const bucketName = process.env.MEDIA_S3_BUCKET || "rentosphere-media-260543925645";

const s3Config = {
    region,
};

// Use explicit credentials if provided (e.g. local development)
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    s3Config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
}

export const s3Client = new S3Client(s3Config);

/**
 * Generate a pre-signed PUT URL for direct browser-to-S3 uploads
 * @param {Object} params
 * @param {string} params.fileName - Original file name
 * @param {string} params.fileType - MIME type (e.g. image/jpeg, image/png)
 * @returns {Promise<{ uploadUrl: string, fileUrl: string, key: string }>}
 */
export const generatePresignedUploadUrl = async ({ fileName, fileType }) => {
    const cleanName = (fileName || "image.jpg")
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "-")
        .replace(/-+/g, "-");

    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const key = `properties/${Date.now()}-${randomSuffix}-${cleanName}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl, key };
};

/**
 * Upload a file buffer directly to S3 (fallback / direct upload)
 * @param {Object} params
 * @param {Buffer} params.buffer - File buffer from multer
 * @param {string} params.originalName - Original file name
 * @param {string} params.mimeType - MIME type
 * @returns {Promise<{ fileUrl: string, key: string }>}
 */
export const uploadDirectToS3 = async ({ buffer, originalName, mimeType }) => {
    const cleanName = (originalName || "image.jpg")
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "-")
        .replace(/-+/g, "-");

    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const key = `properties/${Date.now()}-${randomSuffix}-${cleanName}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
    });

    await s3Client.send(command);
    const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    return { fileUrl, key };
};
