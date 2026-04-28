import { getWebSocket } from '../../../utils/websockets/index.js';
import { buildFunctionLogsUrl, fetchHistoricalLogs } from '../log-api.js';
const MAX_CONCURRENT_FUNCTIONS = 10;
export const listFunctions = async (client, siteId, deployId) => {
    if (deployId) {
        const deploy = (await client.getSiteDeploy({ siteId, deployId }));
        return deploy.available_functions ?? [];
    }
    const searchResponse = (await client.searchSiteFunctions({ siteId }));
    return searchResponse.functions ?? [];
};
export const selectFunctions = (allFunctions, filterNames) => {
    if (filterNames.length === 0) {
        return allFunctions;
    }
    const selected = [];
    for (const name of filterNames) {
        const match = allFunctions.find((fn) => fn.n === name);
        if (!match) {
            throw new Error(`Could not find function ${name}`);
        }
        selected.push(match);
    }
    return selected;
};
export const validateFunctionCount = (count) => {
    if (count > MAX_CONCURRENT_FUNCTIONS) {
        throw new Error(`You can only stream logs for up to ${MAX_CONCURRENT_FUNCTIONS.toString()} functions at a time — this project has ${count.toString()}.`);
    }
};
export const fetchFunctionHistoricalLogs = async ({ functions, siteId, accessToken, from, to, deployId, }) => {
    const results = await Promise.all(functions.map(async (fn) => {
        const baseUrl = buildFunctionLogsUrl({ siteId, branch: fn.branch, functionName: fn.n });
        const entries = await fetchHistoricalLogs({ baseUrl, accessToken, from, to, deployId });
        return entries.map((entry) => ({
            source: 'function',
            name: fn.n,
            ts: entry.ts,
            level: entry.level || 'INFO',
            message: entry.message,
        }));
    }));
    return results.flat();
};
export const streamFunctions = (functions, siteId, accessToken, onEntry) => {
    const sockets = [];
    for (const fn of functions) {
        const ws = getWebSocket('wss://socketeer.services.netlify.com/function/logs');
        sockets.push(ws);
        ws.on('open', () => {
            ws.send(JSON.stringify({
                function_id: fn.oid,
                site_id: siteId,
                access_token: accessToken,
                account_id: fn.a,
            }));
        });
        ws.on('message', (data) => {
            const logData = JSON.parse(data);
            onEntry({
                source: 'function',
                name: fn.n,
                ts: typeof logData.ts === 'number' ? logData.ts : Date.now(),
                level: logData.level || 'INFO',
                message: logData.message,
            });
        });
    }
    return () => {
        for (const ws of sockets) {
            ws.close();
        }
    };
};
//# sourceMappingURL=functions.js.map