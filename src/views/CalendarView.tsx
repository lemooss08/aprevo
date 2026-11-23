import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StudySession } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Award,
  CheckCircle2,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import {
  formatDateBR,
  formatTimeBR,
  formatSecondsToHuman,
  isSameDay,
} from '../utils/formatters';
import { Modal } from '../components/Modal';

export const CalendarView: React.FC = () => {
  const { sessions, subjects, settings } = useApp();

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const days = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding days to complete 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Daily statistics map for the calendar
  const dayStats = useMemo(() => {
    const map = new Map<string, { totalSeconds: number; sessions: StudySession[]; goalMet: boolean }>();
    const dailyGoalSec = settings.dailyGoalMinutes * 60;

    sessions.forEach((sess) => {
      const d = new Date(sess.startedAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const entry = map.get(key) || { totalSeconds: 0, sessions: [], goalMet: false };
      entry.totalSeconds += sess.durationSeconds;
      entry.sessions.push(sess);
      entry.goalMet = entry.totalSeconds >= dailyGoalSec && dailyGoalSec > 0;
      map.set(key, entry);
    });

    return map;
  }, [sessions, settings.dailyGoalMinutes]);

  // Selected Day sessions
  const selectedDaySessions = useMemo(() => {
    if (!selectedDay) return [];
    return sessions.filter((s) => isSameDay(new Date(s.startedAt), selectedDay));
  }, [selectedDay, sessions]);

  const selectedDayTotalSec = selectedDaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);

  // Month summary metrics
  const monthSessions = useMemo(() => {
    return sessions.filter((s) => {
      const d = new Date(s.startedAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [sessions, year, month]);

  const monthTotalSec = monthSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const activeDaysInMonth = new Set(monthSessions.map((s) => new Date(s.startedAt).getDate())).size;

  const getSubject = (id: string) => subjects.find((s) => s.id === id);

  const weekDayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="space-y-6">
      {/* Top Controls & Navigation */}
      <div className="p-5 rounded-3xl bg-[#11131a] border border-[#232836] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white capitalize tracking-tight">
              {monthName} de {year}
            </h2>
            <p className="text-xs text-slate-400">
              {activeDaysInMonth} dias estudados • {formatSecondsToHuman(monthTotalSec)} acumulados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl bg-[#161922] hover:bg-[#202534] text-slate-300 text-xs font-semibold border border-[#282f42] transition-colors"
          >
            Hoje
          </button>
          <div className="flex items-center rounded-xl bg-[#161922] border border-[#282f42] p-0.5">
            <button
              onClick={prevMonth}
              aria-label="Mês anterior"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#202534] transition-colors"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              aria-label="Próximo mês"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#202534] transition-colors"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#11131a] border border-[#232836] shadow-md">
        {/* Week Day Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
          {weekDayLabels.map((day, idx) => (
            <div key={idx} className="py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((item, idx) => {
            const key = `${item.date.getFullYear()}-${item.date.getMonth()}-${item.date.getDate()}`;
            const stats = dayStats.get(key);
            const isToday = isSameDay(item.date, new Date());
            const hasStudy = stats && stats.totalSeconds > 0;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDay(item.date)}
                aria-label={`Dia ${item.date.getDate()}${hasStudy ? `, ${formatSecondsToHuman(stats.totalSeconds)} estudados` : ''}`}
                className={`relative min-h-[72px] sm:min-h-[96px] p-2 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  !item.isCurrentMonth
                    ? 'opacity-30 bg-[#0e1017] border-[#1c202c]'
                    : hasStudy
                    ? 'bg-[#151724] border-brand-500/30 hover:border-brand-500 hover:shadow-glow-sm'
                    : 'bg-[#11131a] border-[#202534] hover:bg-[#161922]'
                } ${isToday ? 'ring-2 ring-brand-500' : ''}`}
              >
                {/* Day Number + Goal Trophy */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isToday
                        ? 'text-brand-300 px-1.5 py-0.5 rounded-md bg-brand-500/20'
                        : item.isCurrentMonth
                        ? 'text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    {item.date.getDate()}
                  </span>

                  {stats?.goalMet && (
                    <span title="Meta diária batida!" className="text-emerald-400 text-xs">
                      🏆
                    </span>
                  )}
                </div>

                {/* Day Study Info */}
                {hasStudy && (
                  <div className="mt-1">
                    <span className="block text-[11px] font-mono font-bold text-brand-300">
                      {formatSecondsToHuman(stats.totalSeconds)}
                    </span>

                    {/* Subject Dots */}
                    <div className="flex items-center gap-1 mt-1 overflow-hidden">
                      {stats.sessions.slice(0, 3).map((sess, sIdx) => {
                        const sColor = getSubject(sess.subjectId)?.color || '#8b5cf6';
                        return (
                          <span
                            key={sIdx}
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: sColor }}
                          />
                        );
                      })}
                      {stats.sessions.length > 3 && (
                        <span className="text-[9px] text-slate-500 font-mono">
                          +{stats.sessions.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Modal */}
      <Modal
        isOpen={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? `Estudos de ${formatDateBR(selectedDay.toISOString())}` : 'Detalhes do Dia'}
        description={
          selectedDaySessions.length > 0
            ? `${selectedDaySessions.length} sessão(ões) realizada(s) • Total: ${formatSecondsToHuman(selectedDayTotalSec)}`
            : 'Nenhuma sessão registrada nesta data.'
        }
      >
        <div className="space-y-3">
          {selectedDaySessions.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Sem atividades registradas neste dia.
            </p>
          ) : (
            selectedDaySessions.map((sess) => {
              const sub = getSubject(sess.subjectId);
              return (
                <div
                  key={sess.id}
                  className="p-3.5 rounded-xl bg-[#161922] border border-[#232836] flex items-start gap-3"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: sub?.color || '#8b5cf6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{sess.topic}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {sub?.name || 'Geral'} • {formatTimeBR(sess.startedAt)} até {formatTimeBR(sess.endedAt)}
                    </p>
                    {sess.notes && (
                      <p className="text-xs text-slate-300 mt-1 italic line-clamp-2">"{sess.notes}"</p>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-brand-300 shrink-0">
                    {formatSecondsToHuman(sess.durationSeconds)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </div>
  );
};
