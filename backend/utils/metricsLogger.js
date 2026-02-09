import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS_DIR = path.join(__dirname, '../logs');
const METRICS_LOG_FILE = path.join(LOGS_DIR, 'metrics.log');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const ARCHIVE_DIR = path.join(LOGS_DIR, 'archive');

// Ensure directories exist
const ensureDirs = () => {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
};

// Rotate log if size exceeds limit
const rotateLogIfNeeded = () => {
  try {
    if (fs.existsSync(METRICS_LOG_FILE)) {
      const stats = fs.statSync(METRICS_LOG_FILE);
      if (stats.size > MAX_LOG_SIZE) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveFile = path.join(ARCHIVE_DIR, `metrics-${timestamp}.log`);
        fs.renameSync(METRICS_LOG_FILE, archiveFile);
        console.log(`📋 Metrics log rotated to ${archiveFile}`);
      }
    }
  } catch (e) {
    console.error('❌ Error rotating metrics log:', e.message);
  }
};

export const logMetrics = (label, data) => {
  try {
    ensureDirs();
    rotateLogIfNeeded();

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      label,
      data,
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      }
    };

    fs.appendFileSync(METRICS_LOG_FILE, JSON.stringify(logEntry) + '\n', 'utf8');
  } catch (e) {
    console.error('❌ Error writing metrics log:', e.message);
  }
};

export const startPeriodicMetricsLogging = (getMetricsCallback, intervalMs = 30000) => {
  const interval = setInterval(() => {
    try {
      const metrics = getMetricsCallback();
      logMetrics('PERIODIC_CHECK', metrics);
    } catch (e) {
      console.error('❌ Error in periodic metrics logging:', e.message);
    }
  }, intervalMs);

  return () => clearInterval(interval);
};

export const readMetricsLog = (lines = 100) => {
  try {
    if (!fs.existsSync(METRICS_LOG_FILE)) {
      return [];
    }
    const content = fs.readFileSync(METRICS_LOG_FILE, 'utf8');
    const allLines = content.trim().split('\n').filter(l => l);
    return allLines.slice(-lines).map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return { error: line };
      }
    });
  } catch (e) {
    return [{ error: String(e) }];
  }
};
