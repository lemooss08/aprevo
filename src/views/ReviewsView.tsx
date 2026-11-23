import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ReviewItem } from '../types';
import {
  RotateCcw,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  Trash2,
  AlertCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { formatDateBR } from '../utils/formatters';
import { Modal } from '../components/Modal';

export const ReviewsView: React.FC = () => {
  const { reviews, subjects, addReview, advanceReview, postponeReview, deleteReview } = useApp();

  const [filterTab, setFilterTab] = useState<'today' | 'upcoming' | 'completed' | 'all'>('today');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Form states
  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id || '');
  const [topic, setTopic] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [intervalsStr, setIntervalsStr] = useState<string>('1, 3, 7, 15, 30');

  const todayStr = new Date().toISOString().slice(0, 10);

  // Grouped counts
  const pendingTodayReviews = reviews.filter(
    (r) => r.status === 'pending' && r.nextReviewDate <= todayStr
  );
  const upcomingReviews = reviews.filter(
    (r) => r.status === 'pending' && r.nextReviewDate > todayStr
  );
  const completedReviews = reviews.filter((r) => r.status === 'completed');

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (selectedSubjectFilter !== 'all' && r.subjectId !== selectedSubjectFilter) {
        return false;
      }
      if (filterTab === 'today') {
        return r.status === 'pending' && r.nextReviewDate <= todayStr;
      }
      if (filterTab === 'upcoming') {
        return r.status === 'pending' && r.nextReviewDate > todayStr;
      }
      if (filterTab === 'completed') {
        return r.status === 'completed';
      }
      return true;
    });
  }, [reviews, filterTab, selectedSubjectFilter, todayStr]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !topic.trim()) return;

    const parsedIntervals = intervalsStr
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    addReview(
      subjectId,
      topic.trim(),
      notes.trim(),
      parsedIntervals.length > 0 ? parsedIntervals : [1, 3, 7, 15, 30]
    );

    setTopic('');
    setNotes('');
    setIsCreateModalOpen(false);
  };

  const getSubject = (id: string) => subjects.find((s) => s.id === id);

  return (
    <div className="space-y-6">
      {/* Top Banner: Spaced Repetition Concept */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#17142b] via-[#11131c] to-[#0d0f17] border border-brand-500/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curva do Esquecimento (Ebbinghaus)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Sistema de Revisões Espaçadas
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Revise no momento certo (1d, 3d, 7d, 15d, 30d) para transferir o aprendizado da memória de curto prazo para a memória permanente.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Revisão</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#11131a] border border-[#232836]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pendentes Para Hoje</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {pendingTodayReviews.length}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {pendingTodayReviews.length === 0 ? 'Nenhuma revisão atrasada!' : 'Necessitam da sua atenção'}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#11131a] border border-[#232836]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Próximos Dias</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {upcomingReviews.length}
            </div>
            <p className="text-xs text-slate-400 mt-1">Agendadas para as próximas semanas</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#11131a] border border-[#232836]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Ciclos Concluídos</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {completedReviews.length}
            </div>
            <p className="text-xs text-slate-400 mt-1">Conteúdos consolidados na memória</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Subject Filter */}
      <div className="p-4 rounded-2xl bg-[#11131a] border border-[#232836] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#161922] border border-[#282f42] overflow-x-auto text-xs">
          <button
            onClick={() => setFilterTab('today')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              filterTab === 'today'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hoje ({pendingTodayReviews.length})
          </button>
          <button
            onClick={() => setFilterTab('upcoming')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              filterTab === 'upcoming'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Próximas ({upcomingReviews.length})
          </button>
          <button
            onClick={() => setFilterTab('completed')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              filterTab === 'completed'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Concluídas ({completedReviews.length})
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              filterTab === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas ({reviews.length})
          </button>
        </div>

        <select
          value={selectedSubjectFilter}
          onChange={(e) => setSelectedSubjectFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#161922] border border-[#282f42] text-xs text-white focus:outline-none focus:border-brand-500"
        >
          <option value="all">Todas as matérias</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>

      {/* Cards List */}
      {filteredReviews.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#11131a] border border-dashed border-[#282f42]">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-white">Nenhuma revisão nesta lista</h4>
          <p className="text-xs text-slate-500 mt-1">
            Você está em dia com seus ciclos ou adicione um novo conteúdo para acompanhar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev) => {
            const sub = getSubject(rev.subjectId);
            const isDueToday = rev.status === 'pending' && rev.nextReviewDate <= todayStr;

            return (
              <div
                key={rev.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isDueToday
                    ? 'bg-[#151322] border-brand-500/40 shadow-glow-sm'
                    : rev.status === 'completed'
                    ? 'bg-[#10141a] border-emerald-500/20'
                    : 'bg-[#11131a] border-[#232836]'
                }`}
              >
                <div>
                  {/* Top Bar: Subject Pill & Stage */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#161922] border border-[#282f42] text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sub?.color || '#8b5cf6' }}
                      />
                      <span className="font-semibold text-slate-200 truncate max-w-[150px]">
                        {sub?.name || 'Geral'}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        rev.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                          : isDueToday
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {rev.status === 'completed'
                        ? 'Consolidado ✓'
                        : isDueToday
                        ? 'Revisar Hoje!'
                        : `Próxima: ${formatDateBR(rev.nextReviewDate)}`}
                    </span>
                  </div>

                  {/* Topic Title */}
                  <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    {rev.topic}
                  </h4>

                  {/* Notes */}
                  {rev.notes && (
                    <p className="text-xs text-slate-300 mt-2 p-2.5 rounded-xl bg-[#161922] border border-[#202534] leading-relaxed">
                      {rev.notes}
                    </p>
                  )}

                  {/* Spaced Repetition Step Indicators */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span>Ciclo de Fixação</span>
                      <span className="font-mono text-white">
                        {rev.stage >= rev.intervals.length
                          ? 'Completo (5/5)'
                          : `Etapa ${rev.stage + 1} de ${rev.intervals.length} (${rev.intervals[rev.stage]}d)`}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {rev.intervals.map((days, idx) => {
                        const isDone = idx < rev.stage;
                        const isCurrent = idx === rev.stage && rev.status !== 'completed';

                        return (
                          <div
                            key={idx}
                            title={`${days} dias de intervalo`}
                            className={`h-2 rounded-full transition-all ${
                              isDone
                                ? 'bg-emerald-500'
                                : isCurrent
                                ? 'bg-brand-500 animate-pulse'
                                : 'bg-[#202534]'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-[#202534] flex items-center justify-between gap-2">
                  <button
                    onClick={() => deleteReview(rev.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    {rev.status !== 'completed' && (
                      <button
                        onClick={() => postponeReview(rev.id, 1)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#161922] hover:bg-[#202534] text-slate-300 text-xs font-medium border border-[#282f42] transition-colors"
                      >
                        +1 Dia
                      </button>
                    )}

                    {rev.status !== 'completed' ? (
                      <button
                        onClick={() => advanceReview(rev.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Revisado</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Concluído
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Nova Revisão */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Agendar Nova Revisão Espaçada"
        description="Defina o conteúdo estudado para o APREVO calcular os intervalos ideais de retenção"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Matéria / Disciplina *
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#161922] border border-[#282f42] text-sm text-white focus:outline-none focus:border-brand-500"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Conteúdo ou Assunto *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              placeholder="Ex: Teorema de Bayes, Ciclo de Krebs, Funções de Ordem Superior..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#161922] border border-[#282f42] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Intervalos Espaçados em Dias (separados por vírgula)
            </label>
            <input
              type="text"
              value={intervalsStr}
              onChange={(e) => setIntervalsStr(e.target.value)}
              placeholder="1, 3, 7, 15, 30"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#161922] border border-[#282f42] text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Padrão científico de retenção: 1º dia, 3º dia, 7º dia, 15º dia e 30º dia.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Resumo ou Dicas de Fixação
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Fórmulas principais, pegadinhas de prova ou pontos de atenção..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#161922] border border-[#282f42] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-[#1c202c] hover:bg-[#252b3b] text-slate-300 text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm"
            >
              Iniciar Ciclo de Revisão
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
