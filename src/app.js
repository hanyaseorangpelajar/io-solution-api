// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
require("express-async-errors");

const routesV1 = require("./routes");
const { notFound, errorHandler } = require("./middlewares/error");

const app = express();

// security & perf
app.use(helmet());
app.use(compression());

// CORS
const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: corsOrigin === "" ? "*" : corsOrigin }));

// body parsers & logger
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// root ping
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "API is alive",
    timestamp: new Date().toISOString(),
  });
});

// versioned routes
app.use("/api/v1", routesV1);

// 404 + error handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;
