import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Clock,
  Calendar as CalendarIcon,
  Layers,
  Award,
  Play,
  ArrowUpRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  FolderKanban,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  formatSecondsToHuman,
  formatSecondsToHMS,
  formatDateBR,
  isSameDay,
  getStartOfWeek,
} from '../utils/formatters';

interface DashboardViewProps {
  onOpenNewStudy: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenNewStudy }) => {
  const { sessions, subjects, settings, accountName, setActiveTab } = useApp();

  const now = new Date();
  const startOfWeek = getStartOfWeek(now);

  // Previous week start & end for comparison
  const prevWeekStart = new Date(startOfWeek);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(startOfWeek);

  // Today stats
  const todaySessions = sessions.filter((s) => isSameDay(new Date(s.startedAt), now));
  const todaySeconds = todaySessions.reduce((acc, curr) => acc + curr.durationSeconds, 0);

  // Week stats
  const weekSessions = sessions.filter((s) => new Date(s.startedAt) >= startOfWeek);
  const weekSeconds = weekSessions.reduce((acc, curr) => acc + curr.durationSeconds, 0);

  // Previous week stats for percentage comparison
  const prevWeekSessions = sessions.filter((s) => {
    const d = new Date(s.startedAt);
    return d >= prevWeekStart && d < prevWeekEnd;
  });
  const prevWeekSeconds = prevWeekSessions.reduce((acc, curr) => acc + curr.durationSeconds, 0);

  const weekGrowth = prevWeekSeconds > 0
    ? Math.round(((weekSeconds - prevWeekSeconds) / prevWeekSeconds) * 100)
    : weekSeconds > 0
    ? 100
    : 0;

  // Total stats
  const totalSeconds = sessions.reduce((acc, curr) => acc + curr.durationSeconds, 0);
  const totalSessionsCount = sessions.length;

  // Daily Goal calculation
  const dailyGoalSeconds = settings.dailyGoalMinutes * 60;
  const goalPercentage = dailyGoalSeconds > 0 ? Math.min(100, Math.round((todaySeconds / dailyGoalSeconds) * 100)) : 0;
  const goalMet = todaySeconds >= dailyGoalSeconds && dailyGoalSeconds > 0;

  // 7-day chart data
  const last7DaysData = Array.from({ length: 7 }).map((_, index) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - index));
    d.setHours(0, 0, 0, 0);

    const dayName = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d);
    const dayDate = `${d.getDate()}/${d.getMonth() + 1}`;

    const daySessions = sessions.filter((s) => isSameDay(new Date(s.startedAt), d));
    const daySec = daySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const dayHours = Number((daySec / 3600).toFixed(2));

    return {
      name: `${dayName[0].toUpperCase() + dayName.slice(1, 3)} (${dayDate})`,
      shortName: dayName.slice(0, 3),
      horas: dayHours,
      minutos: Math.round(daySec / 60),
    };
  });

  // Top Subject
  const topSubject = (() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => map.set(s.subjectId, (map.get(s.subjectId) || 0) + s.durationSeconds));
    let bestId = '';
    let maxSec = 0;
    map.forEach((sec, id) => {
      if (sec > maxSec) {
        maxSec = sec;
        bestId = id;
      }
    });
    const sub = subjects.find((s) => s.id === bestId);
    return {
      name: sub?.name || 'Nenhuma',
      color: sub?.color || '#8b5cf6',
      totalFormatted: formatSecondsToHuman(maxSec),
    };
  })();

  // Recent 5 sessions
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 5);

  const getSubject = (id: string) => subjects.find((s) => s.id === id);

  return (
    <div className="space-y-6">
      {/* Hero Banner: Boas-vindas APREVO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-950 via-[#262626] to-[#232323] border border-brand-500/25 p-6 sm:p-8 shadow-glow-sm">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/25 text-brand-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Organização • Evolução • Conhecimento</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Bem-vindo, {accountName ?? settings.userName}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
              Você já estudou <span className="text-brand-300 font-bold">{formatSecondsToHuman(todaySeconds)}</span> hoje.
              {weekGrowth >= 0 ? (
                <span className="text-emerald-400 font-semibold ml-1">
                  ↑ +{weekGrowth}% em relação à semana passada.
                </span>
              ) : (
                <span className="text-amber-400 font-semibold ml-1">
                  ↓ {weekGrowth}% em relação à semana passada.
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('timer')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs sm:text-sm shadow-glow-sm hover:shadow-glow transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Cronômetro</span>
            </button>
            <button
              onClick={onOpenNewStudy}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#303030] hover:bg-[#3c3c3c] text-slate-200 border border-[#464646] font-semibold text-xs sm:text-sm transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>Registrar</span>
            </button>
          </div>
        </div>

        {/* Ambient decorative glow */}
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Onboarding Callout if 0 subjects */}
      {subjects.length === 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#262626] border border-brand-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-glow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Cadastre sua primeira matéria</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Para começar a registrar seus tempos e usar o cronômetro, crie as disciplinas que você está estudando.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('subjects')}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 dark:hover:bg-brand-500 text-[#fff] text-xs font-bold transition-all shadow-sm whitespace-nowrap active:scale-[0.98]"
          >
            + Criar Primeira Matéria
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Hoje */}
        <div className="p-5 rounded-2xl bg-[#222222] border border-[#383838] card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tempo Hoje</span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {formatSecondsToHMS(todaySeconds)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {todaySessions.length} {todaySessions.length === 1 ? 'sessão realizada' : 'sessões realizadas'}
            </p>
          </div>
        </div>

        {/* Card 2: Esta Semana */}
        <div className="p-5 rounded-2xl bg-[#222222] border border-[#383838] card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Esta Semana</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {formatSecondsToHuman(weekSeconds)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {weekSessions.length} sessões nesta semana
            </p>
          </div>
        </div>

        {/* Card 3: Total Acumulado */}
        <div className="p-5 rounded-2xl bg-[#222222] border border-[#383838] card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total de Horas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {(totalSeconds / 3600).toFixed(1)}h
            </div>
            <p className="text-xs text-slate-400 mt-1">{totalSessionsCount} sessões no APREVO</p>
          </div>
        </div>

        {/* Card 4: Matéria Principal */}
        <div className="p-5 rounded-2xl bg-[#222222] border border-[#383838] card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Disciplina Líder</span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${topSubject.color}25`, color: topSubject.color }}
            >
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-base font-bold text-white tracking-tight truncate">
              {topSubject.name}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {topSubject.name === 'Nenhuma' ? 'Sem registros' : `${topSubject.totalFormatted} estudados`}
            </p>
          </div>
        </div>
      </div>

      {/* Meta Diária Barra Visual */}
      <div className="p-6 rounded-2xl bg-[#222222] border border-[#383838]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Meta Diária de Estudos
              {goalMet && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  Concluída 🚀
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {formatSecondsToHuman(todaySeconds)} estudados de {formatSecondsToHuman(dailyGoalSeconds)} planejados
            </p>
          </div>
          <span className="text-base font-bold font-mono text-brand-300">{goalPercentage}%</span>
        </div>

        {/* Animated Progress Track */}
        <div className="w-full h-3 rounded-full bg-[#303030] overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              goalMet
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-brand-600 via-brand-500 to-violet-400 shadow-glow-sm'
            }`}
            style={{ width: `${Math.min(100, Math.max(todaySeconds > 0 ? 3 : 0, goalPercentage))}%` }}
          />
        </div>
      </div>

      {/* 2-Columns: Chart 7 Days + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#222222] border border-[#383838] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Tempo de Estudo (Últimos 7 dias)</h3>
              <p className="text-xs text-slate-400">Horas dedicadas diariamente</p>
            </div>
            <button
              onClick={() => setActiveTab('stats')}
              className="text-xs font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              Ver estatísticas
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="aprevoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#323232" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#383838' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#383838' }}
                  tickFormatter={(val) => `${val}h`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-[#1e1e1e] border border-[#383838] rounded-xl text-xs">
                          <p className="font-semibold text-white mb-1">{data.name}</p>
                          <p className="text-brand-300 font-mono font-medium">
                            {data.horas}h ({data.minutos} min)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="horas"
                  fill="url(#aprevoGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Recent Activities */}
        <div className="p-6 rounded-2xl bg-[#222222] border border-[#383838] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Atividades Recentes</h3>
              <button
                onClick={() => setActiveTab('studies')}
                className="text-xs font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                Ver todos
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentSessions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xs text-slate-500">Nenhuma sessão registrada ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => {
                  const sub = getSubject(session.subjectId);
                  const subColor = sub?.color || '#8b5cf6';

                  return (
                    <div
                      key={session.id}
                      className="p-3 rounded-xl bg-[#2c2c2c] border border-[#383838] hover:border-[#4c4c4c] transition-all flex items-start gap-3"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: subColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{session.topic}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {sub?.name || 'Matéria geral'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-brand-300">
                          {formatSecondsToHuman(session.durationSeconds)}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {formatDateBR(session.startedAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#383838] flex items-center gap-2">
            <button
              onClick={() => setActiveTab('calendar')}
              className="flex-1 py-2 rounded-xl bg-[#2c2c2c] hover:bg-[#343434] text-slate-300 text-xs font-medium text-center transition-colors border border-[#414141]"
            >
              Abrir Calendário
            </button>
            <button
              onClick={() => setActiveTab('timer')}
              className="flex-1 py-2 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 text-xs font-semibold text-center transition-colors border border-brand-500/30"
            >
              Estudar Agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
