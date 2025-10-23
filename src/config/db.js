const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI tidak ditemukan di environment variables");
  }
  const opts = { autoIndex: true };

  mongoose.connection.on("connected", () => {
    isConnected = true;
    const { name, host, port } = mongoose.connection;
    console.log(`✅ MongoDB connected: ${name} @ ${host}:${port}`);
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.log("ℹ️ MongoDB disconnected");
  });

  await mongoose.connect(uri, opts);
  return mongoose.connection;
}

async function disconnectDB() {
  if (isConnected) {
    await mongoose.connection.close();
  }
}

module.exports = { connectDB, disconnectDB };
