import React, { useState, useMemo } from 'react';
import { Course, DayOfWeek } from '../types';
import { useApp } from '../context/AppContext';
import { DAYS_OF_WEEK } from '../data/mockData';
import {
  Clock,
  MapPin,
  User,
  Plus,
  Building2,
  Calendar as CalendarIcon,
  Layers,
  Info,
  ChevronLeft,
  ChevronRight,
  Check,
  CalendarDays,
  Table2,
  CalendarOff,
  Edit3,
} from 'lucide-react';
import { CourseModal } from './CourseModal';
import { DataActionToolbar } from './DataActionToolbar';

const TIME_SLOTS = [
  { hour: 9, label: '09:00' },
  { hour: 10, label: '10:00' },
  { hour: 11, label: '11:00' },
  { hour: 12, label: '12:00' },
  { hour: 13, label: '13:00' },
  { hour: 14, label: '14:00' },
  { hour: 15, label: '15:00' },
  { hour: 16, label: '16:00' },
  { hour: 17, label: '17:00' },
  { hour: 18, label: '18:00' },
];

const HOUR_HEIGHT = 76; // px per hour

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

interface PositionedCourse {
  course: Course;
  colIndex: number;
  totalColumns: number;
  top: number;
  height: number;
}

function computeSimultaneousPositions(dayCourses: Course[]): PositionedCourse[] {
  if (dayCourses.length === 0) return [];

  const sorted = [...dayCourses].sort((a, b) => {
    const diff = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    if (diff !== 0) return diff;
    return timeToMinutes(b.endTime) - timeToMinutes(a.endTime);
  });

  const clusters: Course[][] = [];
  let currentCluster: Course[] = [];
  let clusterEndMin = 0;

  sorted.forEach(course => {
    const startMin = timeToMinutes(course.startTime);
    const endMin = timeToMinutes(course.endTime);

    if (currentCluster.length === 0) {
      currentCluster.push(course);
      clusterEndMin = endMin;
    } else if (startMin < clusterEndMin) {
      currentCluster.push(course);
      clusterEndMin = Math.max(clusterEndMin, endMin);
    } else {
      clusters.push(currentCluster);
      currentCluster = [course];
      clusterEndMin = endMin;
    }
  });

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const result: PositionedCourse[] = [];

  clusters.forEach(cluster => {
    const columns: Course[][] = [];

    cluster.forEach(course => {
      const cStart = timeToMinutes(course.startTime);
      const cEnd = timeToMinutes(course.endTime);

      let placedCol = -1;
      for (let i = 0; i < columns.length; i++) {
        const hasOverlap = columns[i].some(existing => {
          const eStart = timeToMinutes(existing.startTime);
          const eEnd = timeToMinutes(existing.endTime);
          return Math.max(cStart, eStart) < Math.min(cEnd, eEnd);
        });

        if (!hasOverlap) {
          placedCol = i;
          columns[i].push(course);
          break;
        }
      }

      if (placedCol === -1) {
        placedCol = columns.length;
        columns.push([course]);
      }

      const [startH, startM] = course.startTime.split(':').map(Number);
      const startOffsetHours = (startH - 9) + (startM / 60);
      const top = Math.max(0, startOffsetHours * HOUR_HEIGHT);
      const height = Math.max(52, (course.durationHours || 1) * HOUR_HEIGHT - 4);

      result.push({
        course,
        colIndex: placedCol,
        totalColumns: 0,
        top,
        height,
      });
    });

    const totalColsInCluster = columns.length;
    cluster.forEach(c => {
      const item = result.find(r => r.course.id === c.id);
      if (item) {
        item.totalColumns = totalColsInCluster;
      }
    });
  });

  return result;
}

const JS_DAY_TO_KR: Record<number, DayOfWeek | null> = {
  0: null, // 일요일
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
};

function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const TimetableView: React.FC = () => {
  const {
    courses,
    role,
    instructors,
    students,
    programs,
    selectedProgramId,
    setSelectedProgramId,
    selectedStudentId,
    setSelectedStudentId,
    selectedInstructorId,
    setSelectedInstructorId,
    getStudentEnrolledCourses,
    getCourseEnrollmentCount,
    isStudentEnrolled,
    absences,
    setActiveTab,
  } = useApp();

  // View Mode: 'weekly' (표 방식) | 'google_weekly' (구글 주간 캘린더) | 'google_monthly' (구글 월간 캘린더) | 'classroom' (강의실 트랙)
  const [viewType, setViewType] = useState<'weekly' | 'google_weekly' | 'google_monthly' | 'classroom'>('weekly');
  const [filterMode, setFilterMode] = useState<'all' | 'my' | 'instructor'>('all');
  const [targetInstructorId, setTargetInstructorId] = useState<string>(selectedInstructorId);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedDayMobile, setSelectedDayMobile] = useState<DayOfWeek>('월');
  const [selectedDayClassroom, setSelectedDayClassroom] = useState<DayOfWeek>('월');
  const [mobileViewStyle, setMobileViewStyle] = useState<'day_list' | 'grid'>('day_list');

  // Google Calendar Date states (defaulting to Oct 2026)
  const [calendarBaseDate, setCalendarBaseDate] = useState<Date>(() => new Date(2026, 9, 26)); // Oct 26, 2026 (Monday)

  // Modal states
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  React.useEffect(() => {
    if (role === 'student') {
      setFilterMode('my');
    } else if (role === 'instructor') {
      setFilterMode('instructor');
      setTargetInstructorId(selectedInstructorId);
    } else {
      setFilterMode('all');
    }
  }, [role, selectedInstructorId]);

  // Compute displayed courses
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    if (selectedProgramId !== 'all') {
      result = result.filter(c => c.programId === selectedProgramId);
    }

    if (filterMode === 'my') {
      result = getStudentEnrolledCourses(selectedStudentId).filter(
        c => selectedProgramId === 'all' || c.programId === selectedProgramId
      );
    } else if (filterMode === 'instructor') {
      const activeInstId = role === 'instructor' ? selectedInstructorId : targetInstructorId;
      result = result.filter(c => c.instructorId === activeInstId);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(c => c.category === categoryFilter);
    }

    return result;
  }, [
    courses,
    selectedProgramId,
    filterMode,
    role,
    selectedStudentId,
    selectedInstructorId,
    targetInstructorId,
    categoryFilter,
    getStudentEnrolledCourses,
  ]);

  const allClassrooms = useMemo(() => {
    const roomSet = new Set(courses.map(c => c.room).filter(Boolean));
    return Array.from(roomSet).sort();
  }, [courses]);

  const positionedByDay = useMemo(() => {
    const map: Record<DayOfWeek, PositionedCourse[]> = {
      월: [], 화: [], 수: [], 목: [], 금: [], 토: [],
    };
    DAYS_OF_WEEK.forEach(day => {
      const dayCourses = filteredCourses.filter(c => c.day === day);
      map[day] = computeSimultaneousPositions(dayCourses);
    });
    return map;
  }, [filteredCourses]);

  const maxConcurrentCount = useMemo(() => {
    let maxCount = 1;
    DAYS_OF_WEEK.forEach(day => {
      positionedByDay[day].forEach(pos => {
        if (pos.totalColumns > maxCount) {
          maxCount = pos.totalColumns;
        }
      });
    });
    return maxCount;
  }, [positionedByDay]);

  const categories = useMemo(() => {
    const set = new Set(courses.map(c => c.category));
    return Array.from(set);
  }, [courses]);

  // Google Weekly Calendar dates (Monday to Saturday of current calendarBaseDate week)
  const weekDates = useMemo(() => {
    const d = new Date(calendarBaseDate);
    const dayOfWeek = d.getDay();
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMon);

    return DAYS_OF_WEEK.map((krDay, idx) => {
      const dateObj = new Date(monday);
      dateObj.setDate(monday.getDate() + idx);
      return {
        day: krDay,
        dateObj,
        ymd: formatYMD(dateObj),
        monthDayLabel: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
        dayNum: dateObj.getDate(),
      };
    });
  }, [calendarBaseDate]);

  // Google Monthly Calendar cells
  const monthCalendarCells = useMemo(() => {
    const year = calendarBaseDate.getFullYear();
    const month = calendarBaseDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay(); // 0 (Sun) ~ 6 (Sat)
    const totalDays = lastDay.getDate();

    const cells: {
      dateObj: Date;
      ymd: string;
      isCurrentMonth: boolean;
      dayNum: number;
      krDay: DayOfWeek | null;
    }[] = [];

    // Previous month padding
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      cells.push({
        dateObj: d,
        ymd: formatYMD(d),
        isCurrentMonth: false,
        dayNum: d.getDate(),
        krDay: JS_DAY_TO_KR[d.getDay()],
      });
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      cells.push({
        dateObj: d,
        ymd: formatYMD(d),
        isCurrentMonth: true,
        dayNum: day,
        krDay: JS_DAY_TO_KR[d.getDay()],
      });
    }

    // Next month padding to fill 35 or 42 cells
    const targetLen = cells.length > 35 ? 42 : 35;
    let nextDay = 1;
    while (cells.length < targetLen) {
      const d = new Date(year, month + 1, nextDay++);
      cells.push({
        dateObj: d,
        ymd: formatYMD(d),
        isCurrentMonth: false,
        dayNum: d.getDate(),
        krDay: JS_DAY_TO_KR[d.getDay()],
      });
    }

    return cells;
  }, [calendarBaseDate]);

  const navigateCalendar = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCalendarBaseDate(new Date(2026, 9, 30));
      return;
    }
    const next = new Date(calendarBaseDate);
    if (viewType === 'google_monthly') {
      next.setMonth(next.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      next.setDate(next.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCalendarBaseDate(next);
  };

  const openCourseDetail = (course: Course) => {
    setSelectedCourse(course);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedCourse(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* 1. Export & Import Action Bar */}
      <DataActionToolbar entityType="course" />

      {/* 2. All Filter & View Buttons Listed Visibly Side-by-Side */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        {/* Row 1: View Mode Buttons (Table vs Google Weekly vs Google Monthly vs Classroom) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500">
              1. 일정표 화면 보기 방식 선택 (나열된 버튼 중 선택한 뷰만 활성화):
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'weekly', label: '표 방식 주간 시간표 (동시과목 분할)', icon: Table2 },
                { id: 'google_weekly', label: '구글 주간 캘린더 뷰 (날짜·타임라인)', icon: CalendarIcon },
                { id: 'google_monthly', label: '구글 월간 캘린더 뷰 (월별 달력)', icon: CalendarDays },
                { id: 'classroom', label: '강의실별 트랙 보기', icon: Building2 },
              ].map((mode) => {
                const Icon = mode.icon;
                const active = viewType === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setViewType(mode.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {active ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5 text-indigo-500" />}
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>최대 동시 진행: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{maxConcurrentCount}과목</strong></span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('absence')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <CalendarOff className="w-3.5 h-3.5" />
              <span>결강신청방 이동</span>
            </button>

            {role === 'admin' && (
              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>신규 강의 개설</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: 5+ Training Programs Filter Buttons (Listed visibly) */}
        <div className="space-y-1.5 pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">
              2. 교육과정별 필터 (5개 기본 과정 + 추가 과정 · 클릭 시 해당 과정만 활성화):
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('programs')}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>과정 이름 변경 및 과정 추가하기</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedProgramId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedProgramId === 'all'
                  ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {selectedProgramId === 'all' && <Check className="w-3.5 h-3.5" />}
              <span>전체 과정 ({courses.length}과목)</span>
            </button>
            {programs.map(prog => {
              const active = selectedProgramId === prog.id;
              const cnt = courses.filter(c => c.programId === prog.id).length;
              return (
                <button
                  key={prog.id}
                  type="button"
                  onClick={() => setSelectedProgramId(prog.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  <span>{prog.name}</span>
                  <span className={`font-mono text-[10px] px-1 rounded ${active ? 'bg-indigo-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    {cnt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Target Filter Mode Buttons + Listed Instructor/Student Buttons */}
        <div className="space-y-2 pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-bold text-slate-500">
            3. 대상별 일정 필터 (전체 강좌 / 학생별 / 교관별 버튼 나열):
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: '전체 개설 강좌 보기' },
              { id: 'my', label: '학생별 신청 시간표 보기' },
              { id: 'instructor', label: '교관(강사)별 시간표 보기' },
            ].map(f => {
              const active = filterMode === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterMode(f.id as any)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* If Instructor mode selected, list all 9 instructors visibly side-by-side */}
          {filterMode === 'instructor' && (
            <div className="pt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mr-1">
                교관 선택:
              </span>
              {instructors.map(inst => {
                const currentInstId = role === 'instructor' ? selectedInstructorId : targetInstructorId;
                const active = currentInstId === inst.id;
                return (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => {
                      setTargetInstructorId(inst.id);
                      if (role === 'instructor') setSelectedInstructorId(inst.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      active
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    <span>{inst.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* If Student mode selected, list students visibly side-by-side */}
          {filterMode === 'my' && (
            <div className="pt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 mr-1">
                학생 선택:
              </span>
              {students.map(stud => {
                const active = selectedStudentId === stud.id;
                return (
                  <button
                    key={stud.id}
                    type="button"
                    onClick={() => setSelectedStudentId(stud.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      active
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    <span>{stud.name} ({stud.grade})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Row 4: Category Filter Buttons (Listed visibly instead of select dropdown) */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-slate-500">
            4. 전공 분야별 필터 (나열된 버튼 중 선택한 분야만 활성화):
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'all'
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {categoryFilter === 'all' && <Check className="w-3 h-3" />}
              <span>전체 분야</span>
            </button>
            {categories.map(cat => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                    active
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {active && <Check className="w-3 h-3" />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================================
          VIEW 1: GOOGLE CALENDAR MONTHLY VIEW (구글 캘린더 스타일 월간 달력 뷰)
         ===================================================================== */}
      {viewType === 'google_monthly' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          {/* Google Calendar Top Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => navigateCalendar('prev')}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateCalendar('today')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  오늘 (2026.10)
                </button>
                <button
                  type="button"
                  onClick={() => navigateCalendar('next')}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {calendarBaseDate.getFullYear()}년 {calendarBaseDate.getMonth() + 1}월
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600" />
                정규 강의일정
              </span>
              <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-600" />
                결강/휴강 일정
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
                보강 수업일정
              </span>
            </div>
          </div>

          {/* Days of Week Header (Sun ~ Sat) */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-center text-xs font-bold">
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div
                key={d}
                className={`py-2.5 border-r last:border-r-0 border-slate-200 dark:border-slate-800 ${
                  i === 0 ? 'text-rose-500' : i === 6 ? 'text-indigo-500' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {d}요일
              </div>
            ))}
          </div>

          {/* Month Calendar Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800">
            {monthCalendarCells.map((cell) => {
              const dayCourses = cell.krDay
                ? filteredCourses
                    .filter(c => c.day === cell.krDay)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                : [];

              const dayAbsences = absences.filter(a => a.absenceDate === cell.ymd && a.status !== 'rejected');
              const dayMakeups = absences.filter(a => a.makeupDate === cell.ymd && a.status !== 'rejected');
              const isToday = cell.ymd === '2026-10-30';

              return (
                <div
                  key={cell.ymd}
                  className={`min-h-[135px] p-2 transition-colors ${
                    cell.isCurrentMonth
                      ? 'bg-white dark:bg-slate-900'
                      : 'bg-slate-50/60 dark:bg-slate-950/50 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : cell.dateObj.getDay() === 0
                          ? 'text-rose-500'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    {dayCourses.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {dayCourses.length}강좌
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {/* Makeup classes on this date */}
                    {dayMakeups.map(mk => (
                      <div
                        key={`mk-${mk.id}`}
                        onClick={() => setActiveTab('absence')}
                        className="px-1.5 py-1 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950/90 border-l-2 border-emerald-600 text-emerald-900 dark:text-emerald-200 font-bold truncate cursor-pointer"
                        title={`[보강] ${mk.courseName} (${mk.makeupStartTime}~${mk.makeupEndTime})`}
                      >
                        [보강] {mk.makeupStartTime} {mk.courseName}
                      </div>
                    ))}

                    {/* Regular courses on this date */}
                    {dayCourses.map(course => {
                      const cancelled = dayAbsences.find(
                        a => a.courseId === course.id && a.type === 'instructor_cancel'
                      );
                      return (
                        <div
                          key={course.id}
                          onClick={() => openCourseDetail(course)}
                          className={`px-1.5 py-1 rounded text-[10px] border-l-2 cursor-pointer transition-transform hover:scale-[1.01] truncate ${
                            cancelled
                              ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-500 text-rose-700 dark:text-rose-300 line-through'
                              : `${course.color.bg} border-indigo-600 text-slate-800 dark:text-slate-100`
                          }`}
                          title={`${course.startTime}~${course.endTime} ${course.name} (${course.instructorName} · ${course.room})`}
                        >
                          <span className="font-mono font-bold mr-1">{course.startTime}</span>
                          <span className="font-semibold">{course.name}</span>
                          {cancelled && <span className="ml-1 font-bold text-rose-600">[결강]</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: GOOGLE CALENDAR WEEKLY VIEW (구글 캘린더 스타일 주간 타임라인 뷰)
         ===================================================================== */}
      {viewType === 'google_weekly' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          {/* Google Weekly Top Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => navigateCalendar('prev')}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateCalendar('today')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  이번 주 (10월 마지막 주)
                </button>
                <button
                  type="button"
                  onClick={() => navigateCalendar('next')}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                구글 주간 캘린더 ({weekDates[0].ymd} ~ {weekDates[5].ymd})
              </h3>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                실시간 타임라인 기준선
              </span>
              <span className="inline-flex items-center gap-1.5">
                날짜별 결강·보강 상태 실시간 연동
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[960px]">
              {/* Google Calendar Style Date Numbers Header */}
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="p-3 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center text-[11px] font-mono text-slate-400">
                  GMT+09
                </div>
                {weekDates.map(({ day, ymd, dayNum, dateObj }) => {
                  const isToday = ymd === '2026-10-30';
                  const dayAbsences = absences.filter(a => a.absenceDate === ymd && a.status !== 'rejected');
                  const dayMakeups = absences.filter(a => a.makeupDate === ymd && a.status !== 'rejected');

                  return (
                    <div
                      key={ymd}
                      className="p-3 border-r last:border-r-0 border-slate-200 dark:border-slate-800 text-center"
                    >
                      <div className={`text-xs font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                        {day}요일
                      </div>
                      <div
                        className={`mt-1 w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-mono font-bold ${
                          isToday
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {dateObj.getMonth() + 1}/{dayNum}
                      </div>
                      {(dayAbsences.length > 0 || dayMakeups.length > 0) && (
                        <div className="mt-1 flex flex-wrap justify-center gap-1">
                          {dayAbsences.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                              결강 {dayAbsences.length}건
                            </span>
                          )}
                          {dayMakeups.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                              보강 {dayMakeups.length}건
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Google Calendar Timeline Body */}
              <div className="relative grid grid-cols-7">
                {/* Current Time Red Line Indicator (at 10:30 AM) */}
                <div
                  style={{ top: `${1.5 * HOUR_HEIGHT}px` }}
                  className="absolute left-16 right-0 h-0.5 bg-rose-500 z-20 pointer-events-none flex items-center"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5" />
                </div>

                {/* Time column */}
                <div className="border-r border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 divide-y divide-slate-100 dark:divide-slate-800/80">
                  {TIME_SLOTS.map(slot => (
                    <div
                      key={slot.hour}
                      style={{ height: `${HOUR_HEIGHT}px` }}
                      className="p-1.5 text-[11px] font-mono text-slate-400 text-right pr-3"
                    >
                      {slot.label}
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                {weekDates.map(({ day, ymd }) => {
                  const positionedList = positionedByDay[day];
                  const dayAbsences = absences.filter(a => a.absenceDate === ymd && a.status !== 'rejected');

                  return (
                    <div
                      key={ymd}
                      className="relative border-r last:border-r-0 border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60"
                    >
                      {TIME_SLOTS.map(slot => (
                        <div
                          key={slot.hour}
                          style={{ height: `${HOUR_HEIGHT}px` }}
                          className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors"
                        />
                      ))}

                      {positionedList.map(({ course, colIndex, totalColumns, top, height }) => {
                        const total = totalColumns || 1;
                        const widthPercent = 100 / total;
                        const leftPercent = colIndex * widthPercent;
                        const cancelled = dayAbsences.find(
                          a => a.courseId === course.id && a.type === 'instructor_cancel'
                        );

                        return (
                          <div
                            key={course.id}
                            onClick={() => openCourseDetail(course)}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              left: `calc(${leftPercent}% + 2px)`,
                              width: `calc(${widthPercent}% - 4px)`,
                            }}
                            className={`absolute rounded-lg p-2 border-l-4 shadow-xs hover:shadow-md transition-all cursor-pointer z-10 flex flex-col justify-between overflow-hidden ${
                              cancelled
                                ? 'bg-rose-50/95 dark:bg-rose-950/80 border-rose-600'
                                : `${course.color.bg} border-indigo-600`
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                                  {course.startTime} - {course.endTime}
                                </span>
                                {cancelled && (
                                  <span className="px-1 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold">
                                    결강
                                  </span>
                                )}
                              </div>
                              <h4 className={`text-xs font-bold leading-snug mt-0.5 ${cancelled ? 'line-through text-rose-800 dark:text-rose-200' : 'text-slate-900 dark:text-slate-100'}`}>
                                {course.name}
                              </h4>
                            </div>

                            <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                              {course.instructorName} · {course.room}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 3: CLASSROOM TRACKS VIEW (강의실별 타임테이블 모드)
         ===================================================================== */}
      {viewType === 'classroom' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                조회 요일 선택 (클릭 시 활성화):
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDayClassroom(day)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                      selectedDayClassroom === day
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {selectedDayClassroom === day && <Check className="w-3 h-3" />}
                    <span>{day}요일</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>동일 시간대에 열리는 여러 강좌가 강의실별 독립 열로 분리되어 한눈에 파악됩니다.</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <div style={{ minWidth: `${allClassrooms.length * 150 + 70}px` }}>
                <div
                  style={{ gridTemplateColumns: `64px repeat(${allClassrooms.length}, minmax(140px, 1fr))` }}
                  className="grid border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <div className="p-3 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  {allClassrooms.map(room => {
                    const roomCourses = filteredCourses.filter(
                      c => c.day === selectedDayClassroom && c.room.trim().toLowerCase() === room.trim().toLowerCase()
                    );
                    return (
                      <div key={room} className="p-3 border-r last:border-r-0 border-slate-200 dark:border-slate-800 text-center">
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{room}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {roomCourses.length > 0 ? `${roomCourses.length}개 강좌 배정` : '배정 없음'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{ gridTemplateColumns: `64px repeat(${allClassrooms.length}, minmax(140px, 1fr))` }}
                  className="relative grid"
                >
                  <div className="border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 divide-y divide-slate-100 dark:divide-slate-800/80">
                    {TIME_SLOTS.map(slot => (
                      <div
                        key={slot.hour}
                        style={{ height: `${HOUR_HEIGHT}px` }}
                        className="p-1.5 text-[11px] font-mono text-slate-400 text-center flex items-start justify-center pt-1"
                      >
                        {slot.label}
                      </div>
                    ))}
                  </div>

                  {allClassrooms.map(room => {
                    const roomCourses = filteredCourses.filter(
                      c => c.day === selectedDayClassroom && c.room.trim().toLowerCase() === room.trim().toLowerCase()
                    );

                    return (
                      <div
                        key={room}
                        className="relative border-r last:border-r-0 border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60"
                      >
                        {TIME_SLOTS.map(slot => (
                          <div
                            key={slot.hour}
                            style={{ height: `${HOUR_HEIGHT}px` }}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          />
                        ))}

                        {roomCourses.map(course => {
                          const [startH, startM] = course.startTime.split(':').map(Number);
                          const startOffsetHours = (startH - 9) + (startM / 60);
                          const top = Math.max(0, startOffsetHours * HOUR_HEIGHT);
                          const height = Math.max(52, (course.durationHours || 1) * HOUR_HEIGHT - 4);

                          return (
                            <div
                              key={course.id}
                              onClick={() => openCourseDetail(course)}
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                              }}
                              className={`absolute left-1 right-1 rounded-xl p-2.5 border transition-all cursor-pointer shadow-2xs hover:shadow-md hover:scale-[1.01] z-10 flex flex-col justify-between overflow-hidden ${course.color.bg} ${course.color.border}`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="text-[10px] font-mono font-bold px-1 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 truncate">
                                    {course.code}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {course.startTime}~{course.endTime}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold leading-tight text-slate-900 dark:text-slate-100 line-clamp-2">
                                  {course.name}
                                </h4>
                              </div>
                              <div className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                                <span className="truncate">{course.instructorName}</span>
                                <span className="font-mono text-[9px] text-slate-400">{course.durationHours}h</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 4: WEEKLY TABLE VIEW WITH CONCURRENT SUB-COLUMNS (기존 표 방식 주간 시간표)
         ===================================================================== */}
      {viewType === 'weekly' && (
        <>
          {/* MOBILE-SPECIFIC VIEW TOGGLE */}
          <div className="block lg:hidden bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                모바일 뷰 모드 (선택한 버튼 활성화)
              </span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setMobileViewStyle('day_list')}
                  className={`px-3 py-1.5 rounded-lg border font-bold transition-colors ${
                    mobileViewStyle === 'day_list'
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  요일별 목록
                </button>
                <button
                  type="button"
                  onClick={() => setMobileViewStyle('grid')}
                  className={`px-3 py-1.5 rounded-lg border font-bold transition-colors ${
                    mobileViewStyle === 'grid'
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  전체 그리드
                </button>
              </div>
            </div>

            {mobileViewStyle === 'day_list' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {DAYS_OF_WEEK.map(d => {
                  const dayCoursesCount = filteredCourses.filter(c => c.day === d).length;
                  const isSelected = selectedDayMobile === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDayMobile(d)}
                      className={`flex-1 min-w-[50px] py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs font-bold">{d}</span>
                      <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'opacity-90' : 'text-slate-400'}`}>
                        {dayCoursesCount}개
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* MOBILE DAY LIST VIEW */}
          {mobileViewStyle === 'day_list' && (
            <div className="block lg:hidden space-y-3">
              {(() => {
                const dayCourses = filteredCourses
                  .filter(c => c.day === selectedDayMobile)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                if (dayCourses.length === 0) {
                  return (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                      {selectedDayMobile}요일에는 배정된 강의 일정이 없습니다.
                    </div>
                  );
                }

                return dayCourses.map(course => {
                  const enrolled = isStudentEnrolled(course.id, selectedStudentId);
                  const count = getCourseEnrollmentCount(course.id);
                  return (
                    <div
                      key={course.id}
                      onClick={() => openCourseDetail(course)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-900 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 ${course.color.border}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                            <span className="font-mono text-indigo-600 dark:text-indigo-400">{course.code}</span>
                            <span>·</span>
                            <span>{course.programName || course.category}</span>
                            <span>·</span>
                            <span className="font-mono">{course.durationHours}h</span>
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {course.name}
                          </h4>
                        </div>

                        {enrolled && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                            신청 완료
                          </span>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-mono">{course.startTime} ~ {course.endTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="truncate">{course.room}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-rose-500" />
                          <span className="truncate">{course.instructorName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-right font-mono text-[11px]">
                          <span>수강: {count}/{course.maxCapacity}명</span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* FULL WEEKLY TIMETABLE GRID */}
          <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden ${
            mobileViewStyle === 'day_list' ? 'hidden lg:block' : 'block'
          }`}>
            <div className="overflow-x-auto">
              <div className="min-w-[960px]">
                <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="p-3 border-r border-slate-200 dark:border-slate-800 w-16 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  {DAYS_OF_WEEK.map((d) => {
                    const dayCourses = filteredCourses.filter(c => c.day === d);
                    const dayHours = dayCourses.reduce((sum, c) => sum + (c.durationHours || 0), 0);
                    const dayPositions = positionedByDay[d];
                    const maxSimultaneous = dayPositions.reduce((max, p) => Math.max(max, p.totalColumns), 1);

                    return (
                      <div key={d} className="p-3 border-r last:border-r-0 border-slate-200 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{d}요일</div>
                        <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">
                          {dayCourses.length}강의 · <span className="font-mono">{dayHours}h</span>
                          {maxSimultaneous >= 2 && (
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block">
                              동시 {maxSimultaneous}과목 병렬
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="relative grid grid-cols-7">
                  <div className="border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 divide-y divide-slate-100 dark:divide-slate-800/80">
                    {TIME_SLOTS.map((slot) => (
                      <div
                        key={slot.hour}
                        style={{ height: `${HOUR_HEIGHT}px` }}
                        className="p-1.5 text-[11px] font-mono text-slate-400 dark:text-slate-500 text-center flex items-start justify-center pt-1"
                      >
                        {slot.label}
                      </div>
                    ))}
                  </div>

                  {DAYS_OF_WEEK.map((day) => {
                    const positionedList = positionedByDay[day];

                    return (
                      <div
                        key={day}
                        className="relative border-r last:border-r-0 border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60"
                      >
                        {TIME_SLOTS.map((slot) => (
                          <div
                            key={slot.hour}
                            style={{ height: `${HOUR_HEIGHT}px` }}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          />
                        ))}

                        {positionedList.map(({ course, colIndex, totalColumns, top, height }) => {
                          const isEnrolled = isStudentEnrolled(course.id, selectedStudentId);
                          const total = totalColumns || 1;
                          const widthPercent = 100 / total;
                          const leftPercent = colIndex * widthPercent;

                          return (
                            <div
                              key={course.id}
                              onClick={() => openCourseDetail(course)}
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                left: `calc(${leftPercent}% + 2px)`,
                                width: `calc(${widthPercent}% - 4px)`,
                              }}
                              className={`absolute rounded-xl p-2 border transition-all cursor-pointer shadow-2xs hover:shadow-md hover:scale-[1.02] z-10 flex flex-col justify-between overflow-hidden ${course.color.bg} ${course.color.border}`}
                              title={`${course.name} (${course.code}) - ${course.room} - ${course.instructorName} (${course.startTime}~${course.endTime})`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span className="text-[9px] font-mono font-semibold px-1 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 truncate">
                                    {course.code}
                                  </span>
                                  {isEnrolled && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="수강 신청 완료" />
                                  )}
                                </div>
                                <h4 className="text-[11px] font-bold leading-tight line-clamp-2 text-slate-900 dark:text-slate-100">
                                  {course.name}
                                </h4>
                              </div>

                              <div className="mt-0.5 space-y-0.5 text-[9px] text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1 font-mono">
                                  <Clock className="w-2.5 h-2.5 shrink-0 opacity-70" />
                                  <span className="truncate">{course.startTime}~{course.endTime}</span>
                                </div>
                                <div className="flex items-center gap-1 truncate font-medium">
                                  <MapPin className="w-2.5 h-2.5 shrink-0 text-emerald-600 opacity-80" />
                                  <span className="truncate">{course.room}</span>
                                </div>
                                <div className="flex items-center gap-1 truncate text-slate-500">
                                  <User className="w-2.5 h-2.5 shrink-0 opacity-70" />
                                  <span className="truncate">{course.instructorName}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Course Detail / Create Modal */}
      <CourseModal
        isOpen={isModalOpen}
        course={selectedCourse}
        isEditMode={isEditMode}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
