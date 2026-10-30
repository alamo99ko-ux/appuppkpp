import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Instructor, Student, Course } from '../types';
import { DataActionToolbar } from './DataActionToolbar';
import {
  readExcelFile,
  parseInstructorsExcel,
  parseStudentsExcel,
  parseCoursesExcel,
  downloadExcelTemplate,
  exportInstructorsExcel,
  exportStudentsExcel,
  exportCoursesExcel,
} from '../utils/excelUtils';
import {
  Upload,
  Download,
  Plus,
  FileSpreadsheet,
  Users,
  GraduationCap,
  BookOpen,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  RefreshCw,
} from 'lucide-react';
import { CourseModal } from './CourseModal';
import { DAYS_OF_WEEK } from '../data/mockData';

export const DataImportExportView: React.FC = () => {
  const {
    instructors,
    addInstructor,
    updateInstructor,
    deleteInstructor,
    bulkAddInstructors,
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    bulkAddStudents,
    courses,
    addCourse,
    deleteCourse,
    bulkAddCourses,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'instructor' | 'student' | 'course'>('instructor');
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // File upload refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<any[] | null>(null);
  const [parsedErrors, setParsedErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Direct Input Form States - Instructor
  const [instName, setInstName] = useState('');
  const [instDept, setInstDept] = useState('');
  const [instEmail, setInstEmail] = useState('');
  const [instPhone, setInstPhone] = useState('');
  const [editingInstId, setEditingInstId] = useState<string | null>(null);

  // Direct Input Form States - Student
  const [studName, setStudName] = useState('');
  const [studId, setStudId] = useState('');
  const [studMajor, setStudMajor] = useState('');
  const [studGrade, setStudGrade] = useState('1학년');
  const [studEmail, setStudEmail] = useState('');
  const [editingStudId, setEditingStudId] = useState<string | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Course Modal for Course Direct Add
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  const showNotification = (text: string, isError = false) => {
    setFeedback({ text, isError });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Handle direct Instructor save
  const handleSaveInstructor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName.trim()) {
      showNotification('교관(강사) 이름을 입력해주세요.', true);
      return;
    }

    if (editingInstId) {
      const existing = instructors.find(i => i.id === editingInstId);
      if (existing) {
        updateInstructor({
          ...existing,
          name: instName.trim(),
          department: instDept.trim() || '교육훈련부',
          email: instEmail.trim() || `${instName.trim().toLowerCase()}@academy.ac.kr`,
          phone: instPhone.trim() || '010-0000-0000',
        });
        showNotification(`'${instName}' 교관 정보가 수정되었습니다.`);
      }
      setEditingInstId(null);
    } else {
      addInstructor({
        name: instName.trim(),
        department: instDept.trim() || '교육훈련부',
        email: instEmail.trim() || `${instName.trim().toLowerCase()}@academy.ac.kr`,
        phone: instPhone.trim() || '010-0000-0000',
      });
      showNotification(`'${instName}' 교관이 새로 등록되었습니다.`);
    }

    setInstName('');
    setInstDept('');
    setInstEmail('');
    setInstPhone('');
  };

  // Handle direct Student save
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studName.trim()) {
      showNotification('학생 이름을 입력해주세요.', true);
      return;
    }
    if (!studId.trim()) {
      showNotification('학번을 입력해주세요.', true);
      return;
    }

    if (editingStudId) {
      const existing = students.find(s => s.id === editingStudId);
      if (existing) {
        updateStudent({
          ...existing,
          name: studName.trim(),
          studentId: studId.trim(),
          major: studMajor.trim() || '일반전공',
          grade: studGrade,
          email: studEmail.trim() || `${studId.trim()}@student.ac.kr`,
        });
        showNotification(`'${studName}' 학생 정보가 수정되었습니다.`);
      }
      setEditingStudId(null);
    } else {
      addStudent({
        name: studName.trim(),
        studentId: studId.trim(),
        major: studMajor.trim() || '일반전공',
        grade: studGrade,
        email: studEmail.trim() || `${studId.trim()}@student.ac.kr`,
      });
      showNotification(`'${studName}' 학생이 새로 등록되었습니다.`);
    }

    setStudName('');
    setStudId('');
    setStudMajor('');
    setStudGrade('1학년');
    setStudEmail('');
  };

  // File selection and parsing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processUploadedFile(files[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processUploadedFile = async (file: File) => {
    setIsProcessing(true);
    setParsedErrors([]);
    setParsedPreview(null);

    try {
      const rows = await readExcelFile(file);
      if (rows.length === 0) {
        showNotification('엑셀 파일에 데이터 행이 존재하지 않습니다.', true);
        setIsProcessing(false);
        return;
      }

      if (activeTab === 'instructor') {
        const res = parseInstructorsExcel(rows);
        setParsedPreview(res.data);
        setParsedErrors(res.errors);
        if (res.data.length === 0) {
          showNotification('교관 데이터를 파싱하지 못했습니다. 열 제목을 확인해주세요.', true);
        } else {
          showNotification(`${res.data.length}명의 교관 데이터를 읽어왔습니다. 확인 후 [일괄 등록]을 눌러주세요.`);
        }
      } else if (activeTab === 'student') {
        const res = parseStudentsExcel(rows);
        setParsedPreview(res.data);
        setParsedErrors(res.errors);
        if (res.data.length === 0) {
          showNotification('학생 데이터를 파싱하지 못했습니다. 열 제목을 확인해주세요.', true);
        } else {
          showNotification(`${res.data.length}명의 학생 데이터를 읽어왔습니다. 확인 후 [일괄 등록]을 눌러주세요.`);
        }
      } else {
        const res = parseCoursesExcel(rows, instructors);
        setParsedPreview(res.data);
        setParsedErrors(res.errors);
        if (res.data.length === 0) {
          showNotification('강의과목 데이터를 파싱하지 못했습니다. 열 제목을 확인해주세요.', true);
        } else {
          showNotification(`${res.data.length}개의 강의과목 데이터를 읽어왔습니다. 확인 후 [일괄 등록]을 눌러주세요.`);
        }
      }
    } catch (err: any) {
      showNotification(`파일을 읽는 중 오류가 발생했습니다: ${err.message || '지원하지 않는 파일 형식'}`, true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Commit bulk upload to AppContext
  const handleCommitBulkUpload = () => {
    if (!parsedPreview || parsedPreview.length === 0) return;

    if (activeTab === 'instructor') {
      const { addedCount } = bulkAddInstructors(parsedPreview);
      showNotification(`${addedCount}명의 교관(강사)이 일괄 등록되었습니다!`);
    } else if (activeTab === 'student') {
      const { addedCount } = bulkAddStudents(parsedPreview);
      showNotification(`${addedCount}명의 학생이 일괄 등록되었습니다!`);
    } else {
      const { addedCount } = bulkAddCourses(parsedPreview);
      showNotification(`${addedCount}개의 강의과목 및 시간표가 일괄 등록되었습니다!`);
    }

    setParsedPreview(null);
    setParsedErrors([]);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-xl shadow-lg border transition-all max-w-sm flex items-start gap-3 ${
          feedback.isError
            ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
        }`}>
          {feedback.isError ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <span className="text-xs font-medium leading-relaxed">{feedback.text}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>데이터 관리 센터</span>
              <span>·</span>
              <span>엑셀 & PDF 내보내기(Export) / 양식 다운로드 & 엑셀 업로드(Import)</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              교관·학생·과목 시간표 데이터 통합 관리
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              각 중요 데이터(교관명단, 학생명단, 강의시간표)를 엑셀(.xlsx) 또는 PDF로 Export 할 수 있으며, 바로 옆의 Import 양식을 내려받아 일괄 업로드할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Tab Selection (Listed visibly side-by-side) */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              setActiveTab('instructor');
              setParsedPreview(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'instructor'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {activeTab === 'instructor' ? <Check className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            <span>1. 교관(강사) 명단 관리 ({instructors.length}명)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('student');
              setParsedPreview(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'student'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {activeTab === 'student' ? <Check className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
            <span>2. 학생 명단 관리 ({students.length}명)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('course');
              setParsedPreview(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'course'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {activeTab === 'course' ? <Check className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
            <span>3. 강의과목 및 시간 관리 ({courses.length}과목)</span>
          </button>
        </div>

        {/* Universal Side-by-Side Export (Excel / PDF) + Import Template + Import Upload */}
        <DataActionToolbar entityType={activeTab} />
      </div>

      {/* EXCEL UPLOAD DROPZONE */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>
              {activeTab === 'instructor' ? '교관 명단 엑셀(.xlsx, .csv) 일괄 업로드' : activeTab === 'student' ? '학생 명단 엑셀(.xlsx, .csv) 일괄 업로드' : '강의과목 및 시간표 엑셀(.xlsx, .csv) 일괄 업로드'}
            </span>
          </h3>
          <span className="text-xs text-slate-400">
            .xlsx, .xls, .csv 지원
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              await processUploadedFile(e.dataTransfer.files[0]);
            }
          }}
          className={`p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/20'
          }`}
        >
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
            여기를 클릭하거나 엑셀 파일을 드래그하여 업로드하세요
          </div>
          <p className="text-xs text-slate-400 mt-1">
            양식이 없으시다면 상단의 <strong>[엑셀 양식 다운로드]</strong> 버튼을 먼저 눌러 서식을 받아보세요.
          </p>
        </div>

        {/* PARSED PREVIEW TABLE */}
        {parsedPreview && (
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  파싱 완료 미리보기 ({parsedPreview.length}건)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setParsedPreview(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleCommitBulkUpload}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>시스템에 일괄 등록 확정</span>
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500">
                    {Object.keys(parsedPreview[0] || {}).map((col) => (
                      <th key={col} className="p-2 font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedPreview.slice(0, 10).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="p-2 text-slate-700 dark:text-slate-300">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedPreview.length > 10 && (
              <div className="text-[11px] text-slate-400 text-right">
                외 {parsedPreview.length - 10}건의 데이터가 더 있습니다.
              </div>
            )}
          </div>
        )}
      </div>

      {/* DIRECT INPUT & EXISTING DATA SECTION */}
      {/* 1. INSTRUCTORS TAB */}
      {activeTab === 'instructor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Direct Input Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>{editingInstId ? '교관(강사) 정보 수정' : '교관(강사) 직접 입력 등록'}</span>
            </h3>

            <form onSubmit={handleSaveInstructor} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  교관명 (이름) *
                </label>
                <input
                  type="text"
                  required
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  placeholder="예: 김도현 교관"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  소속 부서 / 학과 *
                </label>
                <input
                  type="text"
                  required
                  value={instDept}
                  onChange={(e) => setInstDept(e.target.value)}
                  placeholder="예: 비행훈련원 / 컴퓨터공학"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  이메일 주소
                </label>
                <input
                  type="email"
                  value={instEmail}
                  onChange={(e) => setInstEmail(e.target.value)}
                  placeholder="예: instructor@academy.ac.kr"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  연락처 (전화번호)
                </label>
                <input
                  type="tel"
                  value={instPhone}
                  onChange={(e) => setInstPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                {editingInstId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingInstId(null);
                      setInstName('');
                      setInstDept('');
                      setInstEmail('');
                      setInstPhone('');
                    }}
                    className="w-1/2 py-2 font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl"
                  >
                    수정 취소
                  </button>
                )}
                <button
                  type="submit"
                  className={`py-2 text-white font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs ${
                    editingInstId ? 'w-1/2' : 'w-full'
                  }`}
                >
                  {editingInstId ? '수정사항 저장' : '교관 등록 완료'}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Instructors List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                현재 등록된 교관(강사) 목록 ({instructors.length}명)
              </h3>
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="교관명 검색..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500">
                    <th className="py-2.5 px-3 font-semibold">교관명</th>
                    <th className="py-2.5 px-3 font-semibold">소속 부서</th>
                    <th className="py-2.5 px-3 font-semibold">이메일</th>
                    <th className="py-2.5 px-3 font-semibold">연락처</th>
                    <th className="py-2.5 px-3 font-semibold text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {instructors
                    .filter(i => !searchTerm || i.name.includes(searchTerm) || i.department.includes(searchTerm))
                    .map((inst) => (
                      <tr key={inst.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full ${inst.avatarBg} text-white flex items-center justify-center font-bold text-[10px]`}>
                              {inst.name[0]}
                            </span>
                            <span>{inst.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {inst.department}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {inst.email}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {inst.phone}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingInstId(inst.id);
                                setInstName(inst.name);
                                setInstDept(inst.department);
                                setInstEmail(inst.email);
                                setInstPhone(inst.phone);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                              title="수정"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`'${inst.name}' 교관을 삭제하시겠습니까?`)) {
                                  deleteInstructor(inst.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. STUDENTS TAB */}
      {activeTab === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Direct Input Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>{editingStudId ? '학생 정보 수정' : '학생 직접 입력 등록'}</span>
            </h3>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  학생 이름 *
                </label>
                <input
                  type="text"
                  required
                  value={studName}
                  onChange={(e) => setStudName(e.target.value)}
                  placeholder="예: 김철수"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  학번 (학생 고유번호) *
                </label>
                <input
                  type="text"
                  required
                  value={studId}
                  onChange={(e) => setStudId(e.target.value)}
                  placeholder="예: 20261001"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  전공 / 학과
                </label>
                <input
                  type="text"
                  value={studMajor}
                  onChange={(e) => setStudMajor(e.target.value)}
                  placeholder="예: 컴퓨터소프트웨어"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  학년
                </label>
                <select
                  value={studGrade}
                  onChange={(e) => setStudGrade(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="1학년">1학년</option>
                  <option value="2학년">2학년</option>
                  <option value="3학년">3학년</option>
                  <option value="4학년">4학년</option>
                  <option value="수료">수료 / 연수</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  value={studEmail}
                  onChange={(e) => setStudEmail(e.target.value)}
                  placeholder="예: student@academy.ac.kr"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                {editingStudId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStudId(null);
                      setStudName('');
                      setStudId('');
                      setStudMajor('');
                      setStudGrade('1학년');
                      setStudEmail('');
                    }}
                    className="w-1/2 py-2 font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl"
                  >
                    수정 취소
                  </button>
                )}
                <button
                  type="submit"
                  className={`py-2 text-white font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs ${
                    editingStudId ? 'w-1/2' : 'w-full'
                  }`}
                >
                  {editingStudId ? '수정사항 저장' : '학생 등록 완료'}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Students List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                현재 등록된 학생 명부 ({students.length}명)
              </h3>
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="학생명 또는 학번 검색..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500">
                    <th className="py-2.5 px-3 font-semibold">학생명</th>
                    <th className="py-2.5 px-3 font-semibold">학번</th>
                    <th className="py-2.5 px-3 font-semibold">전공 / 학년</th>
                    <th className="py-2.5 px-3 font-semibold">이메일</th>
                    <th className="py-2.5 px-3 font-semibold text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students
                    .filter(s => !searchTerm || s.name.includes(searchTerm) || s.studentId.includes(searchTerm) || s.major.includes(searchTerm))
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full ${s.avatarBg} text-white flex items-center justify-center font-bold text-[10px]`}>
                              {s.name[0]}
                            </span>
                            <span>{s.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                          {s.studentId}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {s.major} · {s.grade}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {s.email}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingStudId(s.id);
                                setStudName(s.name);
                                setStudId(s.studentId);
                                setStudMajor(s.major);
                                setStudGrade(s.grade);
                                setStudEmail(s.email);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                              title="수정"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`'${s.name}' 학생을 삭제하시겠습니까?`)) {
                                  deleteStudent(s.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. COURSES & TIME TAB */}
      {activeTab === 'course' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                개설 강의과목 및 요일/시간 편성 현황 ({courses.length}과목)
              </h3>
              <p className="text-xs text-slate-500">
                직접 [신규 강의 개설] 모달을 열어 요일과 시간을 입력하거나, 엑셀 파일로 수십 개의 강의를 한 번에 등록할 수 있습니다.
              </p>
            </div>

            <button
              onClick={() => setIsCourseModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>강의과목 직접 입력 개설</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500">
                  <th className="py-2.5 px-3 font-semibold">코드</th>
                  <th className="py-2.5 px-3 font-semibold">과목명</th>
                  <th className="py-2.5 px-3 font-semibold">분야</th>
                  <th className="py-2.5 px-3 font-semibold">담당교관</th>
                  <th className="py-2.5 px-3 font-semibold">요일 및 시간</th>
                  <th className="py-2.5 px-3 font-semibold text-right">시수</th>
                  <th className="py-2.5 px-3 font-semibold">강의실</th>
                  <th className="py-2.5 px-3 font-semibold text-center">정원</th>
                  <th className="py-2.5 px-3 font-semibold text-right">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {c.code}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                      {c.name}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {c.category}
                    </td>
                    <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-medium">
                      {c.instructorName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">{c.day}</span> {c.startTime}~{c.endTime}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {c.durationHours}h
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {c.room}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {c.maxCapacity}명
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`'${c.name}' 강의를 삭제하시겠습니까?`)) {
                            deleteCourse(c.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                        title="과목 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
      />
    </div>
  );
};
