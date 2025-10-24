/**
 * Wrapper function to catch errors in async Express route handlers
 * and pass them to the next() middleware (errorHandler).
 * @param {Function} fn - The async route handler function (req, res, next) => Promise<void>.
 * @returns {Function} Express middleware function.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

module.exports = { catchAsync };
