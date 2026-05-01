import { log } from '../../../utils/command-helpers.js';
import { spawnAsync } from './spawn-async.js';
export const getPackageManager = (command) => {
    const detected = command.project.packageManager;
    return {
        name: detected?.name ?? 'npm',
        remoteRunArgs: detected?.remotePackageCommand ?? ['npx'],
    };
};
export const buildAddArgs = (name, pkgs, dev, quiet) => {
    switch (name) {
        case 'yarn':
            return ['add', ...(quiet ? ['--silent'] : []), ...(dev ? ['-D'] : []), ...pkgs];
        case 'pnpm':
            return ['add', ...(quiet ? ['--reporter=append-only', '--loglevel=warn'] : []), ...(dev ? ['-D'] : []), ...pkgs];
        case 'bun':
            return ['add', ...(quiet ? ['--silent'] : []), ...(dev ? ['--dev'] : []), ...pkgs];
        default:
            return [
                'install',
                ...(quiet ? ['--loglevel=warn', '--no-audit', '--no-fund', '--no-progress'] : []),
                ...(dev ? ['--save-dev'] : []),
                ...pkgs,
            ];
    }
};
export const installCommand = (name, pkg, dev = false) => `${name} ${buildAddArgs(name, [pkg], dev, false).join(' ')}`;
export const installPackages = async (pm, projectRoot, entries) => {
    if (entries.length === 0)
        return;
    const prod = entries.filter((entry) => !entry.dev).map((entry) => entry.pkg);
    const dev = entries.filter((entry) => entry.dev).map((entry) => entry.pkg);
    log('');
    log('----- 📦 ⏳ -----');
    try {
        if (prod.length > 0) {
            await spawnAsync(pm.name, buildAddArgs(pm.name, prod, false, true), {
                stdio: 'inherit',
                shell: true,
                cwd: projectRoot,
            });
        }
        if (dev.length > 0) {
            await spawnAsync(pm.name, buildAddArgs(pm.name, dev, true, true), {
                stdio: 'inherit',
                shell: true,
                cwd: projectRoot,
            });
        }
    }
    catch (error) {
        log('----- 📦 ❌ -----');
        throw error;
    }
    log('----- 📦 ✅ -----');
    log('');
    log('');
};
//# sourceMappingURL=packages.js.map