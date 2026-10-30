import React, { useState, useMemo } from 'react';
import { CourseMaterial, MaterialCategory } from '../types';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Download,
  Search,
  PlusCircle,
  FileSpreadsheet,
  FileCode,
  FolderArchive,
  BookOpen,
  Eye,
  Trash2,
  Edit3,
  X,
  Check,
  Filter,
  User,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';

const CATEGORIES: ('전체' | MaterialCategory)[] = [
  '전체',
  '강의계획서',
  '수업유인물',
  '실습자료',
  '과제안내',
  '참고자료',
];

const FORMAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PDF: { bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
  XLSX: { bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  PPTX: { bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  DOCX: { bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  ZIP: { bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  HWP: { bg: 'bg-cyan-50 dark:bg-cyan-950/60', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' },
};

export const CourseMaterialsView: React.FC = () => {
  const {
    materials,
    courses,
    instructors,
    role,
    selectedStudentId,
    selectedInstructorId,
    getStudentEnrolledCourses,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    incrementDownloadCount,
  } = useApp();

  // Filter & Search states
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<'전체' | MaterialCategory>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyMyEnrolled, setOnlyMyEnrolled] = useState<boolean>(role === 'student');
  const [sortBy, setSortBy] = useState<'latest' | 'downloads' | 'title' | 'course'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<CourseMaterial | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<CourseMaterial | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for upload/edit
  const [formCourseId, setFormCourseId] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<MaterialCategory>('수업유인물');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formFileName, setFormFileName] = useState<string>('');
  const [formFileFormat, setFormFileFormat] = useState<'PDF' | 'HWP' | 'PPTX' | 'ZIP' | 'XLSX' | 'DOCX'>('PDF');
  const [formFileSize, setFormFileSize] = useState<string>('2.5 MB');
  const [formContentPreview, setFormContentPreview] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const enrolledCourseIds = useMemo(() => {
    return new Set(getStudentEnrolledCourses(selectedStudentId).map(c => c.id));
  }, [getStudentEnrolledCourses, selectedStudentId]);

  const currentInstructor = instructors.find(i => i.id === selectedInstructorId);

  // Open Upload Modal
  const handleOpenUpload = (mat?: CourseMaterial) => {
    if (mat) {
      setEditingMaterial(mat);
      setFormCourseId(mat.courseId);
      setFormTitle(mat.title);
      setFormCategory(mat.category);
      setFormDescription(mat.description);
      setFormFileName(mat.fileName);
      setFormFileFormat(mat.fileFormat);
      setFormFileSize(mat.fileSize);
      setFormContentPreview(mat.contentPreview || '');
    } else {
      setEditingMaterial(null);
      // Default to instructor's first course if instructor role
      const defaultCourse = courses.find(c => c.instructorId === selectedInstructorId) || courses[0];
      setFormCourseId(defaultCourse?.id || '');
      setFormTitle('');
      setFormCategory('수업유인물');
      setFormDescription('');
      setFormFileName('');
      setFormFileFormat('PDF');
      setFormFileSize('2.5 MB');
      setFormContentPreview('');
    }
    setFormError('');
    setIsUploadModalOpen(true);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formCourseId) {
      setFormError('강의 과목을 선택해주세요.');
      return;
    }
    if (!formTitle.trim()) {
      setFormError('자료 제목을 입력해주세요.');
      return;
    }

    const targetCourse = courses.find(c => c.id === formCourseId);
    if (!targetCourse) {
      setFormError('선택한 강의를 찾을 수 없습니다.');
      return;
    }

    const fileName = formFileName.trim() || `${formTitle.trim().replace(/\s+/g, '_')}.${formFileFormat.toLowerCase()}`;

    if (editingMaterial) {
      const res = updateMaterial({
        ...editingMaterial,
        courseId: targetCourse.id,
        courseName: targetCourse.name,
        courseCode: targetCourse.code,
        instructorId: targetCourse.instructorId,
        instructorName: targetCourse.instructorName,
        title: formTitle.trim(),
        category: formCategory,
        description: formDescription.trim(),
        fileName,
        fileFormat: formFileFormat,
        fileSize: formFileSize.trim() || '2.0 MB',
        contentPreview: formContentPreview.trim(),
      });
      showToast(res.message);
    } else {
      const res = addMaterial({
        courseId: targetCourse.id,
        courseName: targetCourse.name,
        courseCode: targetCourse.code,
        instructorId: targetCourse.instructorId,
        instructorName: targetCourse.instructorName,
        title: formTitle.trim(),
        category: formCategory,
        description: formDescription.trim(),
        fileName,
        fileFormat: formFileFormat,
        fileSize: formFileSize.trim() || '2.0 MB',
        contentPreview: formContentPreview.trim(),
      });
      showToast(res.message);
    }

    setIsUploadModalOpen(false);
  };

  const handleDeleteMaterial = (materialId: string, title: string) => {
    if (confirm(`'${title}' 자료를 정말 삭제하시겠습니까?`)) {
      deleteMaterial(materialId);
      showToast('강의 자료가 삭제되었습니다.');
    }
  };

  // Real download trigger with simulated content Blob
  const handleDownload = (material: CourseMaterial) => {
    incrementDownloadCount(material.id);

    // Create an authentic downloadable file with course & material metadata
    const content = `=====================================================
[ClassTime 강의자료실] ${material.courseName} (${material.courseCode})
=====================================================
■ 자료명: ${material.title}
■ 구분: ${material.category}
■ 담당교관: ${material.instructorName}
■ 파일명: ${material.fileName} (${material.fileSize})
■ 등록일시: ${new Date(material.uploadedAt).toLocaleString()}

-----------------------------------------------------
[강의자료 요약 및 학습 가이드]
-----------------------------------------------------
${material.description}

-----------------------------------------------------
[주요 학습 내용 및 본문 미리보기]
-----------------------------------------------------
${material.contentPreview || '상세 학습 자료 본문이 포함되어 있습니다.'}

=====================================================
본 자료는 항공운항 및 교육 목적으로 제공되는 공식 수업 자료입니다.
무단 복제 및 상업적 배포를 금합니다.
=====================================================
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = material.fileName.endsWith('.txt') ? material.fileName : `${material.fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`'${material.fileName}' 파일 다운로드를 시작합니다.`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered & Sorted list
  const filteredMaterials = useMemo(() => {
    return materials
      .filter(item => {
        // Course Filter
        if (selectedCourseFilter !== 'all' && item.courseId !== selectedCourseFilter) {
          return false;
        }

        // Student "Only Enrolled" Filter
        if (role === 'student' && onlyMyEnrolled && !enrolledCourseIds.has(item.courseId)) {
          return false;
        }

        // Category Filter
        if (selectedCategory !== '전체' && item.category !== selectedCategory) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const match =
            item.title.toLowerCase().includes(q) ||
            item.courseName.toLowerCase().includes(q) ||
            item.courseCode.toLowerCase().includes(q) ||
            item.instructorName.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.fileName.toLowerCase().includes(q);
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'latest') {
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        }
        if (sortBy === 'downloads') {
          return b.downloadCount - a.downloadCount;
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'course') {
          return a.courseName.localeCompare(b.courseName);
        }
        return 0;
      });
  }, [materials, selectedCourseFilter, selectedCategory, searchQuery, onlyMyEnrolled, enrolledCourseIds, role, sortBy]);

  const totalDownloads = useMemo(() => {
    return materials.reduce((sum, m) => sum + (m.downloadCount || 0), 0);
  }, [materials]);

  const uniqueCoursesCount = useMemo(() => {
    return new Set(materials.map(m => m.courseId)).size;
  }, [materials]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Banner / Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-2xs shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>학습 지원 센터</span>
                <span>·</span>
                <span>강의 계획서 및 수업 유인물</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                강의 자료실 (Lecture Resources)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                강사가 수업별로 등록한 강의계획서, 주차별 유인물, 실습 매뉴얼 및 과제 양식을 확인하고 다운로드할 수 있습니다.
              </p>
            </div>
          </div>

          {/* Quick Metrics & Upload Action */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-center">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">등록 자료</div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                {materials.length}건
              </div>
            </div>
            <div className="p-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-center">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">총 다운로드</div>
              <div className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {totalDownloads}회
              </div>
            </div>
            <div className="p-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-center">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">자료 등록 과목</div>
              <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {uniqueCoursesCount}개 과목
              </div>
            </div>

            {(role === 'instructor' || role === 'admin') && (
              <button
                onClick={() => handleOpenUpload()}
                className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs hover:shadow-md transition-all shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>강의 자료 등록</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="자료 제목, 과목명(NAV101), 교관명, 파일명 검색..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Course Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCourseFilter}
              onChange={e => setSelectedCourseFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden"
            >
              <option value="all">전체 강의 과목</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.name} ({c.instructorName})
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden"
            >
              <option value="latest">최신 등록순</option>
              <option value="downloads">다운로드 많은순</option>
              <option value="title">자료명 가나다순</option>
              <option value="course">과목명순</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="카드 그리드 뷰"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'table'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="테이블 목록 뷰"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs & Student Enrolled Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {role === 'student' && (
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 select-none shrink-0">
              <input
                type="checkbox"
                checked={onlyMyEnrolled}
                onChange={e => setOnlyMyEnrolled(e.target.checked)}
                className="w-4 h-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>내 수강 과목 자료만 보기 ({enrolledCourseIds.size}과목)</span>
            </label>
          )}
        </div>
      </div>

      {/* Materials List */}
      {filteredMaterials.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="text-slate-500 text-sm">조건에 맞는 강의 자료가 없습니다.</p>
          {(role === 'instructor' || role === 'admin') && (
            <button
              onClick={() => handleOpenUpload()}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>새로운 강의 자료 등록하기</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map(item => {
            const fmt = FORMAT_COLORS[item.fileFormat] || FORMAT_COLORS.PDF;
            const canManage = role === 'admin' || (role === 'instructor' && item.instructorId === selectedInstructorId);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Metadata */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {item.courseCode}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium">
                    {item.courseName}
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => setPreviewMaterial(item)}
                    className="font-bold text-base text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors mt-1 leading-snug"
                  >
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Attachment Pill */}
                  <div
                    onClick={() => setPreviewMaterial(item)}
                    className="mt-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold ${fmt.bg} ${fmt.text} border ${fmt.border} shrink-0`}>
                        {item.fileFormat}
                      </span>
                      <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate">
                        {item.fileName}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {item.fileSize}
                    </span>
                  </div>

                  {/* Meta stats */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {item.instructorName}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Download className="w-3 h-3 text-slate-400" />
                      {item.downloadCount}회 다운로드
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewMaterial(item)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>미리보기</span>
                    </button>
                    {canManage && (
                      <button
                        onClick={() => handleOpenUpload(item)}
                        className="p-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="수정"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canManage && (
                      <button
                        onClick={() => handleDeleteMaterial(item.id, item.title)}
                        className="p-1.5 text-xs font-medium text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDownload(item)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>다운로드</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-3 px-4 font-semibold">구분</th>
                  <th className="py-3 px-4 font-semibold">강의 과목</th>
                  <th className="py-3 px-4 font-semibold">자료 제목</th>
                  <th className="py-3 px-4 font-semibold">첨부 파일</th>
                  <th className="py-3 px-4 font-semibold">담당 교관</th>
                  <th className="py-3 px-4 font-semibold text-center">다운로드</th>
                  <th className="py-3 px-4 font-semibold text-right">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMaterials.map(item => {
                  const fmt = FORMAT_COLORS[item.fileFormat] || FORMAT_COLORS.PDF;
                  const canManage = role === 'admin' || (role === 'instructor' && item.instructorId === selectedInstructorId);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[11px] text-slate-700 dark:text-slate-300">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mr-1.5">
                          {item.courseCode}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {item.courseName}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          onClick={() => setPreviewMaterial(item)}
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 cursor-pointer"
                        >
                          {item.title}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${fmt.bg} ${fmt.text}`}>
                            {item.fileFormat}
                          </span>
                          <span className="font-mono text-slate-600 dark:text-slate-400">
                            {item.fileName} ({item.fileSize})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {item.instructorName}
                      </td>
                      <td className="py-3 px-4 font-mono text-center text-slate-500">
                        {item.downloadCount}회
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewMaterial(item)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            title="미리보기"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(item)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>다운</span>
                          </button>
                          {canManage && (
                            <button
                              onClick={() => handleDeleteMaterial(item.id, item.title)}
                              className="p-1.5 text-rose-500 hover:text-rose-700"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload & Edit Modal Dialog */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {editingMaterial ? '강의 자료 수정' : '신규 강의 자료 등록'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    수강생들에게 제공할 강의 계획서 또는 수업 유인물을 등록합니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              {/* Course Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  대상 강의 과목 *
                </label>
                <select
                  required
                  value={formCourseId}
                  onChange={e => setFormCourseId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">강의를 선택하세요</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.name} (담당: {c.instructorName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    자료 제목 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="예: 1주차 PBN 항법 원리 및 비행절차 유인물"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    자료 분류 *
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as MaterialCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="강의계획서">강의계획서</option>
                    <option value="수업유인물">수업유인물</option>
                    <option value="실습자료">실습자료</option>
                    <option value="과제안내">과제안내</option>
                    <option value="참고자료">참고자료</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  자료 설명 및 학습 안내
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="학생들이 숙지해야 할 핵심 학습 목표나 다운로드 전 안내사항을 입력하세요."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Attachment File Details */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  첨부 파일 정보 설정
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-500 mb-1">파일명</label>
                    <input
                      type="text"
                      value={formFileName}
                      onChange={e => setFormFileName(e.target.value)}
                      placeholder="예: NAV101_Week1_Handout.pdf"
                      className="w-full px-3 py-1.5 font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">파일 포맷</label>
                    <select
                      value={formFileFormat}
                      onChange={e => setFormFileFormat(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                    >
                      <option value="PDF">PDF</option>
                      <option value="XLSX">XLSX</option>
                      <option value="PPTX">PPTX</option>
                      <option value="DOCX">DOCX</option>
                      <option value="ZIP">ZIP</option>
                      <option value="HWP">HWP</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">파일 용량 (표시용)</label>
                  <input
                    type="text"
                    value={formFileSize}
                    onChange={e => setFormFileSize(e.target.value)}
                    placeholder="예: 3.2 MB"
                    className="w-full px-3 py-1.5 font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Online Preview Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  온라인 미리보기 본문 (수강생 즉시 열람 내용)
                </label>
                <textarea
                  rows={4}
                  value={formContentPreview}
                  onChange={e => setFormContentPreview(e.target.value)}
                  placeholder="수강생이 파일을 다운로드하기 전에 미리 확인 가능한 목차, 핵심 공식, 주차별 요약 텍스트를 기재해주세요."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-[11px] leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingMaterial ? '수정사항 저장' : '강의자료 등록'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Online Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-bold text-indigo-600">{previewMaterial.courseCode}</span>
                  <span>·</span>
                  <span>{previewMaterial.courseName}</span>
                  <span>·</span>
                  <span className="font-semibold">{previewMaterial.category}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {previewMaterial.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* File Info strip */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded text-xs font-mono font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {previewMaterial.fileFormat}
                  </span>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {previewMaterial.fileName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      용량: {previewMaterial.fileSize} · 누적 {previewMaterial.downloadCount}회 다운로드
                    </div>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <div>담당: {previewMaterial.instructorName}</div>
                  <div className="font-mono text-slate-400">{new Date(previewMaterial.uploadedAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Description */}
              {previewMaterial.description && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    학습 안내 및 유의사항
                  </h4>
                  <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {previewMaterial.description}
                  </div>
                </div>
              )}

              {/* Online Preview Document Content */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>문서 본문 미리보기</span>
                  <span className="text-[11px] font-normal text-slate-400">온라인 열람 모드</span>
                </h4>
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 dark:bg-slate-950 dark:text-slate-200 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto border border-slate-800 select-text">
                  {previewMaterial.contentPreview || '등록된 온라인 미리보기 본문이 없습니다. 원본 파일을 다운로드하여 확인하세요.'}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                다운로드 시 오프라인에서 열람 가능한 문서 파일이 생성됩니다.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  닫기
                </button>
                <button
                  onClick={() => {
                    handleDownload(previewMaterial);
                    setPreviewMaterial(null);
                  }}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>파일 다운로드</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
