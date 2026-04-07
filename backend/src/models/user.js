import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: false,
      select: false,
    },

    googleId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },

    avatarUrl: {
      type: String,
      default: null,
      trim: true,
    },

    phoneNumber: {
      type: String,
      default: null,
      trim: true,
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other", "unknown"],
      default: "unknown",
    },

    // trim
    statusMessage: {
      type: String,
      default: null,
      trim: true,
      maxlength: 150,
    },

    // có sửa ở enum
    accountStatus: {
      type: String,
      enum: ["active", "banned"],
      default: "active",
      index: true,
    },

    // 🔐 OTP Reset Password
    resetPasswordOTP: {
      type: String,
      select: false,
    },

    resetPasswordExpire: {
      type: Date,
      select: false,
    },

    resetPasswordAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    settings: {
      allowStrangerMessage: { type: Boolean, default: false },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      notificationEnabled: { type: Boolean, default: true },
    },
  },

  //version key
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.index({ name: "text", email: "text" });

//virtual
userSchema.virtual("displayName").get(function displayName() {
  return this.name;
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
