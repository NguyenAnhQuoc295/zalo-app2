import "dotenv/config";
import connectDB from "./src/configs/db.js";
import express from "express";
import userRoutes from "./src/routes/user.js";
import authRoutes from "./src/routes/auth.js";
import friendshipRoutes from "./src/routes/friendshipRoute.js";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";
import { handleSendMessage } from "./src/socket/messageHandle.js";
import conversationRoutes from "./src/routes/conversation.js";
import messageRoutes from "./src/routes/message.js";
import session from "express-session";
import passport from "./src/configs/passport.js";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Session & Passport (dùng cho OAuth flow)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "chatapp_session",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 5 * 60 * 1000 }, // 5 phút, chỉ dùng tạm để OAuth redirect
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/friends", friendshipRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

connectDB();

// ❗ HTTP server
const server = http.createServer(app);

// ❗ Socket
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// 🔥 lưu user online
const onlineUsers = new Map();

// 🔐 AUTH SOCKET (PHẢI đặt sau khi có io)
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("No token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = decoded.id;

    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
});

// 🔥 SOCKET LOGIC
io.on("connection", (socket) => {
  console.log("User connected:", socket.userId);

  if (!onlineUsers.has(socket.userId)) {
    onlineUsers.set(socket.userId, []);
  }

  onlineUsers.get(socket.userId).push(socket.id);

  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId);
    console.log("Joined:", conversationId);
  });

  socket.on("send_message", (data) => {
    handleSendMessage(io, socket, data);
  });

  socket.on("disconnect", () => {
    const sockets = onlineUsers.get(socket.userId) || [];

    const updated = sockets.filter((id) => id !== socket.id);

    if (updated.length === 0) {
      onlineUsers.delete(socket.userId);
    } else {
      onlineUsers.set(socket.userId, updated);
    }

    console.log("User disconnected:", socket.userId);
  });
});

server.listen(process.env.PORT || 5000, () => {
  console.log("Server running...");
});
