/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import XLSX from 'xlsx-js-style';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  CheckCircle,
  HelpCircle,
  Info,
  ArrowRight,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  Settings,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react';
import { LeaveRecord } from '../types';

interface ExcelExportWizardProps {
  records: LeaveRecord[];
  onClose: () => void;
  triggerToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر'
];

interface ExportGroup {
  year: number;
  month: number; // 1-12
  monthName: string;
  sheetName: string;
  records: LeaveRecord[];
}

export default function ExcelExportWizard({ records, onClose, triggerToast }: ExcelExportWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [includeFooter, setIncludeFooter] = useState(true);
  const [autoFitWidths, setAutoFitWidths] = useState(true);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]); // "YYYY-MM" format

  // 1. Group records by Year and Month
  const allGroups = useMemo(() => {
    const groupsMap: Record<string, ExportGroup> = {};

    records.forEach((rec) => {
      if (!rec.startDate) return;
      const parts = rec.startDate.split('-');
      if (parts.length < 2) return;
      
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return;

      const key = `${year}-${String(month).padStart(2, '0')}`;
      const monthName = ARABIC_MONTHS[month - 1];

      if (!groupsMap[key]) {
        groupsMap[key] = {
          year,
          month,
          monthName,
          sheetName: `${monthName} ${year}`,
          records: []
        };
      }
      groupsMap[key].records.push(rec);
    });

    // Sort groups chronologically (most recent last, or first?)
    // Typically, standard calendars go from Jan to Dec, so sort ascending
    return Object.values(groupsMap).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, [records]);

  // All unique years found in data
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(allGroups.map((g) => g.year))).sort((a: number, b: number) => b - a);
    return years;
  }, [allGroups]);

  // Set default selections once
  React.useEffect(() => {
    if (availableYears.length > 0 && selectedYears.length === 0) {
      setSelectedYears([availableYears[0]]);
      // Select all months of this year
      const defaultMonths = allGroups
        .filter((g) => g.year === availableYears[0])
        .map((g) => `${g.year}-${String(g.month).padStart(2, '0')}`);
      setSelectedMonths(defaultMonths);
    }
  }, [availableYears.length, selectedYears.length, allGroups]);

  // Filter groups according to selections
  const activeGroups = useMemo(() => {
    return allGroups.filter((g) => {
      const isYearSelected = selectedYears.includes(g.year);
      const isMonthSelected = selectedMonths.includes(`${g.year}-${String(g.month).padStart(2, '0')}`);
      return isYearSelected && isMonthSelected;
    });
  }, [allGroups, selectedYears, selectedMonths]);

  const totalSelectedRecords = useMemo(() => {
    return activeGroups.reduce((acc, g) => acc + g.records.length, 0);
  }, [activeGroups]);

  // Format YYYY-MM-DD to DD/MM/YYYY
  const formatArabicDate = (dateStr: string): string => {
    if (!dateStr || dateStr === '-' || dateStr.trim() === '') return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    return `${d}/${m}/${y}`;
  };

  // Run the actual Excel generation & download
  const handleExportExcel = () => {
    if (activeGroups.length === 0) {
      triggerToast('يرجى تحديد شهر واحد على الأقل للتصدير', 'error');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Style definitions matching precisely the technical specs
      const thinBorder = {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      };

      const titleStyle = {
        font: { name: 'Arial', sz: 16, bold: true, color: { rgb: '000000' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      const headerStyle = {
        font: { name: 'Arial', sz: 12, bold: true, color: { rgb: '000000' } },
        fill: { fgColor: { rgb: 'D9D9D9' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: thinBorder
      };

      const dataStyleCenter = {
        font: { name: 'Arial', sz: 11, bold: false, color: { rgb: '000000' } },
        fill: { fgColor: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: thinBorder
      };

      const dataStyleRight = {
        font: { name: 'Arial', sz: 11, bold: false, color: { rgb: '000000' } },
        fill: { fgColor: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'right', vertical: 'center', readingOrder: 2 },
        border: thinBorder
      };

      const dataStyleRightWrap = {
        font: { name: 'Arial', sz: 11, bold: false, color: { rgb: '000000' } },
        fill: { fgColor: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'right', vertical: 'center', wrapText: true, readingOrder: 2 },
        border: thinBorder
      };

      const footerStyle = {
        font: { name: 'Arial', sz: 11, bold: true, color: { rgb: '000000' } },
        alignment: { horizontal: 'right', vertical: 'center', readingOrder: 2 },
        border: thinBorder
      };

      activeGroups.forEach((group) => {
        // Prepare rows array with styled cells
        const rows: any[][] = [];

        // 1. Title Row: A1:G1 merged
        const titleText = `كشف الإجازات المرضية - اللواء 43 عمالقة (النقطة الطبية) - ${group.monthName} ${group.year}`;
        rows.push([
          { v: titleText, t: 's', s: titleStyle },
          { v: '', t: 's', s: titleStyle },
          { v: '', t: 's', s: titleStyle },
          { v: '', t: 's', s: titleStyle },
          { v: '', t: 's', s: titleStyle },
          { v: '', t: 's', s: titleStyle },
          { v: '', t: 's', s: titleStyle }
        ]);

        // 2. Empty spacer row
        rows.push([
          { v: '', t: 's', s: { font: { name: 'Arial', sz: 11 } } },
          { v: '', t: 's', s: { font: { name: 'Arial', sz: 11 } } },
          { v: '', t: 's', s: { font: { name: 'Arial', sz: 11 } } },
          { v: '', t: 's', s: { font: { name: 'Arial', sz: 11 } } },
          { v: '', t: 's', s: { font: { name: 'Arial', sz: 11 } } },
          { v: '', t: 's', s: { font: { name: 'Arial', sz: 11 } } },
          { v: '', t: 's', s: { font: { name: 'Arial', sz: 11 } } }
        ]);

        // 3. Header row
        rows.push([
          { v: 'م', t: 's', s: headerStyle },
          { v: 'الاسم', t: 's', s: headerStyle },
          { v: 'الحالة', t: 's', s: headerStyle },
          { v: 'التشخيص', t: 's', s: headerStyle },
          { v: 'بداية الإجازة', t: 's', s: headerStyle },
          { v: 'نهاية الإجازة', t: 's', s: headerStyle },
          { v: 'ملاحظات', t: 's', s: headerStyle }
        ]);

        // Sort group records by start date (ascending)
        const sortedRecords = [...group.records].sort((a, b) => {
          return a.startDate.localeCompare(b.startDate);
        });

        // 4. Data rows
        sortedRecords.forEach((rec, idx) => {
          const serialNum = idx + 1; // numeric value so we can apply formatting
          
          const startDateOutput = formatArabicDate(rec.startDate);
          
          let endDateOutput = rec.endDate;
          if (rec.endDate && /^\d{4}-\d{2}-\d{2}$/.test(rec.endDate)) {
            endDateOutput = formatArabicDate(rec.endDate);
          } else if (!rec.endDate) {
            endDateOutput = '-';
          }

          rows.push([
            { v: serialNum, t: 'n', z: '0.0', s: dataStyleCenter }, // Serial formatted as 1.0, 2.0
            { v: rec.name.trim(), t: 's', s: dataStyleRight },
            { v: rec.type || 'مريض', t: 's', s: dataStyleRight },
            { v: rec.diagnosis || '-', t: 's', s: dataStyleRightWrap },
            { v: startDateOutput, t: 's', s: dataStyleCenter },
            { v: endDateOutput, t: 's', s: dataStyleCenter },
            { v: rec.notes || '', t: 's', s: dataStyleRightWrap }
          ]);
        });

        // 5. Footer (optional)
        if (includeFooter) {
          // Empty spacer row before footer
          rows.push([
            { v: '', t: 's', s: { font: { name: 'Arial', sz: 11 } } },
            { v: '', t: 's', s: { font: { name: 'Arial', sz: 11 } } },
            { v: '', t: 's', s: { font: { name: 'Arial', sz: 11 } } },
            { v: '', t: 's', s: { font: { name: 'Arial', sz: 11 } } },
            { v: '', t: 's', s: { font: { name: 'Arial', sz: 11 } } },
            { v: '', t: 's', s: { font: { name: 'Arial', sz: 11 } } },
            { v: '', t: 's', s: { font: { name: 'Arial', sz: 11 } } }
          ]);

          const totalLabel = `إجمالي الإجازات لمنتسبي اللواء: ${sortedRecords.length}`;
          rows.push([
            { v: totalLabel, t: 's', s: footerStyle },
            { v: '', t: 's', s: footerStyle },
            { v: '', t: 's', s: footerStyle },
            { v: '', t: 's', s: footerStyle },
            { v: '', t: 's', s: footerStyle },
            { v: '', t: 's', s: footerStyle },
            { v: '', t: 's', s: footerStyle }
          ]);
        }

        // Create Worksheet
        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Apply merges for title row (Row 1 merge A1:G1)
        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }
        ];

        // Apply merges for Footer total if enabled
        if (includeFooter) {
          const footerRowIndex = rows.length - 1;
          ws['!merges'].push({
            s: { r: footerRowIndex, c: 0 },
            e: { r: footerRowIndex, c: 2 }
          });
        }

        // Configure Column Widths (A: 8, B: 30, C: 22, D: 40, E: 18, F: 18, G: 50)
        const baseWidths = [8, 30, 22, 40, 18, 18, 50];
        
        if (autoFitWidths) {
          // If autoFitWidths is enabled, we check for even wider values to be safe
          for (let colIdx = 0; colIdx < 7; colIdx++) {
            let maxLen = baseWidths[colIdx];
            rows.forEach((row, rowIdx) => {
              if (rowIdx === 0) return; // Skip title row
              const cell = row[colIdx];
              if (cell && cell.v) {
                const len = String(cell.v).length;
                if (len > maxLen) {
                  maxLen = len;
                }
              }
            });
            // Cap at 65 to prevent super massive columns, minimum is the base standard width
            baseWidths[colIdx] = Math.min(Math.max(baseWidths[colIdx], maxLen + 3), 65);
          }
        }
        
        ws['!cols'] = baseWidths.map((w) => ({ wch: w }));

        // Configure Row Heights
        const rowHeights = [
          { hpt: 35 }, // Row 1 Title
          { hpt: 15 }, // Row 2 Spacer
          { hpt: 25 }  // Row 3 Headers
        ];
        sortedRecords.forEach(() => {
          rowHeights.push({ hpt: 22 }); // comfortable row height for medical records
        });
        if (includeFooter) {
          rowHeights.push({ hpt: 15 }); // Spacer before footer
          rowHeights.push({ hpt: 25 }); // Footer total row
        }
        ws['!rows'] = rowHeights;

        // Add to workbook with sheetName (e.g. "يناير 2026")
        XLSX.utils.book_append_sheet(wb, ws, group.sheetName);
      });

      // Filename construction: "التقرير السنوي [السنة]م.xlsx"
      const yearsStr = selectedYears.join('-');
      const fileName = `التقرير السنوي ${yearsStr}م.xlsx`;

      XLSX.writeFile(wb, fileName);
      triggerToast(`تم إنشاء وتصدير ملف التقرير السنوي بنجاح! تم تصدير ${totalSelectedRecords} سجلاً موزعة على ${activeGroups.length} أوراق عمل (أشهر).`, 'success');
      setCurrentStep(3);
    } catch (err: any) {
      triggerToast(`فشل تصدير ملف Excel: ${err.message || 'حدث خطأ غير معروف'}`, 'error');
    }
  };

  const handleYearToggle = (year: number) => {
    if (selectedYears.includes(year)) {
      if (selectedYears.length === 1) return; // Must have at least one year
      setSelectedYears(selectedYears.filter((y) => y !== year));
      // Deselect all months belonging to this year
      setSelectedMonths(selectedMonths.filter((m) => !m.startsWith(`${year}-`)));
    } else {
      setSelectedYears([...selectedYears, year]);
      // Select all months of this year
      const yearMonths = allGroups
        .filter((g) => g.year === year)
        .map((g) => `${g.year}-${String(g.month).padStart(2, '0')}`);
      setSelectedMonths(Array.from(new Set([...selectedMonths, ...yearMonths])));
    }
  };

  const handleMonthToggle = (monthKey: string) => {
    if (selectedMonths.includes(monthKey)) {
      setSelectedMonths(selectedMonths.filter((m) => m !== monthKey));
    } else {
      setSelectedMonths([...selectedMonths, monthKey]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-55 p-4 text-right select-none no-print">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative"
      >
        {/* Header bar */}
        <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-md md:text-lg font-bold text-slate-900 dark:text-white">تصدير التقرير السنوي والشهري (Excel)</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">مطابق تماماً للتنسيق الرسمي والجماليات المعتمدة للتقارير العسكرية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps indicator */}
        <div className="px-6 py-3.5 bg-slate-100/50 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-4">
            <span className={`flex items-center gap-1.5 ${currentStep >= 1 ? 'text-amber-500 font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-800'}`}>١</span>
              تحديد النطاق والفلترة
            </span>
            <span className="text-slate-300 dark:text-slate-700">←</span>
            <span className={`flex items-center gap-1.5 ${currentStep >= 2 ? 'text-amber-500 font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-800'}`}>٢</span>
              معاينة التنسيق والبنية
            </span>
            <span className="text-slate-300 dark:text-slate-700">←</span>
            <span className={`flex items-center gap-1.5 ${currentStep >= 3 ? 'text-amber-500 font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-800'}`}>٣</span>
              جاهز للتحميل
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">خطوة {currentStep} من ٣</span>
        </div>

        {/* Dynamic Content Pane */}
        <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: CONFIGURE RANGE & FILTERS */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl flex gap-3 items-start">
                  <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-400 space-y-1 leading-relaxed">
                    <p className="font-bold">منطق تقسيم أوراق العمل (Sheets):</p>
                    <p>سيقوم النظام بفرز وفصل الإجازات الطبية تلقائياً وإنشاء ورقة عمل مستقلة لكل شهر (مثال: يناير 2026). إذا قمت باختيار عدة سنوات أو أشهر، سيجمعها التطبيق في ملف واحد غني ومقسم بشكل رائع ومثالي للطباعة.</p>
                  </div>
                </div>

                {/* Years Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">١. حدد السنوات الميلادية المشمولة:</label>
                  <div className="flex flex-wrap gap-2.5">
                    {availableYears.length === 0 ? (
                      <p className="text-xs text-rose-500">لا توجد بيانات مسجلة في قاعدة البيانات لتصديرها!</p>
                    ) : (
                      availableYears.map((year) => {
                        const isSelected = selectedYears.includes(year);
                        return (
                          <button
                            key={year}
                            onClick={() => handleYearToggle(year)}
                            className={`px-4 py-2 rounded-xl border text-xs font-bold font-sans transition-all flex items-center gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                            <span>{year} م</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Months Selector */}
                {selectedYears.length > 0 && (
                  <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">٢. حدد الأشهر المحددة للتصدير:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {allGroups
                        .filter((g) => selectedYears.includes(g.year))
                        .map((group) => {
                          const key = `${group.year}-${String(group.month).padStart(2, '0')}`;
                          const isSelected = selectedMonths.includes(key);
                          return (
                            <button
                              key={key}
                              onClick={() => handleMonthToggle(key)}
                              className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : 'bg-slate-50 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-xs font-bold font-sans">{group.monthName} {group.year}</span>
                                {isSelected ? (
                                  <Check className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700" />
                                )}
                              </div>
                              <span className="text-[10px] mt-1.5 font-sans block text-slate-400 dark:text-slate-500 font-semibold">
                                {group.records.length} سجل طبي
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Aesthetic Export Settings */}
                <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-amber-500" />
                    <span>تفضيلات التنسيق وجماليات التقرير:</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Add Footer Total */}
                    <button
                      onClick={() => setIncludeFooter(!includeFooter)}
                      className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                        includeFooter
                          ? 'bg-slate-50 dark:bg-slate-850 border-amber-500/35 text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border ${includeFooter ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-300 dark:border-slate-700'}`}>
                        {includeFooter && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold block">إضافة تذييل كلي لكل شهر</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">يكتب إجمالي عدد الإجازات الطبية في نهاية الورقة.</span>
                      </div>
                    </button>

                    {/* AutoFit widths */}
                    <button
                      onClick={() => setAutoFitWidths(!autoFitWidths)}
                      className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                        autoFitWidths
                          ? 'bg-slate-50 dark:bg-slate-850 border-amber-500/35 text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border ${autoFitWidths ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-300 dark:border-slate-700'}`}>
                        {autoFitWidths && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold block">ضبط تلقائي لعرض الأعمدة</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">يتوسع عرض الأعمدة أوتوماتيكياً لمنع قص التشخيص والملاحظات.</span>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: PREVIEW LAYOUT & FORMAT */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-5"
              >
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex items-center gap-3">
                  <Eye className="w-5 h-5 text-indigo-500 shrink-0" />
                  <p className="text-xs text-indigo-800 dark:text-indigo-400 font-medium leading-relaxed">
                    معاينة حية لشكل وتركيبة ورقة العمل في ملف Excel قبل الحفظ النهائي:
                  </p>
                </div>

                {/* Simulated Sheet Excel Structure Preview */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-950 text-right">
                  {/* Excel Sheet tab bar */}
                  <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 select-none">
                    <span className="text-slate-400 font-bold font-sans text-[10px] uppercase border-l border-slate-200 dark:border-slate-800 pl-2 ml-1">أوراق التقرير:</span>
                    {activeGroups.map((group, gIdx) => (
                      <span
                        key={group.sheetName}
                        className={`px-3 py-1.5 rounded-t-lg border-x border-t transition-all font-sans text-[11px] font-semibold flex items-center gap-1.5 shrink-0 ${
                          gIdx === 0
                            ? 'bg-white dark:bg-slate-950 text-amber-500 border-slate-250 dark:border-slate-850 font-bold'
                            : 'text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-700'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{group.sheetName}</span>
                      </span>
                    ))}
                  </div>

                  {/* Worksheet contents simulation */}
                  <div className="p-4 overflow-x-auto font-sans text-xs">
                    <div className="min-w-[600px] border border-slate-150 dark:border-slate-800 divide-y divide-slate-150 dark:divide-slate-800/60 rounded-lg overflow-hidden">
                      {/* Simulated Excel Row 1 (Title merged) */}
                      <div className="bg-amber-500/5 dark:bg-amber-500/10 py-3.5 px-4 text-center font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800">
                        {`كشف الإجازات المرضية - اللواء 43 عمالقة (النقطة الطبية) - ${activeGroups[0]?.monthName || 'يناير'} ${activeGroups[0]?.year || '2026'}`}
                      </div>

                      {/* Simulated Excel Row 2 (Empty Row) */}
                      <div className="bg-slate-50/40 dark:bg-slate-900/10 py-1.5 px-4 text-center text-slate-300 dark:text-slate-700 italic font-mono text-[9px]">
                        [صف فارغ للفصل البصري والطباعة]
                      </div>

                      {/* Simulated Excel Row 3 (Headers with D9D9D9 color) */}
                      <div className="bg-[#D9D9D9] dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold grid grid-cols-12 divide-x divide-x-reverse divide-slate-300 dark:divide-slate-700 text-center py-2.5">
                        <div className="col-span-1">م</div>
                        <div className="col-span-3 text-right pr-3">الاسم</div>
                        <div className="col-span-1.5">الحالة</div>
                        <div className="col-span-2.5 text-right pr-2">التشخيص</div>
                        <div className="col-span-1.5">البدء</div>
                        <div className="col-span-1.5">الانتهاء</div>
                        <div className="col-span-1">ملاحظات</div>
                      </div>

                      {/* Simulated Excel Rows 4+ (Records) */}
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/30">
                        {activeGroups[0]?.records.slice(0, 3).map((rec, rIdx) => (
                          <div
                            key={rec.id}
                            className="grid grid-cols-12 divide-x divide-x-reverse divide-slate-100 dark:divide-slate-800/20 text-center py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-600 dark:text-slate-300 font-medium"
                          >
                            <div className="col-span-1 font-mono text-slate-400">{(rIdx + 1).toFixed(1)}</div>
                            <div className="col-span-3 text-right pr-3 truncate text-slate-900 dark:text-white font-semibold">{rec.name}</div>
                            <div className="col-span-1.5">
                              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                                {rec.type}
                              </span>
                            </div>
                            <div className="col-span-2.5 text-right pr-2 truncate text-slate-800 dark:text-slate-200 font-sans">{rec.diagnosis}</div>
                            <div className="col-span-1.5 font-mono text-[11px]">{formatArabicDate(rec.startDate)}</div>
                            <div className="col-span-1.5 font-mono text-[11px]">
                              {rec.endDate && /^\d{4}-\d{2}-\d{2}$/.test(rec.endDate) ? formatArabicDate(rec.endDate) : rec.endDate || '-'}
                            </div>
                            <div className="col-span-1 truncate text-slate-400 pl-2 text-right text-[10px]">
                              {rec.notes ? '✓ نعم' : '-'}
                            </div>
                          </div>
                        ))}
                        {activeGroups[0]?.records.length > 3 && (
                          <div className="py-2.5 text-center text-[11px] text-slate-400 bg-slate-50/20 dark:bg-slate-900/10 italic">
                            ... وعدد {activeGroups[0].records.length - 3} سجلات أخرى مضافة لهذه الصفحة
                          </div>
                        )}
                      </div>

                      {/* Simulated Excel Row N (Footer total) */}
                      {includeFooter && (
                        <div className="bg-slate-50 dark:bg-slate-900/40 py-2.5 px-4 font-bold text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 flex items-center justify-start gap-1 font-sans">
                          <span>إجمالي الإجازات لمنتسبي اللواء:</span>
                          <span className="text-amber-500 font-mono text-sm pr-1">{activeGroups[0]?.records.length || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">ملخص ملف التصدير النهائي:</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">اسم الملف:</span>
                      <span className="text-slate-800 dark:text-white font-mono">التقرير السنوي {selectedYears.join('-')}م.xlsx</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">عدد أوراق العمل (أشهر):</span>
                      <span className="text-amber-500 font-mono font-bold">{activeGroups.length}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">إجمالي الحالات المضمنة:</span>
                      <span className="text-emerald-500 font-mono font-bold">{totalSelectedRecords} حالة</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">الحدود والتصميم:</span>
                      <span className="text-emerald-500">مفعل (أسود رفيع)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: EXPORT COMPLETE / DONE */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-6"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 mb-2 animate-bounce">
                  <CheckCircle className="w-10 h-10 stroke-[2.5px]" />
                </div>
                <div className="space-y-2.5">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">تم تصدير التقرير السنوي بنجاح!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    تم إنشاء وتحميل ملف Excel النهائي وتنسيقه بالشكل الأمثل والمطابق تماماً لمعايير الشؤون الطبية للواء 43 عمالقة.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850/60 max-w-sm mx-auto text-xs text-right space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">عدد الحالات المصدرة:</span>
                    <span className="font-bold text-emerald-500 font-mono">{totalSelectedRecords}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">عدد الشهور المصدرة:</span>
                    <span className="font-bold text-amber-500 font-mono">{activeGroups.length} أشهر</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">اسم الملف:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 font-mono truncate max-w-[200px]">
                      التقرير السنوي {selectedYears.join('-')}م.xlsx
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  ملاحظة: يمكنك العثور على الملف مباشرة في مجلد التنزيلات (Downloads) بجهازك.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action button footer bar */}
        <div className="p-5 md:p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          {/* Back Button */}
          {currentStep === 2 && (
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4.5 py-2.5 bg-slate-200 hover:bg-slate-200.5 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>
          )}

          {currentStep === 3 && (
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4.5 py-2.5 bg-slate-200 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>تصدير ملف آخر</span>
            </button>
          )}

          {/* Forward Button */}
          {currentStep === 1 && (
            <button
              onClick={() => {
                if (activeGroups.length === 0) {
                  triggerToast('يرجى اختيار شهر واحد على الأقل للتصدير', 'error');
                  return;
                }
                setCurrentStep(2);
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>متابعة إلى المعاينة</span>
              <ChevronLeft className="w-4 h-4 stroke-[2.5px]" />
            </button>
          )}

          {currentStep === 2 && (
            <button
              onClick={handleExportExcel}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
            >
              <Download className="w-4 h-4" />
              <span>تأكيد وتصدير إلى Excel</span>
            </button>
          )}

          {/* Close/Done Button */}
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              currentStep === 3
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold w-full justify-center flex'
                : 'bg-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mr-auto'
            }`}
          >
            <span>{currentStep === 3 ? 'إغلاق المعالج' : 'إلغاء الأمر'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
