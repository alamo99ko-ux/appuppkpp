export type UserRole = 'admin' | 'instructor' | 'student';

export type DayOfWeek = '월' | '화' | '수' | '목' | '금' | '토';

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
}

export interface CourseColor {
  bg: string;
  border: string;
  text: string;
  accent: string;
  lightBg: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  category: string;
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
