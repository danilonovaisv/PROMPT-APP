Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

/**
 * Often we patch a module's default export, but we want to be able to do
 * something like this:
 *
 * ```ts
 * patchTheThing(await import('the-thing'));
 * ```
 *
 * Or like this:
 *
 * ```ts
 * import theThing from 'the-thing';
 * patchTheThing(theThing);
 * ```
 *
 * Note: this does not support modules with a falsey default export. However,
 * presumably in those cases, there's no default export to patch anyway.
 */
function getDefaultExport(moduleExport) {
  return (
    (!!moduleExport &&
      typeof moduleExport === 'object' &&
      'default' in moduleExport &&
      (moduleExport ).default) ||
    (moduleExport )
  );
}

exports.getDefaultExport = getDefaultExport;
//# sourceMappingURL=get-default-export.js.map
