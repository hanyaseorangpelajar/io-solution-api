const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { Schema } = mongoose;

const ROLES = ["SYSADMIN", "ADMIN", "TEKNISI"];

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Nama wajib diisi"],
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Username wajib diisi"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password wajib diisi"],
      private: true,
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ROLES,
        message: "Role tidak valid ({VALUE})",
      },
      required: true,
      default: "TEKNISI",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.statics.findByUsernameWithPassword = function (username) {
  return this.findOne({ username }).select("+passwordHash");
};

UserSchema.statics.isUsernameTaken = async function (username, excludeUserId) {
  const query = { username: username.toLowerCase() };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  const user = await this.findOne(query);
  return !!user;
};

UserSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("passwordHash")) {
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
  }
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const toUserDto = (doc) => ({
  userId: doc._id.toString(),
  name: doc.name,
  username: doc.username,
  role: doc.role,
  isActive: doc.isActive,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const User = mongoose.model("User", UserSchema);

module.exports = { User, ROLES, toUserDto };
