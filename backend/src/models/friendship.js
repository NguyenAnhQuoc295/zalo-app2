import mongoose from "mongoose";

const { Schema } = mongoose;

const FRIENDSHIP_STATUSES = ["pending", "accepted", "rejected", "cancelled"];

const friendshipSchema = new Schema(
  {
    userLow: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userHigh: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: FRIENDSHIP_STATUSES,
      required: true,
      default: "pending",
      index: true,
    },
    requestedAt: { type: Date, default: Date.now, index: true },
    respondedAt: { type: Date, default: null },
    blockedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, default: null, trim: true, maxlength: 250 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Đảm bảo A và B chỉ có 1 mối quan hệ duy nhất
friendshipSchema.index({ userLow: 1, userHigh: 1 }, { unique: true });
friendshipSchema.index({ requesterId: 1, status: 1, createdAt: -1 });
friendshipSchema.index({ receiverId: 1, status: 1, createdAt: -1 });

// Hàm statics hỗ trợ sắp xếp cặp user
friendshipSchema.statics.buildPair = function buildPair(userA, userB) {
  const a = String(userA);
  const b = String(userB);

  if (a === b) {
    throw new Error("Một người dùng không thể tự kết bạn với chính mình.");
  }

  return a < b
    ? { userLow: userA, userHigh: userB }
    : { userLow: userB, userHigh: userA };
};

export default mongoose.model("Friendship", friendshipSchema);
