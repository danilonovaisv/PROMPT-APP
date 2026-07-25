export const CURRENT_PROMPT_SCHEMA_VERSION = '1.1.0';
export const CURRENT_BULK_EXPORT_VERSION = '3.0.0';

type CompatibilityStatus = 'current' | 'legacy' | 'future' | 'invalid';

function parseVersionParts(version: string): number[] | null {
  const normalized = version.trim();
  if (!/^\d+\.\d+\.\d+$/.test(normalized)) return null;
  return normalized.split('.').map((part) => Number(part));
}

function compareVersions(a: string, b: string): number | null {
  const aParts = parseVersionParts(a);
  const bParts = parseVersionParts(b);
  if (!aParts || !bParts) return null;

  for (let index = 0; index < 3; index += 1) {
    if (aParts[index] > bParts[index]) return 1;
    if (aParts[index] < bParts[index]) return -1;
  }

  return 0;
}

export function getVersionCompatibility(
  version: string,
  currentVersion: string
): CompatibilityStatus {
  const comparison = compareVersions(version, currentVersion);
  if (comparison === null) return 'invalid';
  if (comparison === 0) return 'current';
  return comparison < 0 ? 'legacy' : 'future';
}

export function getPromptSchemaWarning(schemaVersion: string): string | null {
  const compatibility = getVersionCompatibility(schemaVersion, CURRENT_PROMPT_SCHEMA_VERSION);

  if (compatibility === 'legacy') {
    return `Schema ${schemaVersion} importado em modo de compatibilidade. Revise e salve o template para normalizar no schema ${CURRENT_PROMPT_SCHEMA_VERSION}.`;
  }

  if (compatibility === 'future') {
    return `Schema ${schemaVersion} é mais novo que o suportado localmente (${CURRENT_PROMPT_SCHEMA_VERSION}). O template foi importado, mas pode exigir revisão manual.`;
  }

  if (compatibility === 'invalid') {
    return `Schema "${schemaVersion}" está fora do formato semântico esperado (x.y.z). O template foi importado no melhor esforço.`;
  }

  return null;
}

export function getBulkExportWarning(exportVersion: string): string | null {
  const compatibility = getVersionCompatibility(exportVersion, CURRENT_BULK_EXPORT_VERSION);

  if (compatibility === 'legacy') {
    return `Pacote bulk ${exportVersion} importado em modo legado. Campos ausentes serão normalizados para o formato ${CURRENT_BULK_EXPORT_VERSION}.`;
  }

  if (compatibility === 'future') {
    return `Pacote bulk ${exportVersion} é mais novo que o suportado localmente (${CURRENT_BULK_EXPORT_VERSION}). Verifique compatibilidade após a importação.`;
  }

  if (compatibility === 'invalid') {
    return `Versão do pacote bulk "${exportVersion}" inválida. O arquivo foi processado em modo tolerante.`;
  }

  return null;
}
