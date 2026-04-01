import { Parser } from 'acorn';
import { tsPlugin } from '@sveltejs/acorn-typescript';
const acorn = Parser.extend(tsPlugin({ jsx: true }));
/**
 * Given source code rewrites import assert into import with
 */
export function rewriteSourceImportAssertions(source) {
    if (!source.includes('assert')) {
        return source;
    }
    let modified = source;
    try {
        const parsedAST = acorn.parse(source, {
            ecmaVersion: 'latest',
            sourceType: 'module',
            locations: true,
        });
        const statements = collectImportAssertions(source, parsedAST.body);
        // Bulk replacement of import assertions
        for (const statement of statements.sort((a, b) => b.start - a.start)) {
            modified = `${modified.slice(0, statement.start)}${statement.text}${modified.slice(statement.end)}`;
        }
        return modified;
    }
    catch (error) {
        if (!modified.includes('assert')) {
            return modified;
        }
        throw error;
    }
}
function collectImportAssertions(source, node) {
    const collectedNodes = [];
    if (Array.isArray(node)) {
        return node.filter(isNode).flatMap((n) => collectImportAssertions(source, n));
    }
    // Capture all import assertion statements
    const assertionNodeTypes = ['ImportDeclaration', 'ImportExpression', 'ExportAllDeclaration', 'ExportNamedDeclaration'];
    if (assertionNodeTypes.includes(node.type)) {
        const parsedImportNode = parseImportAssertion(source, node);
        if (parsedImportNode !== undefined) {
            return [parsedImportNode];
        }
    }
    // Fallthrough tree traversal + support for dynamic imports and JSX syntax
    for (const [key, value] of Object.entries(node)) {
        if (['loc', 'typeName'].includes(key))
            continue;
        if (value === null)
            continue;
        if (typeof value === 'object') {
            const childNodes = collectImportAssertions(source, value);
            collectedNodes.push(...childNodes);
        }
    }
    return collectedNodes;
}
function parseImportAssertion(source, node) {
    if (!node.source)
        return undefined;
    const statement = source.slice(node.source.end, node.end);
    if (!statement.includes('assert'))
        return undefined;
    return {
        start: node.source.end,
        end: node.end,
        text: statement.replace('assert', 'with'),
    };
}
function isNode(arg) {
    return typeof arg === 'object' && arg !== null && 'type' in arg;
}
