import type { Client, FieldDef } from 'pg';
export type MetaCommandResult = {
    type: 'query';
    fields: FieldDef[];
    rows: Record<string, unknown>[];
    rowCount: number | null;
    command: string;
} | {
    type: 'quit';
} | {
    type: 'help';
    text: string;
} | {
    type: 'unknown';
    command: string;
};
export declare const executeMetaCommand: (input: string, client: Client) => Promise<MetaCommandResult>;
//# sourceMappingURL=meta-commands.d.ts.map