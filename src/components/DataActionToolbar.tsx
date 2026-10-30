import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  DataEntityType,
  downloadExcelTemplate,
  exportInstructorsExcel,
  exportStudentsExcel,
  exportCoursesExcel,
  exportProgramsExcel,
  exportAbsencesExcel,
  exportAccessLogsExcel,
  readExcelFile,
  parseInstructorsExcel,
  parseStudentsExcel,
  parseCoursesExcel,
  parseProgramsExcel,
  parseAbsencesExcel,
} from '../utils/excelUtils';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Printer,
  X,
} from 'lucide-react';

interface DataActionToolbarProps {
  entityType: DataEntityType;
  title?: string;
  compact?: boolean;
  hideImport?: boolean;
}

const ENTITY_LABELS: Record<DataEntityType, string> = {
  course: '강의시간표·개설과목',
  instructor: '교관명단·강의시수',
  student: '학생명단·수강현황',
  program: '5대 교육과정(커리큘럼)',
  absence: '결강·보강신청 내역',
  access_log: '교관·학생 접속로깅 기록',
};

export const DataActionToolbar: React.FC<DataActionToolbarProps> = ({
  entityType,
  title,
  compact = false,
  hideImport = false,
}) => {
  const {
    courses,
    instructors,
    students,
    programs,
    absences,
    accessLogs,
    bulkAddInstructors,
    bulkAddStudents,
    bulkAddCourses,
    bulkAddPrograms,
    bulkAddAbsences,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [toast, setToast] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const label = title || ENTITY_LABELS[entityType];

  const showToast = (text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const handleExcelExport = () => {
    if (entityType === 'instructor') exportInstructorsExcel(instructors, courses);
    else if (entityType === 'student') exportStudentsExcel(students);
    else if (entityType === 'program') exportProgramsExcel(programs, courses);
    else if (entityType === 'absence') exportAbsencesExcel(absences);
    else if (entityType === 'access_log') exportAccessLogsExcel(accessLogs);
    else exportCoursesExcel(courses);
    showToast(`[${label}] 엑셀(.xlsx) 파일 다운로드가 완료되었습니다.`);
  };

  const handleTemplateDownload = () => {
    downloadExcelTemplate(entityType);
    showToast(`[${label}] Import 전용 엑셀 양식(.xlsx)을 다운로드했습니다.`);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await readExcelFile(file);
      if (rows.length === 0) {
        showToast('업로드한 엑셀 파일에 데이터가 없습니다.', true);
        return;
      }

      if (entityType === 'instructor') {
        const parsed = parseInstructorsExcel(rows);
        if (parsed.data.length > 0) {
          const { addedCount } = bulkAddInstructors(parsed.data);
          showToast(`교관 데이터 ${addedCount}건이 성공적으로 Import 되었습니다!`);
        } else {
          showToast('교관 데이터를 인식하지 못했습니다. 옆의 [Import 양식]을 확인해주세요.', true);
        }
      } else if (entityType === 'student') {
        const parsed = parseStudentsExcel(rows, programs);
        if (parsed.data.length > 0) {
          const { addedCount } = bulkAddStudents(parsed.data);
          showToast(`학생 명단 ${addedCount}건이 성공적으로 Import 되었습니다!`);
        } else {
          showToast('학생 데이터를 인식하지 못했습니다. 옆의 [Import 양식]을 확인해주세요.', true);
        }
      } else if (entityType === 'program') {
        const parsed = parseProgramsExcel(rows);
        if (parsed.data.length > 0) {
          const { addedCount } = bulkAddPrograms(parsed.data);
          showToast(`교육과정 ${addedCount}건이 성공적으로 Import 되었습니다!`);
        } else {
          showToast('교육과정 데이터를 인식하지 못했습니다. 옆의 [Import 양식]을 확인해주세요.', true);
        }
      } else if (entityType === 'absence') {
        const parsed = parseAbsencesExcel(rows, courses);
        if (parsed.data.length > 0) {
          const { addedCount } = bulkAddAbsences(parsed.data);
          showToast(`결강·보강 신청 ${addedCount}건이 성공적으로 Import 되었습니다!`);
        } else {
          showToast('결강 신청 데이터를 인식하지 못했습니다. 옆의 [Import 양식]을 확인해주세요.', true);
        }
      } else {
        const parsed = parseCoursesExcel(rows, instructors, programs);
        if (parsed.data.length > 0) {
          const { addedCount } = bulkAddCourses(parsed.data);
          showToast(`강의시간표·과목 ${addedCount}건이 성공적으로 Import 되었습니다!`);
        } else {
          showToast('강의과목 데이터를 인식하지 못했습니다. 옆의 [Import 양식]을 확인해주세요.', true);
        }
      }
    } catch (err: any) {
      showToast(`파일 Import 오류: ${err?.message || '엑셀 파일 형식을 확인해주세요.'}`, true);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Build tabular data for PDF preview & export
  const getReportTable = () => {
    if (entityType === 'instructor') {
      return {
        columns: ['번호', '교관명', '소속부서', '주간시수(h)', '월간시수(4주)', '년간시수(40주)', '이메일', '연락처'],
        rows: instructors.map((inst, i) => {
          const instCourses = courses.filter(c => c.instructorId === inst.id);
          const weekly = Number(instCourses.reduce((s, c) => s + (c.durationHours || 0), 0).toFixed(1));
          return [
            String(i + 1),
            inst.name,
            inst.department,
            `${weekly}h`,
            `${(weekly * 4).toFixed(1)}h`,
            `${(weekly * 40).toFixed(1)}h`,
            inst.email,
            inst.phone,
          ];
        }),
      };
    }
    if (entityType === 'student') {
      return {
        columns: ['번호', '학생명', '학번', '소속과정', '전공', '학년', '이메일'],
        rows: students.map((s, i) => [
          String(i + 1),
          s.name,
          s.studentId,
          s.programName || '제1과정',
          s.major,
          s.grade,
          s.email,
        ]),
      };
    }
    if (entityType === 'program') {
      return {
        columns: ['번호', '과정코드', '과정명', '과정개요', '개설과목수', '목표시수(h)'],
        rows: programs.map((p, i) => {
          const cnt = courses.filter(c => c.programId === p.id || c.programName === p.name).length;
          return [String(i + 1), p.code, p.name, p.description, `${cnt}과목`, `${p.targetHours}h`];
        }),
      };
    }
    if (entityType === 'absence') {
      return {
        columns: ['번호', '구분', '과정명', '과목명', '신청자', '결강일자', '사유', '보강일정', '상태'],
        rows: absences.map((a, i) => [
          String(i + 1),
          a.type === 'instructor_cancel' ? '교관결강' : '학생공결',
          a.programName || '-',
          a.courseName,
          a.applicantName,
          a.absenceDate,
          `${a.reasonCategory}: ${a.reasonDetail}`,
          a.makeupDate ? `${a.makeupDate} (${a.makeupStartTime || ''}~${a.makeupEndTime || ''})` : '-',
          a.status === 'approved' ? '승인완료' : a.status === 'rejected' ? '반려됨' : '대기중',
        ]),
      };
    }
    if (entityType === 'access_log') {
      return {
        columns: ['번호', '접속일시', '역할', '사용자명', '소속/학과', '열람페이지', '상세활동'],
        rows: accessLogs.map((l, i) => [
          String(i + 1),
          l.timestamp.replace('T', ' ').slice(0, 19),
          l.role === 'instructor' ? '교관' : l.role === 'student' ? '학생' : '관리자',
          l.userName,
          l.departmentOrMajor,
          l.pageTitle,
          l.action,
        ]),
      };
    }
    return {
      columns: ['번호', '코드', '과목명', '소속과정', '담당교관', '요일/시간', '시수', '강의실', '정원'],
      rows: courses.map((c, i) => [
        String(i + 1),
        c.code,
        c.name,
        c.programName || '제1과정',
        c.instructorName,
        `${c.day} ${c.startTime}~${c.endTime}`,
        `${c.durationHours}h`,
        c.room,
        `${c.maxCapacity}명`,
      ]),
    };
  };

  const handleDownloadPdfReportHtml = () => {
    const report = getReportTable();
    const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<title>ClassTime APP program - ${label} 공식 보고서</title>
<style>
  body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; padding: 32px; color: #0f172a; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  p { font-size: 12px; color: #475569; margin-top: 0; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
  th { background-color: #f1f5f9; font-weight: bold; }
  tr:nth-child(even) { background-color: #f8fafc; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>[APP program] ${label} 현황 보고서</h1>
  <p>출력일시: ${new Date().toLocaleString('ko-KR')} · 총 ${report.rows.length}건</p>
  <table>
    <thead>
      <tr>${report.columns.map(col => `<th>${col}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${report.rows.map(r => `<tr>${r.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label.replace(/\s+/g, '_')}_PDF보고서_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 p-3.5 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold max-w-md ${
            toast.isError
              ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          {toast.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      <div
        className={`flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 rounded-xl ${
          compact ? 'p-2.5' : 'p-3.5'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold">
            EXPORT / IMPORT
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            [{label}] 데이터 내보내기 및 양식 업로드
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Excel Export Button */}
          <button
            type="button"
            onClick={handleExcelExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>엑셀(Excel) Export</span>
          </button>

          {/* 2. PDF Export Button */}
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Export (보고서·인쇄)</span>
          </button>

          {/* 3 & 4. Import Template + Import Upload Buttons side-by-side */}
          {!hideImport && entityType !== 'access_log' && (
            <>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5 hidden sm:block" />

              <button
                type="button"
                onClick={handleTemplateDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Import 엑셀 양식 다운로드</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>엑셀 파일 Import (업로드)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* PDF Report Preview & Print Modal */}
      {isPdfModalOpen && (() => {
        const report = getReportTable();
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[88vh] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 uppercase">
                    PDF EXPORT & PRINTABLE REPORT
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    [{label}] PDF 출력 미리보기 ({report.rows.length}건)
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>PDF로 즉시 인쇄 / 저장</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdfReportHtml}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>독립 보고서 파일 다운로드</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPdfModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Sheet */}
              <div className="p-6 overflow-y-auto space-y-4 bg-white text-slate-900">
                <div className="border-b-2 border-slate-900 pb-3 flex items-end justify-between">
                  <div>
                    <div className="text-xs font-mono font-bold text-indigo-700">
                      APP program · ClassTime 통합 학사관리 시스템
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                      {label} 현황 공식 보고서
                    </h2>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-mono">
                    <div>발행일: {new Date().toISOString().slice(0, 10)}</div>
                    <div>총 데이터: {report.rows.length}건</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800">
                        {report.columns.map((col, idx) => (
                          <th key={idx} className="border border-slate-300 px-3 py-2 font-bold">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.rows.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="border border-slate-300 px-3 py-2 text-slate-800">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};
