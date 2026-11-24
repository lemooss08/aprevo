import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Target,
  Award,
  Flame,
  CheckCircle2,
  Sparkles,
  Trophy,
  Zap,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  formatSecondsToHuman,
  isSameDay,
  getStartOfWeek,
} from '../utils/formatters';

export const GoalsView: React.FC = () => {
  const { settings, updateSettings, sessions } = useApp();

  const [dailyMinutesInput, setDailyMinutesInput] = useState<number>(settings.dailyGoalMinutes);
  const [weeklyMinutesInput, setWeeklyMinutesInput] = useState<number>(settings.weeklyGoalMinutes);

  const now = new Date();
  const startOfWeek = getStartOfWeek(now);

  // Today progress
  const todaySessions = sessions.filter((s) => isSameDay(new Date(s.startedAt), now));
  const todaySeconds = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const dailyGoalSeconds = settings.dailyGoalMinutes * 60;
  const dailyPct = dailyGoalSeconds > 0 ? Math.min(100, Math.round((todaySeconds / dailyGoalSeconds) * 100)) : 0;
  const isDailyGoalAchieved = todaySeconds >= dailyGoalSeconds && dailyGoalSeconds > 0;

  // Week progress
  const weekSessions = sessions.filter((s) => new Date(s.startedAt) >= startOfWeek);
  const weekSeconds = weekSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const weeklyGoalSeconds = settings.weeklyGoalMinutes * 60;
  const weeklyPct = weeklyGoalSeconds > 0 ? Math.min(100, Math.round((weekSeconds / weeklyGoalSeconds) * 100)) : 0;
  const isWeeklyGoalAchieved = weekSeconds >= weeklyGoalSeconds && weeklyGoalSeconds > 0;

  const todayKey = now.toDateString();
  const currentStreak = useMemo(() => {
    const studyDays = new Set(sessions.map((session) => new Date(session.startedAt).toDateString()));
    const checkDate = new Date(todayKey);
    if (!studyDays.has(todayKey)) checkDate.setDate(checkDate.getDate() - 1);

    let streak = 0;
    while (studyDays.has(checkDate.toDateString())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  }, [sessions, todayKey]);

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      dailyGoalMinutes: Math.max(1, dailyMinutesInput),
      weeklyGoalMinutes: Math.max(1, weeklyMinutesInput),
    });
  };

  // Achievements
  const totalHours = sessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 3600;
  const achievements = [
    {
      title: 'Primeiro Passo',
      desc: 'Completou a primeira sessão de estudos',
      unlocked: sessions.length >= 1,
      icon: Zap,
    },
    {
      title: 'Meta Batida',
      desc: 'Cumpriu a meta diária estabelecida',
      unlocked: isDailyGoalAchieved,
      icon: Target,
    },
    {
      title: 'Constância de Foco',
      desc: 'Alcançou 3 dias consecutivos de estudo',
      unlocked: currentStreak >= 3 || sessions.length >= 5,
      icon: Flame,
    },
    {
      title: 'Dedicação Sólida',
      desc: 'Acumulou mais de 10 horas de estudo no aplicativo',
      unlocked: totalHours >= 10,
      icon: Trophy,
    },
    {
      title: 'Mestre da Rotina',
      desc: 'Alcançou mais de 25 sessões registradas',
      unlocked: sessions.length >= 25,
      icon: Award,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Streak and Overview */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#18122c] via-[#12141f] to-[#10121a] border border-brand-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-glow-sm">
            <Flame className="w-8 h-8 fill-amber-400/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {currentStreak} {currentStreak === 1 ? 'Dia' : 'Dias'}
              </span>
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Sequência Ativa
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Estude todos os dias para manter o hábito e desbloquear conquistas.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400">Total geral acumulado</span>
          <p className="text-xl font-bold font-mono text-brand-300 mt-0.5">
            {totalHours.toFixed(1)} Horas Estudadas
          </p>
        </div>
      </div>

      {/* 2-Columns: Daily & Weekly Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meta Diária Card */}
        <div className="p-6 rounded-3xl bg-[#11131a] border border-[#232836] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Meta Diária</h4>
                  <p className="text-xs text-slate-400">Progresso de hoje</p>
                </div>
              </div>

              {isDailyGoalAchieved ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Concluída
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-brand-300">{dailyPct}%</span>
              )}
            </div>

            <div className="my-5">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {formatSecondsToHuman(todaySeconds)}
                </span>
                <span className="text-xs text-slate-400">
                  de {formatSecondsToHuman(dailyGoalSeconds)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 rounded-full bg-[#1c202c] overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isDailyGoalAchieved
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : 'bg-gradient-to-r from-brand-600 to-violet-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(todaySeconds > 0 ? 3 : 0, dailyPct))}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 pt-3 border-t border-[#232836]">
            {isDailyGoalAchieved
              ? 'Parabéns! Você já superou sua meta de hoje. Continue se desejar!'
              : `Faltam ${Math.max(0, Math.round((dailyGoalSeconds - todaySeconds) / 60))} minutos para completar a meta diária.`}
          </p>
        </div>

        {/* Meta Semanal Card */}
        <div className="p-6 rounded-3xl bg-[#11131a] border border-[#232836] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Meta Semanal</h4>
                  <p className="text-xs text-slate-400">Progresso da semana</p>
                </div>
              </div>

              {isWeeklyGoalAchieved ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Concluída
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-blue-300">{weeklyPct}%</span>
              )}
            </div>

            <div className="my-5">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {formatSecondsToHuman(weekSeconds)}
                </span>
                <span className="text-xs text-slate-400">
                  de {formatSecondsToHuman(weeklyGoalSeconds)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 rounded-full bg-[#1c202c] overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isWeeklyGoalAchieved
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(weekSeconds > 0 ? 3 : 0, weeklyPct))}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 pt-3 border-t border-[#232836]">
            {isWeeklyGoalAchieved
              ? 'Incrível! Meta semanal conquistada com louvor.'
              : `Faltam ${formatSecondsToHuman(Math.max(0, weeklyGoalSeconds - weekSeconds))} para a meta semanal.`}
          </p>
        </div>
      </div>

      {/* Adjust Goals Form */}
      <div className="p-6 rounded-3xl bg-[#11131a] border border-[#232836]">
        <h4 className="text-base font-bold text-white mb-1">Ajustar Metas de Estudo</h4>
        <p className="text-xs text-slate-400 mb-5">
          Defina tempos desafiadores e sustentáveis de acordo com a sua rotina diária
        </p>

        <form onSubmit={handleSaveGoals} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Meta Diária (Minutos)
            </label>
            <div className="relative">
              <input
                type="number"
                min={10}
                max={1440}
                step={5}
                value={dailyMinutesInput}
                onChange={(e) => setDailyMinutesInput(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#161922] border border-[#282f42] text-sm text-white focus:outline-none focus:border-brand-500"
              />
              <span className="absolute right-3.5 top-3 text-xs text-slate-500 font-medium">
                ({(dailyMinutesInput / 60).toFixed(1)}h)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Meta Semanal (Minutos)
            </label>
            <div className="relative">
              <input
                type="number"
                min={30}
                max={10080}
                step={30}
                value={weeklyMinutesInput}
                onChange={(e) => setWeeklyMinutesInput(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#161922] border border-[#282f42] text-sm text-white focus:outline-none focus:border-brand-500"
              />
              <span className="absolute right-3.5 top-3 text-xs text-slate-500 font-medium">
                ({(weeklyMinutesInput / 60).toFixed(1)}h)
              </span>
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm transition-all"
            >
              Salvar Novas Metas
            </button>
          </div>
        </form>
      </div>

      {/* Conquistas & Marcos */}
      <div className="p-6 rounded-3xl bg-[#11131a] border border-[#232836]">
        <h4 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Marcos & Conquistas
        </h4>
        <p className="text-xs text-slate-400 mb-5">
          Conquistas desbloqueadas automaticamente conforme você estuda
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                  item.unlocked
                    ? 'bg-[#151924] border-brand-500/30'
                    : 'bg-[#11131a] border-[#202534] opacity-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.unlocked
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-bold text-white">{item.title}</h5>
                    {item.unlocked && (
                      <span className="text-[10px] text-emerald-400 font-semibold">✓</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
