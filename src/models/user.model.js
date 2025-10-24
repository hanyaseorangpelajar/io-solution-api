const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { Schema } = mongoose;

const ROLES = ["Teknisi", "Admin", "SysAdmin"];

const SecuritySettingsSchema = new Schema(
  {
    twoFactorEnabled: { type: Boolean, default: false },
    recoveryEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
  },
  { _id: false }
);
const NotificationSettingsSchema = new Schema(
  {
    updates: { type: Boolean, default: true },
    announcements: { type: Boolean, default: true },
    alerts: { type: Boolean, default: true },
    frequency: {
      type: String,
      enum: ["immediate", "daily", "weekly"],
      default: "immediate",
    },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username wajib diisi"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email wajib diisi"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Masukkan alamat email yang valid"],
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password wajib diisi"],
      trim: true,
      minlength: [8, "Password minimal 8 karakter"],
      private: true,
    },
    fullName: {
      type: String,
      required: [true, "Nama lengkap wajib diisi"],
      trim: true,
    },
    role: {
      type: String,
      enum: ROLES,
      required: [true, "Role wajib diisi"],
      default: "Teknisi",
      index: true,
    },
    avatarUrl: { type: String, trim: true, default: null },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    department: { type: String, trim: true, default: null },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    securitySettings: {
      type: SecuritySettingsSchema,
      default: () => ({}),
      select: false,
    },
    notificationSettings: {
      type: NotificationSettingsSchema,
      default: () => ({}),
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        ret.name = ret.fullName;
        delete ret._id;
        delete ret.fullName;
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        ret.id = ret._id;
        ret.name = ret.fullName;
        delete ret._id;
        delete ret.fullName;
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

UserSchema.statics.isEmailTaken = async function (email, excludeUserId) {};
UserSchema.statics.isUsernameTaken = async function (
  username,
  excludeUserId
) {};
UserSchema.pre("save", async function (next) {});
UserSchema.methods.comparePassword = async function (candidatePassword) {};

const User = mongoose.models.User || mongoose.model("User", UserSchema);

module.exports = {
  User,
  ROLES,
  isEmailTaken: User.isEmailTaken,
  isUsernameTaken: User.isUsernameTaken,
};
