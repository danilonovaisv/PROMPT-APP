import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useToast } from '@/context/ToastContext';
import { downloadJson } from '@/utils/exportJson';
import { exportMenusToJson } from '@/utils/importMenusJson';
import { saveLocalBackup } from '@/utils/backupManager';
import ImportMenusModal from '@/components/ImportMenusModal';
import { saveMenuToSupabase, deleteMenuFromSupabase } from '@/services/supabaseMenus';
import type { ContextMenu, ContextMenuOption } from '@/models/types';
import { ArrowLeft, Plus, Upload, Download, Settings } from 'lucide-react';

import { MenuForm } from '@/components/menu-manager/MenuForm';
import { MenuCard } from '@/components/menu-manager/MenuCard';

interface MenuFormData {
  menuId: string;
  menuName: string;
  description: string;
  selectionMode: ContextMenu['selectionMode'];
  options: ContextMenuOption[];
  remoteId?: number;
}

const EMPTY_FORM: MenuFormData = {
  menuId: '',
  menuName: '',
  description: '',
  selectionMode: 'single',
  options: [],
};

export default function MenuManagerPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const menus = useLiveQuery(() => db.contextMenus.toArray()) ?? [];

  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<MenuFormData>(EMPTY_FORM);
  const [expandedOption, setExpandedOption] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const toSlug = (text: string) =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  const startCreate = () => {
    setIsEditing(null);
    setForm(EMPTY_FORM);
    setIsCreating(true);
    setExpandedOption(null);
  };

  const startEdit = (menu: ContextMenu) => {
    setIsCreating(false);
    setIsEditing(menu.id!);
    setForm({
      menuId: menu.menuId,
      menuName: menu.menuName,
      description: menu.description,
      selectionMode: menu.selectionMode,
      options: JSON.parse(JSON.stringify(menu.options || [])),
      remoteId: menu.remoteId,
    });
    setExpandedOption(null);
  };

  const cancel = () => {
    setIsEditing(null);
    setIsCreating(false);
    setForm(EMPTY_FORM);
    setExpandedOption(null);
  };

  const save = async () => {
    if (!form.menuName.trim()) {
      showToast('Nome do menu é obrigatório', 'error');
      return;
    }

    const menuId = form.menuId || toSlug(form.menuName);

    if (!isEditing) {
      const existing = await db.contextMenus.where('menuId').equals(menuId).first();
      if (existing) {
        showToast('Já existe um menu com esse identificador', 'error');
        return;
      }
    }

    const now = new Date();
    let localId: number | null = null;

    try {
      const data: Partial<ContextMenu> = {
        menuId,
        menuName: form.menuName.trim(),
        description: form.description.trim(),
        selectionMode: form.selectionMode,
        options: form.options,
        updatedAt: now,
        syncStatus: 'pending',
      };

      if (isEditing) {
        localId = isEditing;
        await db.contextMenus.update(isEditing, data);
      } else {
        data.createdAt = now;
        const newId = await db.contextMenus.add(data as ContextMenu);
        localId = newId ?? null;
      }
      await saveLocalBackup();
    } catch (error: unknown) {
      console.error('Erro ao salvar localmente:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar o menu localmente.';
      showToast(errorMessage, 'error');
      return;
    }

    try {
      const savedRemote = await saveMenuToSupabase({
        menuId,
        menuName: form.menuName.trim(),
        description: form.description.trim(),
        selectionMode: form.selectionMode,
        options: form.options,
        remoteId: form.remoteId,
      });

      if (localId !== null) {
        await db.contextMenus.update(localId, {
          remoteId: savedRemote.id,
          syncStatus: 'synced',
        });
      }
      showToast(isEditing ? 'Menu sincronizado!' : 'Menu criado e sincronizado!');
      cancel();
    } catch (error: unknown) {
      console.error('Erro ao salvar no Supabase:', error);
      showToast('Menu salvo localmente. Sincronize ao fazer login.', 'info');
      cancel();
    }
  };

  const handleDelete = async (id: number, remoteId?: number) => {
    if (!confirm('Deseja realmente excluir este menu?')) return;
    try {
      if (remoteId) {
        await deleteMenuFromSupabase(remoteId);
      }
      await db.contextMenus.delete(id);
      await saveLocalBackup();
      showToast('Menu excluído do servidor!');
    } catch (error: unknown) {
      console.error('Erro ao excluir do Supabase:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar menu no servidor.';
      showToast(errorMessage, 'error');
    }
  };

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { label: '', value: '', subOptions: [] }],
    }));
    setExpandedOption(form.options.length);
  };

  const updateOption = (idx: number, field: keyof ContextMenuOption, value: string) => {
    setForm((prev) => {
      const options = [...prev.options];
      options[idx] = { ...options[idx], [field]: value };
      if (field === 'label' && !options[idx].value) {
        options[idx].value = toSlug(value);
      }
      return { ...prev, options };
    });
  };

  const removeOption = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx),
    }));
    if (expandedOption === idx) setExpandedOption(null);
  };

  const addSubOption = (optIdx: number) => {
    setForm((prev) => {
      const options = [...prev.options];
      options[optIdx] = {
        ...options[optIdx],
        subOptions: [...(options[optIdx].subOptions || []), { label: '', value: '' }],
      };
      return { ...prev, options };
    });
  };

  const updateSubOption = (optIdx: number, subIdx: number, field: keyof any, value: string) => {
    setForm((prev) => {
      const options = [...prev.options];
      const subs = [...(options[optIdx].subOptions || [])];
      subs[subIdx] = { ...subs[subIdx], [field]: value };
      if (field === 'label' && !subs[subIdx].value) {
        subs[subIdx].value = toSlug(value);
      }
      options[optIdx] = { ...options[optIdx], subOptions: subs };
      return { ...prev, options };
    });
  };

  const removeSubOption = (optIdx: number, subIdx: number) => {
    setForm((prev) => {
      const options = [...prev.options];
      options[optIdx] = {
        ...options[optIdx],
        subOptions: (options[optIdx].subOptions || []).filter((_, i) => i !== subIdx),
      };
      return { ...prev, options };
    });
  };

  const handleFieldChange = <K extends keyof MenuFormData>(field: K, value: MenuFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleExpand = (index: number) => {
    setExpandedOption(expandedOption === index ? null : index);
  };

  return (
    <>
      <header className="app-header">
        <div className="flex-row-center">
          <button
            className="btn btn--ghost btn--icon"
            onClick={() => navigate('/')}
            aria-label="Voltar ao início"
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="app-header__title">Menus do Template</h1>
        </div>
        <div className="app-header__actions">
          <button
            className="btn btn--secondary"
            onClick={() => setShowImportModal(true)}
            title="Importar menus de um arquivo .json"
          >
            <Upload size={16} />
            Importar
          </button>
          <button
            className="btn btn--secondary"
            onClick={async () => {
              const data = await exportMenusToJson();
              downloadJson(data, `menus_export_${Date.now()}`);
              showToast('Menus exportados!');
            }}
            title="Exportar todos os menus em formato .json"
          >
            <Download size={16} />
            Exportar
          </button>
          <button className="btn btn--primary" onClick={startCreate}>
            <Plus size={16} />
            Novo Menu
          </button>
        </div>
      </header>

      <div className="app-content">
        {(isCreating || isEditing !== null) && (
          <MenuForm
            form={form}
            isEditing={isEditing}
            expandedOption={expandedOption}
            toSlug={toSlug}
            onCancel={cancel}
            onSave={save}
            onFieldChange={handleFieldChange}
            onOptionUpdate={updateOption}
            onOptionRemove={removeOption}
            onSubOptionUpdate={updateSubOption}
            onSubOptionRemove={removeSubOption}
            onAddOption={addOption}
            onAddSubOption={addSubOption}
            onToggleExpand={handleToggleExpand}
          />
        )}

        {menus.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><Settings size={48} /></div>
            <h3 className="empty-state__title">Nenhum menu do template</h3>
            <p className="empty-state__description">
              Menus do template são conjuntos reutilizáveis de opções configuráveis que enriquecem seus formatos de saída.
              Clique em "Novo Menu" para começar.
            </p>
          </div>
        ) : (
          <div className="ctx-menu-grid">
            {menus.map((menu) => (
              <MenuCard
                key={menu.id}
                menu={menu}
                onEdit={() => startEdit(menu)}
                onDelete={() => handleDelete(menu.id!, menu.remoteId)}
              />
            ))}
          </div>
        )}
      </div>

      <ImportMenusModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </>
  );
}
