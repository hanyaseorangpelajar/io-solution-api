const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // 1. Import bcryptjs

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
    // 2. Add password field
    password: {
      type: String,
      required: [true, "Password wajib diisi"],
      trim: true,
      minlength: [8, "Password minimal 8 karakter"],
      private: true, // Mencegah field ini terambil by default jika tidak di .select('+password')
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
  {
    timestamps: true,
    // 5. Add toJSON transform to hide password
    toJSON: {
      transform(doc, ret) {
        delete ret.password; // Hapus password dari JSON output
        delete ret.__v;
        return ret;
      },
    },
  }
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

// 3. Add pre-save hook to hash password
UserSchema.pre("save", async function (next) {
  // Hanya hash password jika field ini dimodifikasi (atau baru)
  if (!this.isModified("password")) return next();

  // Generate salt & hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 4. Add method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// (Ini adalah perbaikan kita dari error sebelumnya, sudah benar)
const User = mongoose.models.User || mongoose.model("User", UserSchema);

module.exports = { User, ROLES };
