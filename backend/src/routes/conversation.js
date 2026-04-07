import express from "express";
import { protect } from "../middlewares/auth.js";
import { getMyConversations } from "../controllers/conversationController.js";

const router = express.Router();
router.get("/", protect, getMyConversations);

export default router;
