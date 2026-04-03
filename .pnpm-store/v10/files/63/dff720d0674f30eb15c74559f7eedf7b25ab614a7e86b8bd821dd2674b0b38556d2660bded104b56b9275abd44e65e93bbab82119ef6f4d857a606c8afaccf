// src/main.ts
import path2 from "path";
import mime from "mime-types";

// src/lib/fs.ts
import { createReadStream, promises as fs } from "fs";
import { Readable } from "stream";
var fileExists = async (path3) => {
  try {
    const stat = await fs.stat(path3);
    if (stat.isFile()) {
      return true;
    }
  } catch {
  }
  return false;
};
var getReadableStreamFromFile = (path3) => {
  const stream = createReadStream(path3);
  return Readable.toWeb(stream);
};

// src/lib/paths.ts
import path from "path";
var assetExtensionRegExp = /\.(html?|png|jpg|js|css|svg|gif|ico|woff|woff2)$/;
var getFilePathsForURL = (pathname, baseDirectory = "") => {
  const urlVariations = getURLVariations(pathname);
  const possiblePaths = urlVariations.map((urlVariation) => {
    const parts = urlVariation.split("/").filter(Boolean);
    return path.resolve.apply(null, [baseDirectory, ...parts]);
  });
  return possiblePaths;
};
var getURLVariations = (pathname) => {
  const paths = [];
  if (pathname.endsWith("/")) {
    const end = pathname.length - 1;
    if (pathname !== "/") {
      paths.push(`${pathname.slice(0, end)}.html`, `${pathname.slice(0, end)}.htm`);
    }
    paths.push(`${pathname}index.html`, `${pathname}index.htm`);
  } else if (!assetExtensionRegExp.test(pathname)) {
    paths.push(`${pathname}.html`, `${pathname}.htm`, `${pathname}/index.html`, `${pathname}/index.htm`);
  }
  if (!paths.includes(pathname)) {
    return [pathname, ...paths];
  }
  return paths;
};

// src/main.ts
var staticHeaders = {
  age: "0",
  "cache-control": "public, max-age=0, must-revalidate"
};
var StaticHandler = class {
  publicDirectories;
  constructor(options) {
    this.publicDirectories = [...new Set(Array.isArray(options.directory) ? options.directory : [options.directory])];
  }
  async match(request) {
    const url = new URL(request.url);
    const possiblePaths = this.publicDirectories.flatMap((directory) => getFilePathsForURL(url.pathname, directory));
    for (const possiblePath of possiblePaths) {
      if (!await fileExists(possiblePath)) {
        continue;
      }
      const headers = new Headers(staticHeaders);
      const contentType = mime.contentType(path2.extname(possiblePath));
      if (contentType) {
        headers.set("content-type", contentType);
      }
      return {
        handle: async () => {
          const stream = getReadableStreamFromFile(possiblePath);
          return new Response(stream, { headers, status: 200 });
        }
      };
    }
  }
};
export {
  StaticHandler
};
