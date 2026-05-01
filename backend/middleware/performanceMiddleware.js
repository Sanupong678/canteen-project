import { monitorEventLoopDelay } from 'perf_hooks';

const DEFAULT_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS, 10) || 15000;
const SLOW_REQUEST_THRESHOLD_MS = parseInt(process.env.SLOW_REQUEST_MS, 10) || 1000;
const EVENT_LOOP_MONITOR_RESOLUTION_MS = 20;

const eventLoopHistogram = monitorEventLoopDelay({ resolution: EVENT_LOOP_MONITOR_RESOLUTION_MS });
let eventLoopMonitorTimer = null;

export const requestTimeout = (timeoutMs = DEFAULT_TIMEOUT_MS) => (req, res, next) => {
  req.setTimeout(timeoutMs);
  res.setTimeout(timeoutMs);
  next();
};

export const logSlowRequests = (thresholdMs = SLOW_REQUEST_THRESHOLD_MS) => (req, res, next) => {
  const startedAtNs = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAtNs) / 1_000_000;
    if (durationMs > thresholdMs) {
      const mem = process.memoryUsage();
      console.warn(
        `[SLOW_REQUEST] ${req.method} ${req.originalUrl} ` +
        `took ${durationMs.toFixed(1)}ms status=${res.statusCode} ` +
        `heapUsedMB=${(mem.heapUsed / 1024 / 1024).toFixed(1)}`
      );
    }
  });
  next();
};

export const startEventLoopMonitor = () => {
  if (eventLoopMonitorTimer) return;
  eventLoopHistogram.enable();
  const intervalMs = parseInt(process.env.EVENT_LOOP_LOG_INTERVAL_MS, 10) || 30000;

  eventLoopMonitorTimer = setInterval(() => {
    const p95 = Number(eventLoopHistogram.percentile(95) / 1e6);
    const p99 = Number(eventLoopHistogram.percentile(99) / 1e6);
    if (p95 > 100 || p99 > 200) {
      console.warn(`[EVENT_LOOP] delay p95=${p95.toFixed(2)}ms p99=${p99.toFixed(2)}ms`);
    }
    eventLoopHistogram.reset();
  }, intervalMs);
};

export const stopEventLoopMonitor = () => {
  if (eventLoopMonitorTimer) {
    clearInterval(eventLoopMonitorTimer);
    eventLoopMonitorTimer = null;
  }
  eventLoopHistogram.disable();
};
