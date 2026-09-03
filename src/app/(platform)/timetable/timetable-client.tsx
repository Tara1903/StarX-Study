'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  User, 
  BookOpen, 
  Printer, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Calendar,
  Layers,
  GraduationCap,
  ChevronRight,
  Coffee,
  Dumbbell,
  Library as LibraryIcon,
  FlaskConical,
  Search,
  Filter
} from 'lucide-react';
import { 
  ECE_SUBJECTS, 
  ECE_TIMETABLE_METADATA, 
  ECE_WEEKLY_SCHEDULE, 
  TIME_SLOTS, 
  ClassPeriod 
} from '@/lib/ece-data';

export function TimetableClient() {
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(-1);

  useEffect(() => {
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const day = new Date().getDay();
    setCurrentDayIndex(day);
  }, []);

  const daysList = [
    { key: 'ALL', label: 'All Days (Full Week)' },
    { key: 'Monday', label: 'Monday', short: 'MON', dayNum: 1 },
    { key: 'Tuesday', label: 'Tuesday', short: 'TUE', dayNum: 2 },
    { key: 'Wednesday', label: 'Wednesday', short: 'WED', dayNum: 3 },
    { key: 'Thursday', label: 'Thursday', short: 'THU', dayNum: 4 },
    { key: 'Friday', label: 'Friday', short: 'FRI', dayNum: 5 },
    { key: 'Saturday', label: 'Saturday', short: 'SAT', dayNum: 6 },
  ];

  const filteredSchedule = ECE_WEEKLY_SCHEDULE.filter(day => {
    if (selectedDay !== 'ALL' && day.day !== selectedDay) return false;
    return true;
  });

  const getPeriodTypeBadge = (type?: string) => {
    switch (type) {
      case 'lab':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20"><FlaskConical className="w-3 h-3" /> Lab</span>;
      case 'tutorial':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20"><BookOpen className="w-3 h-3" /> Tutorial</span>;
      case 'sports':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20"><Dumbbell className="w-3 h-3" /> Sports</span>;
      case 'library':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20"><LibraryIcon className="w-3 h-3" /> Library</span>;
      case 'lunch':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20"><Coffee className="w-3 h-3" /> Break</span>;
      case 'activity':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Session</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Theory</span>;
    }
  };

  const findSubjectId = (name: string) => {
    const found = ECE_SUBJECTS.find(s => 
      s.name.toLowerCase().includes(name.toLowerCase()) || 
      name.toLowerCase().includes(s.shortName.toLowerCase())
    );
    return found ? found.id : null;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] border border-white/10 p-6 md:p-8 shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>{ECE_TIMETABLE_METADATA.session} • w.e.f: {ECE_TIMETABLE_METADATA.effectiveDate}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              ECE Class Time Table
            </h1>

            <p className="text-sm md:text-base text-[#A8B2C2] leading-relaxed">
              <strong className="text-white">{ECE_TIMETABLE_METADATA.university}</strong> — {ECE_TIMETABLE_METADATA.institute} <br />
              <span className="text-[#12CFEA] font-medium">{ECE_TIMETABLE_METADATA.department}</span> • {ECE_TIMETABLE_METADATA.program} ({ECE_TIMETABLE_METADATA.semester})
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#CBD5E1]">
              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 font-medium">
                📍 {ECE_TIMETABLE_METADATA.room}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 font-medium">
                ⏰ {ECE_TIMETABLE_METADATA.shift} (08:30 AM - 04:30 PM)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 font-medium">
                🏫 Room No. 03
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium border border-white/15 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4 text-[#12CFEA]" />
              Print Time Table
            </button>
            <div className="flex items-center rounded-xl bg-[#0B132B] border border-white/10 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-primary text-white shadow' 
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                Table View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'cards' 
                    ? 'bg-primary text-white shadow' 
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                Day Cards
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs by Day */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-2">
          {daysList.map((d) => {
            const isToday = d.dayNum === currentDayIndex;
            const isSelected = selectedDay === d.key;

            return (
              <button
                key={d.key}
                onClick={() => setSelectedDay(d.key)}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-card hover:bg-card/80 text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                <span>{d.label}</span>
                {isToday && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                    isSelected ? 'bg-white text-primary' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW MODE: WEEKLY GRID */}
      {viewMode === 'grid' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-base text-foreground">Weekly Master Schedule (First Shift)</h2>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Theory Class
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Lab Work
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Lunch Break
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[900px]">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  <th className="p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider w-24 sticky left-0 bg-muted/95 z-10 border-r border-border backdrop-blur">
                    DAY
                  </th>
                  {TIME_SLOTS.map((slot) => (
                    <th 
                      key={slot.slot} 
                      className={`p-2.5 text-center border-r border-border last:border-r-0 min-w-[110px] ${
                        slot.isBreak ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <div className="text-[11px] font-bold text-foreground">{slot.time}</div>
                      <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                        {slot.label}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSchedule.map((dayItem) => {
                  const isToday = daysList.find(d => d.key === dayItem.day)?.dayNum === currentDayIndex;

                  return (
                    <tr 
                      key={dayItem.day} 
                      className={`transition-colors hover:bg-muted/30 ${
                        isToday ? 'bg-primary/5' : ''
                      }`}
                    >
                      {/* Day Header Column */}
                      <td className="p-3 font-bold text-sm text-foreground sticky left-0 bg-card z-10 border-r border-border">
                        <div className="flex flex-col">
                          <span className="text-foreground font-semibold">{dayItem.shortDay}</span>
                          <span className="text-[11px] text-muted-foreground font-normal">{dayItem.day}</span>
                          {isToday && (
                            <span className="inline-block mt-1 text-[9px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded w-fit">
                              Today
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Time Slot Columns */}
                      {TIME_SLOTS.map((slot) => {
                        const period = dayItem.periods.find(p => p.slot === slot.slot);

                        if (slot.isBreak) {
                          return (
                            <td 
                              key={slot.slot} 
                              className="p-2 text-center bg-amber-500/5 border-r border-border align-middle"
                            >
                              <div className="flex flex-col items-center justify-center py-2 text-amber-500/80">
                                <Coffee className="w-4 h-4 mb-1" />
                                <span className="text-[10px] font-bold tracking-widest uppercase">LUNCH</span>
                                <span className="text-[9px] text-muted-foreground">11:50-12:20</span>
                              </div>
                            </td>
                          );
                        }

                        if (!period) {
                          return (
                            <td 
                              key={slot.slot} 
                              className="p-2 text-center border-r border-border text-muted-foreground/30 text-xs font-mono"
                            >
                              -
                            </td>
                          );
                        }

                        const subjectId = findSubjectId(period.subjectName);

                        return (
                          <td 
                            key={slot.slot} 
                            colSpan={period.slotsSpan || 1}
                            className="p-2 border-r border-border align-top"
                          >
                            <div 
                              className="h-full min-h-[76px] p-2.5 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.02] hover:shadow-md"
                              style={{ 
                                backgroundColor: `${period.color || '#3B82F6'}15`,
                                borderColor: `${period.color || '#3B82F6'}40`,
                              }}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span 
                                    className="text-xs font-bold truncate"
                                    style={{ color: period.color || '#3B82F6' }}
                                  >
                                    {period.shortName}
                                  </span>
                                  {getPeriodTypeBadge(period.type)}
                                </div>
                                <div className="text-xs font-medium text-foreground line-clamp-1 leading-snug">
                                  {period.subjectName}
                                </div>
                              </div>

                              <div className="mt-2 pt-1 border-t border-white/5 flex flex-col text-[11px] text-muted-foreground">
                                {period.facultyName && (
                                  <span className="truncate text-foreground/80 font-medium">
                                    👨‍🏫 {period.facultyAbb || period.facultyName}
                                  </span>
                                )}
                                {period.room && (
                                  <span className="truncate text-[10px] text-muted-foreground">
                                    📍 {period.room}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE: CARDS */}
      {viewMode === 'cards' && (
        <div className="space-y-6">
          {filteredSchedule.map((dayItem) => {
            const isToday = daysList.find(d => d.key === dayItem.day)?.dayNum === currentDayIndex;

            return (
              <div 
                key={dayItem.day} 
                className={`bg-card border rounded-2xl p-6 shadow-sm space-y-4 ${
                  isToday ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                      {dayItem.shortDay}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                        {dayItem.day}
                        {isToday && (
                          <span className="text-xs font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Today's Schedule
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground">8 periods scheduled</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {dayItem.periods.map((period, idx) => {
                    const slotInfo = TIME_SLOTS.find(s => s.slot === period.slot);

                    return (
                      <div 
                        key={idx}
                        className="p-4 rounded-xl border flex flex-col justify-between transition-all hover:shadow-md"
                        style={{ 
                          backgroundColor: `${period.color || '#3B82F6'}10`,
                          borderColor: `${period.color || '#3B82F6'}35`,
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span className="font-mono font-semibold text-foreground flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              {slotInfo?.time || `Slot ${period.slot}`}
                            </span>
                            {getPeriodTypeBadge(period.type)}
                          </div>

                          <h4 
                            className="font-bold text-base mb-1"
                            style={{ color: period.color || '#3B82F6' }}
                          >
                            {period.subjectName}
                          </h4>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-background/50 border border-border inline-block mb-2">
                            {period.shortName}
                          </span>
                        </div>

                        <div className="mt-3 pt-3 border-t border-border/50 text-xs space-y-1 text-muted-foreground">
                          {period.facultyName && (
                            <div className="flex items-center gap-1.5 font-medium text-foreground/90">
                              <User className="w-3.5 h-3.5 text-primary" />
                              <span>{period.facultyName}</span>
                            </div>
                          )}
                          {period.room && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>{period.room}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FACULTY & SUBJECT DIRECTORY SECTION */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" />
              ECE Department Subjects & Faculty Directory
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Official faculty assigned to B.Tech I Semester (ECE) at IET, SAGE University
            </p>
          </div>
          <Link
            href="/subjects"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Go to My Subjects <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                <th className="p-3">Course Code</th>
                <th className="p-3">Subject Name</th>
                <th className="p-3">Short</th>
                <th className="p-3">Assigned Faculty</th>
                <th className="p-3">Faculty Abb</th>
                <th className="p-3">Credits</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {ECE_SUBJECTS.map((sub) => (
                <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-mono text-xs font-bold text-primary">
                    {sub.code}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: sub.color }}
                      />
                      <span className="font-semibold text-foreground">{sub.name}</span>
                    </div>
                  </td>
                  <td className="p-3 font-medium text-foreground">
                    <span className="px-2 py-0.5 rounded bg-muted text-xs font-mono">
                      {sub.shortName}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-foreground">
                    {sub.facultyName}
                  </td>
                  <td className="p-3 font-mono text-muted-foreground">
                    {sub.facultyAbb}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {sub.credits} Credits
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/subjects/${sub.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs font-semibold transition-all"
                    >
                      Open Subject
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Official Verification Footer */}
      <div className="bg-muted/30 border border-border rounded-2xl p-6 text-xs text-muted-foreground">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="space-y-1">
            <span className="font-bold text-foreground block">Prepared By</span>
            <p>{ECE_TIMETABLE_METADATA.preparedBy}</p>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-foreground block">Checked By</span>
            <p>{ECE_TIMETABLE_METADATA.checkedBy}</p>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-foreground block">Verified By</span>
            <p>{ECE_TIMETABLE_METADATA.verifiedBy}</p>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-foreground block">Head of Department</span>
            <p className="font-semibold text-foreground">{ECE_TIMETABLE_METADATA.department}</p>
            <p className="text-[11px]">{ECE_TIMETABLE_METADATA.institute}, {ECE_TIMETABLE_METADATA.university}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
