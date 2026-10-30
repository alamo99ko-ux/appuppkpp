import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Course, Instructor, Student, Enrollment, UserRole, DayOfWeek, InstructorWorkloadStatus, WaitlistEntry, CourseEnrollmentStatus, CourseReview, CourseMaterial } from '../types';
import { INITIAL_COURSES, INITIAL_INSTRUCTORS, INITIAL_STUDENTS, INITIAL_ENROLLMENTS, INITIAL_WAITLISTS, INITIAL_REVIEWS, INITIAL_MATERIALS, COLOR_PALETTES } from '../data/mockData';

export const MAX_DAILY_INSTRUCTOR_HOURS = 6;
export const MAX_WEEKLY_INSTRUCTOR_HOURS = 20;

// Helper to calculate duration in hours between "HH:mm" and "HH:mm"
export function calculateHours(startTime: string, endTime: string): number {
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  const startMin = sH * 60 + sM;
  const endMin = eH * 60 + eM;
  const diffMin = Math.max(0, endMin - startMin);
  return Number((diffMin / 60).toFixed(1));
}

// Helper to check if two time ranges overlap on the same day
export function isTimeOverlapping(
  day1: DayOfWeek,
  start1: string,
  end1: string,
  day2: DayOfWeek,
  start2: string,
  end2: string
): boolean {
  if (day1 !== day2) return false;
  const [s1H, s1M] = start1.split(':').map(Number);
  const [e1H, e1M] = end1.split(':').map(Number);
  const [s2H, s2M] = start2.split(':').map(Number);
  const [e2H, e2M] = end2.split(':').map(Number);

  const startMin1 = s1H * 60 + s1M;
  const endMin1 = e1H * 60 + e1M;
  const startMin2 = s2H * 60 + s2M;
  const endMin2 = e2H * 60 + e2M;

  return Math.max(startMin1, startMin2) < Math.min(endMin1, endMin2);
}

export interface InstructorStatItem {
  instructor: Instructor;
  courses: Course[];
  totalHours: number; // weekly hours
  totalStudents: number;
  dailyHours: Record<DayOfWeek, number>;
  maxDailyHours: number;
  maxDailyDay: DayOfWeek;
  weeklyHours: number;
  monthlyHours: number; // 주간시수 × 4주
  annualHours: number;  // 주간시수 × 40주 (연간 훈련 기준)
  workloadStatus: InstructorWorkloadStatus;
}

export interface StudentStatItem {
  student: Student;
  enrolledCourses: Course[];
  totalHours: number;
  courseCount: number;
}

export interface CategoryStatItem {
  category: string;
  courseCount: number;
  totalHours: number;
  totalStudents: number;
}

export interface DayStatItem {
  day: DayOfWeek;
  courseCount: number;
  totalHours: number;
}

export interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  selectedInstructorId: string;
  setSelectedInstructorId: (id: string) => void;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  courses: Course[];
  instructors: Instructor[];
  students: Student[];
  enrollments: Enrollment[];
  waitlists: WaitlistEntry[];
  
  // Operations
  addCourse: (courseData: Omit<Course, 'id' | 'color' | 'durationHours'> & { colorIndex?: number }, forceAllowOverload?: boolean) => { success: boolean; message?: string; isWarning?: boolean };
  updateCourse: (course: Course, forceAllowOverload?: boolean) => { success: boolean; message?: string; isWarning?: boolean };
  deleteCourse: (courseId: string) => void;
  enrollCourse: (courseId: string, studentId: string) => { success: boolean; message: string };
  cancelEnrollment: (courseId: string, studentId: string) => { success: boolean; message: string };
  isStudentEnrolled: (courseId: string, studentId: string) => boolean;
  getCourseEnrollmentCount: (courseId: string) => number;
  getStudentEnrolledCourses: (studentId: string) => Course[];
  getInstructorCourses: (instructorId: string) => Course[];
  getEnrolledStudentsForCourse: (courseId: string) => Student[];
  checkStudentTimeClash: (course: Course, studentId: string) => { hasClash: boolean; conflictingCourse?: Course };
  checkInstructorTimeClash: (day: DayOfWeek, startTime: string, endTime: string, instructorId: string, excludeCourseId?: string) => { hasClash: boolean; conflictingCourse?: Course };
  checkRoomConflict: (day: DayOfWeek, startTime: string, endTime: string, room: string, excludeCourseId?: string) => { hasClash: boolean; conflictingCourse?: Course };
  
  // Waitlist / 대기 신청 & Course Status helpers
  addToWaitlist: (courseId: string, studentId: string) => { success: boolean; message: string };
  cancelWaitlist: (courseId: string, studentId: string) => { success: boolean; message: string };
  isStudentWaitlisted: (courseId: string, studentId: string) => boolean;
  getCourseWaitlistCount: (courseId: string) => number;
  getStudentWaitlistPosition: (courseId: string, studentId: string) => number | null;
  getCourseEffectiveStatus: (course: Course, studentId?: string) => CourseEnrollmentStatus;
  
  // Instructor / 교관 management & Excel bulk upload
  addInstructor: (instructorData: Omit<Instructor, 'id' | 'avatarBg'>) => void;
  updateInstructor: (instructor: Instructor) => void;
  deleteInstructor: (instructorId: string) => void;
  bulkAddInstructors: (newInstructors: Omit<Instructor, 'id' | 'avatarBg'>[]) => { addedCount: number };

  // Student / 학생명단 management & Excel bulk upload
  addStudent: (studentData: Omit<Student, 'id' | 'avatarBg'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (studentId: string) => void;
  bulkAddStudents: (newStudents: Omit<Student, 'id' | 'avatarBg'>[]) => { addedCount: number };

  // Course / 강의과목 bulk upload
  bulkAddCourses: (newCourses: any[]) => { addedCount: number; errors: string[] };
  
  // Workload Guardrails (Day <= 6h, Week <= 20h)
  getInstructorWorkloadStatus: (instructorId: string, additionalCourse?: { day: DayOfWeek; durationHours: number; excludeCourseId?: string }) => InstructorWorkloadStatus;
  allInstructorWorkloads: InstructorWorkloadStatus[];
  
  // Statistics
  totalLectureHours: number;
  totalEnrollmentCount: number;
  instructorStats: InstructorStatItem[];
  studentStats: StudentStatItem[];
  categoryStats: CategoryStatItem[];
  dayStats: DayStatItem[];
  
  // Course Evaluation & Reviews / 강의 평가 시스템
  reviews: CourseReview[];
  addReview: (reviewData: Omit<CourseReview, 'id' | 'createdAt'>) => { success: boolean; message: string };
  updateReview: (review: CourseReview) => { success: boolean; message: string };
  deleteReview: (reviewId: string) => void;
  getCourseReviews: (courseId: string) => CourseReview[];
  getCourseRatingStats: (courseId: string) => { average: number; count: number; distribution: Record<number, number> };
  getStudentCourseReview: (courseId: string, studentId: string) => CourseReview | undefined;
  getInstructorAverageRating: (instructorId: string) => { average: number; count: number };

  // Course Materials / 강의 자료실
  materials: CourseMaterial[];
  addMaterial: (data: Omit<CourseMaterial, 'id' | 'uploadedAt' | 'downloadCount'>) => { success: boolean; message: string };
  updateMaterial: (data: CourseMaterial) => { success: boolean; message: string };
  deleteMaterial: (materialId: string) => void;
  incrementDownloadCount: (materialId: string) => void;
  getCourseMaterials: (courseId: string) => CourseMaterial[];
  getInstructorMaterials: (instructorId: string) => CourseMaterial[];

  // Storage & presets
  resetToDefault: () => void;
  exportDataJson: () => void;
  importDataJson: (jsonString: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('student');
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('inst-1');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('stud-1');
  const [activeTab, setActiveTab] = useState<string>('timetable');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('classtime_theme') === 'dark';
  });

  const [instructors, setInstructors] = useState<Instructor[]>(() => {
    try {
      const saved = localStorage.getItem('classtime_instructors');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure default 9 instructors are active if previously cached legacy data was present
        if (Array.isArray(parsed) && parsed.length >= 9 && parsed.some(i => i.name.includes('고승희'))) {
          return parsed;
        }
      }
      return INITIAL_INSTRUCTORS;
    } catch {
      return INITIAL_INSTRUCTORS;
    }
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem('classtime_courses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(c => c.instructorName.includes('고승희'))) {
          return parsed;
        }
      }
      return INITIAL_COURSES;
    } catch {
      return INITIAL_COURSES;
    }
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('classtime_students');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 5) {
          return parsed;
        }
      }
      return INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [enrollments, setEnrollments] = useState<Enrollment[]>(() => {
    try {
      const saved = localStorage.getItem('classtime_enrollments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_ENROLLMENTS;
    } catch {
      return INITIAL_ENROLLMENTS;
    }
  });

  const [waitlists, setWaitlists] = useState<WaitlistEntry[]>(() => {
    try {
      const saved = localStorage.getItem('classtime_waitlists');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return INITIAL_WAITLISTS;
    } catch {
      return INITIAL_WAITLISTS;
    }
  });

  const [reviews, setReviews] = useState<CourseReview[]>(() => {
    try {
      const saved = localStorage.getItem('classtime_reviews');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_REVIEWS;
    } catch {
      return INITIAL_REVIEWS;
    }
  });

  const [materials, setMaterials] = useState<CourseMaterial[]>(() => {
    try {
      const saved = localStorage.getItem('classtime_materials');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_MATERIALS;
    } catch {
      return INITIAL_MATERIALS;
    }
  });

  // Sync dark class on documentElement
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('classtime_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('classtime_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('classtime_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('classtime_enrollments', JSON.stringify(enrollments));
  }, [enrollments]);

  useEffect(() => {
    localStorage.setItem('classtime_waitlists', JSON.stringify(waitlists));
  }, [waitlists]);

  useEffect(() => {
    localStorage.setItem('classtime_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('classtime_materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('classtime_instructors', JSON.stringify(instructors));
  }, [instructors]);

  useEffect(() => {
    localStorage.setItem('classtime_students', JSON.stringify(students));
  }, [students]);

  // Query helpers
  const isStudentEnrolled = (courseId: string, studentId: string): boolean => {
    return enrollments.some(e => e.courseId === courseId && e.studentId === studentId);
  };

  const getCourseEnrollmentCount = (courseId: string): number => {
    return enrollments.filter(e => e.courseId === courseId).length;
  };

  const getStudentEnrolledCourses = (studentId: string): Course[] => {
    const studentCourseIds = enrollments.filter(e => e.studentId === studentId).map(e => e.courseId);
    return courses.filter(c => studentCourseIds.includes(c.id));
  };

  const getInstructorCourses = (instructorId: string): Course[] => {
    return courses.filter(c => c.instructorId === instructorId);
  };

  const getEnrolledStudentsForCourse = (courseId: string): Student[] => {
    const studentIds = enrollments.filter(e => e.courseId === courseId).map(e => e.studentId);
    return students.filter(s => studentIds.includes(s.id));
  };

  // Clash checking
  const checkStudentTimeClash = (
    newCourse: Course,
    studentId: string
  ): { hasClash: boolean; conflictingCourse?: Course } => {
    const enrolled = getStudentEnrolledCourses(studentId);
    for (const c of enrolled) {
      if (c.id === newCourse.id) continue;
      if (isTimeOverlapping(c.day, c.startTime, c.endTime, newCourse.day, newCourse.startTime, newCourse.endTime)) {
        return { hasClash: true, conflictingCourse: c };
      }
    }
    return { hasClash: false };
  };

  const checkInstructorTimeClash = (
    day: DayOfWeek,
    startTime: string,
    endTime: string,
    instructorId: string,
    excludeCourseId?: string
  ): { hasClash: boolean; conflictingCourse?: Course } => {
    const instructorCourses = courses.filter(
      c => c.instructorId === instructorId && c.id !== excludeCourseId
    );
    for (const c of instructorCourses) {
      if (isTimeOverlapping(c.day, c.startTime, c.endTime, day, startTime, endTime)) {
        return { hasClash: true, conflictingCourse: c };
      }
    }
    return { hasClash: false };
  };

  const checkRoomConflict = (
    day: DayOfWeek,
    startTime: string,
    endTime: string,
    room: string,
    excludeCourseId?: string
  ): { hasClash: boolean; conflictingCourse?: Course } => {
    if (!room || !room.trim()) return { hasClash: false };
    const roomCourses = courses.filter(
      c => c.room.trim().toLowerCase() === room.trim().toLowerCase() && c.id !== excludeCourseId
    );
    for (const c of roomCourses) {
      if (isTimeOverlapping(c.day, c.startTime, c.endTime, day, startTime, endTime)) {
        return { hasClash: true, conflictingCourse: c };
      }
    }
    return { hasClash: false };
  };

  const getInstructorWorkloadStatus = (
    instructorId: string,
    additionalCourse?: { day: DayOfWeek; durationHours: number; excludeCourseId?: string }
  ): InstructorWorkloadStatus => {
    const inst = instructors.find(i => i.id === instructorId);
    const instructorName = inst?.name || '강사';

    let instCourses = courses.filter(c => c.instructorId === instructorId);
    if (additionalCourse?.excludeCourseId) {
      instCourses = instCourses.filter(c => c.id !== additionalCourse.excludeCourseId);
    }

    const dailyHoursMap: Record<DayOfWeek, number> = {
      월: 0, 화: 0, 수: 0, 목: 0, 금: 0, 토: 0,
    };

    instCourses.forEach(c => {
      if (dailyHoursMap[c.day] !== undefined) {
        dailyHoursMap[c.day] += c.durationHours || 0;
      }
    });

    if (additionalCourse) {
      dailyHoursMap[additionalCourse.day] = (dailyHoursMap[additionalCourse.day] || 0) + additionalCourse.durationHours;
    }

    const violatingDays: { day: DayOfWeek; hours: number }[] = [];
    let maxDailyHours = 0;
    let maxDailyDay: DayOfWeek = '월';

    (Object.keys(dailyHoursMap) as DayOfWeek[]).forEach(d => {
      const hours = Number(dailyHoursMap[d].toFixed(1));
      if (hours > maxDailyHours) {
        maxDailyHours = hours;
        maxDailyDay = d;
      }
      if (hours > MAX_DAILY_INSTRUCTOR_HOURS) {
        violatingDays.push({ day: d, hours });
      }
    });

    const weeklyHours = Number(
      (Object.values(dailyHoursMap).reduce((sum, h) => sum + h, 0)).toFixed(1)
    );

    const isDailyExceeded = violatingDays.length > 0;
    const isWeeklyExceeded = weeklyHours > MAX_WEEKLY_INSTRUCTOR_HOURS;
    const isDailyCaution = !isDailyExceeded && maxDailyHours >= 5;
    const isWeeklyCaution = !isWeeklyExceeded && weeklyHours >= 16;

    let status: 'normal' | 'caution' | 'danger' = 'normal';
    if (isDailyExceeded || isWeeklyExceeded) {
      status = 'danger';
    } else if (isDailyCaution || isWeeklyCaution) {
      status = 'caution';
    }

    const monthlyHours = Number((weeklyHours * 4).toFixed(1));
    const annualHours = Number((weeklyHours * 40).toFixed(1));

    return {
      instructorId,
      instructorName,
      weeklyHours,
      maxDailyHours,
      maxDailyDay,
      dailyHours: dailyHoursMap,
      monthlyHours,
      annualHours,
      isDailyExceeded,
      isWeeklyExceeded,
      isDailyCaution,
      isWeeklyCaution,
      violatingDays,
      status,
    };
  };

  const allInstructorWorkloads = useMemo<InstructorWorkloadStatus[]>(() => {
    return instructors.map(inst => getInstructorWorkloadStatus(inst.id));
  }, [instructors, courses]);

  // Course actions
  const addCourse = (
    courseData: Omit<Course, 'id' | 'color' | 'durationHours'> & { colorIndex?: number },
    forceAllowOverload = false
  ): { success: boolean; message?: string; isWarning?: boolean } => {
    // 1. Clash check for instructor
    const instClash = checkInstructorTimeClash(
      courseData.day,
      courseData.startTime,
      courseData.endTime,
      courseData.instructorId
    );

    if (instClash.hasClash && instClash.conflictingCourse) {
      return {
        success: false,
        message: `${courseData.instructorName}님은 해당 요일(${courseData.day}) ${instClash.conflictingCourse.startTime}~${instClash.conflictingCourse.endTime}에 '${instClash.conflictingCourse.name}' 강의 일정이 이미 등록되어 있어 중복 배정할 수 없습니다.`,
      };
    }

    // 2. Room clash check
    const roomClash = checkRoomConflict(
      courseData.day,
      courseData.startTime,
      courseData.endTime,
      courseData.room
    );

    if (roomClash.hasClash && roomClash.conflictingCourse) {
      return {
        success: false,
        message: `강의실 중복: '${courseData.room}'은(는) 해당 시간에 '${roomClash.conflictingCourse.name}' (${roomClash.conflictingCourse.instructorName}) 강의에서 이미 사용 중입니다.`,
      };
    }

    const duration = calculateHours(courseData.startTime, courseData.endTime);

    // 3. Workload limits check (Day > 6h, Week > 20h)
    const workloadAfter = getInstructorWorkloadStatus(courseData.instructorId, {
      day: courseData.day,
      durationHours: duration,
    });

    if (workloadAfter.status === 'danger' && !forceAllowOverload) {
      const reasons: string[] = [];
      if (workloadAfter.isDailyExceeded) {
        reasons.push(`${courseData.day}요일 일일 시수가 ${workloadAfter.violatingDays.find(v => v.day === courseData.day)?.hours}시간으로 1일 상한(6시간)을 초과`);
      }
      if (workloadAfter.isWeeklyExceeded) {
        reasons.push(`주간 총 시수가 ${workloadAfter.weeklyHours}시간으로 주간 상한(20시간)을 초과`);
      }
      return {
        success: false,
        isWarning: true,
        message: `[강사 시수 초과 경고] ${courseData.instructorName}: ${reasons.join(', ')}합니다. 계속 진행하시겠습니까?`,
      };
    }

    const paletteIndex = courseData.colorIndex !== undefined ? courseData.colorIndex % COLOR_PALETTES.length : courses.length % COLOR_PALETTES.length;

    const newCourse: Course = {
      ...courseData,
      id: `course-${Date.now()}`,
      durationHours: duration,
      color: COLOR_PALETTES[paletteIndex],
    };

    setCourses(prev => [...prev, newCourse]);
    return { success: true };
  };

  const updateCourse = (
    updatedCourse: Course,
    forceAllowOverload = false
  ): { success: boolean; message?: string; isWarning?: boolean } => {
    const instClash = checkInstructorTimeClash(
      updatedCourse.day,
      updatedCourse.startTime,
      updatedCourse.endTime,
      updatedCourse.instructorId,
      updatedCourse.id
    );

    if (instClash.hasClash && instClash.conflictingCourse) {
      return {
        success: false,
        message: `${updatedCourse.instructorName}님은 해당 시간에 '${instClash.conflictingCourse.name}' 강의 일정이 있습니다.`,
      };
    }

    const roomClash = checkRoomConflict(
      updatedCourse.day,
      updatedCourse.startTime,
      updatedCourse.endTime,
      updatedCourse.room,
      updatedCourse.id
    );

    if (roomClash.hasClash && roomClash.conflictingCourse) {
      return {
        success: false,
        message: `강의실 중복: '${updatedCourse.room}'은(는) 해당 시간에 '${roomClash.conflictingCourse.name}' 강의에서 이미 사용 중입니다.`,
      };
    }

    const duration = calculateHours(updatedCourse.startTime, updatedCourse.endTime);

    const workloadAfter = getInstructorWorkloadStatus(updatedCourse.instructorId, {
      day: updatedCourse.day,
      durationHours: duration,
      excludeCourseId: updatedCourse.id,
    });

    if (workloadAfter.status === 'danger' && !forceAllowOverload) {
      const reasons: string[] = [];
      if (workloadAfter.isDailyExceeded) {
        reasons.push(`${updatedCourse.day}요일 일일 시수가 1일 상한(6시간)을 초과`);
      }
      if (workloadAfter.isWeeklyExceeded) {
        reasons.push(`주간 총 시수가 ${workloadAfter.weeklyHours}시간으로 주간 상한(20시간)을 초과`);
      }
      return {
        success: false,
        isWarning: true,
        message: `[강사 시수 초과 경고] ${updatedCourse.instructorName}: ${reasons.join(', ')}합니다. 계속 진행하시겠습니까?`,
      };
    }

    setCourses(prev => prev.map(c => (c.id === updatedCourse.id ? { ...updatedCourse, durationHours: duration } : c)));
    return { success: true };
  };

  const deleteCourse = (courseId: string) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
    // also remove enrollments
    setEnrollments(prev => prev.filter(e => e.courseId !== courseId));
  };

  const enrollCourse = (courseId: string, studentId: string): { success: boolean; message: string } => {
    const course = courses.find(c => c.id === courseId);
    if (!course) {
      return { success: false, message: '강의를 찾을 수 없습니다.' };
    }

    // Check already enrolled
    if (isStudentEnrolled(courseId, studentId)) {
      return { success: false, message: '이미 수강신청된 강의입니다.' };
    }

    // Check capacity
    const currentCount = getCourseEnrollmentCount(courseId);
    if (currentCount >= course.maxCapacity) {
      return { success: false, message: `수강 정원(${course.maxCapacity}명)이 초과되어 신청할 수 없습니다.` };
    }

    // Check time conflict with student's other enrolled courses
    const clash = checkStudentTimeClash(course, studentId);
    if (clash.hasClash && clash.conflictingCourse) {
      return {
        success: false,
        message: `시간 중복 경고: 이미 신청한 '${clash.conflictingCourse.name}' (${clash.conflictingCourse.day} ${clash.conflictingCourse.startTime}~${clash.conflictingCourse.endTime}) 강의와 시간이 겹칩니다!`,
      };
    }

    const newEnrollment: Enrollment = {
      id: `en-${Date.now()}`,
      courseId,
      studentId,
      enrolledAt: new Date().toISOString(),
    };

    setEnrollments(prev => [...prev, newEnrollment]);
    return { success: true, message: `'${course.name}' 수강신청이 성공적으로 완료되었습니다.` };
  };

  const cancelEnrollment = (courseId: string, studentId: string): { success: boolean; message: string } => {
    const course = courses.find(c => c.id === courseId);
    const existing = enrollments.find(e => e.courseId === courseId && e.studentId === studentId);
    if (!existing) {
      return { success: false, message: '수강 신청 내역이 없습니다.' };
    }

    setEnrollments(prev => prev.filter(e => !(e.courseId === courseId && e.studentId === studentId)));
    return { success: true, message: `'${course?.name || '강의'}' 수강신청이 취소되었습니다.` };
  };

  // Waitlist & Course status helpers
  const isStudentWaitlisted = (courseId: string, studentId: string): boolean => {
    return waitlists.some(w => w.courseId === courseId && w.studentId === studentId);
  };

  const getCourseWaitlistCount = (courseId: string): number => {
    return waitlists.filter(w => w.courseId === courseId).length;
  };

  const getStudentWaitlistPosition = (courseId: string, studentId: string): number | null => {
    const courseWaitlist = waitlists
      .filter(w => w.courseId === courseId)
      .sort((a, b) => a.waitNumber - b.waitNumber);
    const index = courseWaitlist.findIndex(w => w.studentId === studentId);
    return index !== -1 ? index + 1 : null;
  };

  const getCourseEffectiveStatus = (course: Course, studentId?: string): CourseEnrollmentStatus => {
    const activeStudentId = studentId || selectedStudentId;
    if (activeStudentId && isStudentWaitlisted(course.id, activeStudentId)) {
      return 'waitlist';
    }

    const enrolledCount = getCourseEnrollmentCount(course.id);
    const waitlistCount = getCourseWaitlistCount(course.id);

    if (course.status === 'closed') {
      return 'closed';
    }
    if (course.status === 'waitlist') {
      return 'waitlist';
    }
    if (course.status === 'available') {
      if (enrolledCount >= course.maxCapacity) {
        return (course.waitlistCapacity && course.waitlistCapacity > 0) ? 'waitlist' : 'closed';
      }
      return 'available';
    }

    if (enrolledCount >= course.maxCapacity) {
      if ((course.waitlistCapacity ?? 5) > 0 && waitlistCount < (course.waitlistCapacity ?? 5)) {
        return 'waitlist';
      }
      return 'closed';
    }

    if (waitlistCount > 0) {
      return 'waitlist';
    }

    return 'available';
  };

  const addToWaitlist = (courseId: string, studentId: string): { success: boolean; message: string } => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return { success: false, message: '강의를 찾을 수 없습니다.' };

    if (isStudentEnrolled(courseId, studentId)) {
      return { success: false, message: '이미 수강신청이 완료된 강좌입니다.' };
    }

    if (isStudentWaitlisted(courseId, studentId)) {
      return { success: false, message: '이미 대기 신청이 접수된 강좌입니다.' };
    }

    const currentWaitCount = getCourseWaitlistCount(courseId);
    const maxWait = course.waitlistCapacity ?? 5;
    if (maxWait > 0 && currentWaitCount >= maxWait) {
      return { success: false, message: '대기 정원도 마감되어 추가 신청이 불가능합니다.' };
    }

    const newWaitNumber = currentWaitCount + 1;
    const newEntry: WaitlistEntry = {
      id: `wl-${Date.now()}`,
      courseId,
      studentId,
      waitNumber: newWaitNumber,
      appliedAt: new Date().toISOString(),
    };

    setWaitlists(prev => [...prev, newEntry]);
    return {
      success: true,
      message: `'${course.name}' 대기 신청이 접수되었습니다. (대기 순번: ${newWaitNumber}번)`,
    };
  };

  const cancelWaitlist = (courseId: string, studentId: string): { success: boolean; message: string } => {
    const course = courses.find(c => c.id === courseId);
    const exists = isStudentWaitlisted(courseId, studentId);
    if (!exists) {
      return { success: false, message: '대기 신청 내역이 없습니다.' };
    }

    setWaitlists(prev => {
      const filtered = prev.filter(w => !(w.courseId === courseId && w.studentId === studentId));
      let rank = 1;
      return filtered.map(w => {
        if (w.courseId === courseId) {
          return { ...w, waitNumber: rank++ };
        }
        return w;
      });
    });

    return { success: true, message: `'${course?.name || '강의'}' 대기 신청이 취소되었습니다.` };
  };

  // Course Evaluation & Reviews / 강의 평가 시스템
  const addReview = (reviewData: Omit<CourseReview, 'id' | 'createdAt'>): { success: boolean; message: string } => {
    const existing = reviews.find(r => r.courseId === reviewData.courseId && r.studentId === reviewData.studentId);
    if (existing) {
      return { success: false, message: '이미 이 과목에 대한 강의 평가를 등록하셨습니다. 기존 평가를 수정해주세요.' };
    }
    const newReview: CourseReview = {
      ...reviewData,
      id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    setReviews(prev => [newReview, ...prev]);
    return { success: true, message: '강의 평가가 성공적으로 등록되었습니다.' };
  };

  const updateReview = (updatedReview: CourseReview): { success: boolean; message: string } => {
    setReviews(prev => prev.map(r => r.id === updatedReview.id ? { ...updatedReview, createdAt: new Date().toISOString() } : r));
    return { success: true, message: '강의 평가가 성공적으로 수정되었습니다.' };
  };

  const deleteReview = (reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));
  };

  const getCourseReviews = (courseId: string): CourseReview[] => {
    return reviews
      .filter(r => r.courseId === courseId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getCourseRatingStats = (courseId: string) => {
    const courseReviews = reviews.filter(r => r.courseId === courseId);
    const count = courseReviews.length;
    if (count === 0) {
      return { average: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }
    const totalScore = courseReviews.reduce((sum, r) => sum + r.rating, 0);
    const average = Number((totalScore / count).toFixed(1));
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    courseReviews.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      distribution[star] = (distribution[star] || 0) + 1;
    });
    return { average, count, distribution };
  };

  const getStudentCourseReview = (courseId: string, studentId: string): CourseReview | undefined => {
    return reviews.find(r => r.courseId === courseId && r.studentId === studentId);
  };

  const getInstructorAverageRating = (instructorId: string): { average: number; count: number } => {
    const instCourseIds = new Set(courses.filter(c => c.instructorId === instructorId).map(c => c.id));
    const instReviews = reviews.filter(r => instCourseIds.has(r.courseId));
    if (instReviews.length === 0) return { average: 0, count: 0 };
    const total = instReviews.reduce((sum, r) => sum + r.rating, 0);
    return {
      average: Number((total / instReviews.length).toFixed(1)),
      count: instReviews.length,
    };
  };

  // Course Materials / 강의 자료실
  const addMaterial = (data: Omit<CourseMaterial, 'id' | 'uploadedAt' | 'downloadCount'>): { success: boolean; message: string } => {
    const newMat: CourseMaterial = {
      ...data,
      id: `mat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      uploadedAt: new Date().toISOString(),
      downloadCount: 0,
    };
    setMaterials(prev => [newMat, ...prev]);
    return { success: true, message: `'${data.title}' 자료가 등록되었습니다.` };
  };

  const updateMaterial = (updated: CourseMaterial): { success: boolean; message: string } => {
    setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
    return { success: true, message: `'${updated.title}' 자료가 수정되었습니다.` };
  };

  const deleteMaterial = (materialId: string) => {
    setMaterials(prev => prev.filter(m => m.id !== materialId));
  };

  const incrementDownloadCount = (materialId: string) => {
    setMaterials(prev => prev.map(m => m.id === materialId ? { ...m, downloadCount: m.downloadCount + 1 } : m));
  };

  const getCourseMaterials = (courseId: string): CourseMaterial[] => {
    return materials
      .filter(m => m.courseId === courseId)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  };

  const getInstructorMaterials = (instructorId: string): CourseMaterial[] => {
    return materials
      .filter(m => m.instructorId === instructorId)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  };

  const AVATAR_COLORS = ['bg-indigo-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-cyan-600', 'bg-purple-600', 'bg-blue-600', 'bg-teal-600'];

  // Instructor / 교관 management
  const addInstructor = (instructorData: Omit<Instructor, 'id' | 'avatarBg'>) => {
    const avatarBg = AVATAR_COLORS[instructors.length % AVATAR_COLORS.length];
    const newInst: Instructor = {
      ...instructorData,
      id: `inst-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      avatarBg,
    };
    setInstructors(prev => [...prev, newInst]);
  };

  const updateInstructor = (updatedInst: Instructor) => {
    setInstructors(prev => prev.map(i => i.id === updatedInst.id ? updatedInst : i));
    setCourses(prev => prev.map(c => c.instructorId === updatedInst.id ? { ...c, instructorName: updatedInst.name } : c));
  };

  const deleteInstructor = (instructorId: string) => {
    setInstructors(prev => prev.filter(i => i.id !== instructorId));
  };

  const bulkAddInstructors = (newInstructors: Omit<Instructor, 'id' | 'avatarBg'>[]) => {
    const addedList: Instructor[] = newInstructors.map((data, idx) => ({
      ...data,
      id: `inst-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      avatarBg: AVATAR_COLORS[(instructors.length + idx) % AVATAR_COLORS.length],
    }));
    setInstructors(prev => [...prev, ...addedList]);
    return { addedCount: addedList.length };
  };

  // Student / 학생명단 management
  const addStudent = (studentData: Omit<Student, 'id' | 'avatarBg'>) => {
    const avatarBg = AVATAR_COLORS[students.length % AVATAR_COLORS.length];
    const newStudent: Student = {
      ...studentData,
      id: `stud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      avatarBg,
    };
    setStudents(prev => [...prev, newStudent]);
  };

  const updateStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  const deleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    setEnrollments(prev => prev.filter(e => e.studentId !== studentId));
  };

  const bulkAddStudents = (newStudents: Omit<Student, 'id' | 'avatarBg'>[]) => {
    const addedList: Student[] = newStudents.map((data, idx) => ({
      ...data,
      id: `stud-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      avatarBg: AVATAR_COLORS[(students.length + idx) % AVATAR_COLORS.length],
    }));
    setStudents(prev => [...prev, ...addedList]);
    return { addedCount: addedList.length };
  };

  // Course bulk import
  const bulkAddCourses = (newCoursesData: any[]) => {
    let addedCount = 0;
    const errors: string[] = [];
    const addedCourses: Course[] = [];

    newCoursesData.forEach((item, idx) => {
      const duration = calculateHours(item.startTime, item.endTime);
      const paletteIndex = (courses.length + idx) % COLOR_PALETTES.length;

      const course: Course = {
        id: `course-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        name: item.name,
        code: item.code || `C${Date.now() + idx}`,
        category: item.category || '컴퓨터공학',
        instructorId: item.instructorId || (instructors[0]?.id ?? ''),
        instructorName: item.instructorName || (instructors[0]?.name ?? '미배정 교관'),
        day: item.day || '월',
        startTime: item.startTime,
        endTime: item.endTime,
        durationHours: duration,
        room: item.room || '강의실',
        maxCapacity: item.maxCapacity || 30,
        description: item.description || '',
        color: COLOR_PALETTES[paletteIndex],
      };

      addedCourses.push(course);
      addedCount++;
    });

    if (addedCourses.length > 0) {
      setCourses(prev => [...prev, ...addedCourses]);
    }

    return { addedCount, errors };
  };

  // Comprehensive Statistics
  const totalLectureHours = useMemo(() => {
    return Number(courses.reduce((sum, c) => sum + (c.durationHours || 0), 0).toFixed(1));
  }, [courses]);

  const totalEnrollmentCount = useMemo(() => enrollments.length, [enrollments]);

  const instructorStats = useMemo<InstructorStatItem[]>(() => {
    return instructors.map(inst => {
      const instCourses = courses.filter(c => c.instructorId === inst.id);
      const totalHours = Number(instCourses.reduce((sum, c) => sum + (c.durationHours || 0), 0).toFixed(1));
      const totalStudents = instCourses.reduce((sum, c) => sum + getCourseEnrollmentCount(c.id), 0);
      const workload = getInstructorWorkloadStatus(inst.id);
      return {
        instructor: inst,
        courses: instCourses,
        totalHours,
        totalStudents,
        dailyHours: workload.dailyHours,
        maxDailyHours: workload.maxDailyHours,
        maxDailyDay: workload.maxDailyDay,
        weeklyHours: workload.weeklyHours,
        monthlyHours: workload.monthlyHours,
        annualHours: workload.annualHours,
        workloadStatus: workload,
      };
    }).sort((a, b) => b.totalHours - a.totalHours);
  }, [instructors, courses, enrollments]);

  const studentStats = useMemo<StudentStatItem[]>(() => {
    return students.map(stud => {
      const studEnrollments = enrollments.filter(e => e.studentId === stud.id);
      const studCourseIds = studEnrollments.map(e => e.courseId);
      const enrolledCourses = courses.filter(c => studCourseIds.includes(c.id));
      const totalHours = Number(enrolledCourses.reduce((sum, c) => sum + (c.durationHours || 0), 0).toFixed(1));
      return {
        student: stud,
        enrolledCourses,
        totalHours,
        courseCount: enrolledCourses.length,
      };
    }).sort((a, b) => b.totalHours - a.totalHours);
  }, [students, enrollments, courses]);

  const categoryStats = useMemo<CategoryStatItem[]>(() => {
    const categoriesMap: Record<string, { count: number; hours: number; students: number }> = {};
    
    courses.forEach(c => {
      const cat = c.category || '기타';
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = { count: 0, hours: 0, students: 0 };
      }
      categoriesMap[cat].count += 1;
      categoriesMap[cat].hours += c.durationHours || 0;
      categoriesMap[cat].students += getCourseEnrollmentCount(c.id);
    });

    return Object.entries(categoriesMap).map(([category, data]) => ({
      category,
      courseCount: data.count,
      totalHours: Number(data.hours.toFixed(1)),
      totalStudents: data.students,
    })).sort((a, b) => b.totalHours - a.totalHours);
  }, [courses, enrollments]);

  const dayStats = useMemo<DayStatItem[]>(() => {
    const days: DayOfWeek[] = ['월', '화', '수', '목', '금', '토'];
    return days.map(day => {
      const dayCourses = courses.filter(c => c.day === day);
      const totalHours = Number(dayCourses.reduce((sum, c) => sum + (c.durationHours || 0), 0).toFixed(1));
      return {
        day,
        courseCount: dayCourses.length,
        totalHours,
      };
    });
  }, [courses]);

  // Presets and restore
  const resetToDefault = () => {
    setCourses(INITIAL_COURSES);
    setInstructors(INITIAL_INSTRUCTORS);
    setStudents(INITIAL_STUDENTS);
    setEnrollments(INITIAL_ENROLLMENTS);
    setWaitlists(INITIAL_WAITLISTS);
    setReviews(INITIAL_REVIEWS);
    setMaterials(INITIAL_MATERIALS);
    localStorage.removeItem('classtime_courses');
    localStorage.removeItem('classtime_instructors');
    localStorage.removeItem('classtime_students');
    localStorage.removeItem('classtime_enrollments');
    localStorage.removeItem('classtime_waitlists');
    localStorage.removeItem('classtime_reviews');
    localStorage.removeItem('classtime_materials');
  };

  const exportDataJson = () => {
    const exportData = {
      courses,
      instructors,
      students,
      enrollments,
      waitlists,
      reviews,
      materials,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classtime-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDataJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.courses) && Array.isArray(data.enrollments)) {
        setCourses(data.courses);
        if (Array.isArray(data.instructors)) setInstructors(data.instructors);
        if (Array.isArray(data.students)) setStudents(data.students);
        if (Array.isArray(data.waitlists)) setWaitlists(data.waitlists);
        if (Array.isArray(data.reviews)) setReviews(data.reviews);
        if (Array.isArray(data.materials)) setMaterials(data.materials);
        setEnrollments(data.enrollments);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        selectedInstructorId,
        setSelectedInstructorId,
        selectedStudentId,
        setSelectedStudentId,
        activeTab,
        setActiveTab,
        isDarkMode,
        toggleDarkMode,
        courses,
        instructors,
        students,
        enrollments,
        waitlists,
        reviews,
        materials,
        addCourse,
        updateCourse,
        deleteCourse,
        enrollCourse,
        cancelEnrollment,
        isStudentEnrolled,
        getCourseEnrollmentCount,
        getStudentEnrolledCourses,
        getInstructorCourses,
        getEnrolledStudentsForCourse,
        checkStudentTimeClash,
        checkInstructorTimeClash,
        checkRoomConflict,
        addToWaitlist,
        cancelWaitlist,
        isStudentWaitlisted,
        getCourseWaitlistCount,
        getStudentWaitlistPosition,
        getCourseEffectiveStatus,
        addInstructor,
        updateInstructor,
        deleteInstructor,
        bulkAddInstructors,
        addStudent,
        updateStudent,
        deleteStudent,
        bulkAddStudents,
        bulkAddCourses,
        getInstructorWorkloadStatus,
        allInstructorWorkloads,
        totalLectureHours,
        totalEnrollmentCount,
        instructorStats,
        studentStats,
        categoryStats,
        dayStats,
        addReview,
        updateReview,
        deleteReview,
        getCourseReviews,
        getCourseRatingStats,
        getStudentCourseReview,
        getInstructorAverageRating,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        incrementDownloadCount,
        getCourseMaterials,
        getInstructorMaterials,
        resetToDefault,
        exportDataJson,
        importDataJson,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
