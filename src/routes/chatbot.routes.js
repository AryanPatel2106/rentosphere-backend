import { Router } from "express";
import { handleChatMessage, synthesizeChatbotSpeech } from "../controllers/chatbot.controller.js";

const router = Router();

// Public route for all visitors & logged in users
router.post("/message", handleChatMessage);
router.post("/speak", synthesizeChatbotSpeech);

export default router;
