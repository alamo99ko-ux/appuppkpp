import React, { useState, useMemo } from 'react';
import { Course, DayOfWeek, CourseEnrollmentStatus } from '../types';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Clock, 
  MapPin, 
  User, 
  Users, 
  CheckCircle, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  BookOpen, 
  Calendar, 
  ArrowRight, 
  Layers, 
  Lock, 
  RotateCcw,
  Sparkles,
  Star 
} from 'lucide-react';
import { CourseModal } from './CourseModal';
import { DAYS_OF_WEEK } from '../data/mockData';

export type CourseStatusFilter = 'all' | CourseEnrollmentStatus;

export const CourseEnrollmentView: React.FC = () => {
  const {
    courses,
    students,
    selectedStudentId,
    setSelectedStudentId,
    isStudentEnrolled,
    enrollCourse,
    cancelEnrollment,
    getCourseEnrollmentCount,
    getStudentEnrolledCourses,
    checkStudentTimeClash,
    setActiveTab,
    waitlists,
    addToWaitlist,
    cancelWaitlist,
    isStudentWaitlisted,
    getCourseWaitlistCount,
    getStudentWaitlistPosition,
    getCourseEffectiveStatus,
    getCourseRatingStats,
  } = useApp();

  // Status Filter state: 'all' | 'available' (신청가능) | 'closed' (마감) | 'waitlist' (대기중)
  const [statusFilter, setStatusFilter] = useState<CourseStatusFilter>('all');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedDay, setSelectedDay] = useState<string>('전체');
  const [sortBy, setSortBy] = useState<'time' | 'capacity' | 'rating' | 'name'>('time');
  
  // Feedback toast
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Modal
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentStudent = students.find(s => s.id === selectedStudentId) || students[0];
  const enrolledCourses = getStudentEnrolledCourses(selectedStudentId);
  const enrolledHours = enrolledCourses.reduce((sum, c) => sum + (c.durationHours || 0), 0);

  const categories = useMemo(() => {
    const set = new Set(courses.map(c => c.category));
    return ['전체', ...Array.from(set)];
  }, [courses]);

  // Compute live count for each status
  const statusCounts = useMemo(() => {
    let available = 0;
    let closed = 0;
    let waitlist = 0;

    courses.forEach(c => {
      const s = getCourseEffectiveStatus(c, selectedStudentId);
      if (s === 'available') available++;
      else if (s === 'closed') closed++;
      else if (s === 'waitlist') waitlist++;
    });

    return {
      all: courses.length,
      available,
      closed,
      waitlist,
    };
  }, [courses, selectedStudentId, getCourseEffectiveStatus, waitlists]);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleEnroll = (course: Course) => {
    const res = enrollCourse(course.id, selectedStudentId);
    showToast(res.message, !res.success);
  };

  const handleCancel = (course: Course) => {
    const res = cancelEnrollment(course.id, selectedStudentId);
    showToast(res.message, !res.success);
  };

  const handleApplyWaitlist = (course: Course) => {
    const res = addToWaitlist(course.id, selectedStudentId);
    showToast(res.message, !res.success);
  };

  const handleCancelWaitlist = (course: Course) => {
    const res = cancelWaitlist(course.id, selectedStudentId);
    showToast(res.message, !res.success);
  };

  const resetAllFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setSelectedCategory('전체');
    setSelectedDay('전체');
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      // 1. Status Filter (신청가능, 마감, 대기중)
      if (statusFilter !== 'all') {
        const effectiveStatus = getCourseEffectiveStatus(course, selectedStudentId);
        if (effectiveStatus !== statusFilter) {
          return false;
        }
      }

      // 2. Search match
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        course.name.toLowerCase().includes(query) ||
        course.code.toLowerCase().includes(query) ||
        course.instructorName.toLowerCase().includes(query) ||
        course.room.toLowerCase().includes(query);

      // 3. Category match
      const matchesCat = selectedCategory === '전체' || course.category === selectedCategory;

      // 4. Day match
      const matchesDay = selectedDay === '전체' || course.day === selectedDay;

      return matchesSearch && matchesCat && matchesDay;
    }).sort((a, b) => {
      if (sortBy === 'time') {
        const dayOrder = { 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };
        if (dayOrder[a.day] !== dayOrder[b.day]) {
          return dayOrder[a.day] - dayOrder[b.day];
        }
        return a.startTime.localeCompare(b.startTime);
      }
      if (sortBy === 'capacity') {
        const remA = a.maxCapacity - getCourseEnrollmentCount(a.id);
        const remB = b.maxCapacity - getCourseEnrollmentCount(b.id);
        return remB - remA;
      }
      if (sortBy === 'rating') {
        const ratA = getCourseRatingStats(a.id).average;
        const ratB = getCourseRatingStats(b.id).average;
        if (ratB !== ratA) return ratB - ratA;
        return getCourseRatingStats(b.id).count - getCourseRatingStats(a.id).count;
      }
      return a.name.localeCompare(b.name);
    });
  }, [
    courses, 
    statusFilter, 
    searchQuery, 
    selectedCategory, 
    selectedDay, 
    sortBy, 
    selectedStudentId, 
    getCourseEffectiveStatus, 
    getCourseEnrollmentCount,
    waitlists
  ]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-xl shadow-lg border transition-all animate-in slide-in-from-top-2 max-w-sm flex items-start gap-3 ${
          toastMessage.isError
            ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
        }`}>
          {toastMessage.isError ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <span className="text-xs font-medium leading-relaxed">{toastMessage.text}</span>
        </div>
      )}

      {/* Student Enrollment Status Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className={`w-14 h-14 rounded-2xl ${currentStudent.avatarBg} text-white flex items-center justify-center font-bold text-xl shadow-inner border border-white/20`}>
              {currentStudent.name[0]}
            </span>
            <div>
              <div className="flex items-center gap-2 text-indigo-200 text-xs">
                <span>학생 본인 인증</span>
                <span>·</span>
                <span className="font-mono">{currentStudent.studentId}</span>
                <span>·</span>
                <span>{currentStudent.grade}</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight mt-0.5">
                {currentStudent.name}님의 수강신청 데스크
              </h2>
              <div className="text-xs text-indigo-200/90 mt-1">
                전공: {currentStudent.major} ({currentStudent.email})
              </div>
            </div>
          </div>

          {/* Quick Stats & Action */}
          <div className="flex flex-wrap items-center gap-4 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
            <div className="text-center px-3 border-r border-white/10">
              <div className="text-[11px] text-indigo-200">신청 과목수</div>
              <div className="text-lg font-bold font-mono">{enrolledCourses.length}개</div>
            </div>
            <div className="text-center px-3 border-r border-white/10">
              <div className="text-[11px] text-indigo-200">총 수업시간</div>
              <div className="text-lg font-bold font-mono text-amber-300">{enrolledHours}시간/주</div>
            </div>
            <div className="text-center px-3">
              <div className="text-[11px] text-indigo-200">권장 기준</div>
              <div className="text-xs font-medium text-emerald-300 mt-1">
                {enrolledHours >= 6 && enrolledHours <= 18 ? '적정 수강' : enrolledHours < 6 ? '최소 미달' : '과부하 주의'}
              </div>
            </div>
            <button
              onClick={() => setActiveTab('student_schedule')}
              className="px-3.5 py-2 text-xs font-semibold bg-white text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>내 시간표 보기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Student Switcher (If tester wants to test different students) */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-200">
          <span>다른 학생 계정으로 테스트 수강신청:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  selectedStudentId === s.id
                    ? 'bg-white text-indigo-900 font-bold shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {s.name} ({s.grade})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status Filter Toggle Tabs (신청가능, 마감, 대기중) */}
      <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {/* 전체 */}
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>전체</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                statusFilter === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                {statusCounts.all}
              </span>
            </button>

            {/* 신청가능 */}
            <button
              type="button"
              onClick={() => setStatusFilter('available')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                statusFilter === 'available'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>신청가능</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                statusFilter === 'available'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
              }`}>
                {statusCounts.available}
              </span>
            </button>

            {/* 대기중 */}
            <button
              type="button"
              onClick={() => setStatusFilter('waitlist')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                statusFilter === 'waitlist'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>대기중</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                statusFilter === 'waitlist'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
              }`}>
                {statusCounts.waitlist}
              </span>
            </button>

            {/* 마감 */}
            <button
              type="button"
              onClick={() => setStatusFilter('closed')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                statusFilter === 'closed'
                  ? 'bg-slate-700 dark:bg-slate-700 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>마감</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                statusFilter === 'closed'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {statusCounts.closed}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-1 justify-between sm:justify-end">
            <span>
              선택 상태: <strong className="text-slate-800 dark:text-slate-200">
                {statusFilter === 'all' ? '전체 강좌' : statusFilter === 'available' ? '신청가능 강좌' : statusFilter === 'waitlist' ? '대기중 강좌' : '마감된 강좌'}
              </strong> ({filteredCourses.length}개)
            </span>
            {statusFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 ml-1"
              >
                <RotateCcw className="w-3 h-3" />
                초기화
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="과목명, 과목코드(CS101), 교수명 또는 강의실 검색..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <span>정렬:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden"
            >
              <option value="time">요일 및 시간순</option>
              <option value="rating">강의 평점 높은 순 (★)</option>
              <option value="capacity">남은 좌석 많은 순</option>
              <option value="name">과목명 가나다순</option>
            </select>
          </div>
        </div>

        {/* Category Tabs & Day Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-slate-400 text-[11px] mr-1">요일:</span>
            {['전체', ...DAYS_OF_WEEK].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-2 py-1 rounded-md text-xs transition-colors ${
                  selectedDay === d
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm space-y-3">
            <div>
              {statusFilter !== 'all' 
                ? `'${statusFilter === 'available' ? '신청가능' : statusFilter === 'waitlist' ? '대기중' : '마감'}' 상태의 조건에 맞는 강좌가 없습니다.` 
                : '검색 조건에 맞는 개설 강의가 없습니다.'}
            </div>
            <button
              onClick={resetAllFilters}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-100 transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              모든 필터 초기화
            </button>
          </div>
        ) : (
          filteredCourses.map((course) => {
            const isEnrolled = isStudentEnrolled(course.id, selectedStudentId);
            const isWaitlisted = isStudentWaitlisted(course.id, selectedStudentId);
            const waitlistPosition = getStudentWaitlistPosition(course.id, selectedStudentId);
            const enrolledCount = getCourseEnrollmentCount(course.id);
            const waitlistCount = getCourseWaitlistCount(course.id);
            const effectiveStatus = getCourseEffectiveStatus(course, selectedStudentId);
            const remaining = Math.max(0, course.maxCapacity - enrolledCount);
            const clash = checkStudentTimeClash(course, selectedStudentId);
            const capacityPercent = Math.min(100, Math.round((enrolledCount / course.maxCapacity) * 100));
            const ratingStats = getCourseRatingStats(course.id);

            return (
              <div
                key={course.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all shadow-2xs hover:shadow-md flex flex-col justify-between p-5 ${
                  isEnrolled
                    ? 'border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/10'
                    : isWaitlisted
                    ? 'border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/10'
                    : clash.hasClash && !isEnrolled
                    ? 'border-amber-200 dark:border-amber-900/60'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Top line metadata */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {course.code}
                      </span>
                      <span>·</span>
                      <span>{course.category}</span>
                      {ratingStats.count > 0 && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {ratingStats.average}
                            <span className="text-slate-400 font-normal">({ratingStats.count})</span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Status Badge */}
                    {isEnrolled ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800">
                        <CheckCircle className="w-3 h-3" />
                        수강 완료
                      </span>
                    ) : isWaitlisted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800">
                        <Clock className="w-3 h-3" />
                        대기 {waitlistPosition}순위
                      </span>
                    ) : effectiveStatus === 'available' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        신청가능 ({remaining}석)
                      </span>
                    ) : effectiveStatus === 'waitlist' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800">
                        <Clock className="w-3 h-3 text-amber-500" />
                        대기중 ({waitlistCount}명)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        <Lock className="w-3 h-3 text-slate-400" />
                        정원 마감
                      </span>
                    )}
                  </div>

                  {/* Course Title */}
                  <h3
                    onClick={() => {
                      setSelectedCourse(course);
                      setIsModalOpen(true);
                    }}
                    className="font-bold text-base text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                  >
                    {course.name}
                  </h3>

                  {/* Syllabus excerpt */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {course.description || '현대적 커리큘럼 및 실습 중심 강의.'}
                  </p>

                  {/* Details pills */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>
                        매주 <strong>{course.day}요일</strong> {course.startTime} ~ {course.endTime}
                        <span className="font-mono text-slate-400 ml-1">({course.durationHours}h)</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{course.room}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{course.instructorName}</span>
                    </div>
                  </div>

                  {/* Conflict Notice */}
                  {clash.hasClash && !isEnrolled && clash.conflictingCourse && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        시간 중복: <strong>{clash.conflictingCourse.name}</strong> ({clash.conflictingCourse.day} {clash.conflictingCourse.startTime}~{clash.conflictingCourse.endTime})와 중복됩니다.
                      </span>
                    </div>
                  )}

                  {/* Capacity Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">수강 정원 현황</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {enrolledCount} / {course.maxCapacity}명 ({capacityPercent}%)
                        {waitlistCount > 0 && (
                          <span className="ml-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                            (대기 {waitlistCount}명)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${capacityPercent}%` }}
                        className={`h-full rounded-full transition-all ${
                          capacityPercent >= 100
                            ? 'bg-rose-500'
                            : capacityPercent >= 80
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedCourse(course);
                      setIsModalOpen(true);
                    }}
                    className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    상세 정보
                  </button>

                  {/* Dynamic Action Buttons based on status & student enrollment */}
                  {isEnrolled ? (
                    <button
                      onClick={() => handleCancel(course)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      수강 취소
                    </button>
                  ) : isWaitlisted ? (
                    <button
                      onClick={() => handleCancelWaitlist(course)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      대기 취소
                    </button>
                  ) : effectiveStatus === 'waitlist' ? (
                    <button
                      onClick={() => handleApplyWaitlist(course)}
                      className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      대기 신청
                    </button>
                  ) : effectiveStatus === 'closed' ? (
                    <button
                      disabled
                      className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      정원 마감
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course)}
                      disabled={clash.hasClash}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs ${
                        clash.hasClash
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {clash.hasClash ? '시간 중복' : '수강 신청'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <CourseModal
        isOpen={isModalOpen}
        course={selectedCourse}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
