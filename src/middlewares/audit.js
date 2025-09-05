// src/middlewares/audit.js
const { AuditLog } = require("../models/auditLog.model");

function genRid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function resolveRouteKey(req) {
  // best-effort: baseUrl + matched route path; fallback originalUrl sans query
  const pathOnly = req.originalUrl.split("?")[0];
  const routePath = req.route && req.route.path ? req.route.path : null;
  return (req.baseUrl || "") + (routePath || pathOnly);
}

function auditMiddleware(options = {}) {
  const skip = options.skip || [/^\/api\/v1\/health/];

  return function audit(req, res, next) {
    // skip?
    const shouldSkip = skip.some((re) => re.test(req.originalUrl));
    if (shouldSkip) return next();

    const start = Date.now();
    req.rid = req.rid || genRid();

    // capture after response finished
    res.on("finish", () => {
      try {
        const duration = Date.now() - start;

        const routeKey = resolveRouteKey(req);

        // tag dari controller (opsional)
        const tag = res.locals && res.locals.audit ? res.locals.audit : {};
        const actor =
          req.user && (req.user.id || req.user._id)
            ? String(req.user.id || req.user._id)
            : null;

        const doc = {
          rid: req.rid,
          method: req.method,
          path: req.originalUrl,
          routeKey,
          status: res.statusCode,
          durationMs: duration,
          actor,
          ip: req.ip || null,
          userAgent: req.headers["user-agent"] || null,
          resourceType: tag.resourceType || null,
          resourceId: tag.resourceId ? String(tag.resourceId) : null,
          query: req.query || {},
          bodyKeys: Object.keys(req.body || {}).slice(0, 24), // limit aman
          message: `${req.method} ${routeKey} → ${res.statusCode}${
            tag.resourceId ? ` (id=${tag.resourceId})` : ""
          }`,
        };

        // jangan blocking response
        Promise.resolve()
          .then(() => AuditLog.create(doc))
          .catch(() => {});
      } catch (_) {
        // diamkan; audit tidak boleh mematahkan request
      }
    });

    next();
  };
}

module.exports = { auditMiddleware };
