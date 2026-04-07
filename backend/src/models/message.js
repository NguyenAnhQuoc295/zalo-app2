import mongoose from "mongoose";

const { Schema } = mongoose;

const MESSAGE_TYPES = ["text", "image", "file", "audio", "video", "call"];

const attachmentSchema = new Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },

    //mime type
    mimeType: {
      type: String,
      default: null,
      trim: true,
    },

    sizeBytes: {
      type: Number,
      default: 0,
      min: 0,
    },

    width: {
      type: Number,
      default: null,
      min: 0,
    },

    height: {
      type: Number,
      default: null,
      min: 0,
    },

    durationSeconds: {
      type: Number,
      default: null,
      min: 0,
    },

    thumbnailUrl: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false }
);

//read receipt schema
const readReceiptSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    seenAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: MESSAGE_TYPES,
      required: true,
      default: "text",
      index: true,
    },

    content: {
      type: String,
      default: "",
      maxlength: 5000,
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    replyToMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
      index: true,
    },

    forwardedFromMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    readBy: {
      type: [readReceiptSchema],
      default: [],
    },

    deliveredTo: {
      type: [
        {
          userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          deliveredAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },

    isEdited: {
      type: Boolean,
      default: false,
      index: true,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    systemEvent: {
      type: {
        action: { type: String, default: null, trim: true },
        targetUserId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        metadata: { type: Schema.Types.Mixed, default: null },
      },
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, type: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, isDeleted: 1, createdAt: -1 });

const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
export default Message;
