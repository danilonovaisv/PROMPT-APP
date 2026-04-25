import { readFile } from 'fs/promises';
import { join } from 'path';
// Returns true when `pkg` is listed in `dependencies` or `devDependencies` of
// the project's package.json. Returns false when the file can't be read or
// parsed, so callers can safely treat absence-by-error as "not installed".
export const hasDependency = async (pkg, projectRoot) => {
    try {
        const raw = await readFile(join(projectRoot, 'package.json'), 'utf-8');
        const json = JSON.parse(raw);
        return Boolean(json.dependencies?.[pkg] ?? json.devDependencies?.[pkg]);
    }
    catch {
        return false;
    }
};
//# sourceMappingURL=package-json.js.map