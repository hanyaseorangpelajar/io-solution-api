// server.js
require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const { connectDB, disconnectDB } = require("./src/config/db");

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "0.0.0.0";

let server;

// start sequence
(async () => {
  try {
    await connectDB();

    server = http.createServer(app);

    server.listen(PORT, HOST, () => {
      console.log(
        `🚀 Server running on http://${
          HOST === "0.0.0.0" ? "localhost" : HOST
        }:${PORT}`
      );
    });

    // handle unexpected errors
    process.on("unhandledRejection", (reason) => {
      console.error("Unhandled Rejection:", reason);
      shutdown(1);
    });

    process.on("uncaughtException", (err) => {
      console.error("Uncaught Exception:", err);
      shutdown(1);
    });

    process.on("SIGINT", () => shutdown(0));
    process.on("SIGTERM", () => shutdown(0));
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
})();

// graceful shutdown
async function shutdown(code) {
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log("HTTP server closed.");
    }
    await disconnectDB();
    console.log("MongoDB connection closed.");
  } catch (e) {
    console.error("Error during shutdown:", e);
  } finally {
    process.exit(code);
  }
}
