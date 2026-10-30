import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  Sun,
  Moon,
  UserCircle,
  Settings,
  GraduationCap,
  Lock,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { UserRole } from '../types';

export const Header: React.FC = () => {
  const {
    role,
    setRole,
    activeTab,
    setActiveTab,
    isDarkMode,
    toggleDarkMode,
    lockApp,
    accessLogs,
    absences,
  } = useApp();

  const pendingAbsenceCount = absences.filter(a => a.status === 'pending').length;

  const navItems = [
    { id: 'timetable', label: '강의시간표 (표·캘린더)' },
    { id: 'enrollment', label: '수강신청' },
    { id: 'absence', label: '결강·보강신청방', badge: pendingAbsenceCount > 0 ? pendingAbsenceCount : undefined },
    { id: 'programs', label: '과정(5대과정)관리' },
    { id: 'materials', label: '강의자료실' },
    { id: 'instructor_schedule', label: '교관일정' },
    { id: 'student_schedule', label: '학생일정' },
    { id: 'scheduler_studio', label: '편성스케줄러' },
    { id: 'data_management', label: '엑셀·PDF·명단관리' },
    { id: 'statistics', label: '시수통계' },
    { id: 'access_logs', label: '접속로깅방(관리자)', adminOnly: true, badge: accessLogs.length },
  ];

  const handleRoleSelect = (newRole: UserRole) => {
    setRole(newRole);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 space-y-2.5">
        {/* Top Row: Brand + Visible Side-by-Side Role Buttons + Lock & Theme Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand wordmark */}
          <div
            onClick={() => setActiveTab('timetable')}
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
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
                항공과정 시간표 · 수강 · 결강 · 로깅 통합시스템
              </span>
            </div>
          </div>

          {/* Visible Side-by-Side Role Switcher Buttons (No hidden dropdown!) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
              사용자 모드 선택:
            </span>
            {[
              { id: 'student' as UserRole, label: '학생 모드', icon: GraduationCap, activeClass: 'bg-indigo-600 border-indigo-600 text-white' },
              { id: 'instructor' as UserRole, label: '교관(강사) 모드', icon: UserCircle, activeClass: 'bg-emerald-600 border-emerald-600 text-white' },
              { id: 'admin' as UserRole, label: '관리자 모드', icon: Settings, activeClass: 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900' },
            ].map((r) => {
              const Icon = r.icon;
              const isSelected = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleSelect(r.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? `${r.activeClass} shadow-xs`
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {isSelected ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  <span>{r.label}</span>
                </button>
              );
            })}

            {/* Lock Screen Button (6-digit Passcode) */}
            <button
              type="button"
              onClick={lockApp}
              className="px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="6자리 비밀번호 잠금화면 열기"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>비번잠금</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Bottom Row: All Main Navigation Tabs Listed Visibly Side-by-Side as Buttons */}
        <nav className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                    : item.adminOnly
                    ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isActive && <Check className="w-3.5 h-3.5" />}
                {item.adminOnly && !isActive && <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-white text-indigo-700'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
