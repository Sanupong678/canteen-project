import fs from 'fs/promises';
import path from 'path';

const uploadsDir = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads'));
const backupsRoot = path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'));

const [, , backupNameArg, cleanFlagArg] = process.argv;
const cleanTarget = cleanFlagArg === '--clean';

if (!backupNameArg) {
  console.error('Usage: npm run restore:uploads -- <backup-folder-name> [--clean]');
  process.exit(1);
}

const backupPath = path.join(backupsRoot, backupNameArg);

const run = async () => {
  try {
    const stat = await fs.stat(backupPath);
    if (!stat.isDirectory()) {
      throw new Error('Backup path is not a directory');
    }
  } catch {
    console.error(`[restore] backup not found: ${backupPath}`);
    process.exit(1);
  }

  await fs.mkdir(uploadsDir, { recursive: true });

  if (cleanTarget) {
    const existingEntries = await fs.readdir(uploadsDir);
    for (const entry of existingEntries) {
      await fs.rm(path.join(uploadsDir, entry), { recursive: true, force: true });
    }
  }

  await fs.cp(backupPath, uploadsDir, { recursive: true });
  await fs.rm(path.join(uploadsDir, 'backup-manifest.json'), { force: true });

  console.log(`[restore] done from: ${backupPath}`);
  console.log(`[restore] target: ${uploadsDir}`);
  console.log(`[restore] mode: ${cleanTarget ? 'clean replace' : 'merge copy'}`);
};

run().catch((error) => {
  console.error('[restore] failed:', error.message);
  process.exit(1);
});
