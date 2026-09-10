import React, { useState } from 'react';
import { CalendarEvent } from '../types.ts';
import {
  Calendar as CalendarIcon,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Grid,
  Layers,
  MapPin,
  Tag,
  Clock,
  X,
} from 'lucide-react';

interface CalendarSectionProps {
  events: CalendarEvent[];
  externalUrl?: string;
  title?: string;
  subtitle?: string;
  description?: string;
}

interface DayCell {
  day: number | null;
  dateStr: string | null;
  colIndex: number; // 1 to 7 for CSS grid
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({
  events,
  externalUrl = 'https://amazon-trail.ai.studio/activity/',
  title = '活動行事曆',
  subtitle = 'ACTIVITY CALENDAR',
  description,
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'year' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const activeEvents = events
    .filter((e) => e.enabled)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
    setSelectedEvent(null);
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
    setSelectedEvent(null);
  };

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayIndex = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const startDayOffset = getFirstDayIndex(year, month);

  // Construct weeks for multi-day spanning
  const totalSlots = Math.ceil((startDayOffset + daysInMonth) / 7) * 7;
  const weeks: DayCell[][] = [];
  let currentWeekCells: DayCell[] = [];

  for (let i = 0; i < totalSlots; i++) {
    const dayNum = i - startDayOffset + 1;
    const isValid = dayNum >= 1 && dayNum <= daysInMonth;
    const dateStr = isValid
      ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      : null;
    const colIndex = (i % 7) + 1;

    currentWeekCells.push({
      day: isValid ? dayNum : null,
      dateStr,
      colIndex,
    });

    if (currentWeekCells.length === 7) {
      weeks.push(currentWeekCells);
      currentWeekCells = [];
    }
  }

  // Check which events fall on or span across a specific date
  const getEventsForDate = (day: number) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return activeEvents.filter((ev) => ev.startDate <= dStr && ev.endDate >= dStr);
  };

  // Selected Day's events
  const selectedDayEvents = selectedDay ? getEventsForDate(selectedDay) : [];

  return (
    <section id="section-calendar" className="py-2 sm:py-3 scroll-mt-20">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-0.5">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{subtitle}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-100 tracking-wide">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-neutral-400 max-w-2xl">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 text-xs">
            <button
              id="calendar-mode-month-btn"
              onClick={() => {
                setViewMode('month');
                setSelectedDay(null);
                setSelectedEvent(null);
              }}
              className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'month' ? 'bg-emerald-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Grid className="w-3 h-3" />
              <span>月曆</span>
            </button>
            <button
              id="calendar-mode-year-btn"
              onClick={() => {
                setViewMode('year');
                setSelectedDay(null);
                setSelectedEvent(null);
              }}
              className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'year' ? 'bg-emerald-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>年度</span>
            </button>
            <button
              id="calendar-mode-list-btn"
              onClick={() => {
                setViewMode('list');
                setSelectedDay(null);
                setSelectedEvent(null);
              }}
              className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'list' ? 'bg-emerald-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ListFilter className="w-3 h-3" />
              <span>列表</span>
            </button>
          </div>

          <a
            id="calendar-open-external-btn"
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 hover:border-emerald-700 transition-colors"
          >
            <span>活動報名平台</span>
            <ExternalLink className="w-3 h-3 text-emerald-400" />
          </a>
        </div>
      </div>

      {/* VIEW 1: MULTI-DAY SPANNING MONTH CALENDAR */}
      {viewMode === 'month' && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 sm:p-4">
          {/* Month Navigator */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-800/80">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-neutral-200">
                {year} 年 {month + 1} 月
              </h3>
              <span className="text-[11px] text-neutral-400 hidden sm:inline-block font-mono">
                (多日行程跨欄顯示，點擊行程可查看詳情與報名)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevMonth}
                className="p-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                title="上一個月"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setCurrentDate(new Date(2026, 8, 1));
                  setSelectedDay(null);
                  setSelectedEvent(null);
                }}
                className="px-2 py-0.5 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors font-mono"
              >
                本月
              </button>
              <button
                onClick={nextMonth}
                className="p-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                title="下一個月"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers: 7 columns */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-neutral-400 mb-1 border-b border-neutral-800/60 pb-1">
            <div className="text-rose-400/90">日</div>
            <div>一</div>
            <div>二</div>
            <div>三</div>
            <div>四</div>
            <div>五</div>
            <div className="text-emerald-400/90">六</div>
          </div>

          {/* Week-by-Week Calendar with Multi-day Spanning Bars */}
          <div className="space-y-1.5">
            {weeks.map((week, weekIdx) => {
              // Find events that intersect this week
              const weekEvents = activeEvents
                .map((ev) => {
                  const matchingCells = week.filter(
                    (c) => c.dateStr && c.dateStr >= ev.startDate && c.dateStr <= ev.endDate
                  );
                  if (matchingCells.length === 0) return null;

                  const startCol = matchingCells[0].colIndex;
                  const endCol = matchingCells[matchingCells.length - 1].colIndex;
                  const spanDays = matchingCells.length;

                  const firstValidDate = week.find((c) => c.dateStr)?.dateStr;
                  const lastValidDate = week.slice().reverse().find((c) => c.dateStr)?.dateStr;

                  const hasPrev = firstValidDate ? ev.startDate < firstValidDate : false;
                  const hasNext = lastValidDate ? ev.endDate > lastValidDate : false;

                  return {
                    ev,
                    startCol,
                    endCol,
                    spanDays,
                    hasPrev,
                    hasNext,
                  };
                })
                .filter(Boolean) as Array<{
                  ev: CalendarEvent;
                  startCol: number;
                  endCol: number;
                  spanDays: number;
                  hasPrev: boolean;
                  hasNext: boolean;
                }>;

              return (
                <div
                  key={`week-${weekIdx}`}
                  className="bg-neutral-950/40 border border-neutral-800/80 rounded-lg p-1 transition-colors hover:border-neutral-700/80"
                >
                  {/* Row 1: Day numbers */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {week.map((cell, cIdx) => {
                      const isSelected = cell.day !== null && selectedDay === cell.day;
                      const dayEvents = cell.day ? getEventsForDate(cell.day) : [];
                      const hasEvents = dayEvents.length > 0;

                      return (
                        <div
                          key={`day-${cIdx}`}
                          onClick={() => {
                            if (cell.day) {
                              setSelectedDay(cell.day === selectedDay ? null : cell.day);
                              setSelectedEvent(null);
                            }
                          }}
                          className={`h-6 sm:h-7 px-1.5 flex items-center justify-between rounded cursor-pointer transition-colors text-xs font-mono select-none ${
                            cell.day === null
                              ? 'opacity-10 cursor-default'
                              : isSelected
                              ? 'bg-emerald-900/80 text-emerald-200 font-bold ring-1 ring-emerald-500'
                              : 'hover:bg-neutral-800/70 text-neutral-300'
                          }`}
                        >
                          <span
                            className={
                              cIdx === 0
                                ? 'text-rose-400/90'
                                : cIdx === 6
                                ? 'text-emerald-400/90'
                                : ''
                            }
                          >
                            {cell.day ?? ''}
                          </span>
                          {hasEvents && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Row 2+: Multi-day continuous event bars spanning across columns */}
                  {weekEvents.length > 0 && (
                    <div className="grid grid-cols-7 gap-1 pt-0.5">
                      {weekEvents.map(
                        ({ ev, startCol, endCol, spanDays, hasPrev, hasNext }) => {
                          const isSelected = selectedEvent?.id === ev.id;
                          return (
                            <div
                              key={`${ev.id}-wk-${weekIdx}`}
                              style={{
                                gridColumn: `${startCol} / ${endCol + 1}`,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(selectedEvent?.id === ev.id ? null : ev);
                                setSelectedDay(null);
                              }}
                              className={`h-6 px-2 rounded text-xs font-medium flex items-center justify-between gap-1.5 cursor-pointer transition-all shadow-sm truncate ${
                                isSelected
                                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 font-bold'
                                  : 'bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/70'
                              }`}
                              title={`${ev.title} (${ev.startDate} ~ ${ev.endDate})`}
                            >
                              <div className="flex items-center gap-1 truncate">
                                {hasPrev && (
                                  <span className="text-[10px] text-emerald-300 font-bold shrink-0">
                                    «
                                  </span>
                                )}
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                                <span className="truncate">{ev.title}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 text-[10px] font-mono">
                                {spanDays > 1 && (
                                  <span className="hidden sm:inline-block px-1 rounded bg-black/40 text-emerald-300">
                                    {spanDays}天
                                  </span>
                                )}
                                <span
                                  className={`px-1 py-0.2 rounded text-[10px] ${
                                    ev.status === 'full'
                                      ? 'bg-rose-950 text-rose-300'
                                      : 'bg-emerald-950 text-emerald-300'
                                  }`}
                                >
                                  {ev.status === 'full' ? '額滿' : '報名'}
                                </span>
                                {hasNext && (
                                  <span className="text-[10px] text-emerald-300 font-bold shrink-0">
                                    »
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Event Detail Drawer */}
          {selectedEvent && (
            <div className="mt-3 p-3 rounded-xl bg-neutral-950 border border-emerald-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 font-semibold">
                    {selectedEvent.category}
                  </span>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded ${
                      selectedEvent.status === 'full'
                        ? 'bg-rose-950 text-rose-300'
                        : 'bg-emerald-950 text-emerald-300'
                    }`}
                  >
                    {selectedEvent.status === 'full' ? '已額滿' : '開放報名中'}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    {selectedEvent.startDate} ~ {selectedEvent.endDate}
                  </span>
                </div>
                <h4 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  <span>{selectedEvent.title}</span>
                </h4>
                <div className="text-xs text-neutral-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-neutral-500" />
                  <span>集合地點／攀登區域：{selectedEvent.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <a
                  href={selectedEvent.url || externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-colors"
                >
                  <span>前往報名此行程</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  title="關閉"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Selected Day Event Drawer */}
          {selectedDay && !selectedEvent && (
            <div className="mt-3 p-3 rounded-xl bg-neutral-950 border border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs text-emerald-400 font-semibold mb-1">
                  {year} 年 {month + 1} 月 {selectedDay} 日
                  {selectedDayEvents.length === 0 && '（當日無排定活動）'}
                </div>
                {selectedDayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="text-sm font-bold text-neutral-100 flex items-center gap-2 mb-1 last:mb-0"
                  >
                    <span>{ev.title}</span>
                    <span className="text-xs font-normal text-neutral-400 font-mono">
                      ({ev.startDate} ~ {ev.endDate})
                    </span>
                    <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-emerald-300">
                      {ev.category}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {selectedDayEvents.length > 0 && (
                  <a
                    href={selectedDayEvents[0].url || externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white shrink-0"
                  >
                    <span>前往報名</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  title="關閉"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: COMPACT YEAR VIEW */}
      {viewMode === 'year' && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-neutral-200">{year} 年度活動總覽</h3>
            <div className="text-xs text-neutral-400 font-mono">
              共計 {activeEvents.length} 場高山遠征
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {Array.from({ length: 12 }).map((_, mIdx) => {
              const monthEvents = activeEvents.filter((ev) => {
                const sMonth = parseInt(ev.startDate.split('-')[1], 10) - 1;
                const eMonth = parseInt(ev.endDate.split('-')[1], 10) - 1;
                return mIdx >= sMonth && mIdx <= eMonth;
              });

              return (
                <div
                  key={`month-${mIdx}`}
                  onClick={() => {
                    setCurrentDate(new Date(year, mIdx, 1));
                    setViewMode('month');
                    setSelectedDay(null);
                    setSelectedEvent(null);
                  }}
                  className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-2.5 hover:border-emerald-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-200 mb-1.5">
                    <span>{mIdx + 1} 月</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-emerald-400">
                      {monthEvents.length} 場
                    </span>
                  </div>

                  <div className="space-y-1">
                    {monthEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[11px] text-neutral-400 truncate hover:text-emerald-300"
                        title={ev.title}
                      >
                        • {ev.title}
                      </div>
                    ))}
                    {monthEvents.length > 2 && (
                      <div className="text-[10px] text-neutral-500 font-mono">
                        + 尚有 {monthEvents.length - 2} 場...
                      </div>
                    )}
                    {monthEvents.length === 0 && (
                      <div className="text-[10px] text-neutral-600">無排定活動</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: COMPACT LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 sm:p-4">
          <div className="space-y-2">
            {activeEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-2.5 sm:p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-emerald-900 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs mb-1 font-mono">
                    <span className="text-emerald-400">{ev.startDate} ~ {ev.endDate}</span>
                    <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 text-[11px]">
                      {ev.category}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 rounded ${
                        ev.status === 'full'
                          ? 'bg-rose-950 text-rose-300'
                          : 'bg-emerald-950 text-emerald-300'
                      }`}
                    >
                      {ev.status === 'full' ? '額滿' : '報名中'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-neutral-100">{ev.title}</h4>
                  <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span>{ev.location}</span>
                  </div>
                </div>

                <a
                  href={ev.url || externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-neutral-800 hover:bg-emerald-800 text-neutral-200 hover:text-white border border-neutral-700 text-xs font-medium transition-colors shrink-0 self-start sm:self-center"
                >
                  <span>活動詳情與報名</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
