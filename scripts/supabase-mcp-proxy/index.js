/**
 * SUPABASE MCP PROXY FOR CHATGPT CUSTOM ACTIONS
 *
 * This Cloudflare Worker acts as a stateful proxy between the stateless ChatGPT Actions
 * and the stateful Supabase Remote MCP server (https://mcp.supabase.com/mcp).
 * It automatically manages the MCP handshake (initialize) and persists the Mcp-Session-Id.
 *
 * SETUP INSTRUCTIONS:
 * 1. Install Wrangler CLI:
 *    npm install -g wrangler
 *
 * 2. Run locally for testing:
 *    npx wrangler dev index.js
 *
 * 3. Deploy to Cloudflare:
 *    npx wrangler deploy index.js --name supabase-mcp-proxy
 *
 * 4. Configure ChatGPT Custom Action:
 *    Use the generated worker URL (e.g., https://supabase-mcp-proxy.<your-subdomain>.workers.dev)
 *    as the base URL in your OpenAPI specification.
 *
 * DEPENDENCIES:
 * - None (runs on standard Cloudflare Workers runtime)
 *
 * ENVIRONMENT VARIABLES:
 * - None required (Authorization header is forwarded from ChatGPT PAT token config)
 */

const SESSIONS = new Map();

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const projectRef = url.searchParams.get("project_ref");
    if (!projectRef) {
      return new Response("Missing project_ref query parameter", { status: 400 });
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Missing Authorization header", { status: 401 });
    }

    // Forward URL parameters and construct remote target URL
    const supabaseMcpUrl = `https://mcp.supabase.com/mcp${url.search}`;
    let sessionId = SESSIONS.get(projectRef);

    // If session doesn't exist, initialize it automatically
    if (!sessionId) {
      sessionId = await initializeSession(supabaseMcpUrl, authHeader);
      if (!sessionId) {
        return new Response("Failed to initialize MCP session with Supabase", { status: 500 });
      }
      SESSIONS.set(projectRef, sessionId);
    }

    const bodyText = await request.text();
    let response = await forwardRequest(supabaseMcpUrl, authHeader, sessionId, bodyText);

    // If session expired or became invalid (HTTP 400/404 indicating session issue)
    if (response.status === 400 || response.status === 404) {
      const responseClone = response.clone();
      try {
        const errorJson = await responseClone.json();
        if (errorJson.message && errorJson.message.includes("Mcp-Session-Id")) {
          // Re-initialize a new session
          sessionId = await initializeSession(supabaseMcpUrl, authHeader);
          if (sessionId) {
            SESSIONS.set(projectRef, sessionId);
            response = await forwardRequest(supabaseMcpUrl, authHeader, sessionId, bodyText);
          }
        }
      } catch (e) {
        // Fall back to returning the original error response
      }
    }

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  }
};

async function initializeSession(url, authHeader) {
  const initPayload = {
    jsonrpc: "2.0",
    id: "init_1",
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "chatgpt-actions-proxy",
        version: "1.0.0"
      }
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader
    },
    body: JSON.stringify(initPayload)
  });

  if (!res.ok) {
    return null;
  }

  // Retrieve the session ID from headers
  return res.headers.get("Mcp-Session-Id");
}

async function forwardRequest(url, authHeader, sessionId, body) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader,
      "Mcp-Session-Id": sessionId
    },
    body: body
  });
}
