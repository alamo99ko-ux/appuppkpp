import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Sun, Moon, UserCircle, Settings, GraduationCap, ChevronDown, BookOpen } from 'lucide-react';
import { UserRole } from '../types';

export const Header: React.FC = () => {
  const {
    role,
    setRole,
    activeTab,
    setActiveTab,
    isDarkMode,
    toggleDarkMode,
    students,
    instructors,
    selectedStudentId,
    setSelectedStudentId,
    selectedInstructorId,
    setSelectedInstructorId,
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const currentStudent = students.find(s => s.id === selectedStudentId);
  const currentInstructor = instructors.find(i => i.id === selectedInstructorId);

  const roleLabels: Record<UserRole, { label: string; icon: any; subtext: string }> = {
    student: {
      label: `학생 (${currentStudent?.name || '학생'})`,
      icon: GraduationCap,
      subtext: `${currentStudent?.major || ''}`,
    },
    instructor: {
      label: `강사 (${currentInstructor?.name || '강사'})`,
      icon: UserCircle,
      subtext: `${currentInstructor?.department || ''}`,
    },
    admin: {
      label: '관리자 (Admin)',
      icon: Settings,
      subtext: '전체 시간표 및 개설 관리',
    },
  };

  const navItems = [
    { id: 'timetable', label: '강의시간표' },
    { id: 'enrollment', label: '수강신청' },
    { id: 'materials', label: '강의자료실' },
    { id: 'instructor_schedule', label: '교관일정' },
    { id: 'student_schedule', label: '학생일정' },
    { id: 'scheduler_studio', label: '편성스케줄러' },
    { id: 'data_management', label: '엑셀·명단관리' },
    { id: 'statistics', label: '시수통계' },
  ];

  const handleRoleSelect = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'instructor') {
      setActiveTab('instructor_schedule');
    } else if (newRole === 'student') {
      setActiveTab('enrollment');
    } else if (newRole === 'admin') {
      setActiveTab('scheduler_studio');
    }
    setIsRoleDropdownOpen(false);
  };

  const CurrentRoleIcon = roleLabels[role].icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand wordmark */}
        <div 
          onClick={() => setActiveTab('timetable')}
          className="flex items-center gap-2 cursor-pointer select-none shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap leading-none">
                ClassTime
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 tracking-wide">
                APP program
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">
              강의시간표 & 수강 통계
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-300">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors relative ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Role Switcher & Dark Mode Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Dark Mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
            aria-label="테마 전환"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Role Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
            >
              <CurrentRoleIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="whitespace-nowrap max-w-[120px] sm:max-w-none truncate">
                {roleLabels[role].label}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsRoleDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
                    사용자 역할 변경
                  </div>

                  {/* Student Option */}
                  <button
                    onClick={() => handleRoleSelect('student')}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center gap-3 transition-colors ${
                      role === 'student'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="font-bold">학생 모드</div>
                      <div className="text-[10px] text-slate-400">수강신청 및 내 시간표 조회</div>
                    </div>
                  </button>

                  {/* Instructor Option */}
                  <button
                    onClick={() => handleRoleSelect('instructor')}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center gap-3 transition-colors ${
                      role === 'instructor'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <UserCircle className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-bold">강사 / 교수 모드</div>
                      <div className="text-[10px] text-slate-400">강의 일정 및 수강생 명부 조회</div>
                    </div>
                  </button>

                  {/* Admin Option */}
                  <button
                    onClick={() => handleRoleSelect('admin')}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center gap-3 transition-colors ${
                      role === 'admin'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <div>
                      <div className="font-bold">관리자 모드</div>
                      <div className="text-[10px] text-slate-400">강좌 개설, 충돌 검사, 종합 통계</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
