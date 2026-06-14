const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Railway: use /data if mounted (persistent volume), else /tmp (ephemeral)
// Local dev: use the local db file
function getDbPath() {
  if (process.env.NODE_ENV === 'production') {
    // Railway persistent volume (set RAILWAY_VOLUME_MOUNT_PATH=/data in Railway)
    const volumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DB_PATH;
    if (volumePath) {
      if (!fs.existsSync(volumePath)) {
        fs.mkdirSync(volumePath, { recursive: true });
      }
      return path.join(volumePath, 'quickinvoice.sqlite');
    }
    // Fallback to /tmp (ephemeral — data lost on restart)
    console.warn('[DB] No persistent volume configured. Using /tmp — data will not survive restarts.');
    console.warn('[DB] Set RAILWAY_VOLUME_MOUNT_PATH or DB_PATH env var for persistence.');
    return '/tmp/quickinvoice.sqlite';
  }
  return path.join(__dirname, 'quickinvoice.sqlite');
}

const dbPath = getDbPath();
console.log(`[DB] Using database at: ${dbPath}`);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
