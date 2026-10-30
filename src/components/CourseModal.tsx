import React, { useState } from 'react';
import { Course, DayOfWeek, Student } from '../types';
import { useApp, calculateHours, MAX_DAILY_INSTRUCTOR_HOURS, MAX_WEEKLY_INSTRUCTOR_HOURS } from '../context/AppContext';
import { X, Clock, MapPin, User, Users, BookOpen, AlertCircle, Trash2, CheckCircle2, AlertOctagon, ShieldAlert, Star, MessageSquareQuote, Edit3, FileText, Download, ArrowRight } from 'lucide-react';
import { DAYS_OF_WEEK } from '../data/mockData';
import { CourseEvaluationModal } from './CourseEvaluationModal';

interface CourseModalProps {
  course?: Course | null;
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  course,
  isOpen,
  onClose,
  isEditMode = false,
}) => {
  const {
    role,
    instructors,
    addCourse,
    updateCourse,
    deleteCourse,
    isStudentEnrolled,
    enrollCourse,
    cancelEnrollment,
    selectedStudentId,
    getCourseEnrollmentCount,
    getEnrolledStudentsForCourse,
    checkStudentTimeClash,
    getInstructorWorkloadStatus,
    getCourseReviews,
    getCourseRatingStats,
    getStudentCourseReview,
    getCourseMaterials,
    incrementDownloadCount,
    setActiveTab,
  } = useApp();

  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState(course?.name || '');
  const [code, setCode] = useState(course?.code || '');
  const [category, setCategory] = useState(course?.category || '컴퓨터공학');
  const [instructorId, setInstructorId] = useState(course?.instructorId || (instructors[0]?.id ?? ''));
  const [day, setDay] = useState<DayOfWeek>(course?.day || '월');
  const [startTime, setStartTime] = useState(course?.startTime || '09:00');
  const [endTime, setEndTime] = useState(course?.endTime || '11:00');
  const [room, setRoom] = useState(course?.room || '');
  const [maxCapacity, setMaxCapacity] = useState(course?.maxCapacity || 30);
  const [description, setDescription] = useState(course?.description || '');
  const [errorMessage, setErrorMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [colorIndex, setColorIndex] = useState(0);

  // Sync if course prop changes
  React.useEffect(() => {
    if (course) {
      setName(course.name);
      setCode(course.code);
      setCategory(course.category);
      setInstructorId(course.instructorId);
      setDay(course.day);
      setStartTime(course.startTime);
      setEndTime(course.endTime);
      setRoom(course.room);
      setMaxCapacity(course.maxCapacity);
      setDescription(course.description);
    } else {
      setName('');
      setCode(`CS${Math.floor(100 + Math.random() * 400)}`);
      setCategory('컴퓨터공학');
      setInstructorId(instructors[0]?.id ?? '');
      setDay('월');
      setStartTime('10:00');
      setEndTime('12:00');
      setRoom('강의동 301호');
      setMaxCapacity(30);
      setDescription('');
    }
    setErrorMessage('');
  }, [course, isOpen, instructors]);

  if (!isOpen) return null;

  const isEditing = Boolean(course && isEditMode);
  const isCreating = !course;
  const isViewing = Boolean(course && !isEditMode);

  const currentEnrolledCount = course ? getCourseEnrollmentCount(course.id) : 0;
  const isEnrolled = course ? isStudentEnrolled(course.id, selectedStudentId) : false;
  const enrolledStudents = course ? getEnrolledStudentsForCourse(course.id) : [];
  const courseReviews = course ? getCourseReviews(course.id) : [];
  const ratingStats = course ? getCourseRatingStats(course.id) : { average: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  const myReview = course ? getStudentCourseReview(course.id, selectedStudentId) : undefined;
  const courseMaterials = course ? getCourseMaterials(course.id) : [];

  // Conflict preview for student
  const conflictInfo = course && role === 'student' && !isEnrolled
    ? checkStudentTimeClash(course, selectedStudentId)
    : { hasClash: false };

  const durationPreview = startTime < endTime ? calculateHours(startTime, endTime) : 0;
  const workloadPreview = (isCreating || isEditing) && instructorId
    ? getInstructorWorkloadStatus(instructorId, {
        day,
        durationHours: durationPreview,
        excludeCourseId: course?.id,
      })
    : null;

  const handleSave = (e: React.FormEvent, forceAllow = false) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');
    setWarningMessage('');

    if (!name.trim()) {
      setErrorMessage('강의명을 입력해주세요.');
      return;
    }
    if (!code.trim()) {
      setErrorMessage('과목 코드를 입력해주세요.');
      return;
    }
    if (startTime >= endTime) {
      setErrorMessage('종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    const selectedInst = instructors.find(i => i.id === instructorId);
    const instructorName = selectedInst ? selectedInst.name : '미배정';

    if (isEditing && course) {
      const res = updateCourse({
        ...course,
        name,
        code,
        category,
        instructorId,
        instructorName,
        day,
        startTime,
        endTime,
        room,
        maxCapacity: Number(maxCapacity),
        description,
      }, forceAllow);

      if (!res.success) {
        if (res.isWarning) {
          setWarningMessage(res.message || '강사 시수 상한 규정 경고');
        } else {
          setErrorMessage(res.message || '강의 수정 중 오류가 발생했습니다.');
        }
        return;
      }
    } else {
      const res = addCourse({
        name,
        code,
        category,
        instructorId,
        instructorName,
        day,
        startTime,
        endTime,
        room,
        maxCapacity: Number(maxCapacity),
        description,
        colorIndex,
      }, forceAllow);

      if (!res.success) {
        if (res.isWarning) {
          setWarningMessage(res.message || '강사 시수 상한 규정 경고');
        } else {
          setErrorMessage(res.message || '강의 개설 중 오류가 발생했습니다.');
        }
        return;
      }
    }

    onClose();
  };

  const handleDelete = () => {
    if (course && confirm(`'${course.name}' 강의를 정말 삭제하시겠습니까? 관련된 모든 수강신청 내역도 함께 삭제됩니다.`)) {
      deleteCourse(course.id);
      onClose();
    }
  };

  const handleEnrollToggle = () => {
    if (!course) return;
    if (isEnrolled) {
      cancelEnrollment(course.id, selectedStudentId);
    } else {
      const res = enrollCourse(course.id, selectedStudentId);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {isCreating ? '신규 강의 개설' : isEditing ? '강의 정보 수정' : '강의 상세 정보'}
            </span>
            {course && (
              <span className="text-xs font-mono text-slate-400">
                {course.code}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* VIEW MODE */}
          {isViewing && course && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>{course.category}</span>
                  <span>·</span>
                  <span className="font-mono">{course.code}</span>
                  <span>·</span>
                  <span>{course.durationHours}시간 강의</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {course.name}
                </h2>
              </div>

              {/* Conflict warning for students */}
              {conflictInfo.hasClash && conflictInfo.conflictingCourse && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">시간 중복 경고:</span> 현재 신청 중인 <strong>{conflictInfo.conflictingCourse.name}</strong> ({conflictInfo.conflictingCourse.day} {conflictInfo.conflictingCourse.startTime}~{conflictInfo.conflictingCourse.endTime})와 일정이 겹쳐 수강신청이 제한됩니다.
                  </div>
                </div>
              )}

              {/* Key Details Cards */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">강의 요일 및 시간</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      매주 {course.day}요일
                    </div>
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      {course.startTime} ~ {course.endTime} ({course.durationHours}시간)
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">강의실 / 장소</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {course.room}
                    </div>
                    <div className="text-xs text-slate-500">지정 강의실</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <User className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">담당 강사</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {course.instructorName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {instructors.find(i => i.id === course.instructorId)?.department || '전공교수'}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <Users className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">수강 현황</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">{currentEnrolledCount}</span> / {course.maxCapacity}명
                    </div>
                    <div className="text-xs text-slate-500">
                      {course.maxCapacity - currentEnrolledCount > 0
                        ? `${course.maxCapacity - currentEnrolledCount}석 남음`
                        : '마감됨'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {course.description && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    강의 개요 및 학습 목표
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {course.description}
                  </div>
                </div>
              )}

              {/* Enrolled Students list (Shown to Admin & Instructor) */}
              {(role === 'admin' || role === 'instructor') && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      수강 신청 학생 명단 ({enrolledStudents.length}명)
                    </span>
                  </div>
                  {enrolledStudents.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      현재 수강신청한 학생이 없습니다.
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                      {enrolledStudents.map((stud: Student) => (
                        <div key={stud.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full ${stud.avatarBg} text-white flex items-center justify-center font-bold text-[10px]`}>
                              {stud.name[0]}
                            </span>
                            <div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 mr-2">{stud.name}</span>
                              <span className="text-slate-400 font-mono">{stud.studentId}</span>
                            </div>
                          </div>
                          <span className="text-slate-500 text-[11px]">{stud.major}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Course Materials / 강의 자료실 Section */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>강의 계획서 및 수업 유인물</span>
                    <span className="text-slate-400 font-normal">({courseMaterials.length}건)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setActiveTab('materials');
                    }}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>자료실 바로가기</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {courseMaterials.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    현재 등록된 강의 자료가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {courseMaterials.map(mat => (
                      <div
                        key={mat.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                            {mat.fileFormat}
                          </span>
                          <div className="truncate">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {mat.title}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate font-mono">
                              {mat.fileName} · {mat.fileSize} · {mat.category}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            incrementDownloadCount(mat.id);
                            const content = `[ClassTime 강의자료] ${mat.title}\n과목: ${mat.courseName} (${mat.courseCode})\n교관: ${mat.instructorName}\n구분: ${mat.category}\n\n■ 설명:\n${mat.description}\n\n■ 본문 미리보기:\n${mat.contentPreview || ''}`;
                            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = mat.fileName.endsWith('.txt') ? mat.fileName : `${mat.fileName}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>다운로드</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Course Evaluations & Student Reviews Section */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    <span>수강생 강의 평가 & 만족도</span>
                    <span className="text-slate-400 font-normal">({courseReviews.length}건)</span>
                  </div>
                  {role === 'student' && isEnrolled && (
                    <button
                      type="button"
                      onClick={() => setIsEvalModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                    >
                      {myReview ? <Edit3 className="w-3 h-3" /> : <Star className="w-3 h-3 fill-white" />}
                      <span>{myReview ? '내 평가 수정' : '강의 평가 작성'}</span>
                    </button>
                  )}
                </div>

                {/* Rating summary widget */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                        {ratingStats.count > 0 ? ratingStats.average : '0.0'}
                      </div>
                      <div>
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(ratingStats.average)
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-slate-300 dark:text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {ratingStats.count > 0 ? `총 ${ratingStats.count}개의 수강생 평가` : '아직 등록된 평가 없음'}
                        </div>
                      </div>
                    </div>

                    {/* Star distribution bars */}
                    <div className="flex-1 max-w-xs space-y-1 text-[11px]">
                      {[5, 4, 3, 2, 1].map(score => {
                        const count = ratingStats.distribution[score] || 0;
                        const pct = ratingStats.count > 0 ? Math.round((count / ratingStats.count) * 100) : 0;
                        return (
                          <div key={score} className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <span className="w-6 font-mono font-semibold">{score}★</span>
                            <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-8 font-mono text-right text-[10px]">{count}건</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-2.5 pt-1">
                  {courseReviews.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      등록된 강의 평가가 없습니다. 수강 후 첫 번째 후기를 남겨보세요!
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {courseReviews.map(rev => (
                        <div
                          key={rev.id}
                          className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {rev.isAnonymous ? '익명 수강생' : rev.studentName}
                              </span>
                              <div className="flex text-amber-400">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < rev.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-slate-600'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {rev.createdAt.slice(0, 10)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {rev.comment}
                          </p>
                          {rev.tags && rev.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {rev.tags.map(t => (
                                <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* EDIT / CREATE MODE */}
          {(isCreating || isEditing) && (
            <form id="course-form" onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    강의명 *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 웹 프론트엔드 실무"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    과목 코드 *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="예: CS201"
                    className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    과목 분야 / 학과 *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="컴퓨터공학">컴퓨터공학</option>
                    <option value="인공지능">인공지능</option>
                    <option value="디자인">디자인</option>
                    <option value="어학">어학</option>
                    <option value="경영데이터">경영데이터</option>
                    <option value="교양">교양</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    담당 강사 / 교수 *
                  </label>
                  <select
                    value={instructorId}
                    onChange={(e) => setInstructorId(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {instructors.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reactive Instructor Workload Guardrail Pill */}
              {workloadPreview && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                  workloadPreview.status === 'danger'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : workloadPreview.status === 'caution'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                }`}>
                  {workloadPreview.status === 'danger' ? (
                    <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                  ) : workloadPreview.status === 'caution' ? (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold flex items-center justify-between">
                      <span>강사 시수 가드레일 (1일 {MAX_DAILY_INSTRUCTOR_HOURS}h / 주 {MAX_WEEKLY_INSTRUCTOR_HOURS}h 규정)</span>
                      <span className="font-mono text-[11px]">
                        배정 후: {day}요일 {workloadPreview.maxDailyHours}h · 주간 {workloadPreview.weeklyHours}h
                      </span>
                    </div>
                    {workloadPreview.isDailyExceeded && (
                      <div className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold mt-0.5">
                        🚨 [경고등] {day}요일 일일 시수가 6시간을 초과합니다!
                      </div>
                    )}
                    {workloadPreview.isWeeklyExceeded && (
                      <div className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold mt-0.5">
                        🚨 [경고등] 주간 총 시수가 20시간을 초과합니다!
                      </div>
                    )}
                    {!workloadPreview.isDailyExceeded && !workloadPreview.isWeeklyExceeded && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                        시수 규정 준수 (1일 6시간 / 주간 20시간 이내)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Warning Message Box with Force Override */}
              {warningMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{warningMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleSave(e, true)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shrink-0 whitespace-nowrap shadow-xs"
                  >
                    경고 확인 후 강제 저장
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    강의 요일 *
                  </label>
                  <div className="grid grid-cols-6 gap-1">
                    {DAYS_OF_WEEK.map((d) => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setDay(d)}
                        className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                          day === d
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      시작 시간 *
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      종료 시간 *
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    강의실 위치 *
                  </label>
                  <input
                    type="text"
                    required
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="예: IT관 301호"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    최대 정원 (명) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    required
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {isCreating && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    시간표 블록 색상
                  </label>
                  <div className="flex items-center gap-2">
                    {['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600', 'bg-violet-600'].map((color, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setColorIndex(idx)}
                        className={`w-7 h-7 rounded-full ${color} transition-all ${
                          colorIndex === idx ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-slate-100 scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  강의 계획 및 안내사항
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="강의 세부 내용, 주차별 목표 또는 선수과목을 입력하세요."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          {isViewing && course ? (
            <>
              <div>
                {role === 'admin' && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    강의 삭제
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {role === 'student' && (
                  <button
                    type="button"
                    onClick={handleEnrollToggle}
                    disabled={!isEnrolled && (currentEnrolledCount >= course.maxCapacity || conflictInfo.hasClash)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-colors shadow-xs ${
                      isEnrolled
                        ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                        : conflictInfo.hasClash
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : currentEnrolledCount >= course.maxCapacity
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isEnrolled ? (
                      <>
                        <X className="w-4 h-4" />
                        수강 취소
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        수강 신청하기
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                취소
              </button>

              <button
                type="submit"
                form="course-form"
                className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                {isCreating ? '강의 개설 완료' : '수정사항 저장'}
              </button>
            </>
          )}
        </div>
      </div>

      <CourseEvaluationModal
        isOpen={isEvalModalOpen}
        course={course || null}
        onClose={() => setIsEvalModalOpen(false)}
      />
    </div>
  );
};
