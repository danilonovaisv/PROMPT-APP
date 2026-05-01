export declare const MIGRATION_DIR_PATTERN: RegExp;
export declare const MIGRATION_FILE_PATTERN: RegExp;
interface MissingSqlFileError {
    type: 'missing_sql_file';
    dirName: string;
}
interface DuplicateMigrationNumberError {
    type: 'duplicate_migration_number';
    migrationNumber: string;
    names: string[];
}
type ValidationError = MissingSqlFileError | DuplicateMigrationNumberError;
interface ValidationResult {
    valid: true;
    dirs: string[];
    files: string[];
}
interface ValidationFailure {
    valid: false;
    errors: ValidationError[];
}
export declare const trackMigrationNumber: (numberToNames: Map<string, string[]>, name: string) => void;
export declare const validateMigrations: (dirNames: string[], fileNames: string[], existingSqlFiles: Set<string>) => ValidationResult | ValidationFailure;
export declare const formatValidationErrors: (errors: ValidationError[]) => string;
export {};
