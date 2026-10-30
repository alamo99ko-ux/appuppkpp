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
import { CourseMaterialsView } from './components/CourseMaterialsView';
import { AbsenceManagementView } from './components/AbsenceManagementView';
import { ProgramManagementView } from './components/ProgramManagementView';
import { AccessLogView } from './components/AccessLogView';
import { PasscodeGate } from './components/PasscodeGate';
import { MobileBottomNav } from './components/MobileBottomNav';
import {
  GraduationCap,
  UserCircle,
  Settings,
  Clock,
  BookOpen,
  AlertOctagon,
  Check,
  CalendarOff,
  Layers,
  Activity,
  Lock,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    isUnlocked,
    lockApp,
    activeTab,
    setActiveTab,
    role,
    students,
    instructors,
    selectedStudentId,
    setSelectedStudentId,
    selectedInstructorId,
    setSelectedInstructorId,
    totalLectureHours,
    courses,
    programs,
    absences,
    accessLogs,
    allInstructorWorkloads,
  } = useApp();

  const currentStudent = students.find(s => s.id === selectedStudentId);
  const currentInstructor = instructors.find(i => i.id === selectedInstructorId);
  const hasDangerInstructor = allInstructorWorkloads.some(w => w.status === 'danger');
  const pendingAbsenceCount = absences.filter(a => a.status === 'pending').length;

  React.useEffect(() => {
    document.title = 'APP program - ClassTime 강의 시간표 및 수강신청 시스템';
  }, []);

  if (!isUnlocked) {
    return <PasscodeGate />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Header />

      {/* Role Context & Visible User Selector Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col gap-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-bold">현재 작업 공간:</span>
              {role === 'student' && (
                <span className="inline-flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-200/60 dark:border-indigo-800">
                  <GraduationCap className="w-3.5 h-3.5" />
                  학생: {currentStudent?.name} ({currentStudent?.programName || currentStudent?.major})
                </span>
              )}
              {role === 'instructor' && (
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200/60 dark:border-emerald-800">
                  <UserCircle className="w-3.5 h-3.5" />
                  교관: {currentInstructor?.name} ({currentInstructor?.department})
                </span>
              )}
              {role === 'admin' && (
                <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                  <Settings className="w-3.5 h-3.5" />
                  관리자 모드 (과정·결강·접속로깅·비밀번호 통합 관리)
                  {hasDangerInstructor && (
                    <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-rose-600 text-white font-bold animate-pulse flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3" />
                      시수 초과 경고등
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
              <button
                onClick={() => setActiveTab('programs')}
                className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                교육과정: <strong className="font-mono text-slate-800 dark:text-slate-200">{programs.length}</strong>개
              </button>
              <button
                onClick={() => setActiveTab('timetable')}
                className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                개설 강좌: <strong className="font-mono text-slate-800 dark:text-slate-200">{courses.length}</strong>개
              </button>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                주간 시수: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{totalLectureHours}</strong>시간
              </span>
              <button
                onClick={() => setActiveTab('absence')}
                className="flex items-center gap-1 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <CalendarOff className="w-3.5 h-3.5 text-rose-500" />
                결강·보강방: <strong className="font-mono text-rose-600 dark:text-rose-400">{absences.length}</strong>건
                {pendingAbsenceCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                    대기 {pendingAbsenceCount}
                  </span>
                )}
              </button>
              {role === 'admin' && (
                <button
                  onClick={() => setActiveTab('access_logs')}
                  className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-bold hover:underline cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  접속로깅방: <strong className="font-mono">{accessLogs.length}</strong>건
                </button>
              )}
            </div>
          </div>

          {/* Visible Side-by-Side User Switcher Buttons for Student / Instructor mode */}
          {role === 'instructor' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-500 mr-1">교관 선택 (나열형 버튼):</span>
              {instructors.map(inst => {
                const isSelected = selectedInstructorId === inst.id;
                return (
                  <button
                    key={inst.id}
                    onClick={() => setSelectedInstructorId(inst.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{inst.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {role === 'student' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-500 mr-1">학생 선택 (나열형 버튼):</span>
              {students.map(stud => {
                const isSelected = selectedStudentId === stud.id;
                return (
                  <button
                    key={stud.id}
                    onClick={() => setSelectedStudentId(stud.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{stud.name}</span>
                    <span className={`text-[9px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                      ({stud.grade})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {activeTab === 'timetable' && <TimetableView />}
        {activeTab === 'enrollment' && <CourseEnrollmentView />}
        {activeTab === 'absence' && <AbsenceManagementView />}
        {activeTab === 'programs' && <ProgramManagementView />}
        {activeTab === 'materials' && <CourseMaterialsView />}
        {activeTab === 'instructor_schedule' && <InstructorScheduleView />}
        {activeTab === 'student_schedule' && <StudentScheduleView />}
        {activeTab === 'scheduler_studio' && <SchedulerStudioView />}
        {activeTab === 'data_management' && <DataImportExportView />}
        {activeTab === 'statistics' && <StatisticsView />}
        {activeTab === 'access_logs' && <AccessLogView />}
        {activeTab === 'manage_courses' && <CourseManagementView />}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Desktop Footer */}
      <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-300">ClassTime</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              APP program
            </span>
            <span>·</span>
            <span>항공교육원 5대 과정 · 구글 캘린더 · 결강신청방 · 접속로깅 통합 시스템</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={lockApp}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-semibold cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>6자리 비밀번호 잠금화면 열기</span>
            </button>
            <span>·</span>
            <span>Excel / PDF Export & 양식 Import 지원</span>
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
