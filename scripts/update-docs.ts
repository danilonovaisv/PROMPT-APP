import fs from 'fs';
import path from 'path';

interface DocScanResult {
  pages: string[];
  components: string[];
  hooks: string[];
  services: string[];
  utils: string[];
  contexts: string[];
  brokenLinks: { file: string; link: string }[];
}

function scanDirectory(dirPath: string, extension: string = '.tsx'): string[] {
  if (!fs.existsSync(dirPath)) return [];
  const files: string[] = [];
  
  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        const relative = path.relative(dirPath, fullPath);
        files.push(relative);
      }
    }
  }

  traverse(dirPath);
  return files;
}

function checkMarkdownLinks(docsDir: string): { file: string; link: string }[] {
  const brokenLinks: { file: string; link: string }[] = [];
  if (!fs.existsSync(docsDir)) return brokenLinks;

  function traverseMd(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        traverseMd(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const linkRegex = /\[.*?\]\((?!http|https|#)(.*?)\)/g;
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
          const rawLink = match[1].split('#')[0];
          if (!rawLink) continue;
          const targetPath = path.resolve(path.dirname(fullPath), rawLink);
          if (!fs.existsSync(targetPath)) {
            brokenLinks.push({ file: fullPath, link: rawLink });
          }
        }
      }
    }
  }

  traverseMd(docsDir);
  return brokenLinks;
}

function runDocUpdate() {
  const rootDir = process.cwd();
  const srcDir = path.join(rootDir, 'src');
  const contextDir = path.join(rootDir, '.context');
  const docsDir = path.join(rootDir, 'docs');

  console.log('🔍 Executando varredura automatizada da arquitetura de PROMPT-APP...\n');

  const scan: DocScanResult = {
    pages: scanDirectory(path.join(srcDir, 'pages')),
    components: scanDirectory(path.join(srcDir, 'components')),
    hooks: scanDirectory(path.join(srcDir, 'hooks')),
    services: scanDirectory(path.join(srcDir, 'services')),
    utils: scanDirectory(path.join(srcDir, 'utils')),
    contexts: scanDirectory(path.join(srcDir, 'context')),
    brokenLinks: [
      ...checkMarkdownLinks(contextDir),
      ...checkMarkdownLinks(docsDir)
    ]
  };

  console.log('📊 RESUMO DA VARREDURA DE CÓDIGO E COMPONENTES:');
  console.log(`  - Páginas (Pages): ${scan.pages.length}`);
  console.log(`  - Componentes (Components): ${scan.components.length}`);
  console.log(`  - Hooks Customizados: ${scan.hooks.length}`);
  console.log(`  - Serviços (Services): ${scan.services.length}`);
  console.log(`  - Utilitários (Utils): ${scan.utils.length}`);
  console.log(`  - Contextos (Contexts): ${scan.contexts.length}`);
  console.log(`  - Links Quebrados Detectados em Docs: ${scan.brokenLinks.length}\n`);

  if (scan.brokenLinks.length > 0) {
    console.warn('⚠️ Links com referência quebrada:');
    scan.brokenLinks.forEach(b => console.warn(`   In ${b.file} -> ${b.link}`));
  } else {
    console.log('✅ Todas as referências cruzadas entre arquivos markdown estão válidas.');
  }

  const syncReportPath = path.join(contextDir, 'logs', `doc-sync-report.json`);
  if (!fs.existsSync(path.dirname(syncReportPath))) {
    fs.mkdirSync(path.dirname(syncReportPath), { recursive: true });
  }

  fs.writeFileSync(syncReportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    metrics: {
      pagesCount: scan.pages.length,
      componentsCount: scan.components.length,
      hooksCount: scan.hooks.length,
      servicesCount: scan.services.length,
      utilsCount: scan.utils.length,
      contextsCount: scan.contexts.length,
      brokenLinksCount: scan.brokenLinks.length
    },
    files: scan
  }, null, 2));

  console.log(`\n💾 Relatório de sincronização salvo em: ${syncReportPath}`);
}

runDocUpdate();
