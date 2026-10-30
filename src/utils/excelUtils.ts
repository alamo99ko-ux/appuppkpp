import * as XLSX from 'xlsx';
import { Instructor, Student, Course } from '../types';

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
    const rowNum = idx + 2; // considering 1-indexed header row
    // Flexible column headers
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
export function parseStudentsExcel(rows: any[]): ExcelParseResult<Omit<Student, 'id' | 'avatarBg'>> {
  const result: Omit<Student, 'id' | 'avatarBg'>[] = [];
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const name = row['학생명'] || row['이름'] || row['학생이름'] || row['성명'] || row['Name'] || row['name'];
    const studentId = row['학번'] || row['학생번호'] || row['ID'] || row['StudentId'] || row['student_id'] || `2026${1000 + idx}`;
    const grade = row['학년'] || row['Grade'] || row['grade'] || '1학년';
    const major = row['전공'] || row['학과'] || row['소속학과'] || row['Major'] || row['major'] || '일반전공';
    const email = row['이메일'] || row['Email'] || row['email'] || `${String(studentId)}@student.ac.kr`;

    if (!name || String(name).trim() === '') {
      errors.push(`${rowNum}행: 학생 이름이 비어있어 건너뜁니다.`);
      return;
    }

    result.push({
      name: String(name).trim(),
      studentId: String(studentId).trim(),
      grade: String(grade).trim(),
      major: String(major).trim(),
      email: String(email).trim(),
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
  instructors: Instructor[]
): ExcelParseResult<any> {
  const result: any[] = [];
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const name = row['과목명'] || row['강의명'] || row['강좌명'] || row['과목'] || row['CourseName'] || row['name'];
    const code = row['과목코드'] || row['코드'] || row['Code'] || row['code'] || `C${200 + idx}`;
    const category = row['분야'] || row['과목분야'] || row['카테고리'] || row['전공분야'] || row['Category'] || '컴퓨터공학';
    const instructorName = row['담당교관'] || row['교관명'] || row['강사명'] || row['교수명'] || row['Instructor'] || '';
    const day = row['요일'] || row['Day'] || row['day'] || '월';
    const startTime = row['시작시간'] || row['시작'] || row['StartTime'] || '09:00';
    const endTime = row['종료시간'] || row['종료'] || row['EndTime'] || '11:00';
    const room = row['강의실'] || row['장소'] || row['Room'] || '강의동 101호';
    const maxCapacity = Number(row['최대정원'] || row['정원'] || row['인원'] || row['Capacity'] || 30);
    const description = row['강의개요'] || row['설명'] || row['비고'] || row['Description'] || '';

    if (!name || String(name).trim() === '') {
      errors.push(`${rowNum}행: 과목명이 비어있어 건너뜁니다.`);
      return;
    }

    // Try to match instructor
    let matchedInst = instructors.find(
      i => i.name.trim() === String(instructorName).trim() ||
           i.name.includes(String(instructorName).trim()) ||
           String(instructorName).includes(i.name.replace(/교수|강사|교관|튜터/g, '').trim())
    );

    if (!matchedInst && instructors.length > 0) {
      matchedInst = instructors[0]; // fallback
    }

    result.push({
      name: String(name).trim(),
      code: String(code).trim(),
      category: String(category).trim(),
      instructorId: matchedInst ? matchedInst.id : '',
      instructorName: matchedInst ? matchedInst.name : String(instructorName).trim() || '미배정 교관',
      day: ['월', '화', '수', '목', '금', '토'].includes(String(day).trim()) ? String(day).trim() : '월',
      startTime: String(startTime).trim().padStart(5, '0'),
      endTime: String(endTime).trim().padStart(5, '0'),
      room: String(room).trim(),
      maxCapacity: isNaN(maxCapacity) ? 30 : maxCapacity,
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
 * Download sample templates
 */
export function downloadExcelTemplate(type: 'instructor' | 'student' | 'course') {
  let data: any[] = [];
  let fileName = '';

  if (type === 'instructor') {
    data = [
      {
        '교관명': '홍길동 교관',
        '소속부서': '항공비행교육과',
        '이메일': 'gildong.hong@academy.ac.kr',
        '연락처': '010-1234-5678',
      },
      {
        '교관명': '이순신 교관',
        '소속부서': '해상운항학부',
        '이메일': 'sunshin.lee@academy.ac.kr',
        '연락처': '010-2345-6789',
      },
      {
        '교관명': '강감찬 책임교관',
        '소속부서': '시스템공학과',
        '이메일': 'gamchan.kang@academy.ac.kr',
        '연락처': '010-3456-7890',
      },
    ];
    fileName = '교관_명단_업로드_양식.xlsx';
  } else if (type === 'student') {
    data = [
      {
        '학생명': '김철수',
        '학번': '20261001',
        '전공': '컴퓨터소프트웨어',
        '학년': '2학년',
        '이메일': 'chulsoo.kim@student.ac.kr',
      },
      {
        '학생명': '이영희',
        '학번': '20261002',
        '전공': '인공지능응용',
        '학년': '3학년',
        '이메일': 'younghee.lee@student.ac.kr',
      },
      {
        '학생명': '박민호',
        '학번': '20261003',
        '전공': '시각디자인',
        '학년': '1학년',
        '이메일': 'minho.park@student.ac.kr',
      },
    ];
    fileName = '학생_명단_업로드_양식.xlsx';
  } else {
    data = [
      {
        '과목코드': 'AV101',
        '과목명': '기초 비행 시뮬레이션 실습',
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
