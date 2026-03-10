/* ======================================================
   Gerenciador de Menus do Template — CRUD hierárquico
   ====================================================== */

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
import type { ContextMenu, ContextMenuOption, ContextMenuSubOption } from '@/models/types';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Edit3,
    Check,
    X,
    ChevronDown,
    ChevronRight,
    Layers,
    Settings,
    Upload,
    Download,
} from 'lucide-react';

/* ---- Form state ---- */
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

    /* ---- Slug generation ---- */
    const toSlug = (text: string) =>
        text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

    /* ---- CRUD ---- */
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

        /* Verificar duplicidade de menuId */
        if (!isEditing) {
            const existing = await db.contextMenus.where('menuId').equals(menuId).first();
            if (existing) {
                showToast('Já existe um menu com esse identificador', 'error');
                return;
            }
        }

        const now = new Date(); // Fix for 'now' is not defined

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
        } catch (error: any) {
            console.error('Erro ao salvar localmente:', error);
            showToast(error.message || 'Erro ao salvar o menu localmente.', 'error');
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
        } catch (error: any) {
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
        } catch (error: any) {
            console.error('Erro ao excluir do Supabase:', error);
            showToast(error.message || 'Erro ao deletar menu no servidor.', 'error');
        }
    };

    /* ---- Option management ---- */
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
            /* Auto-generate value from label */
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

    /* ---- Sub-option management ---- */
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

    const updateSubOption = (optIdx: number, subIdx: number, field: keyof ContextMenuSubOption, value: string) => {
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
                {/* ---- Formulário de criação/edição ---- */}
                {(isCreating || isEditing !== null) && (
                    <div className="card card--active">
                        <h3 className="card__title">
                            {isEditing ? 'Editar Menu' : 'Novo Menu do Template'}
                        </h3>

                        <div className="form-group">
                            <label className="form-label">Nome do Menu</label>
                            <input
                                value={form.menuName}
                                onChange={(e) => {
                                    setForm((prev) => ({
                                        ...prev,
                                        menuName: e.target.value,
                                        menuId: prev.menuId || toSlug(e.target.value),
                                    }));
                                }}
                                placeholder="Ex: Estilo de Escrita, Framework, Nível Técnico..."
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Identificador
                                <span className="form-label__hint">(slug único)</span>
                            </label>
                            <input
                                value={form.menuId}
                                onChange={(e) => setForm((prev) => ({ ...prev, menuId: toSlug(e.target.value) }))}
                                placeholder="auto-gerado a partir do nome"
                                disabled={!!isEditing}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Descrição</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="Descreva o propósito deste menu dinâmico..."
                                rows={2}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="menu-selection-mode">
                                Modo de seleção
                            </label>
                            <select
                                id="menu-selection-mode"
                                value={form.selectionMode}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        selectionMode: e.target.value as ContextMenu['selectionMode'],
                                    }))
                                }
                            >
                                <option value="single">Seleção única</option>
                                <option value="multiple">Seleção múltipla</option>
                            </select>
                        </div>

                        {/* ---- Opções ---- */}
                        <div className="form-group">
                            <label className="form-label">
                                <Layers size={14} /> Opções
                            </label>

                            <div className="ctx-options-list">
                                {form.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="ctx-option-card">
                                        <div
                                            className="ctx-option-card__header"
                                            onClick={() => setExpandedOption(expandedOption === optIdx ? null : optIdx)}
                                        >
                                            {expandedOption === optIdx ? (
                                                <ChevronDown size={16} />
                                            ) : (
                                                <ChevronRight size={16} />
                                            )}
                                            <span className="ctx-option-card__title">
                                                {opt.label || `Opção ${optIdx + 1}`}
                                            </span>
                                            {(opt.subOptions || []).length > 0 && (
                                                <span className="ctx-option-card__badge">
                                                    {(opt.subOptions || []).length} sub
                                                </span>
                                            )}
                                            <button
                                                className="btn btn--ghost btn--icon btn--sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeOption(optIdx);
                                                }}
                                                aria-label="Remover opção"
                                                title="Remover opção"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        {expandedOption === optIdx && (
                                            <div className="ctx-option-card__body">
                                                <div className="ctx-option-card__fields">
                                                    <div className="form-group form-group--tight">
                                                        <label className="form-label">Label</label>
                                                        <input
                                                            value={opt.label}
                                                            onChange={(e) => updateOption(optIdx, 'label', e.target.value)}
                                                            placeholder="Ex: Formal"
                                                        />
                                                    </div>
                                                    <div className="form-group form-group--tight">
                                                        <label className="form-label">Valor</label>
                                                        <input
                                                            value={opt.value}
                                                            onChange={(e) => updateOption(optIdx, 'value', e.target.value)}
                                                            placeholder="Auto-gerado"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Sub-opções */}
                                                <div className="ctx-suboptions">
                                                    <div className="ctx-suboptions__header">
                                                        <span className="form-label">Sub-opções</span>
                                                        <button
                                                            className="btn btn--ghost btn--sm"
                                                            onClick={() => addSubOption(optIdx)}
                                                        >
                                                            <Plus size={12} /> Adicionar
                                                        </button>
                                                    </div>

                                                    {(opt.subOptions || []).length === 0 && (
                                                        <p className="ctx-suboptions__empty">
                                                            Nenhuma sub-opção. Opcional.
                                                        </p>
                                                    )}

                                                    {(opt.subOptions || []).map((sub, subIdx) => (
                                                        <div key={subIdx} className="ctx-suboption-row">
                                                            <input
                                                                value={sub.label}
                                                                onChange={(e) => updateSubOption(optIdx, subIdx, 'label', e.target.value)}
                                                                placeholder="Label"
                                                                className="ctx-suboption-row__input"
                                                            />
                                                            <input
                                                                value={sub.value}
                                                                onChange={(e) => updateSubOption(optIdx, subIdx, 'value', e.target.value)}
                                                                placeholder="Valor"
                                                                className="ctx-suboption-row__input"
                                                            />
                                                            <button
                                                                className="btn btn--ghost btn--icon btn--sm"
                                                                onClick={() => removeSubOption(optIdx, subIdx)}
                                                                aria-label="Remover sub-opção"
                                                                title="Remover"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button className="btn btn--ghost btn--sm dynamic-list__add" onClick={addOption}>
                                <Plus size={14} /> Adicionar opção
                            </button>
                        </div>

                        <div className="flex-row-end">
                            <button className="btn btn--secondary" onClick={cancel}>
                                <X size={16} /> Cancelar
                            </button>
                            <button className="btn btn--primary" onClick={save}>
                                <Check size={16} /> Salvar
                            </button>
                        </div>
                    </div>
                )}

                {/* ---- Lista de menus ---- */}
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
                            <div key={menu.id} className="card ctx-menu-card">
                                <div className="ctx-menu-card__header">
                                    <div>
                                        <div className="ctx-menu-card__name">{menu.menuName}</div>
                                        <div className="ctx-menu-card__slug">
                                            {menu.menuId} • {menu.selectionMode === 'multiple' ? 'múltipla' : 'única'}
                                        </div>
                                    </div>
                                    <div className="flex-row-center">
                                        <button
                                            className="btn btn--ghost btn--icon"
                                            onClick={() => startEdit(menu)}
                                            aria-label="Editar menu"
                                            title="Editar"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            className="btn btn--ghost btn--icon"
                                            onClick={() => handleDelete(menu.id!, menu.remoteId)}
                                            aria-label="Excluir menu"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {menu.description && (
                                    <p className="ctx-menu-card__description">{menu.description}</p>
                                )}

                                <div className="ctx-menu-card__tree">
                                    {(menu.options || []).map((opt, i) => (
                                        <div key={i} className="ctx-tree-node">
                                            <div className="ctx-tree-node__option">
                                                <span className="ctx-tree-node__dot" />
                                                {opt.label}
                                            </div>
                                            {(opt.subOptions || []).length > 0 && (
                                                <div className="ctx-tree-node__children">
                                                    {(opt.subOptions || []).map((sub, j) => (
                                                        <div key={j} className="ctx-tree-node__sub">
                                                            <span className="ctx-tree-node__line" />
                                                            {sub.label}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de importação de menus */}
            <ImportMenusModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
            />
        </>
    );
}
