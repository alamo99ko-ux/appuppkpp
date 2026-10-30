import React, { useState, useMemo } from 'react';
import { Course } from '../types';
import { useApp } from '../context/AppContext';
import { Clock, MapPin, User, BookOpen, Trash2, Printer, PlusCircle, CheckCircle2 } from 'lucide-react';
import { CourseModal } from './CourseModal';
import { DAYS_OF_WEEK } from '../data/mockData';

export const StudentScheduleView: React.FC = () => {
  const {
    students,
    selectedStudentId,
    setSelectedStudentId,
    getStudentEnrolledCourses,
    cancelEnrollment,
    setActiveTab,
  } = useApp();

  const [selectedCourseForModal, setSelectedCourseForModal] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentStudent = students.find(s => s.id === selectedStudentId) || students[0];
  const enrolledCourses = useMemo(() => {
    return getStudentEnrolledCourses(currentStudent.id).sort((a, b) => {
      const dayOrder = { 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };
      if (dayOrder[a.day] !== dayOrder[b.day]) {
        return dayOrder[a.day] - dayOrder[b.day];
      }
      return a.startTime.localeCompare(b.startTime);
    });
  }, [getStudentEnrolledCourses, currentStudent.id]);

  const totalWeeklyHours = useMemo(() => {
    return Number(enrolledCourses.reduce((sum, c) => sum + (c.durationHours || 0), 0).toFixed(1));
  }, [enrolledCourses]);

  const handleDrop = (course: Course) => {
    if (confirm(`'${course.name}' 수강을 취소하시겠습니까?`)) {
      cancelEnrollment(course.id, currentStudent.id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Student Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className={`w-14 h-14 rounded-2xl ${currentStudent.avatarBg} text-white flex items-center justify-center font-bold text-xl shadow-xs`}>
              {currentStudent.name[0]}
            </span>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono">{currentStudent.studentId}</span>
                <span>·</span>
                <span>{currentStudent.major}</span>
                <span>·</span>
                <span>{currentStudent.grade}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {currentStudent.name}님의 맞춤 수업 시간표
              </h2>
              <div className="text-xs text-slate-500 mt-1">
                {currentStudent.email}
              </div>
            </div>
          </div>

          {/* Student Stats & Actions */}
          <div className="flex items-center gap-3">
            <div className="p-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-center">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">수강 중인 과목</div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {enrolledCourses.length}과목
              </div>
            </div>
            <div className="p-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-center">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">주당 총 수업시간</div>
              <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {totalWeeklyHours}시간
              </div>
            </div>
            <button
              onClick={() => setActiveTab('enrollment')}
              className="px-3.5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>강의 추가 신청</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              title="시간표 인쇄"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Student Switcher for multi-student preview */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">학생 전환:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {students.map(stud => (
              <button
                key={stud.id}
                onClick={() => setSelectedStudentId(stud.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedStudentId === stud.id
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {stud.name} ({stud.major})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Week distribution bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {DAYS_OF_WEEK.map(d => {
          const dayClasses = enrolledCourses.filter(c => c.day === d);
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
                {dayClasses.length > 0 ? `${dayClasses.length}과목` : '수업 없음'}
              </div>
            </div>
          );
        })}
      </div>

      {/* List of Enrolled Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            수강 신청 완료 과목 목록 ({enrolledCourses.length}개)
          </h3>
          <span className="text-xs text-slate-500">
            주당 총 학습 시간: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{totalWeeklyHours}</strong>시간
          </span>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-slate-500 text-sm">현재 수강신청한 과목이 없습니다.</p>
            <button
              onClick={() => setActiveTab('enrollment')}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-2xs transition-colors"
            >
              수강신청 페이지로 이동하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrolledCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {course.code}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      신청 완료
                    </span>
                  </div>

                  <h4
                    onClick={() => {
                      setSelectedCourseForModal(course);
                      setIsModalOpen(true);
                    }}
                    className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 cursor-pointer transition-colors"
                  >
                    {course.name}
                  </h4>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>
                        매주 <strong>{course.day}요일</strong> {course.startTime} ~ {course.endTime}
                        <span className="font-mono text-slate-400 ml-1">({course.durationHours}h)</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{course.room}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{course.instructorName}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedCourseForModal(course);
                      setIsModalOpen(true);
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    강의계획서 보기
                  </button>
                  <button
                    onClick={() => handleDrop(course)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    수강 취소
                  </button>
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
