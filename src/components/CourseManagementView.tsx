import React, { useState, useMemo } from 'react';
import { Course } from '../types';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, Clock, MapPin, Users, Search, AlertCircle } from 'lucide-react';
import { CourseModal } from './CourseModal';
import { DAYS_OF_WEEK } from '../data/mockData';

export const CourseManagementView: React.FC = () => {
  const { courses, instructors, deleteCourse, getCourseEnrollmentCount } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedDay, setSelectedDay] = useState('전체');

  // Modal
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const categories = useMemo(() => {
    const set = new Set(courses.map(c => c.category));
    return ['전체', ...Array.from(set)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.instructorName.toLowerCase().includes(q) ||
        c.room.toLowerCase().includes(q);

      const matchCat = selectedCategory === '전체' || c.category === selectedCategory;
      const matchDay = selectedDay === '전체' || c.day === selectedDay;

      return matchQ && matchCat && matchDay;
    }).sort((a, b) => {
      const dayOrder = { 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };
      if (dayOrder[a.day] !== dayOrder[b.day]) {
        return dayOrder[a.day] - dayOrder[b.day];
      }
      return a.startTime.localeCompare(b.startTime);
    });
  }, [courses, searchQuery, selectedCategory, selectedDay]);

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedCourse(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleDelete = (course: Course) => {
    if (confirm(`'${course.name}' (${course.code}) 강의를 삭제하시겠습니까? 관련 수강신청 내역도 모두 삭제됩니다.`)) {
      deleteCourse(course.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>관리자 권한</span>
            <span>·</span>
            <span>강의시간표 개설 및 편성</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            강의 및 시간표 편성 관리
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            새로운 과목을 개설하거나 요일/시간을 수정하고 강사를 배정합니다.
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>신규 강의 개설하기</span>
        </button>
      </div>

      {/* Filter strip */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="과목명, 코드, 강사명 또는 강의실 검색..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <span>총 {filteredCourses.length}개 강좌</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-slate-400 mr-1 text-[11px]">요일:</span>
            {['전체', ...DAYS_OF_WEEK].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-2 py-1 rounded-md text-xs transition-colors ${
                  selectedDay === d
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-500">
                <th className="py-3 px-4 font-semibold">과목코드</th>
                <th className="py-3 px-4 font-semibold">강의명</th>
                <th className="py-3 px-4 font-semibold">분야</th>
                <th className="py-3 px-4 font-semibold">담당 강사</th>
                <th className="py-3 px-4 font-semibold">요일 및 시간</th>
                <th className="py-3 px-4 font-semibold">강의실</th>
                <th className="py-3 px-4 font-semibold text-center">수강 / 정원</th>
                <th className="py-3 px-4 font-semibold text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    조건에 해당하는 강좌가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => {
                  const enrolledCount = getCourseEnrollmentCount(c.id);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {c.code}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {c.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {c.category}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                        {c.instructorName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">{c.day}</span> {c.startTime}~{c.endTime} ({c.durationHours}h)
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {c.room}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{enrolledCount}</span> / {c.maxCapacity}명
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="강의 수정"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="강의 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CourseModal
        isOpen={isModalOpen}
        course={selectedCourse}
        isEditMode={isEditMode}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
