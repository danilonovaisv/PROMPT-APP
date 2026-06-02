import type { Prompt, PromptExportFormat, ContextMenu } from '@/models/types';
/** Converte prompt interno para o formato JSON cognitivo */
export declare function toExportFormat(prompt: Prompt, contextMenus?: ContextMenu[]): PromptExportFormat;
/** Faz download de um objeto como arquivo .json */
export declare function downloadJson(data: unknown, filename: string): void;
/** Exporta um único prompt para download */
export declare function downloadPrompt(prompt: Prompt): Promise<void>;
/** Exporta todos os prompts + menus de contexto em formato bulk */
export declare function downloadAllPrompts(): Promise<void>;
/** Retorna um Blob com o template JSON para novos prompts */
export declare function getTemplateFile(): Blob;
/** Copia texto para a área de transferência */
export declare function copyToClipboard(text: string): Promise<boolean>;
