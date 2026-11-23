import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Clock,
  CheckCircle2,
  Zap,
  Target,
  Flame,
} from 'lucide-react';
import { formatSecondsToHMS, formatSecondsToHuman, formatTimeBR, isSameDay } from '../utils/formatters';

export const TimerView: React.FC = () => {
  const {
    subjects,
    sessions,
    activeTimer,
    timerSeconds,
    isTimerRunning,
    startTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
    discardTimer,
    setActiveTab,
  } = useApp();

  // Local form state for starting a session
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => subjects[0]?.id || '');
  const [topic, setTopic] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);

  const activeSubject = subjects.find((s) => s.id === activeTimer?.subjectId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Today sessions for inspiration
  const todaySessions = sessions.filter((s) => isSameDay(new Date(s.startedAt), new Date()));
  const todayTotalSeconds = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;
    const ok = startTimer(selectedSubjectId, topic, notes);
    if (ok) {
      setTopic('');
      setNotes('');
    }
  };

  const handleFinish = () => {
    finishTimer();
  };

  const handleConfirmDiscard = () => {
    discardTimer();
    setShowDiscardConfirm(false);
  };

  const applyPreset = (presetName: string) => {
    if (!topic.trim()) {
      setTopic(presetName);
    } else {
      setTopic((prev) => `${prev} • ${presetName}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Timer Hero Card */}
      <div
        className={`relative overflow-hidden rounded-3xl p-8 sm:p-12 border transition-all duration-300 text-center flex flex-col items-center justify-center ${
          activeTimer
            ? isTimerRunning
              ? 'bg-gradient-to-b from-[#141226] via-[#10111a] to-[#0c0e14] border-brand-500/50 shadow-glow ring-4 ring-brand-500/10'
              : 'bg-[#11131a] border-amber-500/30 shadow-md ring-2 ring-amber-500/10'
            : 'bg-[#11131a] border-[#232836] shadow-sm'
        }`}
      >
        {/* Glow ambient background element */}
        {activeTimer && isTimerRunning && (
          <div className="absolute inset-0 bg-brand-600/5 blur-3xl pointer-events-none" />
        )}

        {/* Status Indicator */}
        <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase">
          {activeTimer ? (
            isTimerRunning ? (
              <span className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Sessão em Andamento
              </span>
            ) : (
              <span className="flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/25 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Cronômetro Pausado
              </span>
            )
          ) : (
            <span className="flex items-center gap-2 bg-[#161922] text-slate-400 border border-[#232836] px-3.5 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Pronto para Iniciar
            </span>
          )}
        </div>

        {/* Current Active Info */}
        {activeTimer && (
          <div className="mb-6 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#181c28] border border-[#2a3144] text-xs mb-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: activeSubject?.color || '#8b5cf6' }}
              />
              <span className="font-semibold text-slate-200">{activeSubject?.name}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words">
              {activeTimer.topic}
            </h3>
            {activeTimer.notes && (
              <p className="text-xs text-slate-400 mt-1.5 italic max-w-md mx-auto line-clamp-2">
                "{activeTimer.notes}"
              </p>
            )}
          </div>
        )}

        {/* Giant Digital Clock Display */}
        <div className="relative my-4 select-none">
          <div className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tight text-white drop-shadow-md">
            {formatSecondsToHMS(timerSeconds)}
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 z-10">
          {!activeTimer ? (
            <a
              href="#start-form"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-glow-sm hover:shadow-glow transition-all duration-200 cursor-pointer active:scale-[0.98] min-h-[44px]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Configurar e Iniciar Foco</span>
            </a>
          ) : (
            <>
              {/* Pause or Resume */}
              {isTimerRunning ? (
                <button
                  onClick={pauseTimer}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] min-h-[44px]"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pausar</span>
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] min-h-[44px]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Continuar</span>
                </button>
              )}

              {/* Finish Session */}
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-glow-sm transition-all duration-200 cursor-pointer active:scale-[0.98] min-h-[44px]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalizar e Salvar</span>
              </button>

              {/* Discard Session */}
              <button
                onClick={() => setShowDiscardConfirm(true)}
                className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-[#1c202c] hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-[#2a3042] font-semibold text-sm transition-all duration-200 cursor-pointer active:scale-[0.98] min-h-[44px]"
                title="Descartar sem salvar"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Descartar</span>
              </button>
            </>
          )}
        </div>

        {/* Discard Confirmation Prompt */}
        {showDiscardConfirm && (
          <div className="mt-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 max-w-md w-full animate-in fade-in">
            <p className="text-xs text-rose-200 font-medium mb-3">
              Tem certeza que deseja cancelar? O tempo decorrido não será salvo no histórico.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleConfirmDiscard}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer active:scale-[0.98] min-h-[36px]"
              >
                Sim, descartar
              </button>
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="px-4 py-2 rounded-lg bg-[#1c202c] hover:bg-[#252b3b] text-slate-300 text-xs font-medium cursor-pointer active:scale-[0.98] min-h-[36px]"
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Section: Start New Session (when inactive) */}
      {!activeTimer && (
        <div id="start-form" className="p-6 sm:p-8 rounded-3xl bg-[#11131a] border border-[#232836] shadow-sm">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Iniciar Nova Sessão de Foco
              </h3>
              <p className="text-xs text-slate-400">
                Preencha os detalhes do que vai estudar para acompanhar seu progresso no APREVO
              </p>
            </div>
          </div>

          {/* Quick Preset Focus Modes */}
          <div className="mb-5 p-3.5 rounded-2xl bg-[#161922] border border-[#232836]">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
              Modos Rápidos de Estudo (Clique para aplicar):
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset('Técnica Pomodoro (25m)')}
                className="px-3 py-1.5 rounded-xl bg-[#202534] hover:bg-brand-600/20 text-slate-300 hover:text-brand-300 text-xs font-medium border border-[#2b3346] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Pomodoro (25m)</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('Deep Work (50m)')}
                className="px-3 py-1.5 rounded-xl bg-[#202534] hover:bg-brand-600/20 text-slate-300 hover:text-brand-300 text-xs font-medium border border-[#2b3346] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5 text-brand-400" />
                <span>Deep Work (50m)</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('Ultra Focus (90m)')}
                className="px-3 py-1.5 rounded-xl bg-[#202534] hover:bg-brand-600/20 text-slate-300 hover:text-brand-300 text-xs font-medium border border-[#2b3346] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Ultra Focus (90m)</span>
              </button>
            </div>
          </div>

          {subjects.length === 0 ? (
            <div className="text-center py-6 bg-[#161922] rounded-2xl border border-dashed border-[#2d3447]">
              <p className="text-sm text-slate-300 font-medium">Você precisa cadastrar ao menos uma matéria.</p>
              <button
                onClick={() => setActiveTab('subjects')}
                className="mt-3 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 cursor-pointer"
              >
                Cadastrar Matérias
              </button>
            </div>
          ) : (
            <form onSubmit={handleStart} className="space-y-5">
              {/* Grid: Matéria e Conteúdo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select Matéria */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Matéria / Disciplina *
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      required
                      className="w-full px-3.5 py-3 rounded-xl bg-[#161922] border border-[#282f42] text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                    {selectedSubject && (
                      <span
                        className="absolute right-9 top-4 w-3 h-3 rounded-full pointer-events-none"
                        style={{ backgroundColor: selectedSubject.color }}
                      />
                    )}
                  </div>
                </div>

                {/* Input Conteúdo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Conteúdo ou Assunto *
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                    placeholder="Ex: Resolução de Exercícios, Leitura do Cap. 4..."
                    className="w-full px-3.5 py-3 rounded-xl bg-[#161922] border border-[#282f42] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              {/* Observações Opcionais */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Observações (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anotações prévias, metas da sessão ou referências de leitura..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#161922] border border-[#282f42] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!topic.trim()}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-glow-sm transition-all duration-200 cursor-pointer active:scale-[0.98] min-h-[44px]"
                >
                  Começar a Estudar Agora
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Sessões Concluídas Hoje */}
      <div className="p-6 rounded-3xl bg-[#11131a] border border-[#232836] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              Sessões Realizadas Hoje
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Total hoje:{' '}
              <span className="font-semibold text-brand-300">
                {formatSecondsToHuman(todayTotalSeconds)}
              </span>{' '}
              em {todaySessions.length} {todaySessions.length === 1 ? 'sessão' : 'sessões'}
            </p>
          </div>
        </div>

        {todaySessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Nenhuma sessão finalizada hoje ainda. Inicie o cronômetro para começar!
          </div>
        ) : (
          <div className="space-y-2.5">
            {todaySessions.map((s) => {
              const sub = subjects.find((sb) => sb.id === s.subjectId);
              return (
                <div
                  key={s.id}
                  className="p-3.5 rounded-xl bg-[#161922] border border-[#232836] flex items-center justify-between gap-4 card-hover"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: sub?.color || '#8b5cf6' }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{s.topic}</p>
                      <p className="text-[11px] text-slate-400">
                        {sub?.name || 'Geral'} • {formatTimeBR(s.startedAt)} até {formatTimeBR(s.endedAt)}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-brand-300 shrink-0">
                    {formatSecondsToHuman(s.durationSeconds)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
