import express from "express";
import { protect } from "../middlewares/auth.js";
import { getMessagesByConversationId } from "../controllers/messageController.js";

const router = express.Router();

router.get("/:conversationId", protect, getMessagesByConversationId);

export default router;
