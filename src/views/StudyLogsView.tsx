import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StudySession } from '../types';
import {
  Search,
  Plus,
  Calendar,
  Trash2,
  Edit2,
  BookOpen,
} from 'lucide-react';
import {
  formatDateBR,
  formatTimeBR,
  formatSecondsToHuman,
  isSameDay,
  getStartOfWeek,
} from '../utils/formatters';
import { Modal } from '../components/Modal';
import { StudyModal } from '../components/StudyModal';

interface StudyLogsViewProps {
  onOpenCreate: () => void;
}

export const StudyLogsView: React.FC<StudyLogsViewProps> = ({ onOpenCreate }) => {
  const { sessions, subjects, deleteSession } = useApp();

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('all'); // all, today, week, month

  // Modal State for Edit
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openEditModal = (session: StudySession) => {
    setEditingSession(session);
    setIsEditModalOpen(true);
  };

  // Filtered Sessions calculation
  const filteredSessions = useMemo(() => {
    const now = new Date();
    const startOfWeek = getStartOfWeek(now);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return sessions.filter((s) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTopic = s.topic.toLowerCase().includes(query);
        const matchNotes = (s.notes || '').toLowerCase().includes(query);
        if (!matchTopic && !matchNotes) return false;
      }

      // Subject filter
      if (selectedSubjectFilter !== 'all' && s.subjectId !== selectedSubjectFilter) {
        return false;
      }

      // Period filter
      const sessionDate = new Date(s.startedAt);
      if (selectedPeriodFilter === 'today') {
        if (!isSameDay(sessionDate, now)) return false;
      } else if (selectedPeriodFilter === 'week') {
        if (sessionDate < startOfWeek) return false;
      } else if (selectedPeriodFilter === 'month') {
        if (sessionDate < startOfMonth) return false;
      }

      return true;
    });
  }, [sessions, searchTerm, selectedSubjectFilter, selectedPeriodFilter]);

  const totalFilteredSeconds = filteredSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const getSubject = (id: string) => subjects.find((s) => s.id === id);

  return (
    <div className="space-y-6">
      {/* Top action bar: Search & Filters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#222222] border border-[#383838] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por tópico, resumo ou anotação..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#2c2c2c] border border-[#414141] text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Matéria filter */}
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#2c2c2c] border border-[#414141] text-xs text-white focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="all">Todas as matérias</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>

          {/* Período filter */}
          <select
            value={selectedPeriodFilter}
            onChange={(e) => setSelectedPeriodFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#2c2c2c] border border-[#414141] text-xs text-white focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="all">Todo o período</option>
            <option value="today">Apenas Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
          </select>

          {/* New study button */}
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Registro</span>
          </button>
        </div>
      </div>

      {/* Results Header Info */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Mostrando <strong className="text-white">{filteredSessions.length}</strong>{' '}
          {filteredSessions.length === 1 ? 'registro' : 'registros'}
        </span>
        <span>
          Tempo total filtrado:{' '}
          <strong className="text-brand-300 font-mono">
            {formatSecondsToHuman(totalFilteredSeconds)}
          </strong>
        </span>
      </div>

      {/* Cards Grid */}
      {filteredSessions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#222222] border border-dashed border-[#414141]">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">Nenhum registro encontrado</h4>
          <p className="text-xs text-slate-500 mt-1">
            Tente ajustar os filtros ou clique em "Novo Registro" para adicionar manualmente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSessions.map((session) => {
            const sub = getSubject(session.subjectId);
            const color = sub?.color || '#8b5cf6';

            return (
              <div
                key={session.id}
                className="group p-5 rounded-2xl bg-[#222222] border border-[#383838] hover:border-[#4c4c4c] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Subject Tag + Duration Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2c2c2c] border border-[#414141] text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-semibold text-slate-200 truncate max-w-[150px]">
                        {sub?.name || 'Geral'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-300 border border-brand-500/20 font-bold">
                        {formatSecondsToHuman(session.durationSeconds)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#2c2c2c]">
                        {session.type === 'timer' ? 'Cronômetro' : 'Manual'}
                      </span>
                    </div>
                  </div>

                  {/* Topic Title */}
                  <h4 className="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-2">
                    {session.topic}
                  </h4>

                  {/* Notes / Summary */}
                  {session.notes && (
                    <div className="mt-2.5 p-3 rounded-xl bg-[#2c2c2c] border border-[#343434] text-xs text-slate-300 leading-relaxed font-sans">
                      <p className="line-clamp-3">{session.notes}</p>
                    </div>
                  )}
                </div>

                {/* Card Footer: Date & Actions */}
                <div className="mt-4 pt-3 border-t border-[#343434] flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatDateBR(session.startedAt)}</span>
                    <span className="text-slate-600">•</span>
                    <span>{formatTimeBR(session.startedAt)}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(session)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#303030] transition-colors"
                      title="Editar registro"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(session.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Excluir registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <StudyModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSession(null);
        }}
        editingSession={editingSession}
      />

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Excluir Registro de Estudo"
        description="Esta ação removerá permanentemente esta sessão de seus registros e relatórios."
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
                deleteSession(deleteConfirmId);
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
