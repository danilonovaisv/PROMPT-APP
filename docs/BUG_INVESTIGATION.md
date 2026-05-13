# BUG_INVESTIGATION

## Bug P0.1, Templates importados aparecem vazios na UI
Sintoma: template importado aparece com campos vazios ou seleção inconsistente.

Hipótese: defaults permissivos no schema somados à migração podem "normalizar" payload parcial sem bloquear import.

Evidência:
- `PromptDefinitionSchema` usa defaults vazios para campos críticos textuais.
- Import usa `parsePromptPayload` + migração e continua com warnings quando possível.

Causa raiz provável:
- Ausência de validação semântica forte para campos obrigatórios de negócio (não apenas shape), permitindo import de payload estruturalmente válido, porém semanticamente vazio.

Teste de validação:
- Importar JSON com `meta` válido, mas `prompt_definition` com strings vazias, confirmar se entra no IndexedDB e renderiza vazio.

## Bug P0.2, Memória Fixa com fricção de uso
Sintoma: usuários reportam dificuldade de preencher variáveis fixas.

Hipótese: UX mobile e fluxo de adição/edição exigem passos demais e baixa orientação de erro.

Evidência:
- Componente exibe estado vazio e criação inline, mas sem validação explícita de chave duplicada e feedback de erro.
- Área de ações compacta para telas pequenas.

Causa raiz provável:
- Falta de validação de colisão de chave e affordance mobile limitada no bloco de criação.

Teste de validação:
- Em viewport 375px, adicionar duas chaves com mesmo nome e observar ausência de erro claro.

## Bug P1.1, Sync parcial silenciosa
Sintoma: dados podem ficar parcialmente sincronizados sem superfície de erro para usuário final.

Hipótese: `syncToCloud` retorna true até com falhas de fases intermediárias.

Evidência:
- Implementação registra warning e retorna sucesso parcial.

Causa raiz provável:
- Estratégia de tolerância sem camada de UX que apresente status granular.

Teste de validação:
- Simular falha na fase de memória com rede intermitente e validar toast/banner de sync degradada.

## Bug P1.2, Seletor de menus vinculados inconsistente
Sintoma: menu selecionado pode parecer não aplicado de imediato em alguns fluxos.

Hipótese: dropdown usa `onMouseDown` para seleção, sem fechamento e sem confirmação visual progressiva.

Evidência:
- Ação no dropdown não fecha automaticamente nem indica estado transicional.

Causa raiz provável:
- Experiência de interação otimizada para desktop e não para toque.

Teste de validação:
- Fluxo em emulação mobile, adicionar/remover menus repetidamente e validar previsibilidade.
