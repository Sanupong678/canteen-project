import fs from 'fs/promises';
import path from 'path';

const uploadsDir = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads'));
const backupsRoot = path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'));
const retentionDays = Number.parseInt(process.env.BACKUP_RETENTION_DAYS || '14', 10);

const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-');
const backupName = `uploads-${timestamp}`;
const backupPath = path.join(backupsRoot, backupName);

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const summarizeDirectory = async (dir) => {
  let fileCount = 0;
  let totalBytes = 0;

  const walk = async (currentPath) => {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        fileCount += 1;
        const stat = await fs.stat(fullPath);
        totalBytes += stat.size;
      }
    }
  };

  await walk(dir);
  return { fileCount, totalBytes };
};

const cleanupOldBackups = async () => {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return [];

  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const removed = [];
  const entries = await fs.readdir(backupsRoot, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('uploads-')) continue;
    const target = path.join(backupsRoot, entry.name);
    const stat = await fs.stat(target);
    if (stat.mtimeMs < cutoff) {
      await fs.rm(target, { recursive: true, force: true });
      removed.push(entry.name);
    }
  }
  return removed;
};

const run = async () => {
  try {
    await fs.access(uploadsDir);
  } catch {
    console.error(`[backup] uploads directory not found: ${uploadsDir}`);
    process.exit(1);
  }

  await fs.mkdir(backupsRoot, { recursive: true });
  await fs.cp(uploadsDir, backupPath, { recursive: true });

  const sourceSummary = await summarizeDirectory(uploadsDir);
  const backupSummary = await summarizeDirectory(backupPath);

  const manifest = {
    createdAt: now.toISOString(),
    source: uploadsDir,
    destination: backupPath,
    sourceFiles: sourceSummary.fileCount,
    sourceSizeBytes: sourceSummary.totalBytes,
    backupFiles: backupSummary.fileCount,
    backupSizeBytes: backupSummary.totalBytes
  };

  await fs.writeFile(
    path.join(backupPath, 'backup-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const removed = await cleanupOldBackups();

  console.log(`[backup] done: ${backupPath}`);
  console.log(`[backup] files: ${backupSummary.fileCount}`);
  console.log(`[backup] size: ${formatBytes(backupSummary.totalBytes)}`);
  if (removed.length) {
    console.log(`[backup] removed old backups (${retentionDays} days): ${removed.join(', ')}`);
  }
};

run().catch((error) => {
  console.error('[backup] failed:', error.message);
  process.exit(1);
});
