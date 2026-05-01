import { readdir, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import inquirer from 'inquirer';
import { log, logJson } from '../../utils/command-helpers.js';
import { resolveMigrationsDirectory } from './util/migrations-path.js';
import { utcTimestampPrefix } from './util/timestamp.js';
export const generateSlug = (description) => {
    return description
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s_-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};
export const detectNumberingScheme = (existingNames) => {
    if (existingNames.length === 0) {
        return undefined;
    }
    const prefixes = existingNames.map((name) => name.split(/[_-]/)[0]);
    const allTimestamp = prefixes.every((p) => /^\d{14}$/.test(p));
    if (allTimestamp) {
        return 'timestamp';
    }
    const allSequential = prefixes.every((p) => /^\d{4}$/.test(p));
    if (allSequential) {
        return 'sequential';
    }
    return undefined;
};
export const generateNextPrefix = (existingNames, scheme) => {
    if (scheme === 'timestamp') {
        const now = utcTimestampPrefix();
        const existingPrefixes = new Set(existingNames.map((n) => /^(\d+)/.exec(n)?.[1]).filter(Boolean));
        if (existingPrefixes.has(now)) {
            return utcTimestampPrefix(new Date(Date.now() + 1000));
        }
        return now;
    }
    const prefixes = existingNames.map((name) => {
        const match = /^(\d{4})[_-]/.exec(name);
        return match ? parseInt(match[1], 10) : 0;
    });
    const maxPrefix = prefixes.length > 0 ? Math.max(...prefixes) : 0;
    return String(maxPrefix + 1).padStart(4, '0');
};
const getExistingMigrationNames = async (migrationsDirectory) => {
    try {
        const entries = await readdir(migrationsDirectory, { withFileTypes: true });
        return entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
            .sort();
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
};
export const migrationNew = async (options, command) => {
    const { json } = options;
    const migrationsDirectory = resolveMigrationsDirectory(command);
    const existingMigrations = await getExistingMigrationNames(migrationsDirectory);
    const detectedScheme = detectNumberingScheme(existingMigrations);
    let description = options.description;
    let scheme = options.scheme;
    if (!description) {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'description',
                message: 'What is the purpose of this migration?',
                validate: (input) => (input.trim().length > 0 ? true : 'Description cannot be empty'),
            },
        ]);
        description = answers.description;
    }
    if (!scheme) {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'scheme',
                message: 'Numbering scheme:',
                choices: [
                    { name: 'Sequential (0001, 0002, ...)', value: 'sequential' },
                    { name: 'Timestamp (20260312143000)', value: 'timestamp' },
                ],
                ...(detectedScheme && { default: detectedScheme }),
            },
        ]);
        scheme = answers.scheme;
    }
    const slug = generateSlug(description);
    if (!slug) {
        throw new Error(`Description "${description}" produces an empty slug. Use a description with alphanumeric characters (e.g. "add users table").`);
    }
    const prefix = generateNextPrefix(existingMigrations, scheme);
    const folderName = `${prefix}_${slug}`;
    const folderPath = join(migrationsDirectory, folderName);
    const migrationFilePath = join(folderPath, 'migration.sql');
    await mkdir(folderPath, { recursive: true });
    await writeFile(migrationFilePath, `-- Write your migration SQL here
--
-- Example:
--   CREATE TABLE IF NOT EXISTS users (
--     id SERIAL PRIMARY KEY,
--     name TEXT NOT NULL,
--     created_at TIMESTAMP DEFAULT NOW()
--   );
`, { flag: 'wx' });
    if (json) {
        logJson({ path: folderPath, name: folderName });
    }
    else {
        log(`Created migration: ${folderName}`);
        log(`  ${join(folderPath, 'migration.sql')}`);
    }
};
//# sourceMappingURL=db-migration-new.js.map