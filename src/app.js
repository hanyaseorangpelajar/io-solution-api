const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
require("express-async-errors");

const routesV1 = require("./routes");
const { notFound, errorHandler } = require("./middlewares");
const testRoutes = require("./routes/test.route");
const app = express();

app.use(helmet());
app.use(compression());

const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: corsOrigin === "" ? "*" : corsOrigin }));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "API is alive",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1", routesV1);

if (process.env.NODE_ENV !== "production") {
  app.use("/api/test", testRoutes);
  console.log(
    `[DEV MODE] 🧪 Test reset endpoint enabled at /api/test/reset-db`
  );
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
