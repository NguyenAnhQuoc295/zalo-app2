const mongoose = require("mongoose");

const { Schema } = mongoose;

const CALL_TYPES = ["audio", "video"];
const CALL_STATUSES = [
  "ringing",
  "ongoing",
  "ended",
  "missed",
  "rejected",
  "cancelled",
];

const callSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: CALL_TYPES,
      required: true,
      default: "video",
    },

    status: {
      type: String,
      enum: CALL_STATUSES,
      required: true,
      default: "ringing",
      index: true,
    },

    startedAt: {
      type: Date,
      default: null,
      index: true,
    },

    endedAt: {
      type: Date,
      default: null,
      index: true,
    },

    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    //?
    endedReason: {
      type: String,
      default: null,
      trim: true,
    },

    participantCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxParticipantCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastEventAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    metadata: {
      roomKey: { type: String, default: null, trim: true },
      serverRegion: { type: String, default: null, trim: true },
      recordingEnabled: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

callSchema.index({ conversationId: 1, createdAt: -1 });
callSchema.index({ initiatedBy: 1, createdAt: -1 });
callSchema.index({ conversationId: 1, status: 1, createdAt: -1 });

callSchema.virtual("isActive").get(function isActive() {
  return this.status === "ringing" || this.status === "ongoing";
});

callSchema.methods.markStarted = function markStarted() {
  if (!this.startedAt) {
    this.startedAt = new Date();
  }
  this.status = "ongoing";
  this.lastEventAt = new Date();
  return this;
};

callSchema.methods.markEnded = function markEnded(reason = null) {
  const now = new Date();

  this.status = this.status === "ringing" ? "missed" : "ended";
  this.endedAt = now;
  this.lastEventAt = now;

  if (reason) {
    this.endedReason = reason;
  }

  if (this.startedAt && this.endedAt) {
    const diffMs = this.endedAt.getTime() - this.startedAt.getTime();
    this.durationSeconds = Math.max(0, Math.floor(diffMs / 1000));
  }

  return this;
};

module.exports = mongoose.model("Call", callSchema);
