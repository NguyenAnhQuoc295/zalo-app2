import express from "express";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

// API cần login
router.get("/me", protect, (req, res) => {
  res.json(req.user);
});

export default router;
