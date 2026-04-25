export function startDev(devCommand: any, flags?: {}): Promise<{
    success: boolean;
    severityCode: number;
    netlifyConfig: any;
    logs: import("../log/logger.js").Logs | undefined;
    configMutations: any;
    generatedFunctions: import("../steps/return_values.js").GeneratedFunction[];
    deployEnvVars: any;
    error?: undefined;
} | {
    success: boolean;
    severityCode: number;
    logs: import("../log/logger.js").Logs | undefined;
    error: {
        message: string;
        stack: string;
    };
    deployEnvVars: never[];
    netlifyConfig?: undefined;
    configMutations?: undefined;
    generatedFunctions?: undefined;
}>;
