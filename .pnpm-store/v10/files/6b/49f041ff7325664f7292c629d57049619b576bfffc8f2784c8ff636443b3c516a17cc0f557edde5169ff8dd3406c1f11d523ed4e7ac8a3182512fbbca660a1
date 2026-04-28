import net from 'net';
import type { NetlifyPluginConstants } from '../../core/constants.js';
/**
 * Creates the Buildbot IPC client we use to initiate the deploy
 */
export declare const createBuildbotClient: (buildbotServerSocket: string) => net.Socket;
/**
 * Emits the connect event
 */
export declare const connectBuildbotClient: (...args: unknown[]) => Promise<void>;
/**
 * Closes the buildbot client and its connection
 */
export declare const closeBuildbotClient: (client: net.Socket) => Promise<void>;
/**
 * Initates the deploy with the given buildbot client
 */
export declare const deploySiteWithBuildbotClient: ({ client, environment, events, buildDir, repositoryRoot, constants, }: {
    client: net.Socket;
    environment: {
        key: string;
        value: string;
        isSecret: boolean;
        scopes: string[];
    }[];
    events: string[];
    buildDir: string;
    repositoryRoot: string;
    constants: NetlifyPluginConstants;
}) => Promise<undefined>;
