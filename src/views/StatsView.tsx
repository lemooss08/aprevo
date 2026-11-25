import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Clock,
  Flame,
  Award,
  Layers,
  Calendar,
  TrendingUp,
  PieChart as PieIcon,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  formatSecondsToHuman,
  formatDateBR,
  isSameDay,
} from '../utils/formatters';

export const StatsView: React.FC = () => {
  const { sessions, subjects } = useApp();

  const [activeTabMetric, setActiveTabMetric] = useState<'weekly' | 'monthly'>('weekly');

  // Total seconds & sessions
  const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalSessions = sessions.length;

  // Most productive day & daily average calculation
  const { mostProductiveDayStr, dailyAverageFormatted, dayStatsMap } = useMemo(() => {
    if (sessions.length === 0) {
      return {
        mostProductiveDayStr: 'Nenhum',
        dailyAverageFormatted: '0h',
        dayStatsMap: new Map<string, number>(),
      };
    }

    const dayMap = new Map<string, number>();
    let earliest = new Date();
    const now = new Date();

    sessions.forEach((s) => {
      const d = new Date(s.startedAt);
      if (d < earliest) earliest = d;
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      dayMap.set(key, (dayMap.get(key) || 0) + s.durationSeconds);
    });

    // Find best day
    let bestKey = '';
    let maxSec = 0;
    dayMap.forEach((sec, key) => {
      if (sec > maxSec) {
        maxSec = sec;
        bestKey = key;
      }
    });

    let bestFormatted = 'Nenhum';
    if (bestKey) {
      const [year, month, day] = bestKey.split('-');
      bestFormatted = `${day}/${month}/${year} (${formatSecondsToHuman(maxSec)})`;
    }

    // Days span for average
    const diffDays = Math.max(1, Math.ceil((now.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)));
    const avgSec = Math.round(totalSeconds / diffDays);

    return {
      mostProductiveDayStr: bestFormatted,
      dailyAverageFormatted: formatSecondsToHuman(avgSec),
      dayStatsMap: dayMap,
    };
  }, [sessions, totalSeconds]);

  // Top Subject
  const topSubjectInfo = useMemo(() => {
    if (subjects.length === 0 || sessions.length === 0) return { name: 'Nenhuma', time: '0h' };

    const map = new Map<string, number>();
    sessions.forEach((s) => {
      map.set(s.subjectId, (map.get(s.subjectId) || 0) + s.durationSeconds);
    });

    let bestId = '';
    let maxSec = 0;
    map.forEach((sec, id) => {
      if (sec > maxSec) {
        maxSec = sec;
        bestId = id;
      }
    });

    const subject = subjects.find((s) => s.id === bestId);
    return {
      name: subject?.name || 'Geral',
      time: formatSecondsToHuman(maxSec),
      color: subject?.color || '#8b5cf6',
    };
  }, [sessions, subjects]);

  // Subject distribution data for Pie/Donut Chart
  const subjectChartData = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => {
      map.set(s.subjectId, (map.get(s.subjectId) || 0) + s.durationSeconds);
    });

    return subjects
      .map((sub) => {
        const sec = map.get(sub.id) || 0;
        return {
          name: sub.name,
          value: Number((sec / 3600).toFixed(2)),
          minutes: Math.round(sec / 60),
          color: sub.color,
        };
      })
      .filter((item) => item.value > 0);
  }, [sessions, subjects]);

  // Weekly Evolution Chart Data (last 4 weeks)
  const weeklyChartData = useMemo(() => {
    const weeks = [];
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - (i * 7 + 6));
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 7);

      const weekSessions = sessions.filter((s) => {
        const d = new Date(s.startedAt);
        return d >= start && d < end;
      });

      const totalSec = weekSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
      weeks.push({
        name: i === 0 ? 'Semana Atual' : `Semana -${i}`,
        horas: Number((totalSec / 3600).toFixed(1)),
        minutos: Math.round(totalSec / 60),
      });
    }

    return weeks;
  }, [sessions]);

  // Monthly Evolution Chart Data (last 6 months)
  const monthlyChartData = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthSessions = sessions.filter((s) => {
        const sDate = new Date(s.startedAt);
        return sDate >= d && sDate < nextMonth;
      });

      const totalSec = monthSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
      const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(d);

      months.push({
        name: monthName[0].toUpperCase() + monthName.slice(1, 3),
        horas: Number((totalSec / 3600).toFixed(1)),
        minutos: Math.round(totalSec / 60),
      });
    }

    return months;
  }, [sessions]);

  // GitHub-like Contribution Heatmap Data
  // Last 16 weeks (112 days)
  const heatmapData = useMemo(() => {
    const totalDays = 112; // 16 weeks * 7 days
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the end date: adjust to the current Saturday/Sunday
    const currentDayOfWeek = today.getDay(); // 0 is Sunday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (totalDays - 1 - (6 - currentDayOfWeek)));

    for (let i = 0; i < totalDays; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);

      const key = `${cellDate.getFullYear()}-${(cellDate.getMonth() + 1).toString().padStart(2, '0')}-${cellDate.getDate().toString().padStart(2, '0')}`;
      const sec = dayStatsMap.get(key) || 0;
      const min = Math.round(sec / 60);

      // Intensity level: 0 (none), 1 (1-45 min), 2 (46-90 min), 3 (91-180 min), 4 (>180 min)
      let level = 0;
      if (min > 180) level = 4;
      else if (min > 90) level = 3;
      else if (min > 45) level = 2;
      else if (min > 0) level = 1;

      days.push({
        date: cellDate,
        dateStr: formatDateBR(cellDate.toISOString()),
        minutes: min,
        seconds: sec,
        level,
        isToday: isSameDay(cellDate, today),
      });
    }

    return days;
  }, [dayStatsMap]);

  return (
    <div className="space-y-6">
      {/* KPI Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total horas */}
        <div className="p-5 rounded-2xl bg-[#222222] border border-[#383838]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Dedicado</span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {(totalSeconds / 3600).toFixed(1)}h
            </div>
            <p className="text-xs text-slate-400 mt-1">{totalSessions} sessões concluídas</p>
          </div>
        </div>

        {/* Média diária */}
        <div className="p-5 rounded-2xl bg-[#222222] border border-[#383838]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Média Diária</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {dailyAverageFormatted}
            </div>
            <p className="text-xs text-slate-400 mt-1">Estimado desde o início</p>
          </div>
        </div>

        {/* Dia mais produtivo */}
        <div className="p-5 rounded-2xl bg-[#222222] border border-[#383838]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Dia Mais Produtivo</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-base font-bold text-white tracking-tight truncate">
              {mostProductiveDayStr}
            </div>
            <p className="text-xs text-slate-400 mt-1">Recorde pessoal de foco</p>
          </div>
        </div>

        {/* Matéria Top */}
        <div className="p-5 rounded-2xl bg-[#222222] border border-[#383838]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Matéria Mais Estudada</span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${topSubjectInfo.color}25`, color: topSubjectInfo.color }}
            >
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-base font-bold text-white tracking-tight truncate">
              {topSubjectInfo.name}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {topSubjectInfo.time} dedicadas a esta disciplina
            </p>
          </div>
        </div>
      </div>

      {/* GitHub-like Contribution Heatmap */}
      <div className="p-6 rounded-2xl bg-[#222222] border border-[#383838]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-400" />
              Mapa de Constância de Estudos (Últimas 16 Semanas)
            </h3>
            <p className="text-xs text-slate-400">
              Visualização de intensidade por dias com sessões registradas
            </p>
          </div>

          {/* Intensity Legend */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Menos</span>
            <span className="w-3 h-3 rounded-sm bg-[#2c2c2c] border border-[#383838]" />
            <span className="w-3 h-3 rounded-sm bg-[#3b1979]" />
            <span className="w-3 h-3 rounded-sm bg-[#6d28d9]" />
            <span className="w-3 h-3 rounded-sm bg-[#8b5cf6]" />
            <span className="w-3 h-3 rounded-sm bg-[#c4b5fd]" />
            <span>Mais</span>
          </div>
        </div>

        {/* Heatmap Grid Container */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-[680px]">
            {heatmapData.map((day, idx) => {
              const bgColors = [
                'bg-[#2c2c2c] border border-[#383838]/60', // 0
                'bg-[#3b1979]', // 1
                'bg-[#6d28d9]', // 2
                'bg-[#8b5cf6]', // 3
                'bg-[#c4b5fd]', // 4
              ];

              return (
                <div
                  key={idx}
                  title={`${day.dateStr}: ${day.minutes} min estudados`}
                  className={`w-3.5 h-3.5 rounded-sm transition-transform hover:scale-125 cursor-pointer relative ${
                    bgColors[day.level]
                  } ${day.isToday ? 'ring-1 ring-white' : ''}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 2-Columns: Subject Distribution & Temporal Evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Donut Chart - Matérias */}
        <div className="p-6 rounded-2xl bg-[#222222] border border-[#383838] flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-brand-400" />
              Distribuição por Matéria
            </h3>
            <p className="text-xs text-slate-400">Proporção de horas dedicadas por matéria</p>
          </div>

          {subjectChartData.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              Sem dados suficientes para gerar o gráfico.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {subjectChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#222222" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-[#1e1e1e] border border-[#383838] rounded-xl text-xs">
                            <p className="font-semibold text-white">{data.name}</p>
                            <p className="text-brand-300 font-mono mt-0.5">
                              {data.value}h ({data.minutes} min)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right Column: Bar Chart - Evolução Semanal / Mensal */}
        <div className="p-6 rounded-2xl bg-[#222222] border border-[#383838] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-brand-400" />
                Evolução Temporal
              </h3>
              <p className="text-xs text-slate-400">Acompanhe seu volume de estudo</p>
            </div>

            {/* Toggle Weekly vs Monthly */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#2c2c2c] border border-[#414141] text-xs">
              <button
                onClick={() => setActiveTabMetric('weekly')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTabMetric === 'weekly'
                    ? 'button-primary font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semanas
              </button>
              <button
                onClick={() => setActiveTabMetric('monthly')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTabMetric === 'monthly'
                    ? 'button-primary font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Meses
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeTabMetric === 'weekly' ? weeklyChartData : monthlyChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#323232" vertical={false} />
                <XAxis
                  dataKey="name"
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
                  tickFormatter={(v) => `${v}h`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-[#1e1e1e] border border-[#383838] rounded-xl text-xs">
                          <p className="font-semibold text-white">{data.name}</p>
                          <p className="text-brand-300 font-mono mt-0.5">
                            {data.horas}h ({data.minutos} min)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="horas" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
