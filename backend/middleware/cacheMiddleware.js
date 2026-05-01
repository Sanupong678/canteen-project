const cacheStore = new Map();

const buildCacheKey = (req) => `${req.originalUrl}`;

export const cache = (ttlSeconds = 60) => (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  if (req.method !== 'GET') return next();

  const key = buildCacheKey(req);
  const now = Date.now();
  const existing = cacheStore.get(key);

  if (existing && existing.expiresAt > now) {
    req.perf?.mark(
      'middleware.cache',
      Number(process.hrtime.bigint() - startedAt) / 1_000_000,
      { cache: 'hit' }
    );
    return res.json(existing.payload);
  }

  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    cacheStore.set(key, {
      payload,
      expiresAt: now + (ttlSeconds * 1000)
    });
    return originalJson(payload);
  };

  req.perf?.mark(
    'middleware.cache',
    Number(process.hrtime.bigint() - startedAt) / 1_000_000,
    { cache: 'miss' }
  );

  next();
};

export const clearCacheByPrefix = (prefix) => {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
};
