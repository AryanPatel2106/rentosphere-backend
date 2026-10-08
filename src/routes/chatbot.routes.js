import { Router } from "express";
import { handleChatMessage } from "../controllers/chatbot.controller.js";

const router = Router();

// Public route for all visitors & logged in users
router.post("/message", handleChatMessage);

export default router;
