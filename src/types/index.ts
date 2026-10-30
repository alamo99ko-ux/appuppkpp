export type UserRole = 'admin' | 'instructor' | 'student';

export type DayOfWeek = '월' | '화' | '수' | '목' | '금' | '토';

export interface TrainingProgram {
  id: string;
  code: string;
  name: string;
  description: string;
  targetHours: number;
  badgeColor: string;
}

export interface Instructor {
  id: string;
  name: string;
  department: string;
  email: string;
  phone: string;
  avatarBg: string;
}

export interface Student {
  id: string;
  name: string;
  studentId: string;
  grade: string;
  major: string;
  email: string;
  avatarBg: string;
  programId?: string;
  programName?: string;
}

export interface CourseColor {
  bg: string;
  border: string;
  text: string;
  accent: string;
  lightBg: string;
}

export type CourseEnrollmentStatus = 'available' | 'closed' | 'waitlist';

export interface Course {
  id: string;
  code: string;
  name: string;
  category: string;
  programId?: string;
  programName?: string;
  instructorId: string;
  instructorName: string;
  day: DayOfWeek;
  startTime: string; // HH:mm e.g. "09:00"
  endTime: string;   // HH:mm e.g. "11:00"
  durationHours: number; // e.g. 2
  room: string;
  maxCapacity: number;
  description: string;
  color: CourseColor;
  status?: CourseEnrollmentStatus; // 'available' (신청가능) | 'closed' (마감) | 'waitlist' (대기중)
  waitlistCapacity?: number;
}

export interface WaitlistEntry {
  id: string;
  courseId: string;
  studentId: string;
  waitNumber: number;
  appliedAt: string;
}

export interface InstructorWorkloadStatus {
  instructorId: string;
  instructorName: string;
  weeklyHours: number;
  maxDailyHours: number;
  maxDailyDay: DayOfWeek;
  dailyHours: Record<DayOfWeek, number>;
  monthlyHours: number; // 주간시수 × 4주
  annualHours: number;  // 주간시수 × 40주 (연간 훈련/학기 기준)
  isDailyExceeded: boolean; // > 6 hours
  isWeeklyExceeded: boolean; // > 20 hours
  isDailyCaution: boolean; // >= 5 hours
  isWeeklyCaution: boolean; // >= 16 hours
  violatingDays: { day: DayOfWeek; hours: number }[];
  status: 'normal' | 'caution' | 'danger';
}

export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: string;
}

export interface TimeSlot {
  startHour: number;
  label: string;
}

export interface CourseReview {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  rating: number; // 1 to 5
  comment: string;
  tags?: string[];
  isAnonymous?: boolean;
  createdAt: string;
}

export type MaterialCategory = '강의계획서' | '수업유인물' | '실습자료' | '과제안내' | '참고자료';

export interface CourseMaterial {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  instructorId: string;
  instructorName: string;
  title: string;
  category: MaterialCategory;
  description: string;
  fileName: string;
  fileSize: string;
  fileFormat: 'PDF' | 'HWP' | 'PPTX' | 'ZIP' | 'XLSX' | 'DOCX';
  downloadCount: number;
  uploadedAt: string;
  contentPreview?: string;
}

export type AbsenceType = 'instructor_cancel' | 'student_absence';
export type AbsenceStatus = 'pending' | 'approved' | 'rejected';

export interface AbsenceRequest {
  id: string;
  type: AbsenceType; // 'instructor_cancel' (교관 결강·휴강 신청) | 'student_absence' (학생 결석·공결 신청)
  courseId: string;
  courseName: string;
  courseCode: string;
  programId?: string;
  programName?: string;
  applicantRole: 'instructor' | 'student';
  applicantId: string;
  applicantName: string;
  absenceDate: string; // YYYY-MM-DD
  reasonCategory: string; // 기상악화, 기체정비, 공무출장, 병결, 개인사정, 훈련일정조정 등
  reasonDetail: string;
  makeupDate?: string; // 보강 예정일 YYYY-MM-DD
  makeupStartTime?: string; // HH:mm
  makeupEndTime?: string;   // HH:mm
  makeupRoom?: string;
  status: AbsenceStatus;
  createdAt: string;
  processedAt?: string;
  adminNote?: string;
}

export interface AccessLogEntry {
  id: string;
  timestamp: string;
  role: UserRole;
  userId: string;
  userName: string;
  departmentOrMajor: string;
  pageId: string;
  pageTitle: string;
  action: string;
  ipOrDevice: string;
}
