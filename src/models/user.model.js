const mongoose = require("mongoose");

const ROLES = ["Teknisi", "Admin", "SysAdmin"];

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username wajib diisi"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
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
  },
  { timestamps: true }
);

/**
 * Cek apakah username sudah digunakan
 * @param {string} username - Username pengguna
 * @param {ObjectId} [excludeUserId] - ID pengguna yang akan dikecualikan
 * @returns {Promise<boolean>}
 */
UserSchema.statics.isUsernameTaken = async function (username, excludeUserId) {
  const user = await this.findOne({ username, _id: { $ne: excludeUserId } });
  return !!user;
};

UserSchema.statics.isUsernameTaken = async function (username, excludeUserId) {
  const user = await this.findOne({ username, _id: { $ne: excludeUserId } });
  return !!user;
};

// Cek apakah model 'User' sudah ada sebelum membuatnya
const User = mongoose.models.User || mongoose.model("User", UserSchema);

module.exports = { User, ROLES };
