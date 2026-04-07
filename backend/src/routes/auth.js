import express from "express";
import passport from "../configs/passport.js";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  googleCallback,
} from "../controllers/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/?error=google_auth_failed`,
  }),
  googleCallback
);

export default router;
