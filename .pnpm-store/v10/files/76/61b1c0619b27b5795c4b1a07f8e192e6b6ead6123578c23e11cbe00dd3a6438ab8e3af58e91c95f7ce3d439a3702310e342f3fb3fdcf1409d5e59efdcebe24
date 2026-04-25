import execa from 'execa';
import { type Spinner } from '../lib/spinner.js';
/**
 * Registers a cleanup function to run before the process exits. The process
 * will call `process.exit()` after all registered cleanup functions complete.
 */
export declare const runBeforeProcessExit: (fn: () => Promise<void>) => void;
export declare const runCommand: (command: string, options: {
    spinner?: Spinner;
    env?: NodeJS.ProcessEnv;
    cwd: string;
}) => execa.ExecaChildProcess<string>;
//# sourceMappingURL=shell.d.ts.map