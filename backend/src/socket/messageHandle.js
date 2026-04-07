import Message from "../models/message.js";
import Conversation from "../models/conversation.js";

export const handleSendMessage = async (io, socket, data) => {
  try {
    const { conversationId, content } = data;
    const senderId = socket.userId; // 🔐 chống fake

    // 1. check conversation tồn tại
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return;
    }

    // 2. check user có trong conversation không
    const isMember = conversation.members.some(
      (m) => m.userId.toString() === senderId
    );

    if (!isMember) {
      return;
    }

    // 3. lưu message
    const message = await Message.create({
      conversationId,
      senderId,
      content,
      type: "text",
    });

    // 4. update conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        messageId: message._id,
        senderId,
        contentPreview: content,
        createdAt: message.createdAt,
      },
      $inc: { messageCount: 1 },
    });

    // 5. emit realtime cho room
    io.to(conversationId).emit("receive_message", message);
  } catch (err) {
    console.error("Send message error:", err);
  }
};
