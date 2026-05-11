import {
  TemplatePayload,
  UserSelection,
  compilePromptPayload,
  createEmptyPromptPayload,
} from '@/models/promptSchema';
import { renderFinalPromptText } from '../promptArtifacts';

describe('promptArtifacts - Fixed Memory Injection', () => {
  it('should correctly inject fixed memory (user_input) into the rendered prompt via free_inputs', () => {
    // 1. Criar um template base
    const template: TemplatePayload = createEmptyPromptPayload('Test Template');
    template.prompt_definition.task = 'Escreva um resumo de {{user_input}}';

    // 2. Simular o form.selection fundido com a Memória Fixa (comportamento do EditorPage)
    const fixedMemory = { user_input: 'Contexto Global de Teste' };
    const selection: UserSelection = {
      template_id: template.meta.template_id,
      selected_menus: [],
      free_inputs: {
        ...fixedMemory,
      },
    };

    // 3. Compilar o payload (o compilePromptPayload carrega o free_inputs no compiled_context)
    const compiledPayload = compilePromptPayload(template, selection);

    // 4. Renderizar o prompt de saída
    const renderedPrompt = renderFinalPromptText(template, compiledPayload);

    // 5. Verificações
    // Deve incluir as seções padronizadas
    expect(renderedPrompt).toContain('## CONTEXT');
    // Deve listar explicitamente o input livre injetado
    expect(renderedPrompt).toContain('- user_input: Contexto Global de Teste');
    // Deve conter a tarefa formatada
    expect(renderedPrompt).toContain('Task:\nEscreva um resumo de Contexto Global de Teste');
  });
});
