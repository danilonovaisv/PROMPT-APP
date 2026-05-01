import BaseCommand from '../../base-command.js';
export type PkgManagerName = 'npm' | 'yarn' | 'pnpm' | 'bun';
export interface PmInfo {
    name: PkgManagerName;
    remoteRunArgs: string[];
}
export interface PackageEntry {
    pkg: string;
    dev?: boolean;
}
export declare const getPackageManager: (command: BaseCommand) => PmInfo;
export declare const buildAddArgs: (name: PkgManagerName, pkgs: string[], dev: boolean, quiet: boolean) => string[];
export declare const installCommand: (name: PkgManagerName, pkg: string, dev?: boolean) => string;
export declare const installPackages: (pm: PmInfo, projectRoot: string, entries: PackageEntry[]) => Promise<void>;
//# sourceMappingURL=packages.d.ts.map