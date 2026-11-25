import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Subject } from '../types';
import { DEFAULT_SUBJECT_COLORS } from '../services/storage';
import {
  FolderKanban,
  Plus,
  Clock,
  Layers,
  Edit2,
  Trash2,
  Palette,
  Check,
} from 'lucide-react';
import { formatSecondsToHuman } from '../utils/formatters';
import { Modal } from '../components/Modal';

export const SubjectsView: React.FC = () => {
  const { subjects, sessions, addSubject, updateSubject, deleteSubject } = useApp();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState<string>('');
  const [color, setColor] = useState<string>(DEFAULT_SUBJECT_COLORS[0]);
  const [description, setDescription] = useState<string>('');

  const openCreateModal = () => {
    setEditingSubject(null);
    setName('');
    setColor(DEFAULT_SUBJECT_COLORS[Math.floor(Math.random() * DEFAULT_SUBJECT_COLORS.length)]);
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setName(subject.name);
    setColor(subject.color);
    setDescription(subject.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSubject) {
      updateSubject(editingSubject.id, name.trim(), color, description.trim());
    } else {
      addSubject(name.trim(), color, description.trim());
    }

    setIsModalOpen(false);
  };

  // Metrics per subject
  const getSubjectStats = (subjectId: string) => {
    const subjectSessions = sessions.filter((s) => s.subjectId === subjectId);
    const totalSeconds = subjectSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    return {
      sessionCount: subjectSessions.length,
      totalSeconds,
      hoursFormatted: formatSecondsToHuman(totalSeconds),
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-[#222222] border border-[#383838] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Gerenciamento de Matérias
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Personalize disciplinas, cores de identificação e acompanhe horas dedicadas por área
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl button-primary font-semibold text-xs shadow-sm transition-all hover:shadow-glow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Matéria</span>
        </button>
      </div>

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#222222] border border-dashed border-[#414141]">
          <FolderKanban className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">Nenhuma matéria cadastrada</h4>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Crie sua primeira matéria para categorizar seus estudos.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl button-primary text-xs font-semibold"
          >
            Adicionar Matéria
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => {
            const stats = getSubjectStats(sub.id);

            return (
              <div
                key={sub.id}
                className="group p-5 rounded-2xl bg-[#222222] border border-[#383838] hover:border-[#4c4c4c] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top bar with color pill and action buttons */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full ring-2 ring-white/10"
                        style={{ backgroundColor: sub.color }}
                      />
                      <span className="text-[11px] font-mono text-slate-400 uppercase">
                        {sub.color}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(sub)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#303030] transition-colors"
                        title="Editar matéria"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(sub.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Excluir matéria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Name and Description */}
                  <h4 className="text-base font-bold text-white tracking-tight">{sub.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                    {sub.description || 'Sem descrição informada.'}
                  </p>
                </div>

                {/* Metrics Box */}
                <div className="mt-5 pt-4 border-t border-[#343434] grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-[#2c2c2c] border border-[#343434]">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <Clock className="w-3 h-3" />
                      <span>Tempo Total</span>
                    </div>
                    <p className="text-sm font-bold font-mono text-brand-300 mt-1">
                      {stats.hoursFormatted}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#2c2c2c] border border-[#343434]">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <Layers className="w-3 h-3" />
                      <span>Sessões</span>
                    </div>
                    <p className="text-sm font-bold font-mono text-white mt-1">
                      {stats.sessionCount}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Subject */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Editar Matéria' : 'Criar Nova Matéria'}
        description="Defina o nome, a cor visual e a descrição desta disciplina"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nome da Matéria *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Inteligência Artificial, Cálculo, História..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#2c2c2c] border border-[#414141] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cor de Destaque
            </label>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {DEFAULT_SUBJECT_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-400">{color}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Descrição ou Tópicos Principais (Opcional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve resumo do conteúdo programático ou livros de apoio..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#2c2c2c] border border-[#414141] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-[#303030] hover:bg-[#3c3c3c] text-slate-300 text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl button-primary text-xs font-bold"
            >
              {editingSubject ? 'Salvar Matéria' : 'Criar Matéria'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Delete Subject */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Excluir Matéria"
        description="Tem certeza que deseja excluir esta matéria? Os registros anteriores continuarão no histórico de estudos."
        maxWidth="max-w-md"
      >
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            onClick={() => setDeleteConfirmId(null)}
            className="px-4 py-2 rounded-xl bg-[#303030] hover:bg-[#3c3c3c] text-slate-300 text-xs font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (deleteConfirmId) {
                deleteSubject(deleteConfirmId);
                setDeleteConfirmId(null);
              }
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
          >
            Sim, Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
};
