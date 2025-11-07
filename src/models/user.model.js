const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { Schema } = mongoose;

const ROLES = ["SysAdmin", "Admin", "Teknisi"];

const UserSchema = new Schema(
  {
    nama: {
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
      default: "Teknisi",
    },
    statusAktif: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: "dibuatPada", updatedAt: "diperbaruiPada" },
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Cek apakah username sudah terdaftar
 */
UserSchema.statics.findByUsernameWithPassword = function (username) {
  return this.findOne({ username }).select("+passwordHash");
};

/**
 * Cek apakah username sudah terdaftar (untuk validasi)
 * @param {string} username - Username yang akan dicek
 * @param {string} [excludeUserId] - (Opsional) ID user yang dikecualikan dari pencarian
 * @returns {Promise<boolean>} - true jika username sudah diambil, false jika belum
 */
UserSchema.statics.isUsernameTaken = async function (username, excludeUserId) {
  const query = { username: username.toLowerCase() };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  const user = await this.findOne(query);
  return !!user;
};

/**
 * Pre-save hook untuk hash password
 */
UserSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("passwordHash")) {
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
  }
  next();
});

/**
 * Method untuk membandingkan password (digunakan saat login)
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model("User", UserSchema);

module.exports = { User, ROLES };
