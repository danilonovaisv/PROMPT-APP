/**
 * Returns the effective migrations source directory for the current build.
 *
 * If the user has set `database.migrations.path` in their config, or the new
 * default `netlify/database/migrations` directory exists, that value will have
 * been populated into `constants.DB_MIGRATIONS_SRC` upstream. If not, we fall
 * back to the legacy `netlify/db/migrations` directory for backwards
 * compatibility.
 */
export declare const getMigrationsSrc: (buildDir: string, configuredSrc: string | undefined) => Promise<string | undefined>;
export interface MigrationEntries {
    dirNames: string[];
    fileNames: string[];
}
export declare const readMigrationEntries: (buildDir: string, migrationsSrc?: string) => Promise<MigrationEntries>;
export declare const getMigrationNames: ({ dirNames, fileNames }: MigrationEntries) => string[];
