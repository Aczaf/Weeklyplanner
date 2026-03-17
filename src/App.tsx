import React, { useState, useMemo, useEffect } from 'react';
import { 
  format, 
  addWeeks, 
  subWeeks, 
  startOfWeek, 
  addDays, 
  isSameDay,
  startOfDay,
  setHours,
  setMinutes,
  addMinutes
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Constants
const SLOTS_PER_HOUR = 3;
const MINUTES_PER_SLOT = 20;
const TOTAL_SLOTS = 24 * SLOTS_PER_HOUR;

interface Task {
  id: string;
  date: Date;
  startSlot: number;
  endSlot: number;
  title: string;
  description?: string;
  color: string;
}

const COLORS = [
  { name: 'Work', value: 'bg-blue-500', hex: '#3b82f6' },
  { name: 'Study', value: 'bg-emerald-500', hex: '#10b981' },
  { name: 'Health', value: 'bg-rose-500', hex: '#f43f5e' },
  { name: 'Relax', value: 'bg-amber-500', hex: '#f59e0b' },
  { name: 'Social', value: 'bg-purple-500', hex: '#a855f7' },
  { name: 'Personal', value: 'bg-pink-500', hex: '#ec4899' },
  { name: 'Other', value: 'bg-indigo-500', hex: '#6366f1' },
];

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selection, setSelection] = useState<{ date: Date; slot: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingTask, setPendingTask] = useState<{ date: Date; startSlot: number; endSlot: number } | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskColor, setTaskColor] = useState(COLORS[0].value);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  // New Features State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(new Date());
  const [showStats, setShowStats] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showYearView, setShowYearView] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date());

  // Update "Now" line every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Persistence: Load tasks and theme
  useEffect(() => {
    const savedTasks = localStorage.getItem('weekly-planner-tasks');
    const savedTheme = localStorage.getItem('weekly-planner-theme');
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        setTasks(parsed.map((t: any) => ({ ...t, date: new Date(t.date) })));
      } catch (e) { console.error(e); }
    }
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('weekly-planner-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('weekly-planner-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // Calculate statistics for the current week
  const stats = useMemo(() => {
    const weekTasks = tasks.filter(t => weekDays.some(d => isSameDay(t.date, d)));
    const totals: Record<string, number> = {};
    weekTasks.forEach(t => {
      const duration = (t.endSlot - t.startSlot + 1) * 20;
      totals[t.color] = (totals[t.color] || 0) + duration;
    });
    return COLORS.map(c => ({
      ...c,
      minutes: totals[c.value] || 0,
      hours: ((totals[c.value] || 0) / 60).toFixed(1)
    })).filter(s => s.minutes > 0);
  }, [tasks, weekDays]);

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setViewMonth(today);
    setShowDatePicker(false);
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    setViewMonth(date);
    setShowDatePicker(false);
  };

  const handlePrevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  const getSlotTime = (slotIndex: number) => {
    const hours = Math.floor(slotIndex / SLOTS_PER_HOUR);
    const minutes = (slotIndex % SLOTS_PER_HOUR) * MINUTES_PER_SLOT;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleSlotClick = (date: Date, slot: number) => {
    if (!selection) {
      setSelection({ date, slot });
    } else {
      if (isSameDay(selection.date, date)) {
        const start = Math.min(selection.slot, slot);
        const end = Math.max(selection.slot, slot);
        setPendingTask({ date, startSlot: start, endSlot: end });
        setEditingTaskId(null); // Ensure we're creating a new task
        setModalOpen(true);
      }
      setSelection(null);
    }
  };

  const handleTaskClick = (task: Task) => {
    setEditingTaskId(task.id);
    setPendingTask({ date: task.date, startSlot: task.startSlot, endSlot: task.endSlot });
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskColor(task.color);
    setModalOpen(true);
  };

  const saveTask = () => {
    if (pendingTask && taskTitle.trim()) {
      if (editingTaskId) {
        setTasks(tasks.map(t => t.id === editingTaskId ? {
          ...t,
          title: taskTitle,
          description: taskDesc,
          color: taskColor
        } : t));
      } else {
        const newTask: Task = {
          id: Math.random().toString(36).substr(2, 9),
          ...pendingTask,
          title: taskTitle,
          description: taskDesc,
          color: taskColor,
        };
        setTasks([...tasks, newTask]);
      }
      closeModal();
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setPendingTask(null);
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskColor(COLORS[0].value);
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Calculate position of the "Now" indicator
  const nowPosition = useMemo(() => {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return (hours * 60 + minutes) * (60 / 60); // 1 minute = 1px since 1 hour (60min) = 60px
  }, [now]);

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (showYearView) {
    const year = currentDate.getFullYear();
    const daysInYear = Array.from({ length: 366 }, (_, i) => {
      const d = new Date(year, 0, 1 + i);
      return d.getFullYear() === year ? d : null;
    }).filter(Boolean) as Date[];

    return (
      <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className={`h-8 sm:h-0 transition-colors ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`} />
        <header className={`sticky top-0 z-30 border-b px-4 md:px-6 py-4 flex items-center justify-between shadow-sm transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowYearView(false)}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight italic">{year} Journey</h1>
              <p className="text-[10px] opacity-50 font-black uppercase tracking-widest">Yearly Achievement Timeline</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-2xl border text-xs font-black ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              {tasks.length} Tasks Completed
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto space-y-2">
            {daysInYear.map((day, idx) => {
              const dayTasks = tasks.filter(t => isSameDay(t.date, day));
              const isToday = isSameDay(day, new Date());
              
              return (
                <div 
                  key={idx} 
                  onClick={() => { setCurrentDate(day); setShowYearView(false); }}
                  className={`group flex items-center gap-4 p-3 rounded-2xl transition-all cursor-pointer border ${isToday ? (isDarkMode ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-indigo-50 border-indigo-200') : (isDarkMode ? 'bg-slate-900/40 border-slate-800/50 hover:bg-slate-800/60' : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm')}`}
                >
                  <div className="w-16 md:w-20 flex flex-col items-center justify-center border-r border-slate-500/10 pr-4">
                    <span className="text-[10px] font-black uppercase opacity-30">{format(day, 'MMM')}</span>
                    <span className={`text-lg font-black leading-none ${isToday ? 'text-indigo-500' : ''}`}>{format(day, 'dd')}</span>
                  </div>
                  
                  <div className="flex-1 flex items-center gap-1 overflow-hidden h-8">
                    {dayTasks.length > 0 ? (
                      dayTasks.sort((a, b) => a.startSlot - b.startSlot).map(task => (
                        <div 
                          key={task.id}
                          title={task.title}
                          className={`h-full rounded-lg ${task.color} min-w-[20px] flex-1 max-w-[150px] transition-transform group-hover:scale-[1.02] shadow-sm border border-white/10`}
                        />
                      ))
                    ) : (
                      <div className="w-full h-1 bg-slate-500/5 rounded-full" />
                    )}
                  </div>

                  <div className="w-12 text-right">
                    <span className={`text-[10px] font-black ${dayTasks.length > 0 ? 'text-indigo-500' : 'opacity-10'}`}>
                      {dayTasks.length > 0 ? `${dayTasks.length}nd` : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Safe Area Spacer for Mobile Notches */}
      <div className={`h-8 sm:h-0 transition-colors ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`} />
      
      {/* Header */}
      <header className={`sticky top-0 z-30 border-b px-4 md:px-6 py-3 flex items-center justify-between shadow-sm transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-lg shadow-indigo-500/20">
            <CalendarIcon size={20} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tight">Weekly Planner</h1>
            <p className="text-[10px] opacity-50 font-medium uppercase tracking-widest">Efficiency Pro</p>
          </div>
          
          {/* Mobile Search Toggle */}
          <div className="md:hidden ml-2">
            <button 
              onClick={() => setSearchQuery(searchQuery ? '' : ' ')} 
              className={`p-2 rounded-full ${searchQuery ? 'bg-indigo-500/10 text-indigo-500' : 'opacity-50'}`}
            >
              <svg size={18} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
          </div>
        </div>

        {/* Search Bar (Desktop & Active Mobile) */}
        <div className={`flex-1 max-w-xs mx-4 ${searchQuery.length > 0 ? 'block' : 'hidden md:block'}`}>
          <div className="relative">
            <input 
              type="text"
              placeholder="Search tasks..."
              value={searchQuery.trim()}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-1.5 rounded-full text-sm border transition-all focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40">
              <svg size={14} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={handleToday}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-indigo-400' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'}`}
          >
            <span className="hidden xs:inline">Today</span>
            <span className="xs:hidden">T</span>
          </button>
          <button 
            onClick={() => { setShowDatePicker(!showDatePicker); setViewMonth(currentDate); }}
            className={`p-2 rounded-full transition-all ${showDatePicker ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : (isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}
          >
            <CalendarIcon size={18} />
          </button>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {isDarkMode ? <svg size={18} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg> : <svg size={18} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>}
          </button>
          <button 
            onClick={() => setShowStats(!showStats)}
            className={`p-2 rounded-full transition-all ${showStats ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : (isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}
          >
            <svg size={18} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
          </button>
          <div className={`h-6 w-[1px] mx-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <button onClick={handlePrevWeek} className="p-1.5 hover:bg-indigo-500/10 rounded-md transition-all"><ChevronLeft size={20} /></button>
          <button onClick={handleNextWeek} className="p-1.5 hover:bg-indigo-500/10 rounded-md transition-all"><ChevronRight size={20} /></button>
        </div>
      </header>

      {/* Date Picker Overlay */}
      <AnimatePresence>
        {showDatePicker && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowDatePicker(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: -20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, y: -20, filter: 'blur(10px)' }}
              className={`fixed top-[80px] sm:top-[90px] right-4 z-40 p-5 rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border backdrop-blur-xl transition-colors ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <button onClick={handlePrevMonth} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                    <ChevronLeft size={18} />
                  </button>
                  <h4 className="font-black text-xs uppercase tracking-[0.2em] opacity-60 min-w-[100px] text-center">
                    {format(viewMonth, 'MMMM yyyy')}
                  </h4>
                  <button onClick={handleNextMonth} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                    <ChevronRight size={18} />
                  </button>
                </div>
                <button 
                  onClick={() => { setShowYearView(true); setShowDatePicker(false); }}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                >
                  Year View
                </button>
                <button 
                  onClick={handleToday}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                >
                  Today
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
                  <div key={d} className="w-9 h-9 flex items-center justify-center text-[10px] font-black opacity-20">{d}</div>
                ))}
                {Array.from({ length: 35 }).map((_, i) => {
                  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
                  const startOfGrid = startOfWeek(monthStart, { weekStartsOn: 1 });
                  const date = addDays(startOfGrid, i);
                  const isSelected = isSameDay(date, currentDate);
                  const isToday = isSameDay(date, new Date());
                  const isCurrentMonth = date.getMonth() === viewMonth.getMonth();
                  
                  return (
                    <button
                      key={i}
                      onClick={() => handleDateSelect(date)}
                      className={`w-9 h-9 rounded-2xl text-xs font-bold transition-all flex items-center justify-center relative group
                        ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-110 z-10' : (isToday ? 'text-indigo-500 bg-indigo-500/10' : (isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'))}
                        ${!isCurrentMonth && !isSelected ? 'opacity-20' : ''}
                      `}
                    >
                      {format(date, 'd')}
                      {tasks.some(t => isSameDay(t.date, date)) && !isSelected && (
                        <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-indigo-400 opacity-50" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Stats Panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`overflow-hidden border-b ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-indigo-50/30 border-slate-200'}`}
          >
            <div className="p-6 max-w-4xl mx-auto">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-60">Weekly Insights</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                {stats.length > 0 ? stats.map(s => (
                  <div key={s.value} className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`w-2 h-2 rounded-full mb-2 ${s.value}`} />
                    <div className="text-[10px] font-bold opacity-50 uppercase">{s.name}</div>
                    <div className="text-lg font-black tracking-tighter">{s.hours}h</div>
                  </div>
                )) : (
                  <div className="col-span-full text-center py-4 opacity-40 text-sm italic">No data for this week yet.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <div className="min-w-[800px] md:min-w-[1000px] relative">
            {/* Sticky Days Header */}
            <div className={`sticky top-0 z-20 grid grid-cols-[60px_repeat(7,1fr)] md:grid-cols-[80px_repeat(7,1fr)] border-b backdrop-blur-md transition-colors ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200'}`}>
              <div className="p-2 md:p-4 border-r border-transparent flex items-center justify-center">
                <Clock size={16} className="text-slate-400" />
              </div>
              {weekDays.map((day, i) => (
                <div key={i} className={`p-2 md:p-4 text-center border-r last:border-r-0 transition-colors ${isDarkMode ? 'border-slate-800' : 'border-slate-200'} ${isSameDay(day, new Date()) ? (isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50/50') : ''}`}>
                  <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-sm md:text-lg font-black ${isSameDay(day, new Date()) ? 'text-indigo-500' : (isDarkMode ? 'text-slate-300' : 'text-slate-700')}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid Body */}
            <div className="relative grid grid-cols-[60px_repeat(7,1fr)] md:grid-cols-[80px_repeat(7,1fr)] h-[1440px]">
              {/* Time Labels */}
              <div className={`border-r transition-colors shadow-[4px_0_12px_rgba(0,0,0,0.02)] z-10 ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className={`h-[60px] border-b text-[10px] md:text-xs font-black flex items-start justify-center pt-1.5 transition-colors ${isDarkMode ? 'border-slate-800/50 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{h.toString().padStart(2, '0')}</span>
                    <span className="opacity-30 ml-0.5">00</span>
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {weekDays.map((day, dayIdx) => (
                <div key={dayIdx} className={`relative border-r last:border-r-0 transition-colors ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                  {/* Background Slots */}
                  {Array.from({ length: TOTAL_SLOTS }).map((_, slotIdx) => (
                    <div 
                      key={slotIdx}
                      onClick={() => handleSlotClick(day, slotIdx)}
                      className={`h-[20px] border-b cursor-pointer transition-colors
                        ${isDarkMode ? 'border-slate-900/50' : 'border-slate-50'}
                        ${slotIdx % SLOTS_PER_HOUR === SLOTS_PER_HOUR - 1 ? (isDarkMode ? 'border-b-slate-800' : 'border-b-slate-200') : ''}
                        ${selection && isSameDay(selection.date, day) && selection.slot === slotIdx ? (isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-100') : (isDarkMode ? 'hover:bg-slate-900' : 'hover:bg-slate-50')}
                      `}
                    />
                  ))}

                  {/* Current Time Indicator Line */}
                  {isSameDay(day, now) && (
                    <div 
                      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                      style={{ top: `${nowPosition}px` }}
                    >
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 shadow-lg shadow-rose-500/50" 
                      />
                      <div className="flex-1 h-[2px] bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                    </div>
                  )}

                  {/* Tasks */}
                  {filteredTasks.filter(t => isSameDay(t.date, day)).map(task => (
                    <motion.div
                      layoutId={task.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={task.id}
                      onClick={(e) => { e.stopPropagation(); handleTaskClick(task); }}
                      className={`absolute left-0.5 right-0.5 md:left-1 md:right-1 rounded-lg p-1.5 md:p-2 text-white text-[10px] md:text-xs font-bold shadow-lg overflow-hidden group/task z-10 border border-white/10 cursor-pointer hover:brightness-110 transition-all ${task.color}`}
                      style={{
                        top: `${task.startSlot * 20}px`,
                        height: `${(task.endSlot - task.startSlot + 1) * 20}px`,
                      }}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="truncate leading-tight drop-shadow-sm">{task.title}</span>
                      </div>
                      <div className="text-[8px] md:text-[9px] font-medium opacity-90 mt-0.5 flex items-center gap-1">
                        <Clock size={8} /> {getSlotTime(task.startSlot)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className={`relative rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}
            >
              <div className={`p-5 md:p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <h2 className="text-lg md:text-xl font-black">{editingTaskId ? 'Edit Schedule' : 'Create Schedule'}</h2>
                <button onClick={closeModal} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                  <X size={20} className="opacity-40" />
                </button>
              </div>

              <div className="p-5 md:p-6 space-y-5 md:space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Task Title</label>
                  <input 
                    autoFocus
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="What's the plan?"
                    className={`w-full px-4 py-3 rounded-2xl border transition-all focus:ring-2 focus:ring-indigo-500 outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Notes (Optional)</label>
                  <textarea 
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Add some details..."
                    rows={2}
                    className={`w-full px-4 py-3 rounded-2xl border transition-all focus:ring-2 focus:ring-indigo-500 outline-none resize-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Time & Category</label>
                  <div className={`flex items-center gap-3 p-4 rounded-2xl ${isDarkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                    <Clock size={18} />
                    <div className="flex-1">
                      <div className="text-xs font-bold">{pendingTask && format(pendingTask.date, 'EEEE, MMM d')}</div>
                      <div className="text-[10px] opacity-70">{pendingTask && `${getSlotTime(pendingTask.startSlot)} - ${getSlotTime(pendingTask.endSlot + 1)}`}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Category Color</label>
                  <div className="grid grid-cols-4 gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setTaskColor(color.value)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all border ${taskColor === color.value ? (isDarkMode ? 'bg-indigo-500/20 border-indigo-500' : 'bg-indigo-50 border-indigo-500') : (isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-100 hover:bg-slate-50')}`}
                      >
                        <div className={`w-8 h-8 rounded-xl shadow-sm ${color.value} flex items-center justify-center`}>
                          {taskColor === color.value && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className={`text-[9px] font-bold truncate w-full text-center ${taskColor === color.value ? 'text-indigo-500' : 'opacity-60'}`}>{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`p-5 md:p-6 flex flex-col sm:flex-row gap-3 ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                {editingTaskId && (
                  <button 
                    onClick={() => { deleteTask(editingTaskId); closeModal(); }}
                    className={`px-4 py-3 font-bold rounded-2xl transition-colors bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 order-3 sm:order-1`}
                  >
                    Delete
                  </button>
                )}
                <div className="flex flex-1 gap-3 order-1 sm:order-2">
                  <button 
                    onClick={closeModal}
                    className={`flex-1 px-4 py-3 font-bold rounded-2xl transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveTask}
                    disabled={!taskTitle.trim()}
                    className="flex-1 px-4 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-xl shadow-indigo-500/20 transition-all"
                  >
                    {editingTaskId ? 'Save Changes' : 'Confirm'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
