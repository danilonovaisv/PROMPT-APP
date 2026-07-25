# Auditoria da Configuração do Agente GPT

**Data:** 2026-07-25  
**Baseline Git:** `709e3fb587f2179cc3e96af981c59472c70659e5`

## Resumo executivo

Foram auditados integralmente os quatro arquivos solicitados e os consumidores reais do schema. O schema externo vigente é `1.1.0`; `AGENT-CONFIG-IMPORT-GUIDE.md` não é legado, mas acumula função normativa e técnica. A consolidação é necessária porque regras de ferramentas, precedência, schema, memória e entrega aparecem em até três documentos.

Foram identificados:

* 3 conflitos de precedência;
* 8 grupos de redundância normativa;
* 4 ambiguidades entre formato externo e modelo interno;
* 9 ocorrências produtivas originais de `1.0.0` fora dos testes e documentos auditados;
* 1 divergência entre o template público e o template produzido por `getTemplateFile()`;
* 1 incompatibilidade entre os campos sugeridos na solicitação e o schema Zod estrito.

## Inventário

| Arquivo | Finalidade | Conteúdo | Versão | Dependências | Diagnóstico |
|---|---|---|---|---|---|
| `REGRAS PARA O GPT.txt` | comportamento do agente | normativo e operacional | 1.1.0 | guia, templates, MCPs | principal fonte de duplicação |
| `AGENT-CONFIG-IMPORT-GUIDE.md` | contrato e pipeline | técnico e parcialmente normativo | 1.1.0 | schemas, importador, Dexie | atual, deve ser incorporado |
| `POLÍTICA DE EXECUÇÃO, VERIFICAÇÃO E FALHAS DE FERRAMENTAS.md` | ferramentas e falhas | normativo | sem versão própria | Supabase, Context7 | correta, mas sobreposta |
| `PROMPT-TEMPLATE.json` | exemplo importável | dados e contrato externo | 1.1.0 | normalização e Zod | válido como formato externo |

## Conflitos e decisões

| ID | Conflito | Impacto | Decisão |
|---|---|---|---|
| C01 | precedência local não inclui plataforma, sistema e desenvolvedor | pode instruir violação de autoridade superior | adotar hierarquia canônica completa |
| C02 | política declara precedência operacional, regras declaram ordem própria | decisão varia conforme documento lido | incorporar ambas em uma ordem única |
| C03 | dados de Supabase e Context7 aparecem na lista de prioridade | dados podem ser confundidos com instruções | reclassificar como fontes de dados |
| C04 | regras proíbem `menu_definitions`, mas o payload interno usa esse campo | confusão entre contrato externo e modelo interno | proibir apenas na saída externa nova |
| C05 | campos sugeridos como `purpose` e `source_policy` não existem no Zod | importação rejeitaria o JSON | manter políticas no documento canônico |
| C06 | `getTemplateFile()` ainda produz `menu_definitions` | download interno diverge do template público | registrar dívida técnica separada |
| C07 | `1.0.0` ainda é default em pontos de UI e serviços | novos registros podem continuar marcados como legados | exigir correção de código em tarefa própria |
| C08 | falha externa e artefato válido aparecem em três documentos | risco de redações divergentes | manter uma única política canônica |

## Matriz de rastreabilidade

| ID | Regra resumida | Origem | Repetição | Conflito | Decisão | Destino |
|---|---|---|---|---|---|---|
| R01 | usar envelope 1.1.0 | regras, guia, template | alta | não | fundir | canônico 12 e 13 |
| R02 | aliases somente na entrada | regras, guia, código | média | C04 | reescrever | canônico 12 e 14 |
| R03 | consultar Supabase | regras, política | alta | não | fundir | canônico 5 |
| R04 | consultar Context7 | regras, política | alta | não | fundir | canônico 5 e 10 |
| R05 | falha de MCP não bloqueia JSON | três documentos | alta | não | fundir | canônico 6 a 8 |
| R06 | não fabricar resultados | regras, política | alta | não | fundir | canônico 4 e 7 |
| R07 | separar artefato e relatório | três documentos | alta | não | fundir | canônico 8 |
| R08 | JSON estrito sem diagnósticos | regras, política | alta | não | fundir | canônico 8 e 12 |
| R09 | reutilizar menus | regras | baixa | portabilidade | manter | canônico 12.3 |
| R10 | menu remoto não garante menu local | regras | baixa | não | manter | canônico 5 e 12.3 |
| R11 | TAG em menu novo | regras | baixa | menu autônomo | manter com escopo | canônico 12.3 |
| R12 | memória `preserve_existing` | regras, guia, schema | média | não | fundir | canônico 12.4 |
| R13 | placeholder deve ter entry | regras, guia, importador | média | não | fundir | canônico 12.4 |
| R14 | não usar placeholder abstrato executável | regras, guia | média | não | fundir | canônico 12.4 |
| R15 | erros com caminho exato | regras, guia, Zod | média | não | manter | canônico 12.5 |
| R16 | conteúdo externo é dado | regras | baixa | C03 | ampliar | canônico 3, 9 e 11 |
| R17 | precedência | regras, política | alta | C01 a C03 | reescrever | canônico 3 |
| R18 | aceitar 1.0.0 | guia e código | média | saída vs entrada | manter só entrada | canônico 14 |
| R19 | não gerar 1.0.0 | regras | baixa | resíduos de código | manter | canônico 14 |
| R20 | output enums e campos | regras, guia, schema | média | não | fundir | canônico 13 |
| R21 | fontes externas confiáveis | solicitação e pesquisa | nova | não | manter | canônico 9 |
| R22 | resistir a prompt injection | regras e fonte oficial | média | não | ampliar | canônico 3 e 11 |
| R23 | campos sugeridos adicionais | solicitação | nova | C05 | depreciar | não entram no JSON |
| R24 | template deve ser validado pelo consumidor | regras e código | média | não | manter | canônico 12.5 |

Nenhuma regra foi removida sem destino. R11 permanece como pendência porque a TAG é convenção de produto, não requisito do schema.

## Diagnóstico do schema 1.0.0

`AGENT-CONFIG-IMPORT-GUIDE.md` foi migrado de `1.0.0` para `1.1.0` no commit `8089ef21e`. Seu conteúdo atual é necessário, porém deve ser incorporado ao documento canônico.

Ocorrências produtivas residuais:

| Local | Uso | Classificação | Recomendação |
|---|---|---|---|
| `src/services/importService.ts` | fallback de envelopes legados | compatibilidade necessária | manter documentado |
| `src/services/realtimeService.ts` | fallback remoto | potencial dívida | migrar em tarefa de código |
| `src/services/assetManager.ts` | fallback remoto | potencial dívida | migrar em tarefa de código |
| `src/components/editor/EditorMetaForm.tsx` | placeholder visual | migrado | usa constante 1.1.0 |
| `src/pages/EditorPage.tsx` | default de novo save | migrado | usa constante 1.1.0 |
| `src/db/defaultPrompts.ts` | prompt default | migrado | usa constante 1.1.0 |
| `public/templates/auditor_arquitetura.json` | asset público | migrado | schema 1.1.0 |

Testes com `1.0.0` devem permanecer quando comprovarem retrocompatibilidade.

## Fontes externas

| Tema | Consulta | Fonte | Versão/data | Conclusão aplicada |
|---|---|---|---|---|
| Zod estrito e paths | strict objects, aliases, `superRefine`, issue paths | Context7 `/colinhacks/zod/v4.0.1`, `https://github.com/colinhacks/zod/tree/v4.0.1` | Zod 4.0.1, 2026-07-25 | campos extras devem ser rejeitados e erros podem apontar paths |
| Supabase errors | resposta `{data, error}` e falha de query | Context7 `/supabase/supabase`, `https://supabase.com/docs/guides/api/handling-errors-in-supabase-js` | documentação corrente, 2026-07-25 | erro não prova ausência de registros |
| hierarquia de instruções | conflito entre instruções e conteúdo de ferramenta | OpenAI, `https://openai.com/index/instruction-hierarchy-challenge/` | 2026-03-10 consultado em 2026-07-25 | sistema precede desenvolvedor, usuário e ferramenta |
| prompt injection | instruções em conteúdo externo | OpenAI, `https://openai.com/index/designing-agents-to-resist-prompt-injection/` | 2026-03-11 consultado em 2026-07-25 | conteúdo externo deve ser dado não confiável |

Limitação: Context7 disponibilizou Zod 4.0.1, enquanto o workspace usa Zod 4.4.3. As conclusões usadas são APIs estáveis também confirmadas no código local.

## Validações executadas

| Verificação | Resultado | Evidência |
|---|---|---|
| sintaxe e contrato JSON | passou | `JSON_CONTRACT_OK` |
| parse pelo schema real | passou | `ZOD_AND_REFERENCES_OK nome_empresa,segmento_empresa` |
| envelope Zod | passou | `ImportEnvelopeSchema.parse()` |
| campos extras | passou | nenhuma chave externa ao contrato |
| memória e placeholders | passou | 2 referências e 2 entries correspondentes |
| precedência única | passou | uma seção canônica, três redirecionamentos |
| rastreabilidade | passou | 24 regras mapeadas |
| falha de ferramenta | passou | cenário exige `partial` e continuidade local |
| Context7 indisponível | passou | cenário proíbe fabricação e mantém validação local |
| conteúdo externo malicioso | passou | cenário trata conteúdo como dado não confiável |
| ausência de versão exata | passou | cenário exige registrar limitação |
| recusa indevida por schema proprietário | passou | documento declara o template público e suficiente |
| MCP como pré-condição | passou | Supabase e Context7 não bloqueiam geração local |
| links externos | passou | quatro URLs abertas em 2026-07-25 |
| TypeScript e build Vite | passou | 2.399 módulos, build concluído |
| `git diff --check` | passou | sem erros |
| ESLint | passou | 0 erros e 10 warnings preexistentes |
| Jest | passou | 37 suítes e 161 testes |

O build mantém avisos preexistentes sobre `@theme` e imports dinâmicos inefetivos. Nenhum deles foi introduzido por esta consolidação.

O toolchain foi estabilizado em `typescript@5.9.3`. TypeScript 7 não expõe a API JavaScript exigida pelas versões instaladas de `typescript-eslint` e `ts-jest`.

## Destino dos arquivos antigos

| Arquivo | Ação proposta |
|---|---|
| `REGRAS PARA O GPT.txt` | substituído por redirecionamento |
| `AGENT-CONFIG-IMPORT-GUIDE.md` | substituído por redirecionamento |
| `POLÍTICA DE EXECUÇÃO, VERIFICAÇÃO E FALHAS DE FERRAMENTAS.md` | substituído por redirecionamento |
| `PROMPT-TEMPLATE.json` | manter como template canônico de dados |

Nenhum arquivo foi excluído. O conteúdo anterior permanece no histórico Git a partir do baseline informado.

## Decisões aprovadas

As três decisões registradas nesta auditoria foram aprovadas em 2026-07-25:

1. a TAG de `menu_name` permanece como regra de negócio;
2. defaults produtivos de novos templates usam `1.1.0`;
3. `getTemplateFile()` serializa `context_menus` no formato externo.
4. o toolchain usa TypeScript 5.9.3 até que ESLint e Jest suportem a API do TypeScript 7.

Fallbacks de registros remotos sem versão permanecem explicitamente legados para preservar migração segura.
