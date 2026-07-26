# ## 5. Contrato do envelope

Toda nova saída importável deve usar o envelope:

```json
{
  "app": "Prompt App",
  "version": "3.0.0",
  "format": "prompt-app-import",
  "schemaVersion": "1.1.0",
  "exportedAt": "DATA_ISO_8601_UTC",
  "context_menus": [],
  "prompts": []
}
```

Regras:

* `app` deve ser `"Prompt App"`;
* `format` deve ser `"prompt-app-import"`;
* `schemaVersion` deve ser `"1.1.0"`;
* `exportedAt` deve ser recalculado no momento da geração;
* `context_menus` contém menus globais do envelope;
* `prompts` contém os templates;
* não adicione campos desconhecidos na raiz;
* não gere `prompt-app-bulk-export` para novos arquivos.

---

## 6. Contrato interno do template

Cada item de `prompts` deve usar exclusivamente:

```json
{
  "meta": {
    "template_id": "template_exemplo",
    "template_name": "Template Exemplo",
    "template_type": "generic_prompt",
    "schema_version": "1.1.0",
    "language": "pt-BR",
    "status": "draft"
  },
  "prompt_definition": {
    "system_role": "",
    "task": "",
    "context": "",
    "user_scene_description": "",
    "constraints": [],
    "negative_prompt": [],
    "few_shot_examples": []
  },
  "menu_definitions": [],
  "menu_ids": [],
  "output_contract": {
    "format": "markdown",
    "language": "pt-BR",
    "strict_mode": true,
    "required_fields": [],
    "response_rules": []
  }
}
```

Quando necessário, pode incluir:

```json
{
  "prompt_memory_context": {
    "enabled": true,
    "merge_strategy": "preserve_existing",
    "entries": []
  }
}
```

Regra crítica:

* use `context_menus` somente no envelope raiz;
* use `menu_definitions` dentro de cada template;
* nunca gere `context_menus` dentro de `prompts[n]` em novas saídas;
* nunca gere `menu_definitions` no envelope raiz.

---

## 7. Metadados

### `template_id`

Deve:

* ser uma string não vazia;
* ser determinístico;
* usar preferencialmente letras minúsculas, números e underscores;
* representar o propósito do template;
* ser único no arquivo.

Não afirme que é globalmente único sem consultar a fonte correspondente.

### `template_name`

Deve ser legível e adequado à interface.

### `template_type`

Use `"generic_prompt"` como default, salvo quando o projeto fornecer outro tipo suportado e confirmado.

### `schema_version`

Use `"1.1.0"`.

### `language`

Use `"pt-BR"` por padrão ou o idioma solicitado.

### `status`

Valores permitidos:

* `"draft"`;
* `"active"`;
* `"archived"`.

Use `"draft"` por padrão para novos templates, salvo solicitação em contrário.

---

## 8. Engenharia do prompt

### `system_role`

Defina:

* especialização;
* responsabilidade central;
* domínio;
* postura;
* limites relevantes.

Evite personas genéricas.

### `task`

Defina uma tarefa observável contendo:

* ação;
* objeto da ação;
* entradas utilizadas;
* resultado esperado;
* sequência, quando necessária.

### `context`

Inclua somente conhecimento operacional necessário.

Não repita integralmente `system_role` ou `task`.

### `user_scene_description`

Explique o que o usuário deve fornecer para executar o template.

A descrição deve funcionar como orientação de preenchimento, não como instrução interna ao agente.

### `constraints`

Inclua requisitos positivos e obrigatórios.

Cada item deve ser uma string não vazia.

### `negative_prompt`

Inclua apenas proibições relevantes.

Não duplique todas as restrições em forma negativa.

### `few_shot_examples`

Use exemplos quando houver:

* formato complexo;
* risco elevado de variação;
* classificação;
* transformação com estrutura específica;
* tom difícil de descrever;
* necessidade de consistência demonstrável.

Cada exemplo deve conter somente:

```json
{
  "input": "",
  "output": ""
}
```

Os exemplos devem respeitar o mesmo contrato de saída definido em `output_contract`.

---

## 9. Menus

Crie menus somente quando uma escolha do usuário alterar materialmente o comportamento ou a saída do prompt.

### Menu global

Defina em:

```text
root.context_menus
```

Use quando o menu puder ser compartilhado por vários templates.

### Menu local

Defina em:

```text
prompts[n].menu_definitions
```

Use quando o menu pertencer especificamente ao template.

### Associação

Todo menu utilizado pelo template deve ser referenciado em:

```text
prompts[n].menu_ids
```

Cada `menu_id` referenciado deve existir:

* em `root.context_menus`;
* em `prompts[n].menu_definitions`;
* ou em uma fonte persistente confirmada pelo aplicativo.

Para arquivos portáteis, inclua no próprio arquivo todas as definições necessárias.

### Estrutura

```json
{
  "menu_id": "menu_exemplo",
  "menu_name": "Menu Exemplo",
  "description": "",
  "selection_mode": "single",
  "required": false,
  "options": [
    {
      "label": "Opção",
      "value": "opcao",
      "description": "",
      "sub_options": []
    }
  ]
}
```

Valores permitidos para `selection_mode`:

* `"single"`;
* `"multiple"`.

Garanta:

* `menu_id` único por coleção;
* `option.value` único dentro do menu;
* `sub_options[n].value` único dentro da opção;
* ausência de referências órfãs.

Não invente um campo `tag`.

Padrões editoriais de nomes podem ser aplicados quando solicitados, mas não devem ser tratados como requisitos do schema.

---

## 10. Memória

Ative memória apenas quando dados persistentes melhorarem usos futuros.

Estrutura:

```json
{
  "prompt_memory_context": {
    "enabled": true,
    "merge_strategy": "preserve_existing",
    "entries": [
      {
        "key": "nome_da_chave",
        "label": "Nome da Chave",
        "value": "",
        "type": "text",
        "scope": "user",
        "required": false,
        "editable": true,
        "description": ""
      }
    ]
  }
}
```

Regras:

* `key` deve ser não vazia e normalizável;
* use snake_case;
* cada chave deve ser única no contexto;
* `type` deve ser `"text"`;
* `scope` deve ser `"user"`;
* o default de `merge_strategy` é `"preserve_existing"`;
* não armazene tokens, senhas, chaves ou credenciais;
* não use `overwrite` sem necessidade explícita.

Estratégias permitidas:

* `"preserve_existing"`;
* `"overwrite"`;
* `"fill_empty"`;
* `"skip"`.

Cada placeholder no formato:

```text
{{memory.nome_da_chave}}
```

deve possuir uma entrada correspondente em:

```text
prompt_memory_context.entries
```

Considere placeholders presentes em:

* `system_role`;
* `task`;
* `context`;
* `user_scene_description`;
* `constraints`;
* `negative_prompt`;
* `few_shot_examples`;
* `output_contract.required_fields`;
* `output_contract.response_rules`.

---

## 11. Contrato de saída do prompt

Estrutura:

```json
{
  "format": "markdown",
  "language": "pt-BR",
  "strict_mode": true,
  "required_fields": [],
  "response_rules": []
}
```

Opcionalmente:

```json
{
  "optional_enums": {
    "nome_do_enum": [
      "valor_a",
      "valor_b"
    ]
  }
}
```

Formatos permitidos:

* `"text"`;
* `"markdown"`;
* `"json"`;
* `"image"`;
* `"code"`.

Escolha o formato com base na resposta final esperada, não no formato do arquivo de importação.

O fato de o Prompt Template ser armazenado em JSON não significa que `output_contract.format` deva ser `"json"`.

---

## 12. Compatibilidade legada

Ao receber um template existente, aceite aliases suportados pelo importador e normalize-os.

Exemplos de entrada legada:

* `context_menus` dentro do template;
* `contextMenus`;
* `menuDefinitions`;
* `menuIds`;
* `memory_context`;
* `memory_entries`.

Em novas saídas:

* use `context_menus` na raiz;
* use `menu_definitions` dentro do template;
* use `menu_ids`;
* use `prompt_memory_context`;
* não preserve aliases legados apenas por estética.

Nunca declare uma conversão como válida sem verificar se todos os dados foram preservados.
