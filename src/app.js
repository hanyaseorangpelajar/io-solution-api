const express = require("express");
const cors = require("cors");
const { StatusCodes } = require("http-status-codes");
const morgan = require("morgan");
require("express-async-errors");
const path = require("path");

const authRouter = require("./routes/auth.route");
const kbEntryRouter = require("./routes/kbEntry.route");
const userRouter = require("./routes/user.route");
const uploadRouter = require("./routes/upload.route");
const { notFound, errorHandler } = require("./middlewares");

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/v1", express.static(path.join(__dirname, "..", "public")));

app.get("/api/v1", (req, res) => {
  res.status(StatusCodes.OK).json({
    message: "API for I/O Solutions",
  });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/kb-entry", kbEntryRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/upload", uploadRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
