import * as XLSX from 'xlsx';
import { Instructor, Student, Course, TrainingProgram, AbsenceRequest, AccessLogEntry } from '../types';

export type DataEntityType = 'instructor' | 'student' | 'course' | 'program' | 'absence' | 'access_log';

export interface ExcelParseResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
}

/**
 * Read and parse Excel (.xlsx, .xls) or CSV file into JSON rows
 */
export async function readExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

/**
 * Parse uploaded Excel rows for Instructors / 교관
 */
export function parseInstructorsExcel(rows: any[]): ExcelParseResult<Omit<Instructor, 'id' | 'avatarBg'>> {
  const result: Omit<Instructor, 'id' | 'avatarBg'>[] = [];
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const name = row['교관명'] || row['이름'] || row['교관이름'] || row['강사명'] || row['성명'] || row['Name'] || row['name'];
    const department = row['소속'] || row['소속부서'] || row['학과'] || row['부서'] || row['Department'] || row['dept'] || '일반교육부';
    const email = row['이메일'] || row['Email'] || row['email'] || `${String(name).toLowerCase().replace(/\s+/g, '')}@academy.ac.kr`;
    const phone = row['연락처'] || row['전화번호'] || row['휴대폰'] || row['Phone'] || row['phone'] || '010-0000-0000';

    if (!name || String(name).trim() === '') {
      errors.push(`${rowNum}행: 교관(강사) 이름이 비어있어 건너뜁니다.`);
      return;
    }

    result.push({
      name: String(name).trim(),
      department: String(department).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
    });
  });

  return {
    success: result.length > 0,
    data: result,
    errors,
  };
}

/**
 * Parse uploaded Excel rows for Students / 학생 명단
 */
export function parseStudentsExcel(rows: any[], programs?: TrainingProgram[]): ExcelParseResult<Omit<Student, 'id' | 'avatarBg'>> {
  const result: Omit<Student, 'id' | 'avatarBg'>[] = [];
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const name = row['학생명'] || row['이름'] || row['학생이름'] || row['성명'] || row['Name'] || row['name'];
    const studentId = row['학번'] || row['학생번호'] || row['ID'] || row['StudentId'] || row['student_id'] || `2026${1000 + idx}`;
    const grade = row['학년'] || row['Grade'] || row['grade'] || '1학년';
    const major = row['전공'] || row['학과'] || row['소속학과'] || row['Major'] || row['major'] || '항공운항학전공';
    const email = row['이메일'] || row['Email'] || row['email'] || `${String(studentId)}@student.ac.kr`;
    const programRaw = row['과정'] || row['과정명'] || row['교육과정'] || row['Program'] || '';

    if (!name || String(name).trim() === '') {
      errors.push(`${rowNum}행: 학생 이름이 비어있어 건너뜁니다.`);
      return;
    }

    let matchedProg = programs?.find(p => p.name.includes(String(programRaw).trim()) || p.code === String(programRaw).trim());
    if (!matchedProg && programs && programs.length > 0) {
      matchedProg = programs[0];
    }

    result.push({
      name: String(name).trim(),
      studentId: String(studentId).trim(),
      grade: String(grade).trim(),
      major: String(major).trim(),
      email: String(email).trim(),
      programId: matchedProg?.id || 'prog-1',
      programName: matchedProg?.name || String(programRaw).trim() || '제1과정 (자가용조종사 PPL 과정)',
    });
  });

  return {
    success: result.length > 0,
    data: result,
    errors,
  };
}

/**
 * Parse uploaded Excel rows for Courses / 강의과목 및 시간
 */
export function parseCoursesExcel(
  rows: any[],
  instructors: Instructor[],
  programs?: TrainingProgram[]
): ExcelParseResult<any> {
  const result: any[] = [];
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const name = row['과목명'] || row['강의명'] || row['강좌명'] || row['과목'] || row['CourseName'] || row['name'];
    const code = row['과목코드'] || row['코드'] || row['Code'] || row['code'] || `C${200 + idx}`;
    const category = row['분야'] || row['과목분야'] || row['카테고리'] || row['전공분야'] || row['Category'] || '항공운항';
    const programRaw = row['과정'] || row['과정명'] || row['교육과정'] || row['Program'] || '';
    const instructorName = row['담당교관'] || row['교관명'] || row['강사명'] || row['교수명'] || row['Instructor'] || '';
    const day = row['요일'] || row['Day'] || row['day'] || '월';
    const startTime = row['시작시간'] || row['시작'] || row['StartTime'] || '09:00';
    const endTime = row['종료시간'] || row['종료'] || row['EndTime'] || '11:00';
    const room = row['강의실'] || row['장소'] || row['Room'] || '운항교육동 101호';
    const maxCapacity = Number(row['최대정원'] || row['정원'] || row['인원'] || row['Capacity'] || 25);
    const description = row['강의개요'] || row['설명'] || row['비고'] || row['Description'] || '';

    if (!name || String(name).trim() === '') {
      errors.push(`${rowNum}행: 과목명이 비어있어 건너뜁니다.`);
      return;
    }

    let matchedInst = instructors.find(
      i => i.name.trim() === String(instructorName).trim() ||
           i.name.includes(String(instructorName).trim()) ||
           String(instructorName).includes(i.name.replace(/교수|강사|교관|튜터/g, '').trim())
    );

    if (!matchedInst && instructors.length > 0) {
      matchedInst = instructors[0];
    }

    let matchedProg = programs?.find(
      p => p.name.includes(String(programRaw).trim()) || p.code === String(programRaw).trim()
    );
    if (!matchedProg && programs && programs.length > 0) {
      matchedProg = programs[0];
    }

    result.push({
      name: String(name).trim(),
      code: String(code).trim(),
      category: String(category).trim(),
      programId: matchedProg?.id || 'prog-1',
      programName: matchedProg?.name || String(programRaw).trim() || '제1과정 (자가용조종사 PPL 과정)',
      instructorId: matchedInst ? matchedInst.id : '',
      instructorName: matchedInst ? matchedInst.name : String(instructorName).trim() || '미배정 교관',
      day: ['월', '화', '수', '목', '금', '토'].includes(String(day).trim()) ? String(day).trim() : '월',
      startTime: String(startTime).trim().padStart(5, '0'),
      endTime: String(endTime).trim().padStart(5, '0'),
      room: String(room).trim(),
      maxCapacity: isNaN(maxCapacity) ? 25 : maxCapacity,
      description: String(description).trim(),
    });
  });

  return {
    success: result.length > 0,
    data: result,
    errors,
  };
}

/**
 * Parse uploaded Excel rows for TrainingPrograms / 교육과정
 */
export function parseProgramsExcel(rows: any[]): ExcelParseResult<Omit<TrainingProgram, 'id' | 'badgeColor'>> {
  const result: Omit<TrainingProgram, 'id' | 'badgeColor'>[] = [];
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const name = row['과정명'] || row['교육과정명'] || row['과정'] || row['Name'] || row['name'];
    const code = row['과정코드'] || row['코드'] || row['Code'] || `PROC-0${idx + 1}`;
    const description = row['과정설명'] || row['설명'] || row['개요'] || row['Description'] || '전문 항공 교육훈련 과정';
    const targetHours = Number(row['목표시수'] || row['총시수'] || row['기준시수'] || row['Hours'] || 150);

    if (!name || String(name).trim() === '') {
      errors.push(`${rowNum}행: 과정명이 비어있어 건너뜁니다.`);
      return;
    }

    result.push({
      name: String(name).trim(),
      code: String(code).trim(),
      description: String(description).trim(),
      targetHours: isNaN(targetHours) ? 150 : targetHours,
    });
  });

  return {
    success: result.length > 0,
    data: result,
    errors,
  };
}

/**
 * Parse uploaded Excel rows for AbsenceRequests / 결강·보강 신청
 */
export function parseAbsencesExcel(rows: any[], courses: Course[]): ExcelParseResult<any> {
  const result: any[] = [];
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const typeRaw = String(row['신청구분'] || row['구분'] || '교관결강').trim();
    const courseNameRaw = String(row['과목명'] || row['강좌명'] || row['과목'] || '').trim();
    const applicantName = String(row['신청자'] || row['신청자명'] || row['이름'] || '').trim();
    const absenceDate = String(row['결강일자'] || row['결석일자'] || row['일자'] || '2026-11-02').trim();
    const reasonCategory = String(row['사유분류'] || row['사유구분'] || '기상악화').trim();
    const reasonDetail = String(row['상세사유'] || row['사유'] || '일정 조정으로 인한 결강 및 보강 신청').trim();
    const makeupDate = String(row['보강일자'] || row['보강예정일'] || '').trim();
    const makeupStartTime = String(row['보강시작시간'] || '14:00').trim();
    const makeupEndTime = String(row['보강종료시간'] || '16:00').trim();
    const makeupRoom = String(row['보강강의실'] || '운항교육동 101호').trim();

    if (!applicantName) {
      errors.push(`${rowNum}행: 신청자 이름이 비어있어 건너뜁니다.`);
      return;
    }

    const matchedCourse = courses.find(c => c.name.includes(courseNameRaw) || c.code === courseNameRaw) || courses[0];
    const isStudent = typeRaw.includes('학생') || typeRaw.includes('공결') || typeRaw.includes('결석');

    result.push({
      type: isStudent ? 'student_absence' : 'instructor_cancel',
      courseId: matchedCourse?.id || 'course-1',
      courseName: matchedCourse?.name || courseNameRaw || '비행조종학 기초 및 항공역학',
      courseCode: matchedCourse?.code || 'AV101',
      programId: matchedCourse?.programId || 'prog-1',
      programName: matchedCourse?.programName || '제1과정 (자가용조종사 PPL 과정)',
      applicantRole: isStudent ? 'student' : 'instructor',
      applicantId: isStudent ? 'stud-1' : 'inst-1',
      applicantName,
      absenceDate,
      reasonCategory,
      reasonDetail,
      makeupDate: makeupDate || undefined,
      makeupStartTime: makeupDate ? makeupStartTime : undefined,
      makeupEndTime: makeupDate ? makeupEndTime : undefined,
      makeupRoom: makeupDate ? makeupRoom : undefined,
      status: 'pending',
    });
  });

  return {
    success: result.length > 0,
    data: result,
    errors,
  };
}

/**
 * Download sample templates for any data entity
 */
export function downloadExcelTemplate(type: DataEntityType) {
  let data: any[] = [];
  let fileName = '';

  if (type === 'instructor') {
    data = [
      {
        '교관명': '홍길동 교관',
        '소속부서': '항공운항과',
        '이메일': 'gildong.hong@academy.ac.kr',
        '연락처': '010-1234-5678',
      },
      {
        '교관명': '이순신 교관',
        '소속부서': '항법제어학부',
        '이메일': 'sunshin.lee@academy.ac.kr',
        '연락처': '010-2345-6789',
      },
    ];
    fileName = '교관_명단_업로드_양식.xlsx';
  } else if (type === 'student') {
    data = [
      {
        '학생명': '김철수',
        '학번': '20261001',
        '과정명': '제1과정 (자가용조종사 PPL 과정)',
        '전공': '항공운항학전공',
        '학년': '2학년',
        '이메일': 'chulsoo.kim@student.ac.kr',
      },
      {
        '학생명': '이영희',
        '학번': '20261002',
        '과정명': '제2과정 (계기비행증명 IFR 과정)',
        '전공': '항공교통물류학부',
        '학년': '3학년',
        '이메일': 'younghee.lee@student.ac.kr',
      },
    ];
    fileName = '학생_명단_업로드_양식.xlsx';
  } else if (type === 'program') {
    data = [
      {
        '과정코드': 'PROC-06',
        '과정명': '제6과정 (무인항공기·드론 교관 과정)',
        '과정설명': '초경량 비행장치 조종자 및 실기평가지도교관 전문 양성 과정',
        '목표시수': 160,
      },
      {
        '과정코드': 'PROC-07',
        '과정명': '제7과정 (항공교통관제 심화 과정)',
        '과정설명': '접근관제 및 레이더 시뮬레이션 실전 집중 과정',
        '목표시수': 180,
      },
    ];
    fileName = '교육과정_업로드_양식.xlsx';
  } else if (type === 'absence') {
    data = [
      {
        '신청구분': '교관결강',
        '과목명': '비행조종학 기초 및 항공역학',
        '신청자': '고승희 교관',
        '결강일자': '2026-11-09',
        '사유분류': '기상악화',
        '상세사유': '악기상 예보로 인한 비행브리핑 일정 조정',
        '보강일자': '2026-11-14',
        '보강시작시간': '10:00',
        '보강종료시간': '12:00',
        '보강강의실': '운항교육동 101호',
      },
      {
        '신청구분': '학생공결',
        '과목명': '위성항법 및 비행제어시스템',
        '신청자': '이지민',
        '결강일자': '2026-11-10',
        '사유분류': '공무출장',
        '상세사유': '항공신체검사 정밀검진 출석 공결 신청',
        '보강일자': '',
        '보강시작시간': '',
        '보강종료시간': '',
        '보강강의실': '',
      },
    ];
    fileName = '결강_및_보강신청_업로드_양식.xlsx';
  } else {
    data = [
      {
        '과목코드': 'AV101',
        '과목명': '기초 비행 시뮬레이션 실습',
        '과정명': '제1과정 (자가용조종사 PPL 과정)',
        '분야': '항공운항',
        '담당교관': '고승희 교관',
        '요일': '월',
        '시작시간': '09:00',
        '종료시간': '11:00',
        '강의실': '시뮬레이터실 A',
        '최대정원': 20,
        '강의개요': '조종 계기판 기본 조작 및 비행 시뮬레이터 훈련 실습',
      },
      {
        '과목코드': 'NAV202',
        '과목명': '위성항법 및 비행제어시스템',
        '과정명': '제2과정 (계기비행증명 IFR 과정)',
        '분야': '항법제어',
        '담당교관': '장민식 교관',
        '요일': '화',
        '시작시간': '13:00',
        '종료시간': '16:00',
        '강의실': '항법공학관 204호',
        '최대정원': 25,
        '강의개요': 'GPS/GNSS 위성항법 및 자동조종 제어 알고리즘 실습',
      },
    ];
    fileName = '강의과목_및_시간_업로드_양식.xlsx';
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '데이터양식');
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export current data to Excel
 */
export function exportInstructorsExcel(instructors: Instructor[], courses?: Course[]) {
  const data = instructors.map((inst, idx) => {
    let weeklyHours = 0;
    let maxDailyHours = 0;
    const dailyHoursMap: Record<string, number> = { 월: 0, 화: 0, 수: 0, 목: 0, 금: 0, 토: 0 };

    if (courses) {
      const instCourses = courses.filter(c => c.instructorId === inst.id);
      instCourses.forEach(c => {
        dailyHoursMap[c.day] = (dailyHoursMap[c.day] || 0) + (c.durationHours || 0);
      });
      weeklyHours = Number(Object.values(dailyHoursMap).reduce((s, h) => s + h, 0).toFixed(1));
      maxDailyHours = Number(Math.max(...Object.values(dailyHoursMap), 0).toFixed(1));
    }

    const monthlyHours = Number((weeklyHours * 4).toFixed(1));
    const annualHours = Number((weeklyHours * 40).toFixed(1));
    const isExceeded = maxDailyHours > 6 || weeklyHours > 20;

    return {
      '번호': idx + 1,
      '교관명': inst.name,
      '소속부서': inst.department,
      '1일최고시수(시간)': maxDailyHours,
      '주간강의시간(시간)': weeklyHours,
      '월별강의시간(4주기준)': monthlyHours,
      '년간강의시간(40주기준)': annualHours,
      '시수상태': isExceeded ? '초과(경고)' : '정상',
      '이메일': inst.email,
      '연락처': inst.phone,
    };
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '교관명단_및_시수');
  XLSX.writeFile(wb, `교관명단_및_강의시간_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportStudentsExcel(students: Student[]) {
  const data = students.map((s, idx) => ({
    '번호': idx + 1,
    '학생명': s.name,
    '학번': s.studentId,
    '소속과정': s.programName || '제1과정 (자가용조종사 PPL 과정)',
    '전공': s.major,
    '학년': s.grade,
    '이메일': s.email,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '학생명단');
  XLSX.writeFile(wb, `학생명단_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportCoursesExcel(courses: Course[]) {
  const data = courses.map((c, idx) => ({
    '번호': idx + 1,
    '과목코드': c.code,
    '과목명': c.name,
    '소속과정': c.programName || '제1과정 (자가용조종사 PPL 과정)',
    '분야': c.category,
    '담당교관': c.instructorName,
    '요일': c.day,
    '시작시간': c.startTime,
    '종료시간': c.endTime,
    '시수(시간)': c.durationHours,
    '강의실': c.room,
    '최대정원': c.maxCapacity,
    '강의개요': c.description,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '강의시간표');
  XLSX.writeFile(wb, `강의시간표_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportProgramsExcel(programs: TrainingProgram[], courses: Course[]) {
  const data = programs.map((p, idx) => {
    const progCourses = courses.filter(c => c.programId === p.id || c.programName === p.name);
    const totalHours = Number(progCourses.reduce((s, c) => s + (c.durationHours || 0), 0).toFixed(1));
    return {
      '번호': idx + 1,
      '과정코드': p.code,
      '과정명': p.name,
      '과정설명': p.description,
      '개설과목수': progCourses.length,
      '현재주간시수(h)': totalHours,
      '목표기준시수(h)': p.targetHours,
    };
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '교육과정목록');
  XLSX.writeFile(wb, `교육과정목록_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportAbsencesExcel(absences: AbsenceRequest[]) {
  const data = absences.map((a, idx) => ({
    '번호': idx + 1,
    '신청구분': a.type === 'instructor_cancel' ? '교관 결강/휴강' : '학생 결석/공결',
    '과정명': a.programName || '-',
    '과목명': `${a.courseName} (${a.courseCode})`,
    '신청자': `${a.applicantName} (${a.applicantRole === 'instructor' ? '교관' : '학생'})`,
    '결강/결석일': a.absenceDate,
    '사유분류': a.reasonCategory,
    '상세사유': a.reasonDetail,
    '보강예정일': a.makeupDate || '-',
    '보강시간': a.makeupStartTime ? `${a.makeupStartTime}~${a.makeupEndTime}` : '-',
    '보강강의실': a.makeupRoom || '-',
    '승인상태': a.status === 'approved' ? '승인완료' : a.status === 'rejected' ? '반려됨' : '승인대기',
    '신청일시': a.createdAt.slice(0, 16).replace('T', ' '),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '결강보강신청내역');
  XLSX.writeFile(wb, `결강보강신청내역_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportAccessLogsExcel(logs: AccessLogEntry[]) {
  const data = logs.map((l, idx) => ({
    '번호': idx + 1,
    '접속일시': l.timestamp.replace('T', ' ').slice(0, 19),
    '구분': l.role === 'instructor' ? '교관' : l.role === 'student' ? '학생' : '관리자',
    '사용자명': l.userName,
    '소속/전공': l.departmentOrMajor,
    '열람페이지': l.pageTitle,
    '상세활동': l.action,
    '접속환경': l.ipOrDevice,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '접속로깅기록');
  XLSX.writeFile(wb, `교관학생_접속로깅기록_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
