import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { DataActionToolbar } from './DataActionToolbar';
import {
  ShieldAlert,
  KeyRound,
  Check,
  CheckCircle2,
  Trash2,
  UserCircle,
  GraduationCap,
  Settings,
  Lock,
  Activity,
  Clock,
} from 'lucide-react';

export const AccessLogView: React.FC = () => {
  const {
    role,
    setRole,
    accessLogs,
    clearAccessLogs,
    passcodes,
    updateRolePasscode,
    lockApp,
  } = useApp();

  const [roleFilter, setRoleFilter] = useState<'all' | 'instructor' | 'student' | 'admin'>('all');
  const [pageFilter, setPageFilter] = useState<string>('all');

  const [studentPin, setStudentPin] = useState<string>(passcodes.student);
  const [instructorPin, setInstructorPin] = useState<string>(passcodes.instructor);
  const [adminPin, setAdminPin] = useState<string>(passcodes.admin);

  useEffect(() => {
    setStudentPin(passcodes.student);
    setInstructorPin(passcodes.instructor);
    setAdminPin(passcodes.admin);
  }, [passcodes]);

  const [toast, setToast] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => setToast(null), 3500);
  };

  // Restrict to Admin only
  if (role !== 'admin') {
    return (
      <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs text-center max-w-xl mx-auto my-8 space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <span className="px-2.5 py-1 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold">
            관리자 전용 열람 구역 (Access Restricted)
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            교관·학생 페이지 열람 로깅방 및 비밀번호 설정은 관리자만 볼 수 있습니다
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            현재 <strong>{role === 'instructor' ? '교관 모드' : '학생 모드'}</strong>로 접속 중입니다. 교관 및 학생의 페이지 접속 기록과 학생·교관·관리자 8자리 비밀번호 변경 관리는 관리자 권한에서만 열람이 허용됩니다.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={() => setRole('admin')}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>관리자 모드로 전환하여 열람하기</span>
          </button>
        </div>
      </div>
    );
  }

  const handleSaveRolePasscode = (targetRole: UserRole, pinValue: string, e: React.FormEvent) => {
    e.preventDefault();
    const res = updateRolePasscode(targetRole, pinValue.trim());
    showToast(res.message, !res.success);
  };

  const filteredLogs = useMemo(() => {
    return accessLogs.filter(log => {
      if (roleFilter !== 'all' && log.role !== roleFilter) return false;
      if (pageFilter !== 'all' && log.pageId !== pageFilter) return false;
      return true;
    });
  }, [accessLogs, roleFilter, pageFilter]);

  const instructorLogCount = accessLogs.filter(l => l.role === 'instructor').length;
  const studentLogCount = accessLogs.filter(l => l.role === 'student').length;

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 p-3.5 rounded-xl border shadow-lg text-xs font-bold flex items-center gap-2 ${
            toast.isError
              ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* 1. 관리자 전용 · 학생 / 교관 / 관리자 8자리 비밀번호 통합 관리 카드 */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <KeyRound className="w-4 h-4" />
              <span>관리자 전용 · 권한별(학생·교관·관리자) 8자리 접속 비밀번호 통합 관리</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              보안접속 8자리 비밀번호 설정 및 변경
            </h3>
            <p className="text-xs text-slate-500">
              학생 기본 비밀번호(`12345678`), 교관 기본 비밀번호(`28687870`), 관리자 기본 비밀번호(`28687870`)를 각각 8자리 숫자로 자유롭게 변경할 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={lockApp}
            className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>보안 잠금화면 즉시 테스트</span>
          </button>
        </div>

        {/* 3개 권한별 8자리 비밀번호 변경 카드 나열 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* (1) 학생 8자리 비밀번호 */}
          <form
            onSubmit={(e) => handleSaveRolePasscode('student', studentPin, e)}
            className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <GraduationCap className="w-4 h-4" />
                학생 접속 비밀번호 (8자리)
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                현재: {passcodes.student}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={8}
                pattern="\d{8}"
                value={studentPin}
                onChange={(e) => setStudentPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                placeholder="8자리 숫자 (예: 12345678)"
                className="flex-1 px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 font-mono text-sm font-bold tracking-widest text-center text-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>변경 저장</span>
              </button>
            </div>
          </form>

          {/* (2) 교관 8자리 비밀번호 */}
          <form
            onSubmit={(e) => handleSaveRolePasscode('instructor', instructorPin, e)}
            className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <UserCircle className="w-4 h-4" />
                교관 접속 비밀번호 (8자리)
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                현재: {passcodes.instructor}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={8}
                pattern="\d{8}"
                value={instructorPin}
                onChange={(e) => setInstructorPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                placeholder="8자리 숫자 (예: 28687870)"
                className="flex-1 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 font-mono text-sm font-bold tracking-widest text-center text-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>변경 저장</span>
              </button>
            </div>
          </form>

          {/* (3) 관리자 8자리 비밀번호 */}
          <form
            onSubmit={(e) => handleSaveRolePasscode('admin', adminPin, e)}
            className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Settings className="w-4 h-4" />
                관리자 접속 비밀번호 (8자리)
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                현재: {passcodes.admin}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={8}
                pattern="\d{8}"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                placeholder="8자리 숫자 (예: 28687870)"
                className="flex-1 px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 font-mono text-sm font-bold tracking-widest text-center text-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>변경 저장</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. Access Logs Room Header & Export Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              <Activity className="w-4 h-4" />
              <span>관리자 전용 보안 감사 · 실시간 자동 로깅방</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              교관 · 학생 페이지 열람 및 활동 로깅방
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              교관이나 학생이 각 화면(시간표, 수강신청, 결강신청방, 교관일정, 학생일정, 자료실 등)을 열 때마다 실시간으로 시각과 열람 내역이 자동 기록됩니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              교관 열람: <strong className="font-mono text-emerald-600">{instructorLogCount}건</strong> · 학생 열람: <strong className="font-mono text-indigo-600">{studentLogCount}건</strong>
            </div>
            <button
              type="button"
              onClick={() => {
                clearAccessLogs();
                showToast('접속 로그 기록이 초기화되었습니다.');
              }}
              className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>로그 비우기</span>
            </button>
          </div>
        </div>

        <DataActionToolbar entityType="access_log" hideImport />

        {/* Visible Side-by-Side Filter Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500">
              접속자 구분 필터 (나열된 버튼 중 선택한 것만 활성화):
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: `전체 접속 기록 (${accessLogs.length}건)` },
                { id: 'instructor', label: `교관(강사) 페이지 열람 (${instructorLogCount}건)` },
                { id: 'student', label: `학생 페이지 열람 (${studentLogCount}건)` },
                { id: 'admin', label: '관리자 활동 기록' },
              ].map(btn => {
                const active = roleFilter === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setRoleFilter(btn.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      active
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {active && <Check className="w-3.5 h-3.5" />}
                    <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500">
              열람한 방(페이지)별 필터 (선택한 버튼만 활성화):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: '전체 페이지' },
                { id: 'timetable', label: '강의시간표' },
                { id: 'enrollment', label: '수강신청' },
                { id: 'absence', label: '결강·보강신청방' },
                { id: 'programs', label: '과정관리' },
                { id: 'instructor_schedule', label: '교관일정' },
                { id: 'student_schedule', label: '학생일정' },
                { id: 'materials', label: '강의자료실' },
              ].map(p => {
                const active = pageFilter === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPageFilter(p.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      active
                        ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Access Logs Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500">
                <th className="py-2.5 px-3 font-semibold">열람 시각</th>
                <th className="py-2.5 px-3 font-semibold">구분</th>
                <th className="py-2.5 px-3 font-semibold">사용자명</th>
                <th className="py-2.5 px-3 font-semibold">소속 부서 / 전공</th>
                <th className="py-2.5 px-3 font-semibold">열람한 페이지(방)</th>
                <th className="py-2.5 px-3 font-semibold">상세 로깅 내역</th>
                <th className="py-2.5 px-3 font-semibold">접속 환경</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.timestamp.replace('T', ' ').slice(0, 19)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {log.role === 'instructor' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                        <UserCircle className="w-3 h-3" />
                        교관
                      </span>
                    )}
                    {log.role === 'student' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
                        <GraduationCap className="w-3 h-3" />
                        학생
                      </span>
                    )}
                    {log.role === 'admin' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                        <Settings className="w-3 h-3" />
                        관리자
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {log.departmentOrMajor}
                  </td>
                  <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    {log.pageTitle}
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                    {log.action}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {log.ipOrDevice}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
