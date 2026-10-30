import React, { useState, useMemo } from 'react';
import { Course, Student, DayOfWeek } from '../types';
import { useApp } from '../context/AppContext';
import { Clock, MapPin, Users, Mail, Phone, Calendar, ChevronDown, ChevronUp, Printer, BookOpen, Star, MessageSquare } from 'lucide-react';
import { CourseModal } from './CourseModal';
import { DAYS_OF_WEEK } from '../data/mockData';

export const InstructorScheduleView: React.FC = () => {
  const {
    instructors,
    selectedInstructorId,
    setSelectedInstructorId,
    courses,
    getCourseEnrollmentCount,
    getEnrolledStudentsForCourse,
    getInstructorWorkloadStatus,
    getInstructorAverageRating,
    getCourseRatingStats,
    getCourseReviews,
  } = useApp();

  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentInstructor = instructors.find(i => i.id === selectedInstructorId) || instructors[0] || {
    id: 'inst-1',
    name: '고승희 교관',
    department: '항공운항과',
    email: 'sh.ko@academy.ac.kr',
    phone: '010-3456-7891',
    avatarBg: 'bg-indigo-600',
  };
  const workloadStatus = getInstructorWorkloadStatus(currentInstructor.id);

  const instructorCourses = useMemo(() => {
    return courses
      .filter(c => c.instructorId === currentInstructor.id)
      .sort((a, b) => {
        const dayOrder = { 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };
        if (dayOrder[a.day] !== dayOrder[b.day]) {
          return dayOrder[a.day] - dayOrder[b.day];
        }
        return a.startTime.localeCompare(b.startTime);
      });
  }, [courses, currentInstructor.id]);

  const totalTeachingHours = workloadStatus.weeklyHours;

  const totalStudentsEnrolled = useMemo(() => {
    return instructorCourses.reduce((sum, c) => sum + getCourseEnrollmentCount(c.id), 0);
  }, [instructorCourses, getCourseEnrollmentCount]);

  const instructorRating = getInstructorAverageRating(currentInstructor.id);

  const toggleStudentList = (courseId: string) => {
    setExpandedCourseId(prev => (prev === courseId ? null : courseId));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Instructor Workload Guardrail Alert Banner if exceeded */}
      {workloadStatus.status === 'danger' && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-3 animate-in slide-in-from-top-1">
          <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0 animate-pulse">
            <span className="text-sm font-bold">🚨 경고등</span>
          </div>
          <div>
            <h4 className="font-bold text-sm">
              강사 시수 상한 규정 위반 감지 (하루 6시간 / 주간 20시간 상한)
            </h4>
            <div className="text-xs text-rose-800 dark:text-rose-300 mt-1 space-y-0.5">
              {workloadStatus.isDailyExceeded && (
                <div>• 일일 최대 시수 초과: {workloadStatus.violatingDays.map(v => `${v.day}요일(${v.hours}시간)`).join(', ')} (1일 6시간 기준 초과)</div>
              )}
              {workloadStatus.isWeeklyExceeded && (
                <div>• 주간 총 시수 초과: 총 {workloadStatus.weeklyHours}시간 (주간 20시간 기준 초과)</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructor Profile & Summary Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className={`w-14 h-14 rounded-2xl ${currentInstructor.avatarBg} text-white flex items-center justify-center font-bold text-xl shadow-xs`}>
              {currentInstructor.name[0]}
            </span>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{currentInstructor.department}</span>
                <span>·</span>
                <span>강사/교수 전용 모드</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {currentInstructor.name}의 주간 강의 일정
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {currentInstructor.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {currentInstructor.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Instructor Metrics Strip: Daily, Weekly, Monthly, and Annual simultaneously */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Daily Max */}
            <div className={`p-2.5 px-3.5 rounded-xl border text-center transition-colors ${
              workloadStatus.isDailyExceeded
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/50'
            }`}>
              <div className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">📅 1일 최고시수 (상한 6h)</div>
              <div className={`text-lg font-bold font-mono ${
                workloadStatus.isDailyExceeded
                  ? 'text-rose-600 dark:text-rose-400 animate-pulse'
                  : 'text-amber-700 dark:text-amber-300'
              }`}>
                {workloadStatus.maxDailyHours} <span className="text-[11px] font-normal text-slate-500">/ 6h ({workloadStatus.maxDailyDay})</span>
              </div>
            </div>

            {/* 2. Weekly Total */}
            <div className={`p-2.5 px-3.5 rounded-xl border text-center transition-colors ${
              workloadStatus.isWeeklyExceeded
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                : workloadStatus.isWeeklyCaution
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                : 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-800/50'
            }`}>
              <div className="text-[10px] text-indigo-800 dark:text-indigo-300 font-medium">⏱️ 주간 총시수 (상한 20h)</div>
              <div className={`text-lg font-bold font-mono ${
                workloadStatus.isWeeklyExceeded
                  ? 'text-rose-600 dark:text-rose-400 animate-pulse'
                  : 'text-indigo-600 dark:text-indigo-400'
              }`}>
                {totalTeachingHours} <span className="text-[11px] font-normal text-slate-500">/ 20h</span>
              </div>
            </div>

            {/* 3. Monthly Total */}
            <div className="p-2.5 px-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 text-center">
              <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">🗓️ 월별 강의시간 (4주)</div>
              <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {workloadStatus.monthlyHours} <span className="text-[11px] font-normal text-slate-500">시간/월</span>
              </div>
            </div>

            {/* 4. Annual Total */}
            <div className="p-2.5 px-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50 text-center">
              <div className="text-[10px] text-purple-800 dark:text-purple-300 font-medium">🌟 년간 강의시간 (40주)</div>
              <div className="text-lg font-bold font-mono text-purple-700 dark:text-purple-400">
                {workloadStatus.annualHours} <span className="text-[11px] font-normal text-slate-500">시간/년</span>
              </div>
            </div>

            {/* 5. Total Students */}
            <div className="p-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">총 수강생</div>
              <div className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">
                {totalStudentsEnrolled}명
              </div>
            </div>

            {/* 6. Course Satisfaction Rating */}
            <div className="p-2.5 px-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-center">
              <div className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">⭐ 강의평가 만족도</div>
              <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                <span>★ {instructorRating.count > 0 ? instructorRating.average : '-'}</span>
                <span className="text-[11px] font-normal text-slate-500">({instructorRating.count}건)</span>
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
              title="시간표 인쇄"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day-by-Day (월~토) Strip for this instructor */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {currentInstructor.name}의 요일별 일일 강의시간 현황:
            </span>
            <span>일일 최대 6시간 준수 여부 점검</span>
          </div>
          <div className="grid grid-cols-6 gap-1.5 text-xs">
            {(['월', '화', '수', '목', '금', '토'] as DayOfWeek[]).map(day => {
              const hours = workloadStatus.dailyHours[day] || 0;
              const isOver = hours > 6;
              const hasClass = hours > 0;
              return (
                <div
                  key={day}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    isOver
                      ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-400 text-rose-700 dark:text-rose-300 font-bold'
                      : hasClass
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600'
                  }`}
                >
                  <div className="text-[10px] font-sans font-medium text-slate-500">{day}요일</div>
                  <div className="font-mono text-sm">{hours > 0 ? `${hours}h` : '0h'}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instructor Switcher with quick time chips */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 shrink-0 font-medium">교관 전환:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar w-full">
            {instructors.map(inst => {
              const instWorkload = getInstructorWorkloadStatus(inst.id);
              const isSelected = selectedInstructorId === inst.id;
              return (
                <button
                  key={inst.id}
                  onClick={() => setSelectedInstructorId(inst.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span>{inst.name}</span>
                  <span className={`text-[10px] font-mono px-1 rounded ${
                    isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                    주 {instWorkload.weeklyHours}h | 월 {instWorkload.monthlyHours}h | 연 {instWorkload.annualHours}h
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Week Schedule Overview Cards (Days) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {DAYS_OF_WEEK.map(d => {
          const dayClasses = instructorCourses.filter(c => c.day === d);
          const dayHours = dayClasses.reduce((sum, c) => sum + (c.durationHours || 0), 0);
          return (
            <div
              key={d}
              className={`p-3.5 rounded-xl border transition-all ${
                dayClasses.length > 0
                  ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/60 shadow-2xs'
                  : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{d}요일</span>
                <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  {dayHours > 0 ? `${dayHours}h` : '-'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {dayClasses.length > 0 ? `${dayClasses.length}개 강의` : '강의 없음'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Courses & Student Rosters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            담당 강좌 상세 및 수강생 명단 ({instructorCourses.length}개)
          </h3>
          <span className="text-xs text-slate-500">
            과목을 클릭하면 수강생 명부를 조회할 수 있습니다.
          </span>
        </div>

        {instructorCourses.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
            등록된 담당 강의가 없습니다.
          </div>
        ) : (
          instructorCourses.map(course => {
            const enrolledStudents = getEnrolledStudentsForCourse(course.id);
            const isExpanded = expandedCourseId === course.id;

            return (
              <div
                key={course.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-all"
              >
                {/* Course Header */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs shrink-0">
                      {course.code}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span>{course.category}</span>
                        <span>·</span>
                        <span>매주 {course.day}요일</span>
                        <span>·</span>
                        <span className="font-mono">{course.durationHours}시간 강의</span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {course.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mt-2">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          {course.startTime} ~ {course.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                          {course.room}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Users className="w-3.5 h-3.5 text-amber-500" />
                          수강 정원: {enrolledStudents.length} / {course.maxCapacity}명
                        </span>
                        {getCourseRatingStats(course.id).count > 0 && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            ★ {getCourseRatingStats(course.id).average} ({getCourseRatingStats(course.id).count}건)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedCourseForModal(course);
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span>강의평가·계획서</span>
                    </button>
                    <button
                      onClick={() => toggleStudentList(course.id)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors ${
                        isExpanded
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <span>수강생 명부 ({enrolledStudents.length}명)</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Enrolled Students Accordion */}
                {isExpanded && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      수강 등록 학생 명단 ({enrolledStudents.length} / {course.maxCapacity}명)
                    </div>

                    {enrolledStudents.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        아직 수강신청한 학생이 없습니다.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {enrolledStudents.map((stud: Student) => (
                          <div
                            key={stud.id}
                            className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`w-8 h-8 rounded-full ${stud.avatarBg} text-white flex items-center justify-center font-bold text-xs`}>
                                {stud.name[0]}
                              </span>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100">
                                  {stud.name} <span className="text-[11px] font-normal text-slate-400 font-mono">({stud.studentId})</span>
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {stud.major} · {stud.grade}
                                </div>
                              </div>
                            </div>
                            <a
                              href={`mailto:${stud.email}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title={`${stud.name} 학생에게 이메일 보내기`}
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
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
