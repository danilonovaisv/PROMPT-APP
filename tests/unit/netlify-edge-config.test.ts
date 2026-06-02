/**
 * Tests for .netlify edge function configuration files.
 *
 * These tests validate the structure and content of the Netlify edge
 * function manifest and import map, ensuring the PR changes are correct.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJSON<T = unknown>(relPath: string): T {
  const absPath = path.join(ROOT, relPath);
  const raw = fs.readFileSync(absPath, 'utf-8');
  return JSON.parse(raw) as T;
}

// ---------------------------------------------------------------------------
// manifest.json
// ---------------------------------------------------------------------------

interface ManifestBundle {
  asset: string;
  format: string;
}

interface ManifestRoute {
  function: string;
  pattern: string;
  excluded_patterns: string[];
  path: string;
}

interface Manifest {
  bundles: ManifestBundle[];
  routes: ManifestRoute[];
  post_cache_routes: unknown[];
  bundler_version: string;
  layers: unknown[];
  import_map: string;
  function_config: Record<string, { generator: string }>;
  bundling_timing: { tarball_ms: number };
}

describe('.netlify/edge-functions-dist/manifest.json', () => {
  let manifest: Manifest;

  beforeAll(() => {
    manifest = readJSON<Manifest>('.netlify/edge-functions-dist/manifest.json');
  });

  it('is valid JSON with an object root', () => {
    expect(manifest).toBeDefined();
    expect(typeof manifest).toBe('object');
    expect(manifest).not.toBeNull();
  });

  it('contains required top-level fields', () => {
    expect(manifest).toHaveProperty('bundles');
    expect(manifest).toHaveProperty('routes');
    expect(manifest).toHaveProperty('post_cache_routes');
    expect(manifest).toHaveProperty('bundler_version');
    expect(manifest).toHaveProperty('layers');
    expect(manifest).toHaveProperty('import_map');
    expect(manifest).toHaveProperty('function_config');
    expect(manifest).toHaveProperty('bundling_timing');
  });

  it('uses bundler_version 14.10.1 (updated in this PR)', () => {
    // The PR downgraded bundler_version from 14.10.2 → 14.10.1
    expect(manifest.bundler_version).toBe('14.10.1');
  });

  it('has bundles array with tar and eszip2 formats', () => {
    expect(Array.isArray(manifest.bundles)).toBe(true);
    expect(manifest.bundles.length).toBeGreaterThanOrEqual(2);

    const formats = manifest.bundles.map((b) => b.format);
    expect(formats).toContain('tar');
    expect(formats).toContain('eszip2');
  });

  it('each bundle has a non-empty asset hash and valid format', () => {
    for (const bundle of manifest.bundles) {
      expect(typeof bundle.asset).toBe('string');
      expect(bundle.asset.length).toBeGreaterThan(0);
      expect(['tar', 'eszip2']).toContain(bundle.format);
    }
  });

  it('has a route for the fireproof_server function', () => {
    expect(Array.isArray(manifest.routes)).toBe(true);
    const fireproofRoute = manifest.routes.find(
      (r) => r.function === 'fireproof_server',
    );
    expect(fireproofRoute).toBeDefined();
    expect(fireproofRoute!.path).toBe('/fireproof');
    expect(fireproofRoute!.pattern).toBe('^/fireproof/?$');
    expect(Array.isArray(fireproofRoute!.excluded_patterns)).toBe(true);
  });

  it('has post_cache_routes as an empty array', () => {
    expect(Array.isArray(manifest.post_cache_routes)).toBe(true);
    expect(manifest.post_cache_routes).toHaveLength(0);
  });

  it('has import_map set to "netlify:import-map"', () => {
    expect(manifest.import_map).toBe('netlify:import-map');
  });

  it('has function_config for fireproof_server with generator internalFunc', () => {
    expect(manifest.function_config).toHaveProperty('fireproof_server');
    expect(manifest.function_config.fireproof_server.generator).toBe(
      'internalFunc',
    );
  });

  it('has bundling_timing with a non-negative tarball_ms value', () => {
    expect(typeof manifest.bundling_timing.tarball_ms).toBe('number');
    expect(manifest.bundling_timing.tarball_ms).toBeGreaterThanOrEqual(0);
  });

  it('layers is an empty array', () => {
    expect(Array.isArray(manifest.layers)).toBe(true);
    expect(manifest.layers).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// import-map.json
// ---------------------------------------------------------------------------

interface ImportMap {
  imports: Record<string, string>;
  scopes: Record<string, unknown>;
}

describe('.netlify/edge-functions-import-map.json', () => {
  let importMap: ImportMap;

  beforeAll(() => {
    importMap = readJSON<ImportMap>('.netlify/edge-functions-import-map.json');
  });

  it('is valid JSON with an object root', () => {
    expect(importMap).toBeDefined();
    expect(typeof importMap).toBe('object');
    expect(importMap).not.toBeNull();
  });

  it('has required top-level fields: imports and scopes', () => {
    expect(importMap).toHaveProperty('imports');
    expect(importMap).toHaveProperty('scopes');
    expect(typeof importMap.imports).toBe('object');
    expect(typeof importMap.scopes).toBe('object');
  });

  it('has scopes as an empty object', () => {
    expect(Object.keys(importMap.scopes)).toHaveLength(0);
  });

  // New modules added in this PR
  it('includes new node:test module mapping (added in this PR)', () => {
    expect(importMap.imports).toHaveProperty('node:test');
    expect(importMap.imports['node:test']).toBe('node:node:test');
  });

  it('includes new node:test/reporters module mapping (added in this PR)', () => {
    expect(importMap.imports).toHaveProperty('node:test/reporters');
    expect(importMap.imports['node:test/reporters']).toBe(
      'node:node:test/reporters',
    );
  });

  it('includes new node:sqlite module mapping (added in this PR)', () => {
    expect(importMap.imports).toHaveProperty('node:sqlite');
    expect(importMap.imports['node:sqlite']).toBe('node:node:sqlite');
  });

  it('includes new node:sea module mapping (added in this PR)', () => {
    expect(importMap.imports).toHaveProperty('node:sea');
    expect(importMap.imports['node:sea']).toBe('node:node:sea');
  });

  // Removed stream module shims (removed in this PR)
  it('does NOT include _stream_writable (removed in this PR)', () => {
    expect(importMap.imports).not.toHaveProperty('_stream_writable');
  });

  it('does NOT include _stream_wrap (removed in this PR)', () => {
    expect(importMap.imports).not.toHaveProperty('_stream_wrap');
  });

  it('does NOT include _stream_transform (removed in this PR)', () => {
    expect(importMap.imports).not.toHaveProperty('_stream_transform');
  });

  it('does NOT include _stream_readable (removed in this PR)', () => {
    expect(importMap.imports).not.toHaveProperty('_stream_readable');
  });

  it('does NOT include _stream_passthrough (removed in this PR)', () => {
    expect(importMap.imports).not.toHaveProperty('_stream_passthrough');
  });

  it('does NOT include _stream_duplex (removed in this PR)', () => {
    expect(importMap.imports).not.toHaveProperty('_stream_duplex');
  });

  // Core Node.js modules still present
  it('retains core node: module mappings', () => {
    const coreModules = [
      'fs', 'path', 'os', 'crypto', 'http', 'https', 'http2',
      'net', 'stream', 'buffer', 'events', 'util', 'url',
      'assert', 'module', 'process', 'timers', 'dns',
    ];
    for (const mod of coreModules) {
      expect(importMap.imports).toHaveProperty(mod);
      expect(importMap.imports[mod]).toBe(`node:${mod}`);
    }
  });

  it('retains TLS-related module mappings', () => {
    expect(importMap.imports).toHaveProperty('tls');
    expect(importMap.imports['tls']).toBe('node:tls');
    expect(importMap.imports).toHaveProperty('_tls_wrap');
    expect(importMap.imports['_tls_wrap']).toBe('node:_tls_wrap');
    expect(importMap.imports).toHaveProperty('_tls_common');
    expect(importMap.imports['_tls_common']).toBe('node:_tls_common');
  });

  it('retains HTTP internal module mappings', () => {
    const httpInternals = [
      '_http_server', '_http_outgoing', '_http_incoming',
      '_http_common', '_http_client', '_http_agent',
    ];
    for (const mod of httpInternals) {
      expect(importMap.imports).toHaveProperty(mod);
      expect(importMap.imports[mod]).toBe(`node:${mod}`);
    }
  });

  it('retains Netlify-specific import mappings', () => {
    expect(importMap.imports).toHaveProperty('@netlify/edge-functions');
    expect(importMap.imports['@netlify/edge-functions']).toBe(
      'https://edge.netlify.com/v1/index.ts',
    );
    expect(importMap.imports).toHaveProperty('netlify:edge');
    expect(importMap.imports['netlify:edge']).toBe(
      'https://edge.netlify.com/v1/index.ts?v=legacy',
    );
  });

  it('maps all import values to strings', () => {
    for (const [key, value] of Object.entries(importMap.imports)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
      expect(typeof key).toBe('string');
    }
  });

  it('has a substantial number of module mappings', () => {
    // Sanity check: the import map should have many entries
    expect(Object.keys(importMap.imports).length).toBeGreaterThan(40);
  });
});
