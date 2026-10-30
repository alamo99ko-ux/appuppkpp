import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TrainingProgram } from '../types';
import { DataActionToolbar } from './DataActionToolbar';
import {
  Layers,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  BookOpen,
  GraduationCap,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const ProgramManagementView: React.FC = () => {
  const {
    programs,
    addProgram,
    updateProgram,
    deleteProgram,
    selectedProgramId,
    setSelectedProgramId,
    courses,
    updateCourse,
    students,
  } = useApp();

  // Inline edit state for renaming a program
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editHours, setEditHours] = useState<number>(150);

  // New program form state
  const [newCode, setNewCode] = useState(`PROC-0${programs.length + 1}`);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newHours, setNewHours] = useState<number>(150);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const startEditing = (prog: TrainingProgram) => {
    setEditingId(prog.id);
    setEditCode(prog.code);
    setEditName(prog.name);
    setEditDesc(prog.description);
    setEditHours(prog.targetHours);
  };

  const handleSaveEdit = (prog: TrainingProgram) => {
    if (!editName.trim()) return;
    const res = updateProgram({
      ...prog,
      code: editCode.trim() || prog.code,
      name: editName.trim(),
      description: editDesc.trim(),
      targetHours: Number(editHours) || 150,
    });
    setEditingId(null);
    showToast(res.message);
  };

  const handleAddProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = addProgram({
      code: newCode.trim() || `PROC-0${programs.length + 1}`,
      name: newName.trim(),
      description: newDesc.trim() || '전문 교육훈련 과정',
      targetHours: Number(newHours) || 150,
    });
    setNewCode(`PROC-0${programs.length + 2}`);
    setNewName('');
    setNewDesc('');
    setNewHours(150);
    showToast(res.message);
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="fixed top-20 right-4 z-50 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Top Banner + Export/Import Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-1">
              <Layers className="w-4 h-4" />
              <span>다중 교육과정(커리큘럼) 통합 관리</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              과정별(기본 5개 과정 + 추가 가능) 이름 변경 및 과정 편성
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              각 과정의 <strong>[과정 이름 변경]</strong> 버튼을 눌러 언제든 명칭을 수정할 수 있으며, 새로운 과정을 무제한 추가할 수 있습니다.
            </p>
          </div>
        </div>

        <DataActionToolbar entityType="program" />

        {/* Visible Side-by-Side Program Filter Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
            과정 선택 나열 버튼 (선택한 과정만 활성화):
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedProgramId('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedProgramId === 'all'
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {selectedProgramId === 'all' && <Check className="w-3.5 h-3.5" />}
              <span>전체 과정 보기 ({programs.length}개 과정)</span>
            </button>

            {programs.map((prog) => {
              const isSelected = selectedProgramId === prog.id;
              const progCoursesCount = courses.filter(c => c.programId === prog.id).length;
              return (
                <button
                  key={prog.id}
                  type="button"
                  onClick={() => setSelectedProgramId(prog.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  <span>{prog.name}</span>
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                    {progCoursesCount}과목
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Add New Program Form, Right = Program Cards with Instant Rename */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add New Program Form */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 h-fit">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>신규 과정 추가하기</span>
          </h3>

          <form onSubmit={handleAddProgram} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                과정 코드
              </label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="예: PROC-06"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                새 과정 이름 *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 제6과정 (회전익 헬리콥터 조종 과정)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                과정 설명 및 교육 목표
              </label>
              <textarea
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="과정에 대한 세부 설명을 입력하세요"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                목표 총 이수 시수 (시간)
              </label>
              <input
                type="number"
                value={newHours}
                onChange={(e) => setNewHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>새 교육과정 등록하기</span>
            </button>
          </form>
        </div>

        {/* Program List & Inline Name Editor */}
        <div className="lg:col-span-2 space-y-4">
          {programs
            .filter(p => selectedProgramId === 'all' || p.id === selectedProgramId)
            .map((prog) => {
              const isEditing = editingId === prog.id;
              const progCourses = courses.filter(c => c.programId === prog.id);
              const progStudents = students.filter(s => s.programId === prog.id);
              const currentHours = Number(progCourses.reduce((s, c) => s + (c.durationHours || 0), 0).toFixed(1));

              return (
                <div
                  key={prog.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4"
                >
                  {isEditing ? (
                    <div className="space-y-3 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800">
                      <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                        과정 이름 및 정보 수정 중
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">과정 코드</label>
                          <input
                            type="text"
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">과정 이름 (변경할 명칭 입력)</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-indigo-400 bg-white dark:bg-slate-900 font-bold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="sm:col-span-2">
                          <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">과정 설명</label>
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">목표 시수(h)</label>
                          <input
                            type="number"
                            value={editHours}
                            onChange={(e) => setEditHours(Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>취소</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(prog)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>이름 변경 저장</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold text-white ${prog.badgeColor}`}>
                            {prog.code}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {prog.name}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500">{prog.description}</p>
                        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                            배정 과목: <strong className="font-mono text-slate-900 dark:text-slate-100">{progCourses.length}과목</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            주간 편성 시수: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{currentHours}h</strong> / 목표 {prog.targetHours}h
                          </span>
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                            소속 학생: <strong className="font-mono">{progStudents.length}명</strong>
                          </span>
                        </div>
                      </div>

                      {/* Visible Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditing(prog)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>과정 이름 변경</span>
                        </button>
                        {programs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => deleteProgram(prog.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 hover:bg-rose-100 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>삭제</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Courses assigned to this program */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-400 mb-2">
                      이 과정에 편성된 강의과목 목록 ({progCourses.length}개):
                    </div>
                    {progCourses.length === 0 ? (
                      <div className="text-xs text-slate-400 py-2">
                        아직 배정된 과목이 없습니다. 아래 과목 버튼에서 클릭하여 이 과정으로 배정할 수 있습니다.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {progCourses.map(c => (
                          <div
                            key={c.id}
                            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mr-1.5">
                                {c.code}
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {c.instructorName} · {c.day} {c.startTime}~{c.endTime} ({c.durationHours}h)
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Quick Course-to-Program Assignment Matrix (All buttons visible) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            과목별 소속 과정 배정 스튜디오 (버튼 클릭 시 해당 과정으로 즉시 변경)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            각 과목 우측에 나열된 과정 버튼을 클릭하면 선택한 과정만 활성화되며 즉시 해당 과정 소속으로 변경됩니다.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {courses.map((course) => (
            <div key={course.id} className="py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mr-2">
                  {course.code}
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100 mr-2">
                  {course.name}
                </span>
                <span className="text-slate-500">
                  ({course.instructorName} · {course.day}요일 {course.startTime}~{course.endTime})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {programs.map((prog) => {
                  const isAssigned = course.programId === prog.id;
                  return (
                    <button
                      key={prog.id}
                      type="button"
                      onClick={() => {
                        updateCourse({
                          ...course,
                          programId: prog.id,
                          programName: prog.name,
                        }, true);
                        showToast(`'${course.name}' 과목이 [${prog.name}] 과정으로 배정되었습니다.`);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                        isAssigned
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {isAssigned && <Check className="w-3 h-3" />}
                      <span>{prog.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
