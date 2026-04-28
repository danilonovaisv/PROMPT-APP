import { getWebSocket } from '../../../utils/websockets/index.js';
import { buildEdgeFunctionLogsUrl, debugFetch, fetchHistoricalLogs } from '../log-api.js';
export const listEdgeFunctions = async (apiBase, accessToken, deployId) => {
    const response = await debugFetch(`${apiBase}/api/v1/deploys/${encodeURIComponent(deployId)}/edge_functions`, {
        headers: {
            Authorization: `Bearer ${accessToken ?? ''}`,
        },
    });
    if (!response.ok) {
        return [];
    }
    const data = (await response.json());
    if (Array.isArray(data)) {
        return data;
    }
    return data.edge_functions ?? [];
};
export const fetchEdgeFunctionHistoricalLogs = async ({ siteId, accessToken, from, to, deployId, filterNames, }) => {
    if (filterNames.length > 0) {
        const results = await Promise.all(filterNames.map(async (filterName) => {
            const baseUrl = buildEdgeFunctionLogsUrl({ siteId, search: filterName });
            const entries = await fetchHistoricalLogs({ baseUrl, accessToken, from, to, deployId });
            return entries.map((entry) => ({
                source: 'edge-function',
                name: entry.name ?? entry.function ?? filterName,
                ts: entry.ts,
                level: entry.level || 'INFO',
                message: entry.message,
            }));
        }));
        return results.flat();
    }
    const baseUrl = buildEdgeFunctionLogsUrl({ siteId });
    const entries = await fetchHistoricalLogs({ baseUrl, accessToken, from, to, deployId });
    return entries.map((entry) => ({
        source: 'edge-function',
        name: entry.name ?? entry.function ?? 'edge-function',
        ts: entry.ts,
        level: entry.level || 'INFO',
        message: entry.message,
    }));
};
export const streamEdgeFunctions = (siteId, deployId, accessToken, filterNames, onEntry) => {
    const ws = getWebSocket('wss://socketeer.services.netlify.com/edge-function/logs');
    ws.on('open', () => {
        ws.send(JSON.stringify({
            deploy_id: deployId,
            site_id: siteId,
            access_token: accessToken,
            since: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        }));
    });
    ws.on('message', (data) => {
        const logData = JSON.parse(data);
        const name = logData.function ?? 'edge-function';
        if (filterNames.length > 0 && !filterNames.some((f) => name === f || logData.request_path === f)) {
            return;
        }
        onEntry({
            source: 'edge-function',
            name,
            ts: typeof logData.ts === 'number' ? logData.ts : Date.now(),
            level: logData.level || 'INFO',
            message: logData.message,
        });
    });
    return () => {
        ws.close();
    };
};
//# sourceMappingURL=edge-functions.js.map