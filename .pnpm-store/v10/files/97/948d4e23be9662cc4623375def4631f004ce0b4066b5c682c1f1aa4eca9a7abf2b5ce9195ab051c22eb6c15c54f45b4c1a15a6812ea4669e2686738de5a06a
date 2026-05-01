import { readApiErrorMessage } from './api-errors.js';
import { MIGRATIONS_TABLE } from './constants.js';
const MIGRATION_FILE_NAME = 'migration.sql';
const parseVersion = (name) => {
    const match = /^(\d+)[_-]/.exec(name);
    if (!match) {
        return null;
    }
    const parsed = Number.parseInt(match[1], 10);
    return Number.isFinite(parsed) ? parsed : null;
};
export const remoteAppliedMigrations = (options) => async () => {
    const token = options.accessToken.replace('Bearer ', '');
    const url = new URL(`${options.basePath}/sites/${encodeURIComponent(options.siteId)}/database/migrations`);
    url.searchParams.set('branch', options.branch);
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const message = await readApiErrorMessage(response);
        throw new Error(`Failed to fetch applied migrations (${String(response.status)}): ${message}`);
    }
    const data = (await response.json());
    return data.migrations.filter((m) => m.applied).map((m) => ({ version: m.version, name: m.name, path: m.path }));
};
export const localAppliedMigrations = (options) => async () => {
    const { rows } = await options.executor.query(`SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY applied_at ASC, name ASC`);
    const migrations = [];
    for (const row of rows) {
        const version = parseVersion(row.name);
        if (version === null) {
            continue;
        }
        migrations.push({
            version,
            name: row.name,
            path: `${row.name}/${MIGRATION_FILE_NAME}`,
        });
    }
    return migrations;
};
//# sourceMappingURL=applied-migrations.js.map