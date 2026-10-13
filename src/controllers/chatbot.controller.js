import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { getChatbotResponse } from "../services/chatbot.service.js";
import { synthesizeSpeech } from "../services/polly.service.js";

/**
 * Handle incoming chatbot conversation messages
 * POST /api/v1/chatbot/message
 */
const handleChatMessage = asyncHandler(async (req, res) => {
    const { message, history } = req.body || {};

    const cleanMessage = (message || "").toString().trim();
    const cleanHistory = Array.isArray(history) ? history : [];

    const chatbotResult = await getChatbotResponse(cleanMessage, cleanHistory);

    return res.status(200).json(
        new ApiResponse(
            200,
            chatbotResult,
            "Chatbot message processed successfully"
        )
    );
});

/**
 * Synthesize speech audio for chatbot message or text description
 * POST /api/v1/chatbot/speak
 */
const synthesizeChatbotSpeech = asyncHandler(async (req, res) => {
    const { text, voiceId, engine } = req.body || {};

    if (!text || typeof text !== "string" || !text.trim()) {
        throw new ApiError(400, "Text is required to synthesize speech");
    }

    const speechResult = await synthesizeSpeech(text, { voiceId, engine });

    return res.status(200).json(
        new ApiResponse(
            200,
            speechResult,
            "Speech synthesized successfully"
        )
    );
});

export { handleChatMessage, synthesizeChatbotSpeech };

