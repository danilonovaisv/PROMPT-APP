// src/main.ts
import process from "process";

// src/lib/rewriter.ts
import path from "path";
import { toMultiValueHeaders } from "@netlify/dev-utils";
import cookie from "cookie";
import redirector from "netlify-redirector";

// src/lib/parser.ts
import { parseAllRedirects } from "@netlify/redirect-parser";
var parseRedirects = async function({
  configRedirects = [],
  configPath,
  redirectsFiles
}) {
  const parsed = await parseAllRedirects({
    redirectsFiles,
    netlifyConfigPath: configPath,
    minimal: false,
    // @ts-expect-error TODO: Fix this type in `@netlify/redirect-parser`.
    configRedirects
  });
  handleRedirectParsingErrors(parsed.errors);
  return parsed.redirects.map(normalizeRedirect);
};
var handleRedirectParsingErrors = (errors) => {
  if (errors.length === 0) {
    return;
  }
  const errorMessage = errors.map(({ message }) => message).join("\n\n");
  console.log(`Redirects syntax errors:
${errorMessage}`);
};
var normalizeRedirect = function(input) {
  const { conditions, from, query, signed, ...redirect } = input;
  return {
    ...redirect,
    origin: from,
    params: query,
    conditions,
    ...signed && {
      sign: {
        jwt_secret: signed
      }
    }
  };
};

// src/lib/rewriter.ts
var REDIRECTS_FILE_NAME = "_redirects";
var getLanguage = (acceptLanguage) => {
  if (acceptLanguage) {
    return acceptLanguage.split(",")[0].slice(0, 2);
  }
  return "en";
};
var createRewriter = async function({
  configPath,
  configRedirects,
  geoCountry,
  ignoreSPARedirect = false,
  jwtRoleClaim,
  jwtSecret,
  projectDir,
  publicDir
}) {
  let matcher = null;
  const redirectsFiles = [
    .../* @__PURE__ */ new Set([path.resolve(publicDir ?? "", REDIRECTS_FILE_NAME), path.resolve(projectDir, REDIRECTS_FILE_NAME)])
  ];
  let redirects = await parseRedirects({ configRedirects, redirectsFiles, configPath });
  if (ignoreSPARedirect) {
    redirects = redirects.filter((redirect) => {
      const isSPARedirect = redirect.origin === "/*" && redirect.to === "/index.html" && redirect.status === 200;
      return !isSPARedirect;
    });
  }
  const getMatcher = async () => {
    if (matcher) return matcher;
    if (redirects.length !== 0) {
      return matcher = await redirector.parseJSON(JSON.stringify(redirects), {
        jwtSecret,
        jwtRoleClaim
      });
    }
    return {
      match() {
        return null;
      }
    };
  };
  return async function rewriter(req) {
    const matcherFunc = await getMatcher();
    const reqUrl = new URL(req.url);
    const cookieValues = cookie.parse(req.headers.get("cookie") || "");
    const headers = {
      "x-language": cookieValues.nf_lang || getLanguage(req.headers.get("accept-language")),
      "x-country": cookieValues.nf_country || geoCountry || "us",
      ...toMultiValueHeaders(req.headers)
    };
    const matchReq = {
      scheme: reqUrl.protocol.replace(/:.*$/, ""),
      host: reqUrl.hostname,
      path: decodeURIComponent(reqUrl.pathname),
      query: reqUrl.search.slice(1),
      headers,
      cookieValues,
      getHeader: (name) => {
        const val = headers[name.toLowerCase()];
        if (Array.isArray(val)) {
          return val[0];
        }
        return val || "";
      },
      getCookie: (key) => cookieValues[key] || ""
    };
    return matcherFunc.match(matchReq);
  };
};

// src/lib/signer.ts
import jwt from "jsonwebtoken";
var signRedirect = ({ deployContext, secret, siteID, siteURL }) => {
  const claims = {
    deploy_context: deployContext,
    netlify_id: siteID,
    site_url: siteURL
  };
  const options = {
    expiresIn: "5 minutes",
    issuer: "netlify"
  };
  return jwt.sign(claims, secret, options);
};

// src/main.ts
var RedirectsHandler = class {
  notFoundHandler;
  rewriter;
  siteID;
  siteURL;
  constructor({
    configPath,
    configRedirects,
    geoCountry,
    jwtRoleClaim,
    jwtSecret,
    notFoundHandler,
    projectDir,
    publicDir,
    siteID,
    siteURL
  }) {
    this.notFoundHandler = notFoundHandler ?? (() => Promise.resolve(new Response("Not found", { status: 404 })));
    this.rewriter = createRewriter({
      configPath,
      configRedirects,
      geoCountry,
      ignoreSPARedirect: true,
      jwtRoleClaim,
      jwtSecret,
      projectDir,
      publicDir
    });
    this.siteID = siteID ?? "0";
    this.siteURL = siteURL ?? "http://localhost";
  }
  async match(request) {
    const rewriter = await this.rewriter;
    const rule = await rewriter(request);
    if (!rule) {
      return;
    }
    if (rule.force404) {
      return {
        external: false,
        force: true,
        headers: {},
        hiddenProxy: false,
        redirect: false,
        statusCode: 404,
        target: new URL(""),
        targetRelative: ""
      };
    }
    const requestURL = new URL(request.url);
    const headers = {
      ...rule.force404 ? {} : rule.proxyHeaders
    };
    const hiddenProxy = Object.entries(headers).some(
      ([key, val]) => key.toLowerCase() === "x-nf-hidden-proxy" && val === "true"
    );
    const target = new URL(rule.to, request.url);
    const match = {
      external: "to" in rule && /^https?:\/\//.exec(rule.to) != null,
      force: rule.force,
      headers,
      hiddenProxy,
      redirect: "status" in rule && rule.status != null && rule.status >= 300 && rule.status <= 400,
      statusCode: rule.status,
      target,
      targetRelative: `${rule.to}${requestURL.search}${requestURL.hash}`
    };
    if (target.searchParams.size === 0) {
      requestURL.searchParams.forEach((val, key) => {
        target.searchParams.append(key, val);
      });
    }
    if (rule.signingSecret) {
      const signingSecretVar = process.env[rule.signingSecret];
      if (signingSecretVar) {
        match.headers["x-nf-sign"] = signRedirect({
          deployContext: "dev",
          secret: signingSecretVar,
          siteID: this.siteID,
          siteURL: this.siteURL
        });
      } else {
        match.error = new Error(`Could not sign redirect because environment variable ${rule.signingSecret} is not set`);
      }
    }
    return match;
  }
  async handle(request, match, getStaticFile) {
    if (match.force && match.statusCode === 404) {
      return this.notFoundHandler(request);
    }
    const sourceStaticFile = await getStaticFile(request);
    if (sourceStaticFile && !match.force) {
      return sourceStaticFile();
    }
    if (match.redirect) {
      return Response.redirect(match.target, match.statusCode);
    }
    if (match.external) {
      const req = new Request(match.target, request);
      return fetch(req);
    }
    const targetStaticFile = await getStaticFile(new Request(match.target, request));
    if (targetStaticFile) {
      return targetStaticFile();
    }
  }
};
export {
  RedirectsHandler
};
