/**
 * Tests for GitHub Actions workflow YAML files.
 *
 * These tests validate the configuration changes made in this PR:
 *   - Explicit pnpm version 11.5.0 added to all workflows
 *   - Removal of `cache: pnpm` from setup-node steps (since pnpm-lock.yaml
 *     was deleted/ignored)
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../');
const WORKFLOWS_DIR = path.join(ROOT, '.github', 'workflows');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readWorkflow(filename: string): string {
  return fs.readFileSync(path.join(WORKFLOWS_DIR, filename), 'utf-8');
}

/** Count non-overlapping occurrences of a substring in a string. */
function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count++;
    pos += needle.length;
  }
  return count;
}

// ---------------------------------------------------------------------------
// ci-cd.yml
// ---------------------------------------------------------------------------

describe('.github/workflows/ci-cd.yml', () => {
  let content: string;

  beforeAll(() => {
    content = readWorkflow('ci-cd.yml');
  });

  it('is a non-empty YAML file', () => {
    expect(content.length).toBeGreaterThan(0);
  });

  it('uses pnpm/action-setup@v4', () => {
    expect(content).toContain('pnpm/action-setup@v4');
  });

  it('specifies pnpm version 11.5.0 (added in this PR)', () => {
    expect(content).toContain('version: 11.5.0');
  });

  it('pnpm version is specified in the pnpm/action-setup block', () => {
    // Ensure version: 11.5.0 follows a pnpm/action-setup reference
    const setupIndex = content.indexOf('pnpm/action-setup@v4');
    const versionIndex = content.indexOf('version: 11.5.0', setupIndex);
    expect(setupIndex).toBeGreaterThanOrEqual(0);
    expect(versionIndex).toBeGreaterThan(setupIndex);
  });

  it('does NOT use `cache: pnpm` in setup-node (removed because pnpm-lock.yaml is absent)', () => {
    expect(content).not.toContain('cache: pnpm');
  });

  it('uses actions/setup-node@v4', () => {
    expect(content).toContain('actions/setup-node@v4');
  });

  it('specifies Node.js version 22', () => {
    expect(content).toContain('node-version: 22');
  });

  it('triggers on push to main and develop branches', () => {
    expect(content).toContain('branches: [main, develop]');
  });

  it('triggers on pull_request targeting main', () => {
    expect(content).toMatch(/pull_request:[\s\S]*?branches:.*main/);
  });

  it('runs pnpm install', () => {
    expect(content).toContain('pnpm install');
  });

  it('runs TypeScript type check', () => {
    expect(content).toContain('pnpm exec tsc --noEmit');
  });

  it('runs tests with coverage', () => {
    expect(content).toContain('pnpm test --coverage');
  });

  it('runs the build step', () => {
    expect(content).toContain('pnpm run build');
  });

  it('uploads coverage to Codecov', () => {
    expect(content).toContain('codecov/codecov-action@v4');
  });

  it('has concurrency configuration to cancel in-progress runs', () => {
    expect(content).toContain('cancel-in-progress: true');
  });
});

// ---------------------------------------------------------------------------
// deploy-netlify.yml
// ---------------------------------------------------------------------------

describe('.github/workflows/deploy-netlify.yml', () => {
  let content: string;

  beforeAll(() => {
    content = readWorkflow('deploy-netlify.yml');
  });

  it('is a non-empty YAML file', () => {
    expect(content.length).toBeGreaterThan(0);
  });

  it('uses pnpm/action-setup@v4', () => {
    expect(content).toContain('pnpm/action-setup@v4');
  });

  it('specifies pnpm version 11.5.0 (added in this PR)', () => {
    expect(content).toContain('version: 11.5.0');
  });

  it('pnpm version is specified in the pnpm/action-setup block', () => {
    const setupIndex = content.indexOf('pnpm/action-setup@v4');
    const versionIndex = content.indexOf('version: 11.5.0', setupIndex);
    expect(setupIndex).toBeGreaterThanOrEqual(0);
    expect(versionIndex).toBeGreaterThan(setupIndex);
  });

  it('does NOT use `cache: pnpm` in setup-node (removed in this PR)', () => {
    // This was removed to avoid errors when pnpm-lock.yaml is missing
    expect(content).not.toContain('cache: pnpm');
  });

  it('uses actions/setup-node@v4', () => {
    expect(content).toContain('actions/setup-node@v4');
  });

  it('is a manual workflow triggered by workflow_dispatch', () => {
    expect(content).toContain('workflow_dispatch');
  });

  it('accepts a production input parameter', () => {
    expect(content).toContain('production');
    expect(content).toContain('default: "false"');
  });

  it('runs pnpm install with --prefer-offline flag', () => {
    expect(content).toContain('pnpm install --prefer-offline');
  });

  it('runs the build step', () => {
    expect(content).toContain('pnpm run build');
  });

  it('uses the netlify deploy action', () => {
    expect(content).toContain('nwtgck/actions-netlify@v3');
  });

  it('deploys to the dist directory', () => {
    expect(content).toContain('publish-dir: ./dist');
  });

  it('uses NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID secrets', () => {
    expect(content).toContain('NETLIFY_AUTH_TOKEN');
    expect(content).toContain('NETLIFY_SITE_ID');
  });

  it('has permissions set to contents: read', () => {
    expect(content).toContain('contents: read');
  });

  it('has concurrency configuration to cancel in-progress runs', () => {
    expect(content).toContain('cancel-in-progress: true');
  });

  it('validates required secrets before build', () => {
    expect(content).toContain('Validar segredos obrigatórios');
  });
});

// ---------------------------------------------------------------------------
// e2e-lighthouse.yml
// ---------------------------------------------------------------------------

describe('.github/workflows/e2e-lighthouse.yml', () => {
  let content: string;

  beforeAll(() => {
    content = readWorkflow('e2e-lighthouse.yml');
  });

  it('is a non-empty YAML file', () => {
    expect(content.length).toBeGreaterThan(0);
  });

  it('has pnpm/action-setup@v4 in both jobs', () => {
    const count = countOccurrences(content, 'pnpm/action-setup@v4');
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('specifies pnpm version 11.5.0 in both jobs (added in this PR)', () => {
    const count = countOccurrences(content, 'version: 11.5.0');
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('does NOT use `cache: pnpm` as an active config (removed in this PR)', () => {
    // Only a comment references cache: pnpm, not an active YAML key
    // Active usage would be unindented or follow `with:` properly
    const lines = content.split('\n');
    const activeCacheLines = lines.filter(
      (line) => /^\s+cache:\s*['"]?pnpm['"]?\s*$/.test(line),
    );
    expect(activeCacheLines).toHaveLength(0);
  });

  it('contains the e2e-tests job', () => {
    expect(content).toContain('e2e-tests:');
  });

  it('contains the lighthouse job', () => {
    expect(content).toContain('lighthouse:');
  });

  it('e2e-tests job runs playwright tests', () => {
    expect(content).toContain('pnpm exec playwright test');
  });

  it('e2e-tests job installs playwright browsers', () => {
    expect(content).toContain('playwright install --with-deps');
  });

  it('e2e-tests job uploads playwright report artifacts', () => {
    expect(content).toContain('actions/upload-artifact@v4');
    expect(content).toContain('playwright-report');
  });

  it('lighthouse job runs a build before lighthouse CI', () => {
    expect(content).toContain('pnpm run build');
    expect(content).toContain('treosh/lighthouse-ci-action@v12');
  });

  it('lighthouse job uses a lighthouserc.json config', () => {
    expect(content).toContain("configPath: './lighthouserc.json'");
  });

  it('triggers on push and pull_request to main branch', () => {
    expect(content).toContain('branches: [ "main" ]');
  });

  it('has Node.js version 22 in both jobs', () => {
    const count = countOccurrences(content, 'node-version: 22');
    expect(count).toBeGreaterThanOrEqual(2);
  });

  // Regression: pnpm version should be consistent across all setup steps
  it('all pnpm/action-setup steps specify the same version (11.5.0)', () => {
    const lines = content.split('\n');
    const pnpmSetupIndices: number[] = [];
    lines.forEach((line, idx) => {
      if (line.includes('pnpm/action-setup@v4')) {
        pnpmSetupIndices.push(idx);
      }
    });

    expect(pnpmSetupIndices.length).toBeGreaterThanOrEqual(2);

    for (const startIdx of pnpmSetupIndices) {
      // Look ahead up to 5 lines for the version specification
      const segment = lines.slice(startIdx, startIdx + 5).join('\n');
      expect(segment).toContain('version: 11.5.0');
    }
  });
});

// ---------------------------------------------------------------------------
// Cross-workflow consistency tests
// ---------------------------------------------------------------------------

describe('GitHub Actions workflow consistency', () => {
  const workflowFiles = ['ci-cd.yml', 'deploy-netlify.yml', 'e2e-lighthouse.yml'];

  it('all workflows specify pnpm version 11.5.0', () => {
    for (const filename of workflowFiles) {
      const content = readWorkflow(filename);
      expect(content).toContain('version: 11.5.0');
    }
  });

  it('all workflows use pnpm/action-setup@v4', () => {
    for (const filename of workflowFiles) {
      const content = readWorkflow(filename);
      expect(content).toContain('pnpm/action-setup@v4');
    }
  });

  it('no workflow has active `cache: pnpm` in setup-node (since pnpm-lock.yaml is absent)', () => {
    for (const filename of workflowFiles) {
      const content = readWorkflow(filename);
      const lines = content.split('\n');
      const activeCacheLines = lines.filter(
        (line) => /^\s+cache:\s*['"]?pnpm['"]?\s*$/.test(line),
      );
      expect(activeCacheLines).toHaveLength(0);
    }
  });

  it('all workflows use actions/checkout@v4', () => {
    for (const filename of workflowFiles) {
      const content = readWorkflow(filename);
      expect(content).toContain('actions/checkout@v4');
    }
  });

  it('ci-cd and deploy-netlify workflows set FORCE_JAVASCRIPT_ACTIONS_TO_NODE24', () => {
    // Only ci-cd.yml and deploy-netlify.yml include this env var
    for (const filename of ['ci-cd.yml', 'deploy-netlify.yml']) {
      const content = readWorkflow(filename);
      expect(content).toContain('FORCE_JAVASCRIPT_ACTIONS_TO_NODE24');
    }
  });
});