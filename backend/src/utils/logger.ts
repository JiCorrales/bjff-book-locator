import * as fs from 'fs';
import * as path from 'path';

interface ChangeLogEntry {
  timestamp: string;
  entity: 'Modules' | 'Shelving_units' | 'Shelves' | 'Users';
  id: number;
  action: 'update_range' | 'toggle_active' | 'update_full' | 'create_user' | 'update_user' | 'delete_user';
  before?: Record<string, any>;
  after?: Record<string, any>;
}

const logsDir = path.join(__dirname, '../../logs');
const changesLogPath = path.join(logsDir, 'changes.log');

function ensureLogsDir() {
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  } catch (err) {
    // If logging directory can't be created, continue silently
    console.error('[logger] Failed to ensure logs directory:', err);
  }
}

export function logChange(entry: ChangeLogEntry) {
  ensureLogsDir();
  const line = JSON.stringify(entry) + '\n';
  try {
    fs.appendFileSync(changesLogPath, line, { encoding: 'utf8' });
  } catch (err) {
    console.error('[logger] Failed to write change log:', err);
  }
  console.log('[change-log]', entry);
}