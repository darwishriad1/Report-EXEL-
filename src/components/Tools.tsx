/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import ExcelImportWizard from './ExcelImportWizard';
import ExcelExportWizard from './ExcelExportWizard';
import {
  FileDown,
  Printer,
  RotateCcw,
  Upload,
  DatabaseBackup,
  Database,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { LeaveRecord } from '../types';

interface ToolsProps {
  records: LeaveRecord[];
  onReset: () => Promise<void>;
  onImport: (records: LeaveRecord[]) => Promise<void>;
  triggerToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export default function Tools({ records, onReset, onImport, triggerToast }: ToolsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedExcelFile, setSelectedExcelFile] = useState<File | null>(null);
  const [isExportWizardOpen, setIsExportWizardOpen] = useState(false);

  // Helper to parse dates gracefully from string or Excel serial number
  const parseExcelDate = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val).trim();
    if (str === '') return '';

    // If it's a number (Excel serial date)
    if (!isNaN(Number(str)) && Number(str) > 30000) {
      try {
        const serial = Number(str);
        const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
        return date.toISOString().substring(0, 10);
      } catch (err) {
        // Fall through
      }
    }

    // Try to parse YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }

    // Try to parse DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
      const parts = str.split('/');
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }

    // Try standard Date parsing
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().substring(0, 10);
    }

    return str;
  };

  // Helper to normalize Leave Types
  const normalizeLeaveType = (val: any): LeaveRecord['type'] => {
    const str = String(val).trim();
    if (['مرافق', 'مرافقة'].includes(str)) return 'مرافق';
    if (['مرض قريب', 'عائلي', 'قريب'].includes(str)) return 'مرض قريب';
    if (['حادث', 'حوادث', 'إصابة'].includes(str)) return 'حادث';
    return 'مريض'; // default fallback
  };

  // Helper to generate a unique ID
  const generateId = () => `rec_import_${Math.random().toString(36).substring(2, 11)}`;

  // 1. Export All CSV
  const handleExportFullCSV = () => {
    if (records.length === 0) {
      triggerToast('لا توجد بيانات لتصديرها', 'error');
      return;
    }

    const headers = [
      'المعرف ID',
      'الاسم الكامل',
      'الرتبة',
      'الوحدة العسكرية',
      'نوع الإجازة',
      'التشخيص الطبي',
      'جهة الإصدار',
      'تاريخ البدء YYYY-MM-DD',
      'تاريخ الانتهاء YYYY-MM-DD',
      'ملاحظات'
    ];

    const rows = records.map((r) => [
      r.id,
      r.name,
      r.rank,
      r.unit || 'اللواء 43 عمالقة',
      r.type,
      r.diagnosis,
      r.issuer,
      r.startDate,
      r.endDate,
      r.notes || ''
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `قاعدة_إجازات_مرضية_كاملة_اللواء_43_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast('تم تصدير نسخة كاملة بصيغة CSV بنجاح', 'success');
  };

  // 2. JSON Backup
  const handleBackupJSON = () => {
    if (records.length === 0) {
      triggerToast('لا توجد بيانات لعمل نسخة احتياطية لها', 'error');
      return;
    }

    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `نسخة_احتياطية_إجازات_اللواء_43_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast('تم تحميل ملف النسخة الاحتياطية بنجاح', 'success');
  };

  // 3. JSON Restore
  const handleRestoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);

        if (!Array.isArray(parsed)) {
          throw new Error('الملف غير مطبق لقواعد هيكلة السجلات');
        }

        // Quick check on schema of the first item
        if (parsed.length > 0) {
          const item = parsed[0];
          if (!item.name || !item.type || !item.startDate || !item.endDate) {
            throw new Error('الملف لا يحتوي على حقول السجلات المطلوبة');
          }
        }

        // Clean values
        const normalized = parsed.map((item: any) => ({
          id: item.id || `rec_restored_${Math.random().toString(36).substring(2, 9)}`,
          name: String(item.name).trim(),
          rank: String(item.rank || 'جندي').trim(),
          unit: String(item.unit || 'اللواء 43 عمالقة').trim(),
          type: normalizeLeaveType(item.type),
          diagnosis: String(item.diagnosis || 'تشخيص طبي مستورد').trim(),
          issuer: String(item.issuer || 'جهة غير محددة').trim(),
          startDate: parseExcelDate(item.startDate),
          endDate: parseExcelDate(item.endDate),
          notes: String(item.notes || '').trim(),
          history: Array.isArray(item.history) ? item.history : []
        }));

        await onImport(normalized);
        triggerToast(`تم استعادة ${normalized.length} سجل بنجاح واستبدال البيانات الحالية`, 'success');
      } catch (err: any) {
        triggerToast(`فشل استيراد الملف: ${err.message || 'تنسيق JSON خاطئ'}`, 'error');
      } finally {
        setIsLoading(false);
        if (jsonInputRef.current) jsonInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // 4. Reset Database
  const handleResetDatabase = async () => {
    if (
      confirm(
        'تحذير هام: هل أنت متأكد تماماً من تهيئة قاعدة البيانات؟ سيؤدي ذلك إلى حذف جميع البيانات الحالية واستعادة السجلات الـ 5 الافتراضية.'
      )
    ) {
      try {
        setIsLoading(true);
        await onReset();
        triggerToast('تمت إعادة تهيئة قاعدة البيانات واسترجاع السجلات الافتراضية بنجاح', 'success');
      } catch (err) {
        triggerToast('حدث خطأ أثناء إعادة تهيئة قاعدة البيانات', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 5. Excel Import (Triggers Wizard)
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedExcelFile(file);
  };

  // 6. CSV Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        // Simple comma/newline split parser
        const lines = text.split('\n').map((line) => line.trim()).filter((line) => line !== '');
        if (lines.length < 2) {
          throw new Error('الملف فارغ أو لا يحتوي على كتل بيانات');
        }

        // Helper to parse CSV line respecting quotes
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const rows = lines.map(parseCSVLine);
        const headers = rows[0].map((h) => h.replace(/^\uFEFF/, '').trim()); // Strip BOM if present

        let nameIdx = headers.findIndex((h) => h.includes('الاسم') || h.includes('name'));
        let rankIdx = headers.findIndex((h) => h.includes('الرتبة') || h.includes('rank'));
        let unitIdx = headers.findIndex((h) => h.includes('الوحدة') || h.includes('unit'));
        let typeIdx = headers.findIndex((h) => h.includes('نوع') || h.includes('type'));
        let diagIdx = headers.findIndex((h) => h.includes('التشخيص') || h.includes('diagnosis'));
        let issuerIdx = headers.findIndex((h) => h.includes('جهة') || h.includes('issuer'));
        let startIdx = headers.findIndex((h) => h.includes('البدء') || h.includes('بداية') || h.includes('startDate') || h.includes('start'));
        let endIdx = headers.findIndex((h) => h.includes('الانتهاء') || h.includes('نهاية') || h.includes('endDate') || h.includes('end'));
        let notesIdx = headers.findIndex((h) => h.includes('ملاحظات') || h.includes('notes'));

        if (nameIdx === -1) nameIdx = 1;
        if (rankIdx === -1) rankIdx = 2;
        if (unitIdx === -1) unitIdx = 3;
        if (typeIdx === -1) typeIdx = 4;
        if (diagIdx === -1) diagIdx = 5;
        if (issuerIdx === -1) issuerIdx = 6;
        if (startIdx === -1) startIdx = 7;
        if (endIdx === -1) endIdx = 8;
        if (notesIdx === -1) notesIdx = 9;

        const importedRecords: LeaveRecord[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || !row[nameIdx]) continue;

          const name = row[nameIdx].replace(/^"|"$/g, '').trim();
          const rank = row[rankIdx] ? row[rankIdx].replace(/^"|"$/g, '').trim() : 'جندي';
          const unit = row[unitIdx] ? row[unitIdx].replace(/^"|"$/g, '').trim() : 'اللواء 43 عمالقة';
          const type = normalizeLeaveType(row[typeIdx] ? row[typeIdx].replace(/^"|"$/g, '') : '');
          const diagnosis = row[diagIdx] ? row[diagIdx].replace(/^"|"$/g, '').trim() : 'تشخيص مستورد';
          const issuer = row[issuerIdx] ? row[issuerIdx].replace(/^"|"$/g, '').trim() : 'جهة معتمدة';
          const startDate = parseExcelDate(row[startIdx] ? row[startIdx].replace(/^"|"$/g, '') : '');
          const endDate = parseExcelDate(row[endIdx] ? row[endIdx].replace(/^"|"$/g, '') : '');
          const notes = row[notesIdx] ? row[notesIdx].replace(/^"|"$/g, '').trim() : '';

          if (!startDate || !endDate) continue;

          importedRecords.push({
            id: generateId(),
            name,
            rank,
            unit,
            type,
            diagnosis,
            issuer,
            startDate,
            endDate,
            notes,
            history: [
              {
                date: new Date().toLocaleString('ar-YE', { hour12: false }),
                action: 'إنشاء',
                details: 'تم استيراد هذا السجل عبر ملف CSV.'
              }
            ]
          });
        }

        if (importedRecords.length === 0) {
          throw new Error('لم يتم العثور على سجلات صحيحة بالملف');
        }

        await onImport([...records, ...importedRecords]);
        triggerToast(`تم دمج ${importedRecords.length} سجل من ملف CSV بنجاح`, 'success');
      } catch (err: any) {
        triggerToast(`فشل قراءة ملف CSV: ${err.message}`, 'error');
      } finally {
        setIsLoading(false);
        if (csvInputRef.current) csvInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // 7. Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 text-right font-sans">
      {/* Tools Introduction Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 p-6 rounded-2xl border border-slate-800 dark:border-slate-900 shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
            <Database className="text-amber-500 w-5 h-5" />
            <span>لوحة الأدوات والعمليات الإدارية</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            استخدم هذه الأدوات للنسخ الاحتياطي لقاعدة البيانات المحلية واستعادتها دمجاً أو إحلالاً، بالإضافة لتصدير السجلات بصيغ متوافقة مع أنظمة Excel وطباعتها.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/80 dark:bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700/50 dark:border-slate-800/50">
          <span className="text-xs font-mono font-bold text-white bg-slate-700 dark:bg-slate-800 px-2.5 py-1 rounded-md shrink-0">
            {records.length}
          </span>
          <span className="text-xs text-slate-300">سجل إجمالي</span>
        </div>
      </div>

      {isLoading && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-800 dark:text-amber-400 text-xs font-bold text-center animate-pulse">
          جاري تنفيذ العملية الإدارية المطلوبة ومزامنة قاعدة البيانات IndexedDB... يرجى الانتظار
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: Export and Backups */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
              <DatabaseBackup className="text-amber-500 w-5 h-5" />
              <span>تصدير ونسخ البيانات</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
              حفظ وتصدير كامل السجلات المسجلة محلياً في جهازك في صيغ مختلفة للأرشفة أو نقلها لجهاز آخر.
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Custom Excel Export Wizard */}
            <button
              onClick={() => setIsExportWizardOpen(true)}
              disabled={isLoading}
              className="w-full flex items-center justify-between px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>تصدير إلى Excel (بنفس تنسيق التقرير السنوي)</span>
            </button>

            {/* Full CSV Export */}
            <button
              onClick={handleExportFullCSV}
              disabled={isLoading}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-slate-500" />
              <span>تصدير قاعدة البيانات كاملة CSV</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              disabled={isLoading}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>طباعة تقرير الإجازات الحالي (Print)</span>
            </button>

            {/* Download JSON backup */}
            <button
              onClick={handleBackupJSON}
              disabled={isLoading}
              className="w-full flex items-center justify-between px-4 py-3 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-800 dark:text-amber-400 rounded-xl font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <DatabaseBackup className="w-4 h-4 text-amber-500" />
              <span>تحميل نسخة احتياطية كاملة (JSON Backup)</span>
            </button>
          </div>
        </div>

        {/* Box 2: Imports & Restores */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
              <Upload className="text-indigo-500 w-5 h-5" />
              <span>استيراد واستعادة البيانات</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
              تحميل ملف خارجي لدمج السجلات في قاعدة البيانات الحالية أو استعادة النسخ الاحتياطية.
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Import Excel */}
            <label className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl font-semibold text-xs transition-all cursor-pointer">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>استيراد إجازات من ملف Excel (.xlsx)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleImportExcel}
                disabled={isLoading}
                className="hidden"
              />
            </label>

            {/* Import CSV */}
            <label className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl font-semibold text-xs transition-all cursor-pointer">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              <span>استيراد إجازات من ملف CSV</span>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                disabled={isLoading}
                className="hidden"
              />
            </label>

            {/* Restore JSON */}
            <label className="w-full flex items-center justify-between px-4 py-3 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-indigo-800 dark:text-indigo-400 rounded-xl font-bold text-xs transition-all cursor-pointer">
              <Upload className="w-4 h-4 text-indigo-500" />
              <span>استعادة نسخة احتياطية بالكامل (JSON Restore)</span>
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreJSON}
                disabled={isLoading}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Dangerous Operations & Help Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Help box */}
        <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 md:col-span-2 space-y-3">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 justify-start">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span>دليل الاستيراد الذكي للملفات</span>
          </h4>
          <ul className="text-[11px] text-slate-500 dark:text-slate-400 list-disc list-inside space-y-1.5 leading-relaxed pr-2">
            <li>
              عند الاستيراد من <strong>Excel أو CSV</strong>، تأكد أن الصف الأول يحتوي على أسماء الأعمدة الأساسية (الاسم، الرتبة، نوع الحالة، التشخيص، تاريخ البداية، تاريخ النهاية).
            </li>
            <li>
              يقوم النظام بتحليل تاريخ البداية والنهاية تلقائياً ويتحمل التنسيقات المتنوعة وتواريخ السيريال الرقمية لـ Excel.
            </li>
            <li>
              يقوم النظام بتعديل المدد الزمنية وفهرستها تلقائياً داخل قاعدة بيانات المتصفح IndexedDB للسرعة القصوى.
            </li>
          </ul>
        </div>

        {/* Reset Database Card */}
        <div className="bg-rose-500/5 dark:bg-rose-500/5 p-5 rounded-2xl border border-rose-500/25 space-y-3 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-extrabold text-rose-800 dark:text-rose-400 flex items-center gap-1.5 justify-start">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
              <span>منطقة العمليات الحساسة</span>
            </h4>
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 leading-relaxed mt-2">
              إعادة تهيئة النظام ستمحو كافة السجلات الطبية الحالية وتسترجع السجلات الـ 5 الافتراضية الملحقة بملف التهيئة الأولى للواء.
            </p>
          </div>

          <button
            onClick={handleResetDatabase}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة تهيئة قاعدة البيانات</span>
          </button>
        </div>
      </div>

      {/* Safety / Compliance footer */}
      <div className="bg-slate-500/5 p-4 rounded-xl border border-slate-500/10 text-center flex items-center justify-center gap-2 flex-wrap">
        <ShieldCheck className="w-5 h-5 text-emerald-500" />
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          النظام يعمل بالكامل تحت بيئة تشفير رملية آمنة في متصفحك. لا يتم رفع أي بيانات عسكرية أو شخصية إلى خوادم خارجية.
        </span>
      </div>

      {/* Excel Import Wizard overlay */}
      {selectedExcelFile && (
        <ExcelImportWizard
          file={selectedExcelFile}
          existingRecords={records}
          onClose={() => {
            setSelectedExcelFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          onComplete={async (updatedRecords) => {
            await onImport(updatedRecords);
            setSelectedExcelFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          triggerToast={triggerToast}
        />
      )}

      {/* Excel Export Wizard overlay */}
      {isExportWizardOpen && (
        <ExcelExportWizard
          records={records}
          onClose={() => setIsExportWizardOpen(false)}
          triggerToast={triggerToast}
        />
      )}
    </div>
  );
}
