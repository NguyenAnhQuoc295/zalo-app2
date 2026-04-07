import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

// GOOGLE CALLBACK
export const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/?error=google_auth_failed`
      );
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Redirect về frontend kèm token
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${token}`
    );
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL}/?error=server_error`);
  }
};


// REGISTER
export const register = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password tối thiểu 6 ký tự" });
    }
    // check email tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    res.status(201).json({
      message: "Đăng ký thành công",
      user: safeUser,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.trim().toLowerCase();
    if (!email || !password) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      return res.status(400).json({ message: "Email không tồn tại" });
    }

    // check banned
    if (user.accountStatus === "banned") {
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ message: "Tài khoản này được đăng ký bằng Google. Vui lòng đăng nhập bằng Google." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: safeUser,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// FORGOT PASSWORD (OTP)
export const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Thiếu email" });
    }

    const user = await User.findOne({ email });

    // ❗ tránh lộ email tồn tại hay không
    if (!user) {
      return res.json({
        message: "Nếu email tồn tại, OTP đã được gửi",
      });
    }

    // tạo OTP 6 số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // hash OTP
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    user.resetPasswordOTP = hashedOTP;
    user.resetPasswordExpire = Date.now() + 5 * 60 * 1000; // 5 phút
    user.resetPasswordAttempts = 0;

    await user.save();

    // gửi mail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: email,
      subject: "OTP Reset Password",
      html: `
        <h3>Mã OTP của bạn:</h3>
        <h1>${otp}</h1>
        <p>OTP có hiệu lực trong 5 phút</p>
      `,
    });

    res.json({ message: "Đã gửi OTP qua email" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// RESET PASSWORD (OTP)
export const resetPassword = async (req, res) => {
  try {
    const { otp, password } = req.body;
    const email = req.body.email?.trim().toLowerCase();
    if (!email || !password || !otp) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password tối thiểu 6 ký tự" });
    }

    // hash OTP nhập vào
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordOTP: hashedOTP,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+resetPasswordOTP +resetPasswordAttempts +passwordHash");

    if (!user) {
      // tìm user theo email để tăng attempts
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        existingUser.resetPasswordAttempts += 1;
        await existingUser.save();
      }

      return res.status(400).json({
        message: "OTP không hợp lệ hoặc đã hết hạn",
      });
    }

    // chống brute force OTP
    if (user.resetPasswordAttempts >= 5) {
      return res.status(429).json({
        message: "Bạn nhập sai quá nhiều lần, thử lại sau",
      });
    }

    // check trùng password
    const isSamePassword = await bcrypt.compare(password, user.passwordHash);

    if (isSamePassword) {
      return res.status(400).json({
        message: "Mật khẩu mới không được trùng với mật khẩu cũ",
      });
    }

    // hash password mới
    const newPasswordHash = await bcrypt.hash(password, 10);

    user.passwordHash = newPasswordHash;
    user.resetPasswordOTP = null;
    user.resetPasswordExpire = null;
    user.resetPasswordAttempts = 0;

    await user.save();

    res.json({ message: "Reset password thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
