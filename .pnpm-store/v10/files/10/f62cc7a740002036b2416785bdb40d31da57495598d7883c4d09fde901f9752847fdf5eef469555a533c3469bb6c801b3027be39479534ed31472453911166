// src/main.ts
import path from "path";

// src/lib/parseHeaders.ts
import { parseAllHeaders } from "@netlify/headers-parser";
var parseHeaders = async function({
  configHeaders,
  configPath,
  headersFiles,
  logger
}) {
  const { errors, headers } = await parseAllHeaders({
    headersFiles,
    netlifyConfigPath: configPath,
    minimal: false,
    configHeaders: configHeaders ?? []
  });
  handleHeadersErrors(errors, logger);
  return headers;
};
var handleHeadersErrors = function(errors, logger) {
  if (errors.length === 0) {
    return;
  }
  const errorMessage = errors.map(({ message }) => message).join("\n\n");
  logger.error(`Headers syntax errors:
${errorMessage}`);
};

// src/lib/headersForPath.ts
var headersForPath = function(headerRules, path2) {
  const matchingHeaderRules = headerRules.filter(({ forRegExp }) => forRegExp.test(path2)).map(({ values }) => values);
  return matchingHeaderRules.reduce((acc, val) => ({ ...acc, ...val }), {});
};

// src/main.ts
var HEADERS_FILE_NAME = "_headers";
var HeadersHandler = class {
  #configHeaders;
  #configPath;
  #headersFiles;
  #logger;
  constructor({ configPath, configHeaders, projectDir, publishDir, logger }) {
    this.#configHeaders = configHeaders;
    this.#configPath = configPath;
    this.#logger = logger;
    const projectDirHeadersFile = path.resolve(projectDir, HEADERS_FILE_NAME);
    const publishDirHeadersFile = publishDir ? path.resolve(projectDir, publishDir, HEADERS_FILE_NAME) : void 0;
    this.#headersFiles = [
      .../* @__PURE__ */ new Set([projectDirHeadersFile, ...publishDirHeadersFile ? [publishDirHeadersFile] : []])
    ];
  }
  get headersFiles() {
    return this.#headersFiles;
  }
  async apply(request, response, collector) {
    const headerRules = await parseHeaders({
      headersFiles: this.#headersFiles,
      configPath: this.#configPath,
      configHeaders: this.#configHeaders,
      logger: this.#logger
    });
    const matchingHeaderRules = headersForPath(headerRules, new URL(request.url).pathname);
    for (const [key, value] of Object.entries(matchingHeaderRules)) {
      response?.headers.set(key, value);
      collector?.(key, value);
    }
    return matchingHeaderRules;
  }
};
export {
  HeadersHandler
};
