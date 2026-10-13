import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

const region = process.env.AWS_REGION || "ap-south-1";

const pollyConfig = {
    region,
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    pollyConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
}

export const pollyClient = new PollyClient(pollyConfig);

// In-memory audio buffer cache to save AWS Polly free-tier quota & speed up common responses
const pollyAudioCache = new Map();

/**
 * Strips markdown symbols, URLs, and code characters to produce clean spoken text for TTS
 */
function cleanTextForSpeech(text) {
    if (!text) return "";
    return text
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1") // convert [Label](url) to just Label
        .replace(/https?:\/\/\S+/g, "") // remove standalone URLs
        .replace(/[#*_~`]/g, "") // remove markdown styling chars
        .replace(/•|-/g, " ") // remove bullet symbols
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Converts text into spoken audio using AWS Polly (Indian English voice: "Kajal" / "Aditi" / "Raveena")
 * @param {string} text - Text to speak
 * @param {Object} options
 * @param {string} [options.voiceId] - Polly voice (defaults to "Kajal" neural or "Aditi")
 * @param {string} [options.engine] - "neural" or "standard"
 * @returns {Promise<{ audioBase64: string, contentType: string, provider: string }>}
 */
export async function synthesizeSpeech(text, options = {}) {
    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) {
        throw new Error("Text is empty after cleaning");
    }

    // Limit to first 400 characters for snappy voice response
    const speechChunk = cleanText.length > 400 ? cleanText.slice(0, 397) + "..." : cleanText;
    const cacheKey = speechChunk.toLowerCase();

    if (pollyAudioCache.has(cacheKey)) {
        return pollyAudioCache.get(cacheKey);
    }

    const voiceId = options.voiceId || "Kajal";
    const engine = options.engine || "neural";

    try {
        const command = new SynthesizeSpeechCommand({
            Text: speechChunk,
            OutputFormat: "mp3",
            VoiceId: voiceId,
            Engine: engine,
            TextType: "text",
        });

        const response = await pollyClient.send(command);

        if (!response.AudioStream) {
            throw new Error("No AudioStream returned from Polly");
        }

        // Convert AudioStream (Readable stream) to Buffer
        const chunks = [];
        for await (const chunk of response.AudioStream) {
            chunks.push(chunk);
        }
        const audioBuffer = Buffer.concat(chunks);
        const audioBase64 = audioBuffer.toString("base64");

        const result = {
            audioBase64: `data:audio/mp3;base64,${audioBase64}`,
            contentType: "audio/mp3",
            provider: "aws-polly",
            voiceId,
        };

        // Cache response (LRU style cap: 50 items)
        if (pollyAudioCache.size > 50) {
            const firstKey = pollyAudioCache.keys().next().value;
            pollyAudioCache.delete(firstKey);
        }
        pollyAudioCache.set(cacheKey, result);

        return result;
    } catch (err) {
        console.warn(`[AWS Polly] Speech synthesis failed (${err.message}). Retrying with standard engine / Aditi voice.`);
        try {
            // Fallback to standard engine Aditi voice
            const fallbackCommand = new SynthesizeSpeechCommand({
                Text: speechChunk,
                OutputFormat: "mp3",
                VoiceId: "Aditi",
                Engine: "standard",
                TextType: "text",
            });
            const fallbackRes = await pollyClient.send(fallbackCommand);
            const chunks = [];
            for await (const chunk of fallbackRes.AudioStream) {
                chunks.push(chunk);
            }
            const audioBuffer = Buffer.concat(chunks);
            const audioBase64 = audioBuffer.toString("base64");

            return {
                audioBase64: `data:audio/mp3;base64,${audioBase64}`,
                contentType: "audio/mp3",
                provider: "aws-polly-standard",
                voiceId: "Aditi",
            };
        } catch (fallbackErr) {
            console.warn(`[AWS Polly] Fallback failed (${fallbackErr.message}). Advising client speech synthesis.`);
            return {
                audioBase64: null,
                contentType: null,
                provider: "client-web-speech",
                text: speechChunk,
            };
        }
    }
}
