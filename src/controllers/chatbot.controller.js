import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { getChatbotResponse } from "../services/chatbot.service.js";

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

export { handleChatMessage };
