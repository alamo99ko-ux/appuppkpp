import React, { useState, useEffect } from 'react';
import { Course, CourseReview } from '../types';
import { useApp } from '../context/AppContext';
import { X, Star, Check, Trash2, MessageSquare, ShieldCheck, User } from 'lucide-react';

interface CourseEvaluationModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

const FEEDBACK_TAGS = [
  '강의 전달력 우수',
  '실무/실습 도움됨',
  '질의응답 친절',
  '강의자료 유익',
  '비행안전 이해 증진',
  '시간 엄수',
  '과제량 적정',
  '피드백 신속',
];

const RATING_LABELS: Record<number, { text: string; desc: string }> = {
  5: { text: '5점 (매우 만족)', desc: '탁월하고 매우 유익한 강의였습니다.' },
  4: { text: '4점 (만족)', desc: '전반적으로 충실하고 만족스러웠습니다.' },
  3: { text: '3점 (보통)', desc: '기본에 충실하며 무난한 강의였습니다.' },
  2: { text: '2점 (미흡)', desc: '개선이나 보완이 필요한 부분이 있었습니다.' },
  1: { text: '1점 (매우 불만)', desc: '강의 진행 및 내용에 많은 아쉬움이 있었습니다.' },
};

export const CourseEvaluationModal: React.FC<CourseEvaluationModalProps> = ({
  course,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    selectedStudentId,
    students,
    addReview,
    updateReview,
    deleteReview,
    getStudentCourseReview,
  } = useApp();

  const currentStudent = students.find(s => s.id === selectedStudentId);

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [existingReview, setExistingReview] = useState<CourseReview | null>(null);

  // Initialize form when opened or course changes
  useEffect(() => {
    if (course && isOpen) {
      const prev = getStudentCourseReview(course.id, selectedStudentId);
      if (prev) {
        setExistingReview(prev);
        setRating(prev.rating);
        setComment(prev.comment);
        setSelectedTags(prev.tags || []);
        setIsAnonymous(prev.isAnonymous ?? false);
      } else {
        setExistingReview(null);
        setRating(5);
        setComment('');
        setSelectedTags(['강의 전달력 우수', '실무/실습 도움됨']);
        setIsAnonymous(false);
      }
      setHoverRating(null);
      setErrorMessage('');
    }
  }, [course, isOpen, selectedStudentId, getStudentCourseReview]);

  if (!isOpen || !course) return null;

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (rating < 1 || rating > 5) {
      setErrorMessage('별점을 1점부터 5점 사이로 선택해주세요.');
      return;
    }

    if (!comment.trim()) {
      setErrorMessage('강의에 대한 솔직한 코멘트를 작성해주세요 (최소 5자 이상).');
      return;
    }

    if (comment.trim().length < 5) {
      setErrorMessage('코멘트를 최소 5자 이상 작성해주세요.');
      return;
    }

    if (existingReview) {
      const res = updateReview({
        ...existingReview,
        rating,
        comment: comment.trim(),
        tags: selectedTags,
        isAnonymous,
      });
      if (res.success) {
        onSuccess?.(res.message);
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } else {
      const res = addReview({
        courseId: course.id,
        studentId: selectedStudentId,
        studentName: currentStudent?.name || '수강생',
        rating,
        comment: comment.trim(),
        tags: selectedTags,
        isAnonymous,
      });
      if (res.success) {
        onSuccess?.(res.message);
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    }
  };

  const handleDelete = () => {
    if (!existingReview) return;
    if (confirm('작성하신 강의 평가를 정말 삭제하시겠습니까?')) {
      deleteReview(existingReview.id);
      onSuccess?.('강의 평가가 삭제되었습니다.');
      onClose();
    }
  };

  const activeRating = hoverRating ?? rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {existingReview ? '강의 평가 수정' : '강의 만족도 평가'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                수강 종료 후 교관 및 강의에 대한 피드백을 남겨주세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Course Info Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{course.code}</span>
              <span>{course.category} · {course.room}</span>
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100">
              {course.name}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 pt-1">
              <span>담당: <strong>{course.instructorName}</strong></span>
              <span>·</span>
              <span>{course.day}요일 {course.startTime} ~ {course.endTime}</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Interactive Star Rating */}
          <div className="text-center space-y-2 py-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              강의 종합 만족도 (별점 선택)
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map(starNum => {
                const isFilled = starNum <= activeRating;
                return (
                  <button
                    key={starNum}
                    type="button"
                    onClick={() => setRating(starNum)}
                    onMouseEnter={() => setHoverRating(starNum)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1.5 focus:outline-hidden hover:scale-115 active:scale-95 transition-transform"
                    aria-label={`${starNum}점`}
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        isFilled
                          ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                          : 'fill-transparent text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {RATING_LABELS[activeRating]?.text}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {RATING_LABELS[activeRating]?.desc}
            </div>
          </div>

          {/* Quick Keyword Tags */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                특징 및 장점 키워드 선택 (다중 선택)
              </label>
              <span className="text-[11px] text-slate-400">
                {selectedTags.length}개 선택됨
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FEEDBACK_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                상세 수강 소감 및 피드백 코멘트
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {comment.length} / 500자
              </span>
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="강의 내용, 교관님의 교수 방식, 실습 피드백, 다음 학기 수강생을 위한 유익한 조언 등을 자유롭게 남겨주세요."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
            />
          </div>

          {/* Anonymity & Reviewer Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                {isAnonymous ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isAnonymous ? '익명으로 등록' : `작성자: ${currentStudent?.name || '수강생'}`}
                </div>
                <div className="text-[11px] text-slate-500">
                  {isAnonymous ? '강사와 다른 학생에게 이름이 노출되지 않습니다.' : '본인 이름으로 평가가 등록됩니다.'}
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>익명 설정</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            {existingReview ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>평가 삭제</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                취소
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {existingReview && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  취소
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-2xs hover:shadow-md transition-all flex items-center gap-1.5"
              >
                <Star className="w-4 h-4 fill-white" />
                <span>{existingReview ? '평가 수정 완료' : '강의 평가 등록'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
