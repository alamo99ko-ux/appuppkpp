/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { TimetableView } from './components/TimetableView';
import { CourseEnrollmentView } from './components/CourseEnrollmentView';
import { InstructorScheduleView } from './components/InstructorScheduleView';
import { StudentScheduleView } from './components/StudentScheduleView';
import { StatisticsView } from './components/StatisticsView';
import { CourseManagementView } from './components/CourseManagementView';
import { SchedulerStudioView } from './components/SchedulerStudioView';
import { DataImportExportView } from './components/DataImportExportView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { GraduationCap, UserCircle, Settings, Calendar, Clock, BookOpen, AlertOctagon } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    activeTab,
    role,
    setRole,
    students,
    instructors,
    selectedStudentId,
    selectedInstructorId,
    totalLectureHours,
    courses,
    allInstructorWorkloads,
  } = useApp();

  const currentStudent = students.find(s => s.id === selectedStudentId);
  const currentInstructor = instructors.find(i => i.id === selectedInstructorId);
  const hasDangerInstructor = allInstructorWorkloads.some(w => w.status === 'danger');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Header />

      {/* Role Context Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">현재 작업 공간:</span>
            {role === 'student' && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-md">
                <GraduationCap className="w-3.5 h-3.5" />
                학생: {currentStudent?.name} ({currentStudent?.grade} · {currentStudent?.major})
              </span>
            )}
            {role === 'instructor' && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md">
                <UserCircle className="w-3.5 h-3.5" />
                강사: {currentInstructor?.name} ({currentInstructor?.department})
              </span>
            )}
            {role === 'admin' && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                <Settings className="w-3.5 h-3.5" />
                관리자 (시간표 편성 & 강사 시수 가드레일)
                {hasDangerInstructor && (
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-rose-600 text-white font-bold animate-pulse flex items-center gap-1">
                    <AlertOctagon className="w-3 h-3" />
                    시수 초과 경고등
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-indigo-500" />
              전체 개설 강좌: <strong className="font-mono text-slate-800 dark:text-slate-200">{courses.length}</strong>개
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-500" />
              주간 총 수업시수: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{totalLectureHours}</strong>시간
            </span>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {activeTab === 'timetable' && <TimetableView />}
        {activeTab === 'enrollment' && <CourseEnrollmentView />}
        {activeTab === 'instructor_schedule' && <InstructorScheduleView />}
        {activeTab === 'student_schedule' && <StudentScheduleView />}
        {activeTab === 'scheduler_studio' && <SchedulerStudioView />}
        {activeTab === 'data_management' && <DataImportExportView />}
        {activeTab === 'statistics' && <StatisticsView />}
        {activeTab === 'manage_courses' && <CourseManagementView />}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Desktop Footer */}
      <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-300">ClassTime</span>
            <span>·</span>
            <span>강의시간표 및 수강신청 통합 관리 시스템</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>강사별 / 학생별 / 과목별 시간 통계 제공</span>
            <span>·</span>
            <span>모바일 반응형 웹앱</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
