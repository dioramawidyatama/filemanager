import Database from 'better-sqlite3';
import path from 'path';
import { mkdirSync } from 'fs';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const dataDir = path.resolve('./data');
    try {
      mkdirSync(dataDir, { recursive: true });
    } catch {
      // Directory may already exist
    }
    
    const dbPath = path.join(dataDir, 'versions.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    
    initializeSchema();
  }
  
  return db;
}

function initializeSchema() {
  if (!db) return;
  
  // Versions table - stores file versions
  db.exec(`
    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL,
      content TEXT NOT NULL,
      size INTEGER NOT NULL,
      checksum TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      commit_message TEXT,
      parent_version_id INTEGER,
      FOREIGN KEY (parent_version_id) REFERENCES versions(id) ON DELETE SET NULL
    );
  `);
  
  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_versions_file_path ON versions(file_path);
    CREATE INDEX IF NOT EXISTS idx_versions_created_at ON versions(created_at);
  `);
  
  // File metadata table - tracks current state
  db.exec(`
    CREATE TABLE IF NOT EXISTS file_metadata (
      file_path TEXT PRIMARY KEY,
      current_version_id INTEGER,
      last_modified INTEGER NOT NULL DEFAULT (unixepoch()),
      auto_version_enabled INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (current_version_id) REFERENCES versions(id) ON DELETE SET NULL
    );
  `);
}

// Types
export interface Version {
  id: number;
  file_path: string;
  content: string;
  size: number;
  checksum: string;
  created_by: string;
  created_at: number;
  commit_message: string | null;
  parent_version_id: number | null;
}

export interface FileMetadata {
  file_path: string;
  current_version_id: number | null;
  last_modified: number;
  auto_version_enabled: boolean;
}

// Generate checksum for content
export function generateChecksum(content: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Create a new version
export function createVersion(
  filePath: string,
  content: string,
  createdBy: string,
  commitMessage?: string,
  parentVersionId?: number
): Version {
  const database = getDatabase();
  const size = Buffer.byteLength(content, 'utf-8');
  const checksum = generateChecksum(content);
  
  const result = database.prepare(`
    INSERT INTO versions (file_path, content, size, checksum, created_by, commit_message, parent_version_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(filePath, content, size, checksum, createdBy, commitMessage || null, parentVersionId || null);
  
  // Update file metadata
  database.prepare(`
    INSERT INTO file_metadata (file_path, current_version_id, last_modified)
    VALUES (?, ?, unixepoch())
    ON CONFLICT(file_path) DO UPDATE SET
      current_version_id = excluded.current_version_id,
      last_modified = excluded.last_modified
  `).run(filePath, result.lastInsertRowid);
  
  return {
    id: result.lastInsertRowid as number,
    file_path: filePath,
    content,
    size,
    checksum,
    created_by: createdBy,
    created_at: Math.floor(Date.now() / 1000),
    commit_message: commitMessage || null,
    parent_version_id: parentVersionId || null,
  };
}

// Get version by ID
export function getVersion(id: number): Version | null {
  const database = getDatabase();
  return database.prepare('SELECT * FROM versions WHERE id = ?').get(id) as Version | null;
}

// Get versions for a file
export function getVersionsForFile(filePath: string, limit: number = 50): Version[] {
  const database = getDatabase();
  return database.prepare(`
    SELECT * FROM versions 
    WHERE file_path = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `).all(filePath, limit) as Version[];
}

// Get current version for a file
export function getCurrentVersion(filePath: string): Version | null {
  const database = getDatabase();
  const metadata = database.prepare('SELECT * FROM file_metadata WHERE file_path = ?').get(filePath) as FileMetadata | null;
  
  if (!metadata?.current_version_id) return null;
  return getVersion(metadata.current_version_id);
}

// Check if auto-versioning is enabled for a file
export function isAutoVersionEnabled(filePath: string): boolean {
  const database = getDatabase();
  const metadata = database.prepare('SELECT auto_version_enabled FROM file_metadata WHERE file_path = ?').get(filePath) as { auto_version_enabled: number } | null;
  return metadata?.auto_version_enabled !== 0;
}

// Toggle auto-versioning for a file
export function setAutoVersionEnabled(filePath: string, enabled: boolean): void {
  const database = getDatabase();
  database.prepare(`
    INSERT INTO file_metadata (file_path, auto_version_enabled)
    VALUES (?, ?)
    ON CONFLICT(file_path) DO UPDATE SET
      auto_version_enabled = excluded.auto_version_enabled
  `).run(filePath, enabled ? 1 : 0);
}

// Restore a file to a specific version
export function restoreVersion(versionId: number, restoredBy: string): Version | null {
  const version = getVersion(versionId);
  if (!version) return null;
  
  // Create a new version with the restored content
  return createVersion(
    version.file_path,
    version.content,
    restoredBy,
    `Restored from version ${versionId}`,
    version.id
  );
}

// Delete old versions (keep last N versions per file)
export function pruneOldVersions(keepCount: number = 100): void {
  const database = getDatabase();
  
  // Get files with more than keepCount versions
  const filesToPrune = database.prepare(`
    SELECT file_path FROM versions
    GROUP BY file_path
    HAVING COUNT(*) > ?
  `).all(keepCount) as { file_path: string }[];
  
  for (const { file_path } of filesToPrune) {
    // Delete old versions keeping the most recent ones
    database.prepare(`
      DELETE FROM versions
      WHERE id NOT IN (
        SELECT id FROM versions
        WHERE file_path = ?
        ORDER BY created_at DESC
        LIMIT ?
      )
      AND file_path = ?
    `).run(file_path, keepCount, file_path);
  }
}
