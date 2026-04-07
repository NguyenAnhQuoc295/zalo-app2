import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import "./Chat.css";

const SERVER = import.meta.env.VITE_API_URL || "http://localhost:5000";

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
}

function formatTime(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (err) {
    return "";
  }
}

export default function Chat() {
  const [activeTab, setActiveTab] = useState("direct");
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const socketRef = useRef(null);
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  const jwtPayload = token ? parseJwt(token) : null;
  const currentUserId = jwtPayload?.id || jwtPayload?._id || null;

  // Connect socket
  useEffect(() => {
    if (!token) return;

    const socket = io(SERVER, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("socket connected", socket.id);
    });

    socket.on("receive_message", (msg) => {
      // If message belongs to current conversation, append, else update preview
      if (!msg) return;
      const convId = String(msg.conversationId);
      if (activeConv && String(activeConv) === convId) {
        setMessages((prev) => [...prev, msg]);
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            String(c._id) === convId
              ? {
                  ...c,
                  lastMessage: {
                    ...(c.lastMessage || {}),
                    contentPreview: msg.content,
                  },
                }
              : c,
          ),
        );
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err.message || err);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, activeConv]);

  // Load conversations
  useEffect(() => {
    if (!token) return;

    const api = axios.create({
      baseURL: `${SERVER}/api`,
      headers: { Authorization: `Bearer ${token}` },
    });

    const fetchConversations = async () => {
      try {
        const res = await api.get("/conversations");
        setConversations(res.data || []);
        if (!activeConv && res.data && res.data.length) {
          setActiveConv(res.data[0]._id);
        }
      } catch (err) {
        console.error(
          "Fetch conversations failed:",
          err?.response?.data || err.message || err,
        );
      }
    };

    fetchConversations();
  }, [token]);

  // Join conversation and load messages
  useEffect(() => {
    if (!activeConv) return;
    if (socketRef.current) {
      socketRef.current.emit("join_conversation", activeConv);
    }

    const loadMessages = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${SERVER}/api/messages/${activeConv}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data || []);
      } catch (err) {
        // If API not mounted, just clear or keep old messages
        console.warn(
          "Load messages failed:",
          err?.response?.data || err.message || err,
        );
        setMessages([]);
      }
    };

    loadMessages();
  }, [activeConv, token]);

  const handleSend = () => {
    if (!message.trim() || !activeConv || !socketRef.current) return;

    const localId = `local-${Date.now()}`;
    const payload = { conversationId: activeConv, content: message };

    const optimisticMessage = {
      _id: localId,
      conversationId: activeConv,
      content: message,
      senderId: { _id: currentUserId, name: "Bạn", avatarUrl: null },
      createdAt: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessage("");

    socketRef.current.emit("send_message", payload, (ack) => {
      if (ack.error) {
        setMessages((prev) =>
          prev.map((m) => (m._id === localId ? { ...m, status: "failed" } : m)),
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === localId ? { ...ack.message, status: "sent" } : m,
          ),
        );
      }
    });
  };

  const onSelectConversation = (conv) => {
    setActiveConv(conv._id);
  };

  const sampleList = [];

  return (
    <div className="chat-wrapper">
      <div className="chat-sidebar">
        <div className="nav-icon active">
          <i className="fa-solid fa-message"></i>
        </div>
        <div className="nav-icon">
          <i className="fa-solid fa-user-group"></i>
        </div>
        <div className="nav-icon">
          <i className="fa-solid fa-users-rectangle"></i>
        </div>
        <div className="spacer"></div>
        <div className="nav-icon">
          <i className="fa-solid fa-gear"></i>
        </div>
        <div className="avatar-wrapper">
          <img
            src="https://i.pravatar.cc/150?img=11"
            alt="User"
            className="avatar"
          />
          <div
            className="status-dot"
            style={{ backgroundColor: "var(--status-online)" }}
          ></div>
        </div>
      </div>

      <div className="chat-middle-panel">
        <div className="search-container">
          <div className="search-bar">
            <i
              className="fa-solid fa-magnifying-glass"
              style={{ color: "var(--text-secondary)" }}
            ></i>
            <input type="text" placeholder="Tìm kiếm tin nhắn..." />
          </div>
        </div>

        <div className="tabs">
          <div
            className={`tab ${activeTab === "direct" ? "active" : ""}`}
            onClick={() => setActiveTab("direct")}
          >
            Tin Nhắn Lẻ
          </div>
          <div
            className={`tab ${activeTab === "group" ? "active" : ""}`}
            onClick={() => setActiveTab("group")}
          >
            Nhóm Chat
          </div>
        </div>

        <div className="chat-list">
          {(conversations.length ? conversations : sampleList).map(
            (chat, idx) => {
              const isActive = String(activeConv) === String(chat._id);
              const avatar =
                chat.avatarUrl ||
                (chat.lastMessage &&
                  chat.lastMessage.senderId &&
                  chat.lastMessage.senderId.avatarUrl) ||
                `https://i.pravatar.cc/150?img=${10 + (idx % 50)}`;
              const name =
                chat.name ||
                (chat.type === "direct"
                  ? `Chat ${String(chat._id).slice(-6)}`
                  : chat.name || `Nhóm ${idx + 1}`);
              const preview =
                (chat.lastMessage && chat.lastMessage.contentPreview) || "";

              return (
                <div
                  key={chat._id}
                  className={`chat-item ${isActive ? "active" : ""}`}
                  onClick={() => onSelectConversation(chat)}
                >
                  <div className="avatar">
                    <img src={avatar} alt="Avatar" className="avatar" />
                  </div>
                  <div className="chat-info">
                    <div className="chat-header-row">
                      <span className="chat-name">{name}</span>
                      <span className="chat-time">
                        {chat.lastMessage && chat.lastMessage.createdAt
                          ? formatTime(chat.lastMessage.createdAt)
                          : ""}
                      </span>
                    </div>
                    <div className="chat-preview-row">
                      <span className="chat-preview-text">{preview}</span>
                      {chat.messageCount > 0 && (
                        <span className="unread-badge">
                          {chat.messageCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>

        <button className="new-group-btn">
          <i className="fa-solid fa-plus"></i>
          Tạo Nhóm Mới
        </button>
      </div>

      <div className="chat-right-panel">
        <div className="main-header">
          <div className="header-user-info">
            <img
              src={"https://i.pravatar.cc/150?img=47"}
              alt="Avatar"
              className="avatar"
            />
            <div className="header-user-text">
              <div className="header-name">
                {/* show active conv name */}
                {conversations.find((c) => String(c._id) === String(activeConv))
                  ?.name || "Cuộc trò chuyện"}
              </div>
              <div className="header-status">
                <span className="status-dot-inline"></span>Trực tuyến
              </div>
            </div>
          </div>
          <div className="header-actions">
            <i className="fa-solid fa-phone" title="Gọi Thoại"></i>
            <i className="fa-solid fa-video" title="Gọi Video"></i>
            <i className="fa-solid fa-magnifying-glass" title="Tìm Kiếm"></i>
            <i className="fa-solid fa-circle-info" title="Thông Tin"></i>
          </div>
        </div>

        <div className="messages-area">
          <div className="date-divider">Hôm nay</div>

          {messages.map((m) => {
            const sender =
              typeof m.senderId === "object" ? m.senderId : { _id: m.senderId };
            const isSent = String(sender._id) === String(currentUserId);
            return (
              <div
                key={m._id}
                className={`message-row ${isSent ? "sent" : "received"}`}
              >
                {!isSent && (
                  <img
                    src={sender.avatarUrl || `https://i.pravatar.cc/150?img=32`}
                    alt="Avatar"
                    className="msg-avatar"
                  />
                )}
                <div className="message-group">
                  <div className="msg-content">
                    <div className="msg-bubble">
                      {m.content}
                      {m.status === "sending" && (
                        <span className="msg-status"> (sending...)</span>
                      )}
                      {m.status === "failed" && (
                        <span className="msg-status-error"> (failed)</span>
                      )}
                    </div>
                    <div className="msg-meta">{formatTime(m.createdAt)}</div>
                  </div>
                </div>
                {isSent && (
                  <img
                    src={sender.avatarUrl || `https://i.pravatar.cc/150?img=11`}
                    alt="Avatar"
                    className="msg-avatar"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="input-area">
          <div className="input-container">
            <div className="input-actions">
              <i className="fa-solid fa-circle-plus" title="Đính Kèm"></i>
              <i className="fa-solid fa-image" title="Gửi Ảnh/Video"></i>
              <i className="fa-solid fa-note-sticky" title="Gửi Sticker"></i>
            </div>
            <textarea
              className="text-input"
              placeholder="Nhập tin nhắn..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            ></textarea>
            <div className="input-actions" style={{ paddingBottom: 0 }}>
              <i
                className="fa-regular fa-face-smile"
                style={{ alignSelf: "center" }}
                title="Chọn Emoji"
              ></i>
              <button
                className="send-btn"
                disabled={!message.trim()}
                onClick={handleSend}
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
