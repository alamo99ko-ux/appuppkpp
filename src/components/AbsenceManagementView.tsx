import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AbsenceType, AbsenceStatus } from '../types';
import { DataActionToolbar } from './DataActionToolbar';
import {
  CalendarOff,
  CalendarPlus,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  UserCheck,
  GraduationCap,
  Send,
} from 'lucide-react';

const REASON_CATEGORIES = [
  '기상악화',
  '기체·시뮬레이터 정비',
  '공무출장·세미나',
  '병결·항공신체검사',
  '훈련일정 조정',
  '개인사정·기타',
];

export const AbsenceManagementView: React.FC = () => {
  const {
    role,
    courses,
    instructors,
    students,
    selectedInstructorId,
    selectedStudentId,
    absences,
    addAbsence,
    updateAbsenceStatus,
    deleteAbsence,
  } = useApp();

  // Form states - all major choices shown as visible side-by-side buttons
  const [requestType, setRequestType] = useState<AbsenceType>(
    role === 'student' ? 'student_absence' : 'instructor_cancel'
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || 'course-1');
  const [applicantId, setApplicantId] = useState<string>(
    role === 'student' ? selectedStudentId : selectedInstructorId
  );
  const [absenceDate, setAbsenceDate] = useState<string>('2026-11-02');
  const [reasonCategory, setReasonCategory] = useState<string>('기상악화');
  const [reasonDetail, setReasonDetail] = useState<string>('');
  const [makeupDate, setMakeupDate] = useState<string>('2026-11-07');
  const [makeupStartTime, setMakeupStartTime] = useState<string>('10:00');
  const [makeupEndTime, setMakeupEndTime] = useState<string>('12:00');
  const [makeupRoom, setMakeupRoom] = useState<string>('운항교육동 101호');

  // Filter states (listed visibly as buttons)
  const [statusFilter, setStatusFilter] = useState<'all' | AbsenceStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | AbsenceType>('all');
  const [toast, setToast] = useState<string | null>(null);

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    const isStudentType = requestType === 'student_absence';
    const inst = instructors.find(i => i.id === applicantId) || instructors.find(i => i.id === selectedCourse.instructorId) || instructors[0];
    const stud = students.find(s => s.id === applicantId) || students[0];

    const applicantName = isStudentType ? (stud?.name || '학생') : (inst?.name || selectedCourse.instructorName);

    const res = addAbsence({
      type: requestType,
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      courseCode: selectedCourse.code,
      programId: selectedCourse.programId,
      programName: selectedCourse.programName,
      applicantRole: isStudentType ? 'student' : 'instructor',
      applicantId: isStudentType ? (stud?.id || 'stud-1') : (inst?.id || 'inst-1'),
      applicantName,
      absenceDate,
      reasonCategory,
      reasonDetail: reasonDetail.trim() || `${reasonCategory} 사유로 인한 ${isStudentType ? '공결/결석' : '결강 및 보강'} 신청`,
      makeupDate: !isStudentType ? makeupDate : undefined,
      makeupStartTime: !isStudentType ? makeupStartTime : undefined,
      makeupEndTime: !isStudentType ? makeupEndTime : undefined,
      makeupRoom: !isStudentType ? makeupRoom : undefined,
    });

    setReasonDetail('');
    showToast(res.message);
  };

  const filteredAbsences = useMemo(() => {
    return absences.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      return true;
    });
  }, [absences, statusFilter, typeFilter]);

  const counts = useMemo(() => ({
    all: absences.length,
    pending: absences.filter(a => a.status === 'pending').length,
    approved: absences.filter(a => a.status === 'approved').length,
    rejected: absences.filter(a => a.status === 'rejected').length,
  }), [absences]);

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-4 z-50 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header + Export / Import Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">
              <CalendarOff className="w-4 h-4" />
              <span>결강 · 보강 · 학생 공결 전용 신청방</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              결강·보강 신청 및 승인 관리방
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              교관의 휴강·보강 계획 신청과 학생의 결석·공결 신청을 한눈에 등록하고 관리합니다. 모든 선택 옵션이 버튼으로 나열되어 클릭 시 즉시 활성화됩니다.
            </p>
          </div>
        </div>

        <DataActionToolbar entityType="absence" />
      </div>

      {/* Main Content: Left = Application Form with Visible Button Selectors, Right = Applications List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Application Form */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5 h-fit">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-indigo-600" />
            <span>신규 결강 · 보강 · 공결 신청서 작성</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* 1. Request Type Buttons (Listed visibly) */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                1. 신청 구분 선택 (클릭 시 활성화)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRequestType('instructor_cancel');
                    setApplicantId(selectedInstructorId);
                  }}
                  className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer flex items-center justify-between ${
                    requestType === 'instructor_cancel'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    <span>교관 결강·보강 신청</span>
                  </div>
                  {requestType === 'instructor_cancel' && <Check className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequestType('student_absence');
                    setApplicantId(selectedStudentId);
                  }}
                  className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer flex items-center justify-between ${
                    requestType === 'student_absence'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>학생 결석·공결 신청</span>
                  </div>
                  {requestType === 'student_absence' && <Check className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 2. Applicant Selector Buttons (Listed visibly) */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                2. 신청자 선택 ({requestType === 'instructor_cancel' ? '교관 명단' : '학생 명단'} - 선택한 이름만 활성화)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {requestType === 'instructor_cancel'
                  ? instructors.map(inst => {
                      const active = applicantId === inst.id;
                      return (
                        <button
                          key={inst.id}
                          type="button"
                          onClick={() => setApplicantId(inst.id)}
                          className={`px-2.5 py-1.5 rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                            active
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {active && <Check className="w-3 h-3" />}
                          <span>{inst.name}</span>
                        </button>
                      );
                    })
                  : students.map(stud => {
                      const active = applicantId === stud.id;
                      return (
                        <button
                          key={stud.id}
                          type="button"
                          onClick={() => setApplicantId(stud.id)}
                          className={`px-2.5 py-1.5 rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                            active
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {active && <Check className="w-3 h-3" />}
                          <span>{stud.name} ({stud.grade})</span>
                        </button>
                      );
                    })}
              </div>
            </div>

            {/* 3. Course Selection Buttons (Listed visibly) */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                3. 대상 강의과목 선택 (선택한 과목만 활성화)
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {courses.map(c => {
                  const active = selectedCourseId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCourseId(c.id);
                        setMakeupRoom(c.room);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        active
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <span className={`font-mono font-bold mr-1.5 ${active ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}`}>
                          [{c.code}]
                        </span>
                        <span className="font-bold">{c.name}</span>
                        <span className={`ml-2 text-[11px] ${active ? 'text-indigo-100' : 'text-slate-500'}`}>
                          ({c.instructorName} · {c.day} {c.startTime}~{c.endTime})
                        </span>
                      </div>
                      {active && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Absence Date */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                4. 결강 / 결석 일자 선택 *
              </label>
              <input
                type="date"
                required
                value={absenceDate}
                onChange={(e) => setAbsenceDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* 5. Reason Category Buttons (Listed visibly) */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                5. 결강 / 공결 사유 분류 (클릭 시 활성화)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {REASON_CATEGORIES.map(cat => {
                  const active = reasonCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setReasonCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                        active
                          ? 'bg-rose-600 border-rose-600 text-white shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {active && <Check className="w-3 h-3" />}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Detailed Reason */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                6. 상세 사유 입력
              </label>
              <textarea
                rows={2}
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                placeholder="결강 또는 공결 상세 사유를 입력하세요..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* 7. Makeup Schedule (if Instructor Cancel) */}
            {requestType === 'instructor_cancel' && (
              <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/80 space-y-3">
                <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>보강 수업 계획 입력 (캘린더 자동 반영)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">보강 예정일자</label>
                    <input
                      type="date"
                      value={makeupDate}
                      onChange={(e) => setMakeupDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">보강 시작시간</label>
                    <input
                      type="time"
                      value={makeupStartTime}
                      onChange={(e) => setMakeupStartTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">보강 종료시간</label>
                    <input
                      type="time"
                      value={makeupEndTime}
                      onChange={(e) => setMakeupEndTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">보강 강의실</label>
                    <input
                      type="text"
                      value={makeupRoom}
                      onChange={(e) => setMakeupRoom(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>결강 · 공결 신청서 제출하기</span>
            </button>
          </form>
        </div>

        {/* Right Column: Absence Requests List with Visible Filter Buttons */}
        <div className="lg:col-span-7 space-y-4">
          {/* Visible Filter Buttons Box */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500">
                처리 상태별 필터 (나열된 버튼 중 선택한 것만 활성화):
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: `전체 신청내역 (${counts.all}건)` },
                  { id: 'pending', label: `승인 대기중 (${counts.pending}건)` },
                  { id: 'approved', label: `승인 완료 (${counts.approved}건)` },
                  { id: 'rejected', label: `반려됨 (${counts.rejected}건)` },
                ].map(tab => {
                  const active = statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        active
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-bold text-slate-500">
                신청자 구분 필터 (선택한 버튼만 활성화):
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: '교관 + 학생 전체 보기' },
                  { id: 'instructor_cancel', label: '교관 결강·보강만 보기' },
                  { id: 'student_absence', label: '학생 결석·공결만 보기' },
                ].map(t => {
                  const active = typeFilter === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTypeFilter(t.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        active
                          ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {filteredAbsences.map(item => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          item.type === 'instructor_cancel'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {item.type === 'instructor_cancel' ? '교관 결강·휴강' : '학생 결석·공결'}
                      </span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        [{item.courseCode}]
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {item.courseName}
                      </span>
                      {item.programName && (
                        <span className="text-[11px] text-slate-500">· {item.programName}</span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-3">
                      <span>
                        신청자: <strong className="text-slate-900 dark:text-slate-100">{item.applicantName}</strong>
                      </span>
                      <span>
                        결강/결석 일자: <strong className="font-mono text-rose-600 dark:text-rose-400">{item.absenceDate}</strong>
                      </span>
                      <span>
                        사유분류: <strong className="text-slate-800 dark:text-slate-200">{item.reasonCategory}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {item.status === 'approved' && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        승인완료
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        승인대기중
                      </span>
                    )}
                    {item.status === 'rejected' && (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        반려됨
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                  <div>
                    <span className="font-bold text-slate-500 mr-1.5">상세 사유:</span>
                    <span>{item.reasonDetail}</span>
                  </div>
                  {item.makeupDate && (
                    <div className="text-indigo-700 dark:text-indigo-300 font-semibold flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
                      <span>보강 예정 일정:</span>
                      <span className="font-mono font-bold">{item.makeupDate}</span>
                      <span className="font-mono">({item.makeupStartTime}~{item.makeupEndTime})</span>
                      <span>· 강의실: {item.makeupRoom}</span>
                    </div>
                  )}
                </div>

                {/* Visible Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] font-mono text-slate-400">
                    신청일시: {item.createdAt.slice(0, 16).replace('T', ' ')}
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        updateAbsenceStatus(item.id, 'approved', '관리자 승인 완료');
                        showToast(`'${item.courseName}' 결강·공결 신청이 [승인 완료] 처리되었습니다.`);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                        item.status === 'approved'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>승인 처리</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updateAbsenceStatus(item.id, 'rejected', '일정 재조정 요청');
                        showToast(`'${item.courseName}' 신청이 [반려] 처리되었습니다.`);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                        item.status === 'rejected'
                          ? 'bg-rose-600 border-rose-600 text-white'
                          : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>반려 처리</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        deleteAbsence(item.id);
                        showToast('해당 신청 내역이 삭제되었습니다.');
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>삭제</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
