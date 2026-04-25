import BaseCommand from '../base-command.js';
export type NumberingScheme = 'sequential' | 'timestamp';
export interface MigrationNewOptions {
    description?: string;
    scheme?: NumberingScheme;
    json?: boolean;
}
export declare const generateSlug: (description: string) => string;
export declare const detectNumberingScheme: (existingNames: string[]) => NumberingScheme | undefined;
export declare const generateNextPrefix: (existingNames: string[], scheme: NumberingScheme) => string;
export declare const migrationNew: (options: MigrationNewOptions, command: BaseCommand) => Promise<void>;
//# sourceMappingURL=db-migration-new.d.ts.map