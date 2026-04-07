import Message from "../models/message.js";

export const getMessagesByConversationId = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Optional: Bạn có thể check xem req.user.id có phải là thành viên nhóm không để tăng cường bảo mật
    // Ở đây ta đơn giản lấy tất cả tin nhắn của Conversation theo thời gian (cũ -> mới để dễ hiển thị Chat)
    const messages = await Message.find({ conversationId })
      .populate("senderId", "name avatarUrl googleId email")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
