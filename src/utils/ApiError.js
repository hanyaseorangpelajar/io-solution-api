class ApiError extends Error {
  /**
   * Creates an API Error object.
   * @param {number} statusCode - The HTTP status code (e.g., 400, 404, 500).
   * @param {string} message - The error message.
   * @param {boolean} [isOperational=true] - Flag indicating if the error is operational (expected) vs. a bug.
   * @param {string} [stack=""] - Optional stack trace.
   */
  constructor(statusCode, message, isOperational = true, stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = { ApiError };
