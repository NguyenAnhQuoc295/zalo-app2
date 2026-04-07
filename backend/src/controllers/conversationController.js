import Conversation from "../models/conversation.js";
import mongoose from "mongoose";

export const getMyConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("User:", userId);

    const conversations = await Conversation.find({
      "members.userId": new mongoose.Types.ObjectId(userId),
    });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
