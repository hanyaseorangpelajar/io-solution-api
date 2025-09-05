// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
require("express-async-errors");

const routesV1 = require("./routes");
const { notFound, errorHandler } = require("./middlewares/error");
const { auditMiddleware } = require("./middlewares/audit");

const app = express();

app.use(helmet());
app.use(compression());

const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: corsOrigin === "" ? "*" : corsOrigin }));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Audit logger — letakkan sebelum routes v1
app.use(auditMiddleware());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "API is alive",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1", routesV1);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
