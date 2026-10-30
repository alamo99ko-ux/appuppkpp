import React, { useState, useMemo } from 'react';
import { Course, DayOfWeek } from '../types';
import { useApp } from '../context/AppContext';
import { DAYS_OF_WEEK } from '../data/mockData';
import { Clock, MapPin, User, Plus, Building2, Calendar as CalendarIcon, Layers, Info } from 'lucide-react';
import { CourseModal } from './CourseModal';

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

// Helper to calculate minutes from "HH:mm"
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Layout item with calculated sub-column position
interface PositionedCourse {
  course: Course;
  colIndex: number;
  totalColumns: number;
  top: number;
  height: number;
}

// Compute simultaneous course positions for a set of courses on the same day
function computeSimultaneousPositions(dayCourses: Course[]): PositionedCourse[] {
  if (dayCourses.length === 0) return [];

  // Sort by start time, then duration
  const sorted = [...dayCourses].sort((a, b) => {
    const diff = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    if (diff !== 0) return diff;
    return timeToMinutes(b.endTime) - timeToMinutes(a.endTime);
  });

  // Group connected overlapping clusters
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
      // Overlaps with current cluster
      currentCluster.push(course);
      clusterEndMin = Math.max(clusterEndMin, endMin);
    } else {
      // New cluster
      clusters.push(currentCluster);
      currentCluster = [course];
      clusterEndMin = endMin;
    }
  });

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const result: PositionedCourse[] = [];

  // For each cluster, assign column indices greedily
  clusters.forEach(cluster => {
    const columns: Course[][] = []; // columns[colIndex] = list of courses placed in this column

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
        totalColumns: 0, // will set below
        top,
        height,
      });
    });

    const totalColsInCluster = columns.length;
    // Update totalColumns for items in this cluster
    cluster.forEach(c => {
      const item = result.find(r => r.course.id === c.id);
      if (item) {
        item.totalColumns = totalColsInCluster;
      }
    });
  });

  return result;
}

export const TimetableView: React.FC = () => {
  const {
    courses,
    role,
    instructors,
    students,
    selectedStudentId,
    selectedInstructorId,
    getStudentEnrolledCourses,
    getCourseEnrollmentCount,
    isStudentEnrolled,
  } = useApp();

  // View filtering & mode
  const [viewType, setViewType] = useState<'weekly' | 'classroom'>('weekly');
  const [filterMode, setFilterMode] = useState<'all' | 'my' | 'instructor'>('all');
  const [targetInstructorId, setTargetInstructorId] = useState<string>(selectedInstructorId);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedDayMobile, setSelectedDayMobile] = useState<DayOfWeek>('월');
  const [selectedDayClassroom, setSelectedDayClassroom] = useState<DayOfWeek>('월');
  const [mobileViewStyle, setMobileViewStyle] = useState<'day_list' | 'grid'>('day_list');

  // Modal states
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Sync default filter mode according to current role
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

    if (filterMode === 'my' && role === 'student') {
      result = getStudentEnrolledCourses(selectedStudentId);
    } else if (filterMode === 'instructor' || role === 'instructor') {
      const activeInstId = role === 'instructor' ? selectedInstructorId : targetInstructorId;
      result = result.filter(c => c.instructorId === activeInstId);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(c => c.category === categoryFilter);
    }

    return result;
  }, [
    courses,
    filterMode,
    role,
    selectedStudentId,
    selectedInstructorId,
    targetInstructorId,
    categoryFilter,
    getStudentEnrolledCourses,
  ]);

  // Unique classrooms list
  const allClassrooms = useMemo(() => {
    const roomSet = new Set(courses.map(c => c.room).filter(Boolean));
    return Array.from(roomSet).sort();
  }, [courses]);

  // Precompute positioned courses for each day
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

  // Count max simultaneous courses across the week
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
    <div className="space-y-6">
      {/* Top Controls & View Mode Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Main View Switcher: Weekly vs Classroom Tracks */}
          <div className="flex items-center p-1 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <button
              onClick={() => setViewType('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                viewType === 'weekly'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-indigo-900 dark:text-indigo-300 hover:text-indigo-950'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>주간 시간표 (동시과목 분할)</span>
            </button>
            <button
              onClick={() => setViewType('classroom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                viewType === 'classroom'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-indigo-900 dark:text-indigo-300 hover:text-indigo-950'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>강의실별 트랙 보기</span>
            </button>
          </div>

          {/* Filter Mode buttons */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              전체 강좌
            </button>
            <button
              onClick={() => setFilterMode('my')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                filterMode === 'my'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {role === 'student' ? '내 신청 시간표' : '학생별 시간표'}
            </button>
            <button
              onClick={() => setFilterMode('instructor')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                filterMode === 'instructor'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              강사별 시간표
            </button>
          </div>

          {/* Instructor selector if in instructor filter */}
          {filterMode === 'instructor' && role !== 'instructor' && (
            <select
              value={targetInstructorId}
              onChange={(e) => setTargetInstructorId(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              {instructors.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.department})
                </option>
              ))}
            </select>
          )}

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">전체 분야 (과목)</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>최대 동시 진행: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{maxConcurrentCount}개 강좌</strong> 병렬 표시</span>
          </div>

          {role === 'admin' && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              강의 개설
            </button>
          )}
        </div>
      </div>

      {/* CLASSROOM TRACKS VIEW (강의실별 타임테이블 모드) */}
      {viewType === 'classroom' && (
        <div className="space-y-4">
          {/* Day Selector for Classroom Tracks */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                조회 요일 선택:
              </span>
              <div className="flex items-center gap-1">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDayClassroom(day)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      selectedDayClassroom === day
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {day}요일
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>동일 시간대에 열리는 여러 강좌가 강의실별 독립 열로 분리되어 한눈에 파악됩니다.</span>
            </div>
          </div>

          {/* Classroom Matrix */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <div style={{ minWidth: `${allClassrooms.length * 150 + 70}px` }}>
                {/* Rooms Header */}
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

                {/* Rooms Body Grid */}
                <div
                  style={{ gridTemplateColumns: `64px repeat(${allClassrooms.length}, minmax(140px, 1fr))` }}
                  className="relative grid"
                >
                  {/* Time label column */}
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

                  {/* Room columns */}
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

                        {/* Room course cards */}
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

      {/* WEEKLY VIEW WITH CONCURRENT SUB-COLUMNS (주간 시간표 모드) */}
      {viewType === 'weekly' && (
        <>
          {/* MOBILE-SPECIFIC VIEW TOGGLE */}
          <div className="block lg:hidden bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                모바일 뷰 모드
              </span>
              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px]">
                <button
                  onClick={() => setMobileViewStyle('day_list')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    mobileViewStyle === 'day_list' ? 'bg-white dark:bg-slate-900 font-bold shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  요일별 목록
                </button>
                <button
                  onClick={() => setMobileViewStyle('grid')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    mobileViewStyle === 'grid' ? 'bg-white dark:bg-slate-900 font-bold shadow-2xs' : 'text-slate-500'
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
                      onClick={() => setSelectedDayMobile(d)}
                      className={`flex-1 min-w-[50px] py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
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
                            <span>{course.category}</span>
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

          {/* FULL WEEKLY TIMETABLE GRID (Desktop always, Mobile when grid mode selected) */}
          <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden ${
            mobileViewStyle === 'day_list' ? 'hidden lg:block' : 'block'
          }`}>
            <div className="overflow-x-auto">
              <div className="min-w-[960px]">
                {/* Table Header: Days of the week */}
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

                {/* Timetable Matrix Body */}
                <div className="relative grid grid-cols-7">
                  {/* Left Column: Time Labels */}
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

                  {/* Day Columns */}
                  {DAYS_OF_WEEK.map((day) => {
                    const positionedList = positionedByDay[day];

                    return (
                      <div
                        key={day}
                        className="relative border-r last:border-r-0 border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60"
                      >
                        {/* Background Hour Grid Lines */}
                        {TIME_SLOTS.map((slot) => (
                          <div
                            key={slot.hour}
                            style={{ height: `${HOUR_HEIGHT}px` }}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          />
                        ))}

                        {/* Absolutely Positioned Course Cards with Concurrent Sub-Column Math */}
                        {positionedList.map(({ course, colIndex, totalColumns, top, height }) => {
                          const isEnrolled = isStudentEnrolled(course.id, selectedStudentId);

                          // Sub-column math: divide column into equal sub-lanes
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
