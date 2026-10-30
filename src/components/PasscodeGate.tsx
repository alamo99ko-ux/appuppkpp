import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, ShieldCheck, Delete, GraduationCap, UserCircle, Settings, KeyRound, CheckCircle2 } from 'lucide-react';

export const PasscodeGate: React.FC = () => {
  const {
    passcode,
    unlockApp,
    role,
    setRole,
    instructors,
    students,
    selectedInstructorId,
    setSelectedInstructorId,
    selectedStudentId,
    setSelectedStudentId,
    addAccessLog,
  } = useApp();

  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // 보안접속 화면 진입 시 항상 '학생으로 접속'을 기본값으로 설정
  useEffect(() => {
    setRole('student');
  }, [setRole]);

  const handleDigit = (digit: string) => {
    setError(null);
    if (pin.length < 6) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 6) {
        attemptUnlock(next);
      }
    }
  };

  const handleBackspace = () => {
    setError(null);
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError(null);
    setPin('');
  };

  const attemptUnlock = (candidate: string) => {
    const ok = unlockApp(candidate);
    if (ok) {
      addAccessLog('6자리 보안 비밀번호 인증 및 시스템 최초 접속');
    } else {
      setError('비밀번호 6자리가 일치하지 않습니다. 다시 입력해주세요.');
      setTimeout(() => setPin(''), 400);
    }
  };

  // 키보드 숫자(0-9), Backspace, Escape 입력 지원
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pin, passcode]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
        {/* 상단 브랜드 & 보안 아이콘 */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Lock className="w-7 h-7" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-bold tracking-tight text-white">ClassTime</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-600 text-white">
              APP program
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">
            보안 접속 · 6자리 비밀번호 입력
          </h1>
          <p className="text-xs text-slate-400">
            별도 아이디 없이 <strong>숫자 6자리 비밀번호</strong>만 입력하면 즉시 시스템에 접속됩니다.
          </p>
        </div>

        {/* 1. 접속 모드 영역: 학생 접속을 기본으로 크게 배치 + 오른쪽에 교관 접속을 작고 희미하게 배치 */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold text-slate-300">1. 접속 모드</span>
            <span className="text-slate-500 text-[10px]">기본: 학생 접속</span>
          </div>

          <div className="flex items-stretch gap-2.5">
            {/* 기본 메인: 학생으로 접속 */}
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                role === 'student'
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-950/60'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    role === 'student' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold">학생으로 접속</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        role === 'student'
                          ? 'bg-indigo-900/70 text-indigo-100'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      기본
                    </span>
                  </div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      role === 'student' ? 'text-indigo-100' : 'text-slate-400'
                    }`}
                  >
                    수강신청 · 내 시간표 · 결강/공결 신청
                  </div>
                </div>
              </div>
              {role === 'student' && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
            </button>

            {/* 오른쪽: 교관 접속 (작고 희미하게 표시, 선택 시 활성화) */}
            <button
              type="button"
              onClick={() => setRole('instructor')}
              title="교관으로 접속 전환"
              className={`px-3 py-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center shrink-0 min-w-[84px] ${
                role === 'instructor'
                  ? 'bg-emerald-600/90 border-emerald-400 text-white opacity-100 shadow-md'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-500 opacity-45 hover:opacity-85 hover:border-slate-700'
              }`}
            >
              <UserCircle className="w-4 h-4 mb-1" />
              <span className="text-[11px] font-semibold leading-tight">교관 접속</span>
              {role === 'instructor' && (
                <span className="text-[9px] text-emerald-100 mt-0.5 font-bold">선택됨</span>
              )}
            </button>
          </div>

          {/* 관리자가 우측 아래 버튼으로 선택되었을 때만 표시되는 작은 상태 배너 */}
          {role === 'admin' && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-700/50 text-amber-200 text-xs">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                <span className="font-bold">관리자 접속 모드가 선택되었습니다</span>
              </div>
              <button
                type="button"
                onClick={() => setRole('student')}
                className="text-[11px] underline text-amber-300 hover:text-white cursor-pointer"
              >
                학생 모드로 돌아가기
              </button>
            </div>
          )}

          {/* 학생 선택 리스트 (학생 모드일 때 기본 표시) */}
          {role === 'student' && (
            <div className="pt-1.5 space-y-1.5">
              <div className="text-[11px] text-slate-400 font-semibold">
                접속 학생 선택 (선택한 학생만 활성화):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {students.map(stud => {
                  const active = selectedStudentId === stud.id;
                  return (
                    <button
                      key={stud.id}
                      type="button"
                      onClick={() => setSelectedStudentId(stud.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        active
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-xs'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {stud.name} ({stud.grade})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 교관 선택 리스트 (교관 접속 클릭 시 표시) */}
          {role === 'instructor' && (
            <div className="pt-1.5 space-y-1.5">
              <div className="text-[11px] text-emerald-400 font-semibold">
                접속 교관 선택 (선택한 교관만 활성화):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {instructors.map(inst => {
                  const active = selectedInstructorId === inst.id;
                  return (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => setSelectedInstructorId(inst.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-xs'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {inst.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. 6자리 비밀번호 입력 박스 */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold text-slate-400 text-center">
            2. 비밀번호 6자리 입력 (키보드 또는 아래 숫자 버튼 클릭)
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const char = pin[index];
              const isCurrent = index === pin.length;
              return (
                <div
                  key={index}
                  className={`w-11 h-13 sm:w-12 sm:h-14 rounded-xl border-2 flex items-center justify-center text-xl font-mono font-bold transition-all ${
                    char
                      ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-inner'
                      : isCurrent
                      ? 'bg-slate-800 border-indigo-400/70 text-slate-400 animate-pulse'
                      : 'bg-slate-800/50 border-slate-700 text-slate-600'
                  }`}
                >
                  {char ? '●' : ''}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="text-center text-xs font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/70 py-2 px-3 rounded-xl">
              {error}
            </div>
          )}
        </div>

        {/* 숫자 키패드 */}
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 border border-slate-700 text-base font-mono font-bold text-white transition-colors cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl bg-slate-800/60 hover:bg-rose-950/60 border border-slate-700 text-xs font-bold text-rose-300 transition-colors cursor-pointer"
          >
            전체지우기
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 border border-slate-700 text-base font-mono font-bold text-white transition-colors cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-slate-800/60 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* 하단 영역: 비밀번호 안내 & 우측 아래쪽의 희미한 관리자 접속 버튼 */}
        <div className="pt-3 border-t border-slate-800/80 flex items-end justify-between gap-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>
                현재 6자리 비밀번호: <strong className="font-mono text-amber-300">{passcode}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => attemptUnlock(passcode)}
              className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>비밀번호 즉시 입력 접속</span>
            </button>
          </div>

          {/* 우측 아래쪽: 관리자 접속 (작고 희미하게 처리) */}
          <button
            type="button"
            onClick={() => setRole('admin')}
            title="관리자 접속 모드로 전환"
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer border ${
              role === 'admin'
                ? 'bg-amber-600/80 border-amber-400 text-white opacity-100 font-bold shadow-xs'
                : 'bg-transparent border-slate-800/60 text-slate-600 opacity-35 hover:opacity-80 hover:text-slate-400 hover:border-slate-700'
            }`}
          >
            <Settings className="w-3 h-3" />
            <span>관리자</span>
          </button>
        </div>
      </div>
    </div>
  );
};
