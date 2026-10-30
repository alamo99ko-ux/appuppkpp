import React, { useState, useMemo } from 'react';
import { useApp, MAX_DAILY_INSTRUCTOR_HOURS, MAX_WEEKLY_INSTRUCTOR_HOURS } from '../context/AppContext';
import { Course, DayOfWeek } from '../types';
import { AlertTriangle, CheckCircle2, AlertOctagon, Clock, Users, Building, Plus, Calendar, ShieldAlert, ArrowRight, Layers } from 'lucide-react';
import { CourseModal } from './CourseModal';
import { DAYS_OF_WEEK } from '../data/mockData';

export const SchedulerStudioView: React.FC = () => {
  const {
    courses,
    instructors,
    allInstructorWorkloads,
    getInstructorWorkloadStatus,
    checkRoomConflict,
    setActiveTab,
    setSelectedInstructorId,
  } = useApp();

  const [selectedInstructorForDetail, setSelectedInstructorForDetail] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<Course | null>(null);

  // Analyze simultaneous courses across all days and slots
  const simultaneousSlots = useMemo(() => {
    const slots: { day: DayOfWeek; time: string; courses: Course[] }[] = [];
    const days: DayOfWeek[] = ['월', '화', '수', '목', '금', '토'];

    days.forEach(day => {
      const dayCourses = courses.filter(c => c.day === day);
      
      // Check overlaps among dayCourses
      const processed = new Set<string>();

      dayCourses.forEach(c1 => {
        if (processed.has(c1.id)) return;
        const overlaps = dayCourses.filter(c2 => {
          const [s1H, s1M] = c1.startTime.split(':').map(Number);
          const [e1H, e1M] = c1.endTime.split(':').map(Number);
          const [s2H, s2M] = c2.startTime.split(':').map(Number);
          const [e2H, e2M] = c2.endTime.split(':').map(Number);
          return Math.max(s1H * 60 + s1M, s2H * 60 + s2M) < Math.min(e1H * 60 + e1M, e2H * 60 + e2M);
        });

        if (overlaps.length >= 2) {
          overlaps.forEach(o => processed.add(o.id));
          slots.push({
            day,
            time: `${c1.startTime} ~ ${c1.endTime}`,
            courses: overlaps,
          });
        }
      });
    });

    return slots;
  }, [courses]);

  // Overall workload alert statistics
  const dangerInstructors = allInstructorWorkloads.filter(w => w.status === 'danger');
  const cautionInstructors = allInstructorWorkloads.filter(w => w.status === 'caution');
  const normalInstructors = allInstructorWorkloads.filter(w => w.status === 'normal');

  const openCreateModal = () => {
    setSelectedCourseForModal(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner for Timetable Schedulers */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-700/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider">Scheduler Studio</span>
              <span>·</span>
              <span>수업일정 편성 & 강사 시수 제약 관리</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              수업 일정 편성 및 강사 시수 가드레일 센터
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              강사의 <strong>하루 최대 6시간</strong>, <strong>주간 최대 20시간</strong> 상한 규정을 실시간으로 감시하고, 동시간대 복수(3개 이상) 과목 병렬 배치 현황을 한눈에 파악합니다.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>강의 배정 및 개설</span>
            </button>
            <button
              onClick={() => setActiveTab('timetable')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-colors border border-white/15"
            >
              <Calendar className="w-4 h-4" />
              <span>전체 시간표 보기</span>
            </button>
          </div>
        </div>

        {/* Status Indicator Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          {/* Danger Warning Light */}
          <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
            dangerInstructors.length > 0
              ? 'bg-rose-950/70 border-rose-600/80 text-rose-200'
              : 'bg-white/5 border-white/10 text-slate-300'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              dangerInstructors.length > 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-white/10 text-slate-400'
            }`}>
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">초과 경고 (1일 6h / 주 20h 초과)</div>
              <div className="text-base font-bold font-mono">
                {dangerInstructors.length}명 <span className="text-xs font-normal">주의 요망</span>
              </div>
            </div>
          </div>

          {/* Caution Warning Light */}
          <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
            cautionInstructors.length > 0
              ? 'bg-amber-950/70 border-amber-600/80 text-amber-200'
              : 'bg-white/5 border-white/10 text-slate-300'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              cautionInstructors.length > 0 ? 'bg-amber-600 text-white' : 'bg-white/10 text-slate-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">한도 근접 주의 (1일 5h+ / 주 16h+)</div>
              <div className="text-base font-bold font-mono">
                {cautionInstructors.length}명 <span className="text-xs font-normal">경계 단계</span>
              </div>
            </div>
          </div>

          {/* Concurrent Courses Indicator */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/30 text-indigo-300 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">동시 다중 강의 슬롯</div>
              <div className="text-base font-bold font-mono">
                {simultaneousSlots.length}개 타임 <span className="text-xs font-normal text-slate-400">(최대 3개 동시)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: INSTRUCTOR WORKLOAD WARNING LIGHT MATRIX */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              강사별 일일/주간 시수 경고등 현황판
            </h3>
            <p className="text-xs text-slate-500">
              편성 규정: <strong>1일 최대 {MAX_DAILY_INSTRUCTOR_HOURS}시간</strong> / <strong>주간 최대 {MAX_WEEKLY_INSTRUCTOR_HOURS}시간</strong> 초과 시 경고등 점등
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              정상 ({normalInstructors.length})
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              주의 ({cautionInstructors.length})
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              초과 ({dangerInstructors.length})
            </span>
          </div>
        </div>

        {/* Instructor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allInstructorWorkloads.map((workload) => {
            const inst = instructors.find(i => i.id === workload.instructorId);
            const instCourses = courses.filter(c => c.instructorId === workload.instructorId);

            const isDanger = workload.status === 'danger';
            const isCaution = workload.status === 'caution';

            const dailyPercent = Math.min(100, Math.round((workload.maxDailyHours / MAX_DAILY_INSTRUCTOR_HOURS) * 100));
            const weeklyPercent = Math.min(100, Math.round((workload.weeklyHours / MAX_WEEKLY_INSTRUCTOR_HOURS) * 100));

            return (
              <div
                key={workload.instructorId}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isDanger
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/20'
                    : isCaution
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Header with status badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-10 h-10 rounded-xl ${inst?.avatarBg || 'bg-indigo-600'} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
                        {workload.instructorName[0]}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {workload.instructorName}
                        </h4>
                        <div className="text-xs text-slate-500">
                          {inst?.department} · {instCourses.length}개 강좌
                        </div>
                      </div>
                    </div>

                    {/* Warning Light Badge */}
                    {isDanger ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-600 text-white animate-pulse shrink-0">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        시수 초과 🚨
                      </span>
                    ) : isCaution ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        한도 근접
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        정상
                      </span>
                    )}
                  </div>

                  {/* Violating notice if any */}
                  {isDanger && (
                    <div className="mb-4 p-2.5 rounded-xl bg-rose-100/80 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200 text-xs space-y-1">
                      {workload.isDailyExceeded && (
                        <div className="font-semibold flex items-center gap-1.5">
                          <span>🚨 일일 시수(6시간) 초과:</span>
                          {workload.violatingDays.map(v => (
                            <span key={v.day} className="underline font-mono">
                              {v.day}요일({v.hours}h)
                            </span>
                          ))}
                        </div>
                      )}
                      {workload.isWeeklyExceeded && (
                        <div className="font-semibold">
                          🚨 주간 시수(20시간) 초과: 총 {workload.weeklyHours}시간 배정됨
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metric Progress Bars */}
                  <div className="space-y-3 pt-1">
                    {/* Daily Max */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">최대 일일 강의 시수</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          <strong className={workload.isDailyExceeded ? 'text-rose-600' : ''}>
                            {workload.maxDailyHours}h
                          </strong> / {MAX_DAILY_INSTRUCTOR_HOURS}h ({workload.maxDailyDay}요일)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${dailyPercent}%` }}
                          className={`h-full rounded-full transition-all ${
                            workload.isDailyExceeded
                              ? 'bg-rose-600'
                              : workload.isDailyCaution
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Weekly Total */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">주간 총 강의 시수</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          <strong className={workload.isWeeklyExceeded ? 'text-rose-600' : ''}>
                            {workload.weeklyHours}h
                          </strong> / {MAX_WEEKLY_INSTRUCTOR_HOURS}h
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${weeklyPercent}%` }}
                          className={`h-full rounded-full transition-all ${
                            workload.isWeeklyExceeded
                              ? 'bg-rose-600'
                              : workload.isWeeklyCaution
                              ? 'bg-amber-500'
                              : 'bg-indigo-600'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Monthly & Annual Projection Chips (일일·월별·년간 동시 표시) */}
                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                        <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-sans font-medium">🗓️ 월별 시간 (4주)</div>
                        <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{workload.monthlyHours}h</div>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40">
                        <div className="text-[10px] text-purple-800 dark:text-purple-300 font-sans font-medium">🌟 년간 시간 (40주)</div>
                        <div className="font-bold text-purple-700 dark:text-purple-400 text-sm">{workload.annualHours}h</div>
                      </div>
                    </div>

                    {/* Day-by-Day Mini Distribution */}
                    <div className="pt-1">
                      <div className="text-[10px] text-slate-400 mb-1">요일별 시수 (월~토)</div>
                      <div className="grid grid-cols-6 gap-1 text-[11px] font-mono text-center">
                        {(['월', '화', '수', '목', '금', '토'] as DayOfWeek[]).map(day => {
                          const h = workload.dailyHours[day] || 0;
                          return (
                            <div
                              key={day}
                              className={`py-1 rounded border ${
                                h > MAX_DAILY_INSTRUCTOR_HOURS
                                  ? 'bg-rose-100 text-rose-700 font-bold border-rose-300'
                                  : h > 0
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold border-slate-200 dark:border-slate-700'
                                  : 'text-slate-300 dark:text-slate-600 border-transparent'
                              }`}
                            >
                              <div className="text-[9px] text-slate-400 font-sans">{day}</div>
                              <div>{h > 0 ? `${h}h` : '-'}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setSelectedInstructorId(workload.instructorId);
                      setActiveTab('instructor_schedule');
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>담당 일정표 조회</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCourseForModal(null);
                      setIsModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                  >
                    강의 추가
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: CONCURRENT COURSE TIMETABLE SLOTS (동시 진행 3개 과목 편성 상세) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              동일 시간대 병렬 강의 현황 (동시 2개~3개 과목 편성 타임)
            </h3>
            <p className="text-xs text-slate-500">
              학원/학교 특성상 동일 시간대에 각기 다른 강의실에서 3개 과목이 동시에 열리는 시간대 목록입니다.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('timetable')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>전체 시간표에서 병렬 트랙 확인하기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {simultaneousSlots.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl text-slate-400 text-xs">
            현재 겹치는 시간대의 병렬 강의가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {simultaneousSlots.map((slot, index) => (
              <div
                key={index}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
                      {slot.day}요일
                    </span>
                    <span>동시 진행 시간대: <span className="font-mono text-indigo-600 dark:text-indigo-400">{slot.time}</span></span>
                  </div>
                  <span className="font-semibold text-slate-500 text-xs">
                    총 <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{slot.courses.length}개 강좌</strong> 병렬 진행 중
                  </span>
                </div>

                {/* Sub-courses cards running at the same time */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {slot.courses.map(course => (
                    <div
                      key={course.id}
                      className={`p-3.5 rounded-xl border bg-white dark:bg-slate-900 shadow-2xs space-y-2 ${course.color.border}`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {course.code}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {course.startTime}~{course.endTime}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs line-clamp-1">
                        {course.name}
                      </h5>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="truncate font-medium">{course.room}</span>
                        <span className="truncate text-slate-500">{course.instructorName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CourseModal
        isOpen={isModalOpen}
        course={selectedCourseForModal}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
