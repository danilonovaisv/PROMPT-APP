import { log } from './command-helpers.js';
import { isInteractive } from './scripted-commands.js';
const OPTION_ERROR_CODES = new Set([
    'commander.unknownOption',
    'commander.missingArgument',
    'commander.excessArguments',
]);
export const isOptionError = (error) => OPTION_ERROR_CODES.has(error.code);
export const handleOptionError = (command) => {
    if (!isInteractive()) {
        log();
        command.outputHelp({ error: true });
        log();
    }
};
//# sourceMappingURL=command-error-handler.js.map