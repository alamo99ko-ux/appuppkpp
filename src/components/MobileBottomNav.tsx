import React from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, BookOpen, UserCheck, GraduationCap, BarChart2, ShieldAlert, FileSpreadsheet, FileText } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, role, allInstructorWorkloads } = useApp();

  const hasDangerInstructor = allInstructorWorkloads.some(w => w.status === 'danger');

  // Role-adaptive tabs for thumb navigation
  const tabs = role === 'admin' ? [
    { id: 'timetable', label: '시간표', icon: Calendar },
    { id: 'scheduler_studio', label: '편성가드', icon: ShieldAlert, hasBadge: hasDangerInstructor },
    { id: 'materials', label: '자료실', icon: FileText },
    { id: 'data_management', label: '엑셀명단', icon: FileSpreadsheet },
    { id: 'statistics', label: '시수통계', icon: BarChart2 },
  ] : role === 'instructor' ? [
    { id: 'instructor_schedule', label: '내강의', icon: UserCheck },
    { id: 'materials', label: '자료실', icon: FileText },
    { id: 'timetable', label: '전체시간표', icon: Calendar },
    { id: 'statistics', label: '시수통계', icon: BarChart2 },
  ] : [
    { id: 'student_schedule', label: '내시간표', icon: GraduationCap },
    { id: 'enrollment', label: '수강신청', icon: BookOpen },
    { id: 'materials', label: '자료실', icon: FileText },
    { id: 'timetable', label: '전체시간표', icon: Calendar },
    { id: 'statistics', label: '통계', icon: BarChart2 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div 
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        className="grid items-center h-14"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-colors relative ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.hasBadge && (
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse absolute -top-0.5 -right-1" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 absolute bottom-1" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
