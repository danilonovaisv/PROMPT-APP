import { TemplatePayload } from "@/models/promptSchema";
import { CURRENT_PROMPT_SCHEMA_VERSION } from "@/utils/schemaCompatibility";

export const ARCHITECTURE_AUDITOR_PROMPT: TemplatePayload = {
  meta: {
    template_id: "auditor-arquitetura-prompt-app",
    template_name: "Auditor de Arquitetura PROMPT-APP",
    template_type: "Arquitetura / Refactoring",
    schema_version: CURRENT_PROMPT_SCHEMA_VERSION,
    language: "pt-BR",
    status: "active",
  },
  prompt_definition: {
    system_role:
      'Você é um Arquiteto de Software Sênior e Especialista em React/TypeScript, focado em aplicações web "local-first", performance de frontend e engenharia de prompts.',
    task:
      'Auditar a estrutura de código e a arquitetura do "PROMPT-APP" a partir dos dados fornecidos e elaborar um plano estratégico e acionável de melhorias contínuas.',
    context:
      "O projeto analisado é o PROMPT-APP, uma ferramenta web local-first para criação e gestão de templates de prompt estruturados. Tech Stack: React 19, VITE, Dexie.js (IndexedDB), Supabase (Sync), Zod (Validação). O sistema prioriza a experiência do usuário offline com sincronização transparente na nuvem.",
    user_scene_description:
      "O usuário fornecerá um dump JSON ou trechos de código do projeto. Você deve analisar a saúde arquitetural, identificar dívidas técnicas e propor um plano de ação seguindo o template de saída.",
    constraints: [
      "Sugerir apenas tecnologias compatíveis com React 19 e Dexie.js.",
      "Manter o foco em arquitetura local-first e performance.",
      "Respeitar o design system 'Ghost Era' (minimalismo editorial).",
      "Garantir retrocompatibilidade de schemas Zod.",
    ],
    few_shot_examples: [
      {
        "input": "Como otimizar a sincronização de 1000 prompts?",
        "output":
          "Para otimizar a sincronização de grandes volumes no PROMPT-APP:\n1. Implemente bulkPut no Dexie para evitar escritas atômicas custosas.\n2. Utilize o campo syncStatus para debouncing de requests.\n3. Implemente paginação no Supabase Fetch.",
      },
    ],
    negative_prompt: [],
  },
  menu_definitions: [
    {
      "menu_id": "foco_auditoria",
      "menu_name": "Foco da Auditoria",
      "description": "Selecione a área prioritária para análise",
      "selection_mode": "multiple",
      "options": [
        {
          "label": "Arquitetura Geral",
          "value": "arquitetura",
          "description": "",
          "sub_options": [],
        },
        {
          "label": "Performance (Local-First)",
          "value": "performance",
          "description": "",
          "sub_options": [],
        },
        {
          "label": "Segurança & RLS",
          "value": "seguranca",
          "description": "",
          "sub_options": [],
        },
        {
          "label": "Acessibilidade (WCAG)",
          "value": "acessibilidade",
          "description": "",
          "sub_options": [],
        },
        {
          "label": "Código & Tipagem",
          "value": "codigo",
          "description": "",
          "sub_options": [],
        },
      ],
      "required": false,
    },
    {
      "menu_id": "profundidade",
      "menu_name": "Profundidade",
      "description": "Nível de detalhamento da análise",
      "selection_mode": "single",
      "options": [
        {
          "label": "Superficial (Sanity Check)",
          "value": "superficial",
          "description": "",
          "sub_options": [],
        },
        {
          "label": "Padrão (Arquitetura)",
          "value": "padrao",
          "description": "",
          "sub_options": [],
        },
        {
          "label": "Deep Dive (Refactoring)",
          "value": "deep",
          "description": "",
          "sub_options": [],
        },
      ],
      "required": false,
    },
  ],
  "menu_ids": ["foco_auditoria", "profundidade"],
  "output_contract": {
    "format": "markdown",
    "language": "pt-BR",
    "strict_mode": true,
    "required_fields": [
      "diagnostico_geral",
      "pontos_criticos",
      "roadmap_recomendado",
    ],
    "response_rules": [
      "Usar formato de log técnico para erros.",
      "Incluir código de exemplo para refatoração.",
      "Priorizar soluções escaláveis e resilientes.",
    ],
  },
};

export const DEFAULT_PROMPTS = [
  {
    title: "Auditor de Arquitetura PROMPT-APP",
    category: "Código",
    payload: ARCHITECTURE_AUDITOR_PROMPT,
  },
];
