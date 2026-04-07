import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Lấy token từ header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. Nếu không có token
    if (!token) {
      return res.status(401).json({ message: "Không có token" });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Lấy user từ DB
    const user = await User.findById(decoded.id).select("-passwordHash");

    if (!user) {
      return res.status(401).json({ message: "User không tồn tại" });
    }

    // 5. Check account bị ban
    if (user.accountStatus === "banned") {
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });
    }

    // 6. Gắn user vào request
    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};
