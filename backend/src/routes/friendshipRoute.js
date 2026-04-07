import express from "express";
import {
  searchUsers,
  sendRequest,
  acceptRequest,
  rejectRequest,
  unfriend,
  getFriends,
  getPendingRequests,
} from "../controllers/friendController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

// Bắt buộc phải đi qua cổng bảo vệ (protect) rồi mới được vào Controller
router.get("/search", protect, searchUsers);
router.post("/request", protect, sendRequest);
router.post("/accept", protect, acceptRequest);
router.post("/reject", protect, rejectRequest);
router.post("/unfriend", protect, unfriend);
router.get("/list", protect, getFriends);
router.get("/requests", protect, getPendingRequests);

export default router;
