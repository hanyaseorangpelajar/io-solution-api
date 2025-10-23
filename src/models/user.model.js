const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
    avatarUrl: {
      type: String,
      trim: true,
      default: null,
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
  }
);

/**
 * Cek apakah email sudah digunakan
 * @param {string} email - Email pengguna
 * @param {ObjectId} [excludeUserId] - ID pengguna yang akan dikecualikan
 * @returns {Promise<boolean>}
 */
UserSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

UserSchema.statics.isUsernameTaken = async function (username, excludeUserId) {
  const user = await this.findOne({ username, _id: { $ne: excludeUserId } });
  return !!user;
};

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model("User", UserSchema);

module.exports = { User, ROLES, isEmailTaken: UserSchema.statics.isEmailTaken };
