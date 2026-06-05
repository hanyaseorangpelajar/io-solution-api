const mongoose = require("mongoose");
const { Schema } = mongoose;

const loginAttemptSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    usernameAttempt: {
      type: String,
      required: true,
      index: true,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    success: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

const LoginAttempt = mongoose.model("LoginAttempt", loginAttemptSchema);

module.exports = { LoginAttempt };
