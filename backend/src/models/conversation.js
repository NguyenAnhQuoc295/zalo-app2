import mongoose from "mongoose";

const { Schema } = mongoose;

const MEMBER_ROLES = ["owner", "admin", "member"];
const CONVERSATION_TYPES = ["direct", "group"];

const conversationMemberSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: MEMBER_ROLES,
      default: "member",
    },

    //nickname
    nickname: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    leftAt: {
      type: Date,
      default: null,
    },

    // last read message id
    lastReadMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    lastReadAt: {
      type: Date,
      default: null,
    },

    isMuted: {
      type: Boolean,
      default: false,
    },

    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  //?
  { _id: false }
);

const lastMessageSchema = new Schema(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: ["text", "image", "file", "audio", "video", "call"],
      default: null,
    },

    contentPreview: {
      type: String,
      default: null,
      trim: true,
      maxlength: 300,
    },

    createdAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const conversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: CONVERSATION_TYPES,
      required: true,
      default: "direct",
      index: true,
    },

    name: {
      type: String,
      default: null,
      trim: true,
      maxlength: 150,
    },

    avatarUrl: {
      type: String,
      default: null,
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    members: {
      type: [conversationMemberSchema],
      default: [],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 2;
        },
        message: "Conversation must have at least 2 members.",
      },
    },

    lastMessage: {
      type: lastMessageSchema,
      default: {},
    },

    messageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // có thể bỏ
    // isArchived: {
    //   type: Boolean,
    //   default: false,
    //   index: true,
    // },
    // archivedAt: {
    //   type: Date,
    //   default: null,
    // },

    // metadata
    metadata: {
      directPairKey: {
        type: String,
        default: null,
        index: true,
      },
      description: {
        type: String,
        default: null,
        trim: true,
        maxlength: 500,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

conversationSchema.index({ "members.userId": 1, updatedAt: -1 });
conversationSchema.index({ type: 1, createdAt: -1 });
conversationSchema.index({ "lastMessage.createdAt": -1 });
conversationSchema.index(
  {
    "metadata.directPairKey": 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      type: "direct",
      "metadata.directPairKey": { $type: "string" },
    },
  }
);

conversationSchema.statics.buildDirectPairKey = function buildDirectPairKey(
  userA,
  userB
) {
  const a = String(userA);
  const b = String(userB);

  if (a === b) {
    throw new Error("Direct conversation requires 2 different users.");
  }

  return a < b ? `${a}_${b}` : `${b}_${a}`;
};

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
