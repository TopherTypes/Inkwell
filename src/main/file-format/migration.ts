import { CURRENT_SCHEMA_VERSION } from '@shared/schema-version';

interface Migration {
  from: number;
  to: number;
  transform: (data: unknown) => unknown;
}

// APPEND ONLY. Never edit existing entries.
const migrations: Migration[] = [];

export function migrate(data: unknown, fromVersion: number): unknown {
  let current = data;
  let version = fromVersion;
  while (version < CURRENT_SCHEMA_VERSION) {
    const m = migrations.find(m => m.from === version);
    if (!m) throw new Error(`No migration from schema v${version} to v${version + 1}`);
    current = m.transform(current);
    version = m.to;
  }
  return current;
}

export function needsMigration(v: number): boolean {
  return v < CURRENT_SCHEMA_VERSION;
}
