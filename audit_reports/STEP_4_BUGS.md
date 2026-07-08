# STEP 4: BUGS TO FIX (INVESTIGATION)
1. **Playground:** A funcionalidade "Memória Fixa" ficava travada em estado isAddingKey, forçando um fallback infinito do add form sem keys.
2. **Variáveis:** Dificuldade no preenchimento de variáveis fixas: O EditorPage autosave hook debouncedFixedMemory dava return pre-maturo quando vazio.
3. **Importação:** Prompts vazios na importação: O parsePromptContract não rodava o schema upgrade strict em legacy, agora utiliza parseTemplatePayload garantindo migração/mapping correto.
4. **Menus:** Falha no seletor: Clicar no MultiSelectItem passava strings que o onMenuSelectionChange requeria array de numbers.
5. **Sync:** Causas de N+1 queries. O loop em importService gerava chamadas db.categories.where pra cada item de lote. Corrigido prefetching de .anyOf.
