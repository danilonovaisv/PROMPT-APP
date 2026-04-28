// TODO: These Drop API helpers should be migrated to @netlify/api once the Drop
// endpoints are added to the OpenAPI spec. Until then, we use raw fetch calls.
import fs from 'fs';
import pWaitFor from 'p-wait-for';
import { DEPLOY_POLL, DEFAULT_DEPLOY_TIMEOUT, DEFAULT_CONCURRENT_UPLOAD, DEFAULT_MAX_RETRY } from './constants.js';
const APP_NETLIFY_REFERRER = 'https://app.netlify.com';
const makeHeaders = (userAgent, extra = {}) => ({
    'User-Agent': userAgent,
    Referer: APP_NETLIFY_REFERRER,
    ...extra,
});
// TODO: Migrate to @netlify/api when Drop endpoints are in the OpenAPI spec.
export const getDropToken = async ({ apiBase, userAgent }) => {
    const response = await fetch(`${apiBase}/drop/token`, {
        method: 'POST',
        headers: makeHeaders(userAgent, { 'Content-Type': 'application/json' }),
    });
    if (!response.ok) {
        const error = new Error(`Failed to get drop token: ${String(response.status)} ${response.statusText}`);
        error.status = response.status;
        throw error;
    }
    const data = (await response.json());
    return data.token;
};
// TODO: Migrate to @netlify/api when Drop endpoints are in the OpenAPI spec.
export const createDropDeploy = async ({ apiBase, userAgent }, files, token, createdVia) => {
    const body = { files, token };
    if (createdVia) {
        body.created_via = createdVia;
    }
    const response = await fetch(`${apiBase}/drop`, {
        method: 'POST',
        headers: makeHeaders(userAgent, { 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Failed to create drop deploy: ${String(response.status)} ${errorText}`);
        error.status = response.status;
        throw error;
    }
    return (await response.json());
};
// TODO: Migrate to @netlify/api when Drop endpoints are in the OpenAPI spec.
export const uploadDropFile = async ({ apiBase, userAgent }, deployId, filePath, body, token) => {
    // Node.js fetch needs `duplex: 'half'` for streaming bodies which isn't in standard RequestInit
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
    const normalizedFilePath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    const response = await fetch(`${apiBase}/deploys/${deployId}/files${encodeURI(normalizedFilePath)}`, {
        method: 'PUT',
        headers: makeHeaders(userAgent, {
            'Content-Type': 'application/octet-stream',
            Authorization: `Bearer ${token}`,
        }),
        body: body,
        duplex: 'half',
    });
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
    if (!response.ok) {
        const error = new Error(`Failed to upload file ${filePath}: ${String(response.status)} ${response.statusText}`);
        error.status = response.status;
        throw error;
    }
};
// TODO: Migrate to @netlify/api when Drop endpoints are in the OpenAPI spec.
export const waitForDropDeploy = async ({ apiBase, userAgent }, siteId, deployId, timeout = DEFAULT_DEPLOY_TIMEOUT) => {
    let deploy;
    const checkDeploy = async () => {
        const response = await fetch(`${apiBase}/sites/${siteId}/deploys/${deployId}`, {
            headers: makeHeaders(userAgent),
        });
        if (!response.ok) {
            return false;
        }
        const data = (await response.json());
        if (data.state === 'ready') {
            deploy = data;
            return true;
        }
        if (data.state === 'error') {
            throw new Error(data.error_message || `Deploy ${deployId} had an error`);
        }
        return false;
    };
    await pWaitFor(checkDeploy, {
        interval: DEPLOY_POLL,
        timeout: {
            milliseconds: timeout,
            message: 'Timeout while waiting for deploy',
        },
    });
    // deploy is guaranteed to be set when pWaitFor resolves
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return deploy;
};
// TODO: Migrate to @netlify/api when Drop endpoints are in the OpenAPI spec.
export const claimDropSite = async ({ apiBase, userAgent }, siteId, dropToken, authToken) => {
    const response = await fetch(`${apiBase}/drop/claim`, {
        method: 'POST',
        headers: makeHeaders(userAgent, {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        }),
        body: JSON.stringify({ site: siteId, token: dropToken }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Failed to claim site: ${String(response.status)} ${errorText}`);
        error.status = response.status;
        throw error;
    }
};
export const uploadDropFiles = async (apiOptions, deployId, uploadList, token, { concurrentUpload = DEFAULT_CONCURRENT_UPLOAD, maxRetry = DEFAULT_MAX_RETRY, statusCb = (() => { }), } = {}) => {
    const { default: pMap } = await import('p-map');
    statusCb({
        type: 'upload',
        msg: `Uploading ${String(uploadList.length)} files`,
        phase: 'start',
    });
    const uploadFile = async (fileObj, index) => {
        statusCb({
            type: 'upload',
            msg: `(${String(index + 1)}/${String(uploadList.length)}) Uploading ${fileObj.normalizedPath}...`,
            phase: 'progress',
        });
        let lastError;
        for (let attempt = 0; attempt <= maxRetry; attempt++) {
            try {
                const body = fs.createReadStream(fileObj.filepath);
                await uploadDropFile(apiOptions, deployId, fileObj.normalizedPath, body, token);
                return;
            }
            catch (error) {
                lastError = error;
                if (lastError.status === 400 || lastError.status === 422) {
                    throw error;
                }
                if (attempt < maxRetry) {
                    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
                }
            }
        }
        if (lastError) {
            throw lastError;
        }
    };
    await pMap(uploadList, uploadFile, { concurrency: concurrentUpload });
    statusCb({
        type: 'upload',
        msg: `Finished uploading ${String(uploadList.length)} assets`,
        phase: 'stop',
    });
};
//# sourceMappingURL=drop-api.js.map