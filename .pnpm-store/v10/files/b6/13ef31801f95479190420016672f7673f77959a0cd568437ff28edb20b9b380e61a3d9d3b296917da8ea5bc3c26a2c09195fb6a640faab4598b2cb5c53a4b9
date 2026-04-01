import { Features } from '@netlify/dev';

interface NetlifyPluginOptions extends Features {
    /**
     * Attach a Vite middleware that intercepts requests and handles them in the
     * same way as the Netlify production environment (default: true).
     */
    middleware?: boolean;
    /**
     * DO NOT USE - build options, not meant for public use at this time.
     * @private
     */
    build?: {
        /**
         * Prepare the server build for deployment to Netlify - no additional configuration,
         * plugins, or adapters necessary (default: false).
         *
         * This is currently only supported for TanStack Start projects.
         */
        enabled?: boolean;
        /**
         * Deploy SSR handler to Netlify Edge Functions instead of Netlify Functions (default: false).
         */
        edgeSSR?: boolean;
        /**
         * A display name for the serverless function or edge function deployed to Netlify
         * (default: `@netlify/vite-plugin server handler`).
         */
        displayName?: string;
    };
}
declare function netlify(options?: NetlifyPluginOptions): any;

export { type NetlifyPluginOptions, netlify as default };
