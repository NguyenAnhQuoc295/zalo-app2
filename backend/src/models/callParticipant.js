const mongoose = require("mongoose");

const { Schema } = mongoose;

const CONNECTION_STATES = [
  "invited",
  "ringing",
  "joined",
  "reconnecting",
  "left",
  "rejected",
  "missed",
  "failed",
];

const DEVICE_TYPES = ["web", "android", "ios", "desktop", "unknown"];

const callParticipantSchema = new Schema(
  {
    callId: {
      type: Schema.Types.ObjectId,
      ref: "Call",
      required: true,
      index: true,
    },

    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["host", "participant"],
      default: "participant",
      index: true,
    },

    inviteOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    state: {
      type: String,
      enum: CONNECTION_STATES,
      required: true,
      default: "invited",
      index: true,
    },

    invitedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    joinedAt: {
      type: Date,
      default: null,
      index: true,
    },

    leftAt: {
      type: Date,
      default: null,
      index: true,
    },

    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    deviceType: {
      type: String,
      enum: DEVICE_TYPES,
      default: "unknown",
    },

    deviceInfo: {
      browser: { type: String, default: null, trim: true },
      os: { type: String, default: null, trim: true },
      platform: { type: String, default: null, trim: true },
    },

    //bỏ isScreenSharing
    finalMediaState: {
      isMicOn: { type: Boolean, default: true },
      isCameraOn: { type: Boolean, default: true },
      isScreenSharing: { type: Boolean, default: false },
    },

    networkSummary: {
      joinIp: { type: String, default: null, trim: true },
      reconnectCount: { type: Number, default: 0, min: 0 },
      averageLatencyMs: { type: Number, default: null, min: 0 },
      packetLossRate: { type: Number, default: null, min: 0 },
    },

    leaveReason: {
      type: String,
      default: null,
      trim: true,
    },

    lastStateAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

callParticipantSchema.index({ callId: 1, userId: 1 }, { unique: true });
callParticipantSchema.index({ callId: 1, state: 1, invitedAt: 1 });
callParticipantSchema.index({ userId: 1, createdAt: -1 });
callParticipantSchema.index({ conversationId: 1, createdAt: -1 });
callParticipantSchema.index({ callId: 1, joinedAt: 1 });

callParticipantSchema.virtual("isActive").get(function isActive() {
  return ["ringing", "joined", "reconnecting"].includes(this.state);
});

callParticipantSchema.methods.markJoined = function markJoined() {
  const now = new Date();
  this.state = "joined";
  this.joinedAt = this.joinedAt || now;
  this.lastStateAt = now;
  return this;
};

callParticipantSchema.methods.markReconnecting = function markReconnecting() {
  this.state = "reconnecting";
  this.lastStateAt = new Date();
  this.networkSummary.reconnectCount += 1;
  return this;
};

callParticipantSchema.methods.markLeft = function markLeft(reason = null) {
  const now = new Date();

  this.state = "left";
  this.leftAt = now;
  this.lastStateAt = now;

  if (reason) {
    this.leaveReason = reason;
  }

  //floor
  if (this.joinedAt && this.leftAt) {
    const diffMs = this.leftAt.getTime() - this.joinedAt.getTime();
    this.durationSeconds = Math.max(0, Math.floor(diffMs / 1000));
  }

  return this;
};

callParticipantSchema.methods.markRejected = function markRejected(
  reason = null
) {
  this.state = "rejected";
  this.lastStateAt = new Date();
  if (reason) {
    this.leaveReason = reason;
  }
  return this;
};

callParticipantSchema.methods.markMissed = function markMissed(reason = null) {
  this.state = "missed";
  this.lastStateAt = new Date();
  if (reason) {
    this.leaveReason = reason;
  }
  return this;
};

module.exports = mongoose.model("CallParticipant", callParticipantSchema);
