const isEnabled = () => {
  const explicit = String(process.env.PERF_TIMING || '').toLowerCase();
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;
  return process.env.NODE_ENV !== 'production';
};

const nowNs = () => process.hrtime.bigint();
const nsToMs = (ns) => Number(ns) / 1_000_000;

export const requestProfiler = (req, res, next) => {
  if (!isEnabled()) return next();

  const startedAt = nowNs();
  req.perf = {
    marks: [],
    mark: (name, durationMs, meta = {}) => {
      req.perf.marks.push({ name, durationMs, ...meta });
    }
  };

  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    const serializeStart = nowNs();
    const result = originalJson(payload);
    const serializeMs = nsToMs(nowNs() - serializeStart);
    req.perf.mark('response.serialization', serializeMs, {
      payloadSizeBytes: Buffer.byteLength(JSON.stringify(payload || {}))
    });
    return result;
  };

  const slowMs = parseInt(process.env.SLOW_REQUEST_MS, 10) || 1000;
  const verbose = String(process.env.PERF_VERBOSE || '').toLowerCase() === 'true';

  res.on('finish', () => {
    const totalMs = nsToMs(nowNs() - startedAt);
    if (!verbose && totalMs < slowMs) return;

    const breakdown = req.perf.marks
      .map((m) => `${m.name}=${m.durationMs.toFixed(1)}ms`)
      .join(' ');

    console.warn(
      `[REQ_PROFILE] ${req.method} ${req.originalUrl} ` +
      `status=${res.statusCode} total=${totalMs.toFixed(1)}ms ${breakdown}`
    );
  });

  next();
};

export const timedMiddleware = (name, middleware) => {
  return (req, res, next) => {
    if (!req.perf) return middleware(req, res, next);
    const startedAt = nowNs();
    middleware(req, res, (err) => {
      req.perf.mark(`middleware.${name}`, nsToMs(nowNs() - startedAt));
      next(err);
    });
  };
};

export const timedHandler = (name, handler) => {
  return async (req, res, next) => {
    const startedAt = nowNs();
    try {
      await handler(req, res, next);
    } finally {
      req.perf?.mark(`controller.${name}`, nsToMs(nowNs() - startedAt));
    }
  };
};
