import React, { useState, useMemo } from 'react';
import { useApp, MAX_DAILY_INSTRUCTOR_HOURS, MAX_WEEKLY_INSTRUCTOR_HOURS } from '../context/AppContext';
import {
  BarChart3,
  Clock,
  Users,
  BookOpen,
  Download,
  UserCheck,
  Calendar,
  ArrowUpDown,
  RefreshCw,
  FileText,
  Search,
  LayoutGrid,
  Table2,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  CalendarRange,
  ArrowRight,
  TrendingUp,
  Info,
  Star
} from 'lucide-react';
import { DayOfWeek } from '../types';
import { DataActionToolbar } from './DataActionToolbar';

export const StatisticsView: React.FC = () => {
  const {
    totalLectureHours,
    courses,
    instructors,
    students,
    totalEnrollmentCount,
    instructorStats,
    studentStats,
    categoryStats,
    dayStats,
    reviews,
    getCourseRatingStats,
    getInstructorAverageRating,
    exportDataJson,
    resetToDefault,
    setSelectedInstructorId,
    setActiveTab,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'instructor' | 'student' | 'category' | 'day' | 'evaluation'>('instructor');
  const [instructorSearch, setInstructorSearch] = useState('');
  const [instructorViewMode, setInstructorViewMode] = useState<'card' | 'table'>('card');
  const [weeksPerYear, setWeeksPerYear] = useState<number>(40); // 40주 연간 훈련 기준
  const [weeksPerMonth, setWeeksPerMonth] = useState<number>(4); // 4주 월간 환산 기준
  const [sortBy, setSortBy] = useState<'annual' | 'monthly' | 'weekly' | 'daily' | 'name'>('annual');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // Average calculations
  const avgInstructorHours = useMemo(() => {
    if (instructors.length === 0) return 0;
    return Number((totalLectureHours / instructors.length).toFixed(1));
  }, [totalLectureHours, instructors.length]);

  const avgStudentHours = useMemo(() => {
    if (students.length === 0) return 0;
    const totalStudentHours = studentStats.reduce((sum, s) => sum + s.totalHours, 0);
    return Number((totalStudentHours / students.length).toFixed(1));
  }, [studentStats, students.length]);

  // Total annual & monthly hours across all instructors
  const totalMonthlyHours = useMemo(() => {
    return Number((totalLectureHours * weeksPerMonth).toFixed(1));
  }, [totalLectureHours, weeksPerMonth]);

  const totalAnnualHours = useMemo(() => {
    return Number((totalLectureHours * weeksPerYear).toFixed(1));
  }, [totalLectureHours, weeksPerYear]);

  const avgDailyMax = useMemo(() => {
    if (instructorStats.length === 0) return 0;
    const sum = instructorStats.reduce((s, i) => s + (i.maxDailyHours || 0), 0);
    return Number((sum / instructorStats.length).toFixed(1));
  }, [instructorStats]);

  // Filtered & sorted instructor statistics
  const filteredAndSortedInstructors = useMemo(() => {
    let list = instructorStats.map(item => {
      const computedMonthly = Number((item.weeklyHours * weeksPerMonth).toFixed(1));
      const computedAnnual = Number((item.weeklyHours * weeksPerYear).toFixed(1));
      return {
        ...item,
        computedMonthly,
        computedAnnual,
      };
    });

    if (instructorSearch.trim()) {
      const q = instructorSearch.trim().toLowerCase();
      list = list.filter(
        i =>
          i.instructor.name.toLowerCase().includes(q) ||
          i.instructor.department.toLowerCase().includes(q) ||
          i.courses.some(c => c.name.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortBy === 'annual') {
        valA = a.computedAnnual;
        valB = b.computedAnnual;
      } else if (sortBy === 'monthly') {
        valA = a.computedMonthly;
        valB = b.computedMonthly;
      } else if (sortBy === 'weekly') {
        valA = a.weeklyHours;
        valB = b.weeklyHours;
      } else if (sortBy === 'daily') {
        valA = a.maxDailyHours;
        valB = b.maxDailyHours;
      } else if (sortBy === 'name') {
        return sortDirection === 'asc'
          ? a.instructor.name.localeCompare(b.instructor.name)
          : b.instructor.name.localeCompare(a.instructor.name);
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'desc' ? valB - valA : valA - valB;
      }
      return 0;
    });

    return list;
  }, [instructorStats, instructorSearch, sortBy, sortDirection, weeksPerMonth, weeksPerYear]);

  // CSV Export helper
  const exportToCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'; // UTF-8 BOM for Excel in Korean

    if (activeSubTab === 'instructor') {
      csvContent += `순위,교관명,소속학과,월요일(시간),화요일(시간),수요일(시간),목요일(시간),금요일(시간),토요일(시간),1일최고시수(시간),주당총강의시간(시간),월별강의시간(${weeksPerMonth}주기준)(시간),년간강의시간(${weeksPerYear}주기준)(시간),시수상태,개설강좌수,총수강생수\n`;
      filteredAndSortedInstructors.forEach((item, idx) => {
        const d = item.dailyHours;
        const statusLabel =
          item.workloadStatus.status === 'danger'
            ? '초과(경고)'
            : item.workloadStatus.status === 'caution'
            ? '주의'
            : '정상';
        csvContent += `${idx + 1},"${item.instructor.name}","${item.instructor.department}",${d['월'] || 0},${d['화'] || 0},${d['수'] || 0},${d['목'] || 0},${d['금'] || 0},${d['토'] || 0},${item.maxDailyHours},${item.weeklyHours},${item.computedMonthly},${item.computedAnnual},"${statusLabel}",${item.courses.length},${item.totalStudents}\n`;
      });
    } else if (activeSubTab === 'student') {
      csvContent += '순위,학생명,학번,전공,학년,신청과목수,주당총수강시간(시간)\n';
      studentStats.forEach((item, idx) => {
        csvContent += `${idx + 1},"${item.student.name}","${item.student.studentId}","${item.student.major}","${item.student.grade}",${item.courseCount},${item.totalHours}\n`;
      });
    } else if (activeSubTab === 'category') {
      csvContent += '분야(과목카테고리),개설강좌수,총수업시간(시간),총수강생수\n';
      categoryStats.forEach(item => {
        csvContent += `"${item.category}",${item.courseCount},${item.totalHours},${item.totalStudents}\n`;
      });
    } else {
      csvContent += '요일,강좌수,총수업시간(시간)\n';
      dayStats.forEach(item => {
        csvContent += `"${item.day}요일",${item.courseCount},${item.totalHours}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `classtime-${activeSubTab}-stats-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Find max values for visual percentage bar scales
  const maxInstWeeklyHours = Math.max(...instructorStats.map(i => i.weeklyHours), 1);
  const maxInstMonthlyHours = Math.max(...instructorStats.map(i => i.weeklyHours * weeksPerMonth), 1);
  const maxInstAnnualHours = Math.max(...instructorStats.map(i => i.weeklyHours * weeksPerYear), 1);
  const maxStudentHours = Math.max(...studentStats.map(s => s.totalHours), 1);
  const maxCategoryHours = Math.max(...categoryStats.map(c => c.totalHours), 1);
  const maxDayHours = Math.max(...dayStats.map(d => d.totalHours), 1);

  return (
    <div className="space-y-6">
      {/* Top Header Summary Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>종합 분석</span>
            <span>·</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">교관 일일·월별·년간 강의시간 종합 모니터링</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>교관별 및 학사 시수 통합 통계</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            교관별 <strong>일일시간</strong>, <strong>월별시간</strong>, <strong>년간강의시간</strong>을 동시에 비교하고 시수 규정 준수 여부를 확인합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV 통계 다운로드</span>
          </button>
          <button
            onClick={exportDataJson}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>백업 JSON</span>
          </button>
          <button
            onClick={() => {
              if (confirm('초기 데모 데이터셋으로 복원하시겠습니까?')) {
                resetToDefault();
              }
            }}
            className="p-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="데이터 초기화"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Universal Export (Excel/PDF) + Import Template + Import Upload Toolbar */}
      <DataActionToolbar
        entityType={activeSubTab === 'student' ? 'student' : activeSubTab === 'instructor' ? 'instructor' : 'course'}
      />

      {/* 4 Core Simultaneous Horizon KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Daily Max Metric */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">📅 교관 1일 최고 시수 (평균)</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {avgDailyMax} <span className="text-sm font-normal text-slate-500">시간/일</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>1일 최대 상한: 6시간</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">규정 준수</span>
          </div>
        </div>

        {/* 2. Weekly Total Metric */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">⏱️ 교관 주간 총 강의시간</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {totalLectureHours} <span className="text-sm font-normal text-slate-500">시간/주</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            교관 1인당 평균 {avgInstructorHours}h (상한 20h)
          </div>
        </div>

        {/* 3. Monthly Total Metric */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">🗓️ 전체 월별 강의시간 합계</span>
            <CalendarRange className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {totalMonthlyHours} <span className="text-sm font-normal text-slate-500">시간/월</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            월 {weeksPerMonth}주 환산 기준 (교관 평균 {(totalMonthlyHours / (instructors.length || 1)).toFixed(1)}h)
          </div>
        </div>

        {/* 4. Annual Total Metric */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">🌟 전체 년간 강의시간 합계</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
            {totalAnnualHours.toLocaleString()} <span className="text-sm font-normal text-slate-500">시간/년</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            연간 {weeksPerYear}주 훈련 기준 (교관 평균 {(totalAnnualHours / (instructors.length || 1)).toFixed(1)}h)
          </div>
        </div>
      </div>

      {/* Tabs for In-depth view: Instructor, Student, Category, Day */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('instructor')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              activeSubTab === 'instructor'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            👨‍✈️ 교관별 일일·월별·년간 강의시간 ({instructorStats.length}명)
          </button>
          <button
            onClick={() => setActiveSubTab('student')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              activeSubTab === 'student'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🎓 학생별 수강 시수 통계 ({studentStats.length}명)
          </button>
          <button
            onClick={() => setActiveSubTab('category')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              activeSubTab === 'category'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            📚 과목/분야별 총 시간 통계 ({categoryStats.length}개 분야)
          </button>
          <button
            onClick={() => setActiveSubTab('day')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              activeSubTab === 'day'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            📅 요일별 시간 분포
          </button>
          <button
            onClick={() => setActiveSubTab('evaluation')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              activeSubTab === 'evaluation'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ⭐ 강의 평가 및 만족도 ({reviews.length}건)
          </button>
        </div>

        {/* Tab 1: INSTRUCTOR STATS (일일 · 월별 · 년간 동시 가시화 대시보드) */}
        {activeSubTab === 'instructor' && (
          <div className="p-6 space-y-6">
            {/* Top Toolbar: Search, Basis Toggles, Sorting, and View Switcher */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="교관명, 부서명, 강의과목 검색..."
                  value={instructorSearch}
                  onChange={e => setInstructorSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Controls: Basis Multipliers, Sort & View Mode */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Year Basis */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[11px]">연간기준:</span>
                  <select
                    value={weeksPerYear}
                    onChange={e => setWeeksPerYear(Number(e.target.value))}
                    className="bg-transparent font-semibold text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer"
                  >
                    <option value={40}>40주 (정규+계절훈련)</option>
                    <option value={32}>32주 (정규 2개 학기)</option>
                    <option value={48}>48주 (12개월 전일제)</option>
                  </select>
                </div>

                {/* Month Basis */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[11px]">월간기준:</span>
                  <select
                    value={weeksPerMonth}
                    onChange={e => setWeeksPerMonth(Number(e.target.value))}
                    className="bg-transparent font-semibold text-emerald-600 dark:text-emerald-400 focus:outline-none cursor-pointer"
                  >
                    <option value={4}>4주 (월 표준)</option>
                    <option value={4.33}>4.33주 (달력 평균)</option>
                  </select>
                </div>

                {/* Sort Option */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[11px]">정렬:</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="bg-transparent font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="annual">년간 시수 높은순</option>
                    <option value="monthly">월별 시수 높은순</option>
                    <option value="weekly">주간 시수 높은순</option>
                    <option value="daily">1일 최고 시수순</option>
                    <option value="name">교관명 가나다순</option>
                  </select>
                  <button
                    onClick={() => setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                    className="p-0.5 text-slate-500 hover:text-slate-900 transition-colors"
                    title={sortDirection === 'desc' ? '내림차순' : '오름차순'}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* View Switcher: Card vs Table */}
                <div className="flex items-center bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg">
                  <button
                    onClick={() => setInstructorViewMode('card')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      instructorViewMode === 'card'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>동시 카드</span>
                  </button>
                  <button
                    onClick={() => setInstructorViewMode('table')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      instructorViewMode === 'table'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Table2 className="w-3.5 h-3.5" />
                    <span>전체 표</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Instruction Callout */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200">
              <Info className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
              <div>
                <span className="font-semibold">동시 가시화 기준 안내:</span> 교관별로 
                <span className="font-bold underline decoration-indigo-400 mx-1">일일시간(월~토 요일별 & 최고치)</span>,
                <span className="font-bold underline decoration-indigo-400 mx-1">주간 총시간</span>,
                <span className="font-bold underline decoration-indigo-400 mx-1">월별시간({weeksPerMonth}주 환산)</span>,
                <span className="font-bold underline decoration-indigo-400 mx-1">년간강의시간({weeksPerYear}주 환산)</span>이
                실시간으로 동시에 집계되어 한눈에 비교됩니다.
              </div>
            </div>

            {/* VIEW MODE 1: SIMULTANEOUS CARD DASHBOARD */}
            {instructorViewMode === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredAndSortedInstructors.map((item, index) => {
                  const d = item.dailyHours;
                  const isDailyDanger = item.maxDailyHours > MAX_DAILY_INSTRUCTOR_HOURS;
                  const isWeeklyDanger = item.weeklyHours > MAX_WEEKLY_INSTRUCTOR_HOURS;
                  const isDanger = isDailyDanger || isWeeklyDanger;
                  const isCaution = !isDanger && (item.maxDailyHours >= 5 || item.weeklyHours >= 16);

                  const dailyBarPercent = Math.min(100, Math.round((item.maxDailyHours / MAX_DAILY_INSTRUCTOR_HOURS) * 100));
                  const weeklyBarPercent = Math.min(100, Math.round((item.weeklyHours / MAX_WEEKLY_INSTRUCTOR_HOURS) * 100));
                  const annualPercent = Math.min(100, Math.round((item.computedAnnual / (MAX_WEEKLY_INSTRUCTOR_HOURS * weeksPerYear)) * 100));

                  return (
                    <div
                      key={item.instructor.id}
                      className={`rounded-2xl border transition-all p-5 space-y-4 shadow-2xs relative ${
                        isDanger
                          ? 'border-rose-400 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/20'
                          : isCaution
                          ? 'border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      {/* Card Top: Avatar, Name, Department, Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-11 h-11 rounded-xl ${item.instructor.avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0`}
                          >
                            {item.instructor.name[0]}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {item.instructor.name}
                              </h4>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                                #{index + 1}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {item.instructor.department}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {isDanger ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              <span>🚨 시수 초과</span>
                            </span>
                          ) : isCaution ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>주의 (근접)</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>규정 준수</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* SIMULTANEOUS 4-BLOCK METRIC STRIP (일일 · 주간 · 월별 · 년간 동시 표시) */}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                        {/* 1. 일일 강의시간 */}
                        <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50">
                          <div className="flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 mb-1">
                            <span className="font-semibold flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-amber-600" />
                              1일 최고 시수
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">상한 6h</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-lg font-bold font-mono ${isDailyDanger ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'}`}>
                              {item.maxDailyHours}
                            </span>
                            <span className="text-xs text-slate-500">시간/일</span>
                            {item.maxDailyHours > 0 && (
                              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-mono ml-auto">
                                ({item.maxDailyDay}요일)
                              </span>
                            )}
                          </div>
                          {/* Daily Progress */}
                          <div className="w-full h-1 bg-amber-200/50 dark:bg-amber-950 rounded-full overflow-hidden mt-1.5">
                            <div
                              style={{ width: `${dailyBarPercent}%` }}
                              className={`h-full rounded-full ${isDailyDanger ? 'bg-rose-600' : 'bg-amber-500'}`}
                            />
                          </div>
                        </div>

                        {/* 2. 주간 총 강의시간 */}
                        <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-800/50">
                          <div className="flex items-center justify-between text-[11px] text-indigo-800 dark:text-indigo-300 mb-1">
                            <span className="font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-indigo-600" />
                              주간 총 시수
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">상한 20h</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-lg font-bold font-mono ${isWeeklyDanger ? 'text-rose-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
                              {item.weeklyHours}
                            </span>
                            <span className="text-xs text-slate-500">시간/주</span>
                            <span className="text-[10px] text-slate-400 font-mono ml-auto">
                              {weeklyBarPercent}%
                            </span>
                          </div>
                          {/* Weekly Progress */}
                          <div className="w-full h-1 bg-indigo-200/50 dark:bg-indigo-950 rounded-full overflow-hidden mt-1.5">
                            <div
                              style={{ width: `${weeklyBarPercent}%` }}
                              className={`h-full rounded-full ${isWeeklyDanger ? 'bg-rose-600' : 'bg-indigo-600'}`}
                            />
                          </div>
                        </div>

                        {/* 3. 월별 강의시간 */}
                        <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/50">
                          <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 mb-1">
                            <span className="font-semibold flex items-center gap-1">
                              <CalendarRange className="w-3 h-3 text-emerald-600" />
                              월별 강의시간
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{weeksPerMonth}주 환산</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
                              {item.computedMonthly}
                            </span>
                            <span className="text-xs text-slate-500">시간/월</span>
                          </div>
                          {/* Monthly Progress against 80h standard */}
                          <div className="w-full h-1 bg-emerald-200/50 dark:bg-emerald-950 rounded-full overflow-hidden mt-1.5">
                            <div
                              style={{ width: `${Math.min(100, Math.round((item.computedMonthly / 80) * 100))}%` }}
                              className="h-full rounded-full bg-emerald-500"
                            />
                          </div>
                        </div>

                        {/* 4. 년간 강의시간 */}
                        <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-800/50">
                          <div className="flex items-center justify-between text-[11px] text-purple-800 dark:text-purple-300 mb-1">
                            <span className="font-semibold flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-purple-600" />
                              년간 강의시간
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{weeksPerYear}주 환산</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold font-mono text-purple-700 dark:text-purple-400">
                              {item.computedAnnual}
                            </span>
                            <span className="text-xs text-slate-500">시간/년</span>
                          </div>
                          {/* Annual Progress */}
                          <div className="w-full h-1 bg-purple-200/50 dark:bg-purple-950 rounded-full overflow-hidden mt-1.5">
                            <div
                              style={{ width: `${annualPercent}%` }}
                              className="h-full rounded-full bg-purple-600"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Day-by-Day (월~토) Detailed Breakdown Pills */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>요일별 일일 강의시간 분포</span>
                          <span className="text-[10px] font-mono text-slate-400">월 ~ 토요일</span>
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {(['월', '화', '수', '목', '금', '토'] as DayOfWeek[]).map(day => {
                            const hours = d[day] || 0;
                            const isExceeded = hours > MAX_DAILY_INSTRUCTOR_HOURS;
                            const hasClass = hours > 0;
                            return (
                              <div
                                key={day}
                                className={`text-center py-1.5 px-1 rounded-lg border text-xs font-mono transition-colors ${
                                  isExceeded
                                    ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-400 text-rose-700 dark:text-rose-300 font-bold'
                                    : hasClass
                                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold'
                                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600'
                                }`}
                              >
                                <div className="text-[10px] font-sans font-medium text-slate-500">{day}</div>
                                <div>{hours > 0 ? `${hours}h` : '-'}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer: Courses & Action Link */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span>담당 {item.courses.length}개 과목</span>
                          <span>·</span>
                          <span>수강생 {item.totalStudents}명</span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedInstructorId(item.instructor.id);
                            setActiveTab('instructor_schedule');
                          }}
                          className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          <span>시간표 조회</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW MODE 2: SIMULTANEOUS EXECUTIVE MATRIX TABLE */}
            {instructorViewMode === 'table' && (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                      <th className="py-3 px-3 font-semibold text-center w-12">순위</th>
                      <th className="py-3 px-3 font-semibold">교관명</th>
                      <th className="py-3 px-3 font-semibold">소속 학과</th>
                      <th className="py-3 px-2 font-semibold text-center bg-amber-50/50 dark:bg-amber-950/20" colSpan={7}>
                        📅 일일 강의시간 (월 · 화 · 수 · 목 · 금 · 토 · 1일최고)
                      </th>
                      <th className="py-3 px-3 font-semibold text-right bg-indigo-50/50 dark:bg-indigo-950/20">
                        ⏱️ 주간 총 시수
                      </th>
                      <th className="py-3 px-3 font-semibold text-right bg-emerald-50/50 dark:bg-emerald-950/20">
                        🗓️ 월별시간 ({weeksPerMonth}주)
                      </th>
                      <th className="py-3 px-3 font-semibold text-right bg-purple-50/50 dark:bg-purple-950/20">
                        🌟 년간시간 ({weeksPerYear}주)
                      </th>
                      <th className="py-3 px-3 font-semibold text-center">시수 규정상태</th>
                      <th className="py-3 px-3 font-semibold text-center">강좌/수강생</th>
                      <th className="py-3 px-3 font-semibold text-center">조회</th>
                    </tr>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 bg-slate-50/30 dark:bg-slate-800/30">
                      <th></th>
                      <th></th>
                      <th></th>
                      <th className="py-1 px-1.5 text-center font-mono">월</th>
                      <th className="py-1 px-1.5 text-center font-mono">화</th>
                      <th className="py-1 px-1.5 text-center font-mono">수</th>
                      <th className="py-1 px-1.5 text-center font-mono">목</th>
                      <th className="py-1 px-1.5 text-center font-mono">금</th>
                      <th className="py-1 px-1.5 text-center font-mono">토</th>
                      <th className="py-1 px-2 text-center font-bold text-amber-700 dark:text-amber-300 font-mono">1일최고</th>
                      <th className="py-1 px-3 text-right text-indigo-700 dark:text-indigo-300 font-mono">상한 20h</th>
                      <th className="py-1 px-3 text-right text-emerald-700 dark:text-emerald-300 font-mono">월 환산</th>
                      <th className="py-1 px-3 text-right text-purple-700 dark:text-purple-300 font-mono">연 환산</th>
                      <th></th>
                      <th></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAndSortedInstructors.map((item, index) => {
                      const d = item.dailyHours;
                      const isDailyDanger = item.maxDailyHours > MAX_DAILY_INSTRUCTOR_HOURS;
                      const isWeeklyDanger = item.weeklyHours > MAX_WEEKLY_INSTRUCTOR_HOURS;
                      const isDanger = isDailyDanger || isWeeklyDanger;
                      const isCaution = !isDanger && (item.maxDailyHours >= 5 || item.weeklyHours >= 16);

                      return (
                        <tr
                          key={item.instructor.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                            {index + 1}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded-lg ${item.instructor.avatarBg} text-white flex items-center justify-center font-bold text-[10px] shrink-0`}
                              >
                                {item.instructor.name[0]}
                              </span>
                              <span>{item.instructor.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {item.instructor.department}
                          </td>

                          {/* Daily columns: 월, 화, 수, 목, 금, 토 */}
                          {(['월', '화', '수', '목', '금', '토'] as DayOfWeek[]).map(day => {
                            const hours = d[day] || 0;
                            return (
                              <td
                                key={day}
                                className={`py-3 px-1.5 text-center font-mono ${
                                  hours > MAX_DAILY_INSTRUCTOR_HOURS
                                    ? 'text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40'
                                    : hours > 0
                                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                                    : 'text-slate-300 dark:text-slate-600'
                                }`}
                              >
                                {hours > 0 ? `${hours}h` : '-'}
                              </td>
                            );
                          })}

                          {/* 1일 최고 시수 */}
                          <td className="py-3 px-2 text-center font-mono font-bold bg-amber-50/30 dark:bg-amber-950/10">
                            <span
                              className={`px-1.5 py-0.5 rounded-md ${
                                isDailyDanger
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 font-bold'
                                  : 'text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              {item.maxDailyHours}시간
                            </span>
                          </td>

                          {/* 주간 총 시수 */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm bg-indigo-50/20 dark:bg-indigo-950/10">
                            <span className={isWeeklyDanger ? 'text-rose-600 animate-pulse' : ''}>
                              {item.weeklyHours}시간
                            </span>
                          </td>

                          {/* 월별 강의시간 */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm bg-emerald-50/20 dark:bg-emerald-950/10">
                            {item.computedMonthly}시간
                          </td>

                          {/* 년간 강의시간 */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400 text-sm bg-purple-50/20 dark:bg-purple-950/10">
                            {item.computedAnnual}시간
                          </td>

                          {/* 상태 규정 */}
                          <td className="py-3 px-3 text-center">
                            {isDanger ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                🚨 초과
                              </span>
                            ) : isCaution ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                ⚠️ 주의
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                ✅ 준수
                              </span>
                            )}
                          </td>

                          {/* 강좌 및 학생 수 */}
                          <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400 font-mono">
                            {item.courses.length}개 / {item.totalStudents}명
                          </td>

                          {/* 일정표 조회 버튼 */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedInstructorId(item.instructor.id);
                                setActiveTab('instructor_schedule');
                              }}
                              className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                            >
                              일정표
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: STUDENT STATS */}
        {activeSubTab === 'student' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                학생별 수강 과목 수 & 주당 학습 시간 현황
              </h3>
              <span className="text-xs text-slate-500">
                적정 학습량 기준 (권장 10~18시간)
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 pb-2">
                    <th className="py-2.5 px-3 font-semibold w-12 text-center">순위</th>
                    <th className="py-2.5 px-3 font-semibold">학생명</th>
                    <th className="py-2.5 px-3 font-semibold">학번</th>
                    <th className="py-2.5 px-3 font-semibold">전공 / 학년</th>
                    <th className="py-2.5 px-3 font-semibold text-center">신청 과목수</th>
                    <th className="py-2.5 px-3 font-semibold text-right">주당 수강시간</th>
                    <th className="py-2.5 px-3 font-semibold w-44">수강 시수 그래프</th>
                    <th className="py-2.5 px-3 font-semibold text-center">학업 상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentStats.map((item, index) => {
                    const barWidth = ((item.totalHours / maxStudentHours) * 100).toFixed(0);
                    const status =
                      item.totalHours >= 10 && item.totalHours <= 18
                        ? { label: '적정 이수', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' }
                        : item.totalHours < 10
                        ? { label: '추가 신청 권장', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' }
                        : { label: '과중 이수 주의', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' };

                    return (
                      <tr key={item.student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full ${item.student.avatarBg} text-white flex items-center justify-center font-bold text-[10px]`}>
                              {item.student.name[0]}
                            </span>
                            <span>{item.student.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">
                          {item.student.studentId}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {item.student.major} · {item.student.grade}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {item.courseCount}과목
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                          {item.totalHours}시간
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${barWidth}%` }}
                                className="h-full bg-emerald-500 rounded-full"
                              />
                            </div>
                            <span className="font-mono text-[11px] text-slate-400 w-8 text-right">
                              {item.totalHours}h
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: CATEGORY / SUBJECT STATS */}
        {activeSubTab === 'category' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                과목 분야(전공)별 총 개설 시간 및 학생 참여도
              </h3>
              <span className="text-xs text-slate-500">
                분야별 커리큘럼 배분 현황
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 pb-2">
                    <th className="py-2.5 px-3 font-semibold">과목 분야 (카테고리)</th>
                    <th className="py-2.5 px-3 font-semibold text-center">개설 강좌 수</th>
                    <th className="py-2.5 px-3 font-semibold text-right">총 수업 시간</th>
                    <th className="py-2.5 px-3 font-semibold w-56">시간 점유율</th>
                    <th className="py-2.5 px-3 font-semibold text-right">총 수강 인원</th>
                    <th className="py-2.5 px-3 font-semibold text-right">강좌당 평균 시간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {categoryStats.map(item => {
                    const percent = totalLectureHours > 0 ? ((item.totalHours / totalLectureHours) * 100).toFixed(1) : 0;
                    const barWidth = ((item.totalHours / maxCategoryHours) * 100).toFixed(0);
                    const avgTime = item.courseCount > 0 ? (item.totalHours / item.courseCount).toFixed(1) : 0;

                    return (
                      <tr key={item.category} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                          {item.category}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {item.courseCount}개
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                          {item.totalHours}시간
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${barWidth}%` }}
                                className="h-full bg-indigo-500 rounded-full"
                              />
                            </div>
                            <span className="font-mono text-[11px] text-slate-400 w-12 text-right">
                              {percent}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {item.totalStudents}명
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {avgTime}h
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: DAY OF WEEK STATS */}
        {activeSubTab === 'day' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                요일별 강의 편성 및 수업시간 분포
              </h3>
              <span className="text-xs text-slate-500">
                주간 부하 집중도 분석
              </span>
            </div>

            {/* Visual Bar Columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {dayStats.map(item => {
                const percent = totalLectureHours > 0 ? ((item.totalHours / totalLectureHours) * 100).toFixed(0) : 0;
                const barHeight = maxDayHours > 0 ? ((item.totalHours / maxDayHours) * 100).toFixed(0) : 0;

                return (
                  <div
                    key={item.day}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {item.day}요일
                      </div>
                      <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                        {item.totalHours}시간
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.courseCount}개 강의
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="h-20 w-full bg-slate-200 dark:bg-slate-800 rounded-lg flex items-end p-1">
                        <div
                          style={{ height: `${barHeight}%` }}
                          className="w-full bg-indigo-600 rounded-md transition-all"
                        />
                      </div>
                      <div className="text-center font-mono text-[10px] text-slate-400 mt-1">
                        점유율 {percent}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 5: COURSE EVALUATIONS & SATISFACTION STATS */}
        {activeSubTab === 'evaluation' && (() => {
          const totalReviewsCount = reviews.length;
          const avgScore = totalReviewsCount > 0
            ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviewsCount).toFixed(2))
            : 0;

          // Star distribution across institution
          const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          reviews.forEach(r => {
            const s = Math.min(5, Math.max(1, Math.round(r.rating)));
            distribution[s] = (distribution[s] || 0) + 1;
          });

          // Tag frequencies
          const tagCounts: Record<string, number> = {};
          reviews.forEach(r => {
            (r.tags || []).forEach(t => {
              tagCounts[t] = (tagCounts[t] || 0) + 1;
            });
          });
          const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

          // Instructor satisfaction ranking
          const instructorRankings = instructors.map(inst => {
            const ratingInfo = getInstructorAverageRating(inst.id);
            const instCourses = courses.filter(c => c.instructorId === inst.id);
            return {
              instructor: inst,
              coursesCount: instCourses.length,
              averageRating: ratingInfo.average,
              reviewCount: ratingInfo.count,
            };
          }).sort((a, b) => {
            if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
            return b.reviewCount - a.reviewCount;
          });

          return (
            <div className="p-6 space-y-6">
              {/* Evaluation KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50">
                  <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-medium mb-1">
                    <span>전체 강의 평균 만족도</span>
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                    ★ {avgScore > 0 ? avgScore : '0.00'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    5.00점 만점 기준 (총 {totalReviewsCount}건 평가)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50">
                  <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium mb-1">
                    만족 이상 (4~5★) 비율
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    {totalReviewsCount > 0
                      ? `${Math.round(((distribution[5] + distribution[4]) / totalReviewsCount) * 100)}%`
                      : '0%'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    5점 {distribution[5]}건 · 4점 {distribution[4]}건
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50">
                  <div className="text-xs text-indigo-800 dark:text-indigo-300 font-medium mb-1">
                    평가 참여 수강생
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                    {new Set(reviews.map(r => r.studentId)).size}명
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    전체 재학생 대비 높은 피드백 참여율
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50">
                  <div className="text-xs text-purple-800 dark:text-purple-300 font-medium mb-1">
                    최다 호평 피드백 키워드
                  </div>
                  <div className="text-lg font-bold text-purple-700 dark:text-purple-300 truncate">
                    {topTags[0] ? `"${topTags[0][0]}"` : '-'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {topTags[0] ? `총 ${topTags[0][1]}회 수강생 선택` : '키워드 데이터 없음'}
                  </div>
                </div>
              </div>

              {/* Institution Rating Distribution & Keywords */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribution Bars */}
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    별점 평점별 종합 분포 현황
                  </h4>
                  <div className="space-y-2 pt-1 text-xs">
                    {[5, 4, 3, 2, 1].map(score => {
                      const count = distribution[score] || 0;
                      const pct = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
                      return (
                        <div key={score} className="flex items-center gap-3">
                          <span className="w-12 font-mono font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            {score}점
                          </span>
                          <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-16 font-mono text-right text-slate-500 dark:text-slate-400">
                            {count}건 ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Feedback Keywords Cloud */}
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    수강생 추천 키워드 순위
                  </h4>
                  {topTags.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">등록된 키워드가 없습니다.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {topTags.map(([tag, count], idx) => (
                        <div
                          key={tag}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs flex items-center gap-1.5"
                        >
                          <span className="font-semibold">{tag}</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-indigo-200/70 dark:bg-indigo-800 text-[10px] font-mono">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Instructor Satisfaction Ranking Table */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  교관별 강의 만족도 순위 현황
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="py-3 px-4 font-semibold">순위</th>
                        <th className="py-3 px-4 font-semibold">교관명</th>
                        <th className="py-3 px-4 font-semibold">소속 학부</th>
                        <th className="py-3 px-4 font-semibold text-center">개설 과목</th>
                        <th className="py-3 px-4 font-semibold text-center">평균 만족도 평점</th>
                        <th className="py-3 px-4 font-semibold text-center">평가 건수</th>
                        <th className="py-3 px-4 font-semibold text-right">일정 바로가기</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {instructorRankings.map((item, idx) => (
                        <tr key={item.instructor.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-slate-400">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {item.instructor.name}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {item.instructor.department}
                          </td>
                          <td className="py-3 px-4 font-mono text-center">
                            {item.coursesCount}과목
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.reviewCount > 0 ? (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                {item.averageRating}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-center text-slate-600 dark:text-slate-300">
                            {item.reviewCount}건
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedInstructorId(item.instructor.id);
                                setActiveTab('instructor_schedule');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold transition-colors"
                            >
                              일정·평가 보기
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Student Review Feed */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  실시간 수강생 강의 평가 & 코멘트 피드 ({reviews.length}건)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map(rev => {
                    const targetCourse = courses.find(c => c.id === rev.courseId);
                    return (
                      <div
                        key={rev.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {targetCourse?.name || '강의'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {targetCourse?.instructorName} · {targetCourse?.category}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                              <span>{rev.rating}.0</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {rev.createdAt.slice(0, 10)}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                          "{rev.comment}"
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                          <span className="text-slate-400">
                            작성자: <strong className="text-slate-600 dark:text-slate-300">{rev.isAnonymous ? '익명 수강생' : rev.studentName}</strong>
                          </span>
                          {rev.tags && rev.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {rev.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
