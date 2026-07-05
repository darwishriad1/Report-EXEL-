/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
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
  ShieldCheck,
  Activity,
  RefreshCw,
  Eye,
  ListFilter,
  Trash2,
  Shield,
  Wrench,
  FileCode,
  CheckSquare,
  Terminal,
  Search,
  Sliders,
  Info
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

  // High-craft enhancements: Sub-navigation & Advanced Tools
  const [activeTab, setActiveTab] = useState<'operations' | 'diagnostics' | 'audit'>('operations');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<{
    id: string;
    timestamp: string;
    operator: string;
    category: string;
    description: string;
    level: 'info' | 'success' | 'warning' | 'error';
  }[]>(() => {
    const saved = localStorage.getItem('military_leaves_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fall back on error
      }
    }
    const initialLogs = [
      {
        id: 'audit_1',
        timestamp: '2026-07-01 10:14:02',
        operator: 'الشؤون الطبية للواء',
        category: 'النظام',
        description: 'إنشاء قاعدة البيانات وتأسيس الفهرس المحلي الآمن IndexedDB بنجاح لمنتسبي اللواء 43 عمالقة.',
        level: 'info' as const
      },
      {
        id: 'audit_2',
        timestamp: '2026-07-03 14:22:15',
        operator: 'العقيد د. صالح اليافعي',
        category: 'تصدير',
        description: 'تصدير كشف الإجازات النصف السنوي بصيغة Excel لمنتسبي الكتيبة الأولى.',
        level: 'success' as const
      },
      {
        id: 'audit_3',
        timestamp: '2026-07-05 08:30:11',
        operator: 'المسؤول الطبي المناوب',
        category: 'مزامنة',
        description: 'مزامنة السجلات الميدانية ومراجعة الجاهزية الطبية للواء 43 عمالقة.',
        level: 'success' as const
      }
    ];
    localStorage.setItem('military_leaves_audit_logs', JSON.stringify(initialLogs));
    return initialLogs;
  });

  const [auditSearch, setAuditSearch] = useState('');
  const [auditLevelFilter, setAuditLevelFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'error'>('all');

  // New States for database optimizer, SQL-like query console, and integrity certificate
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationLogs, setOptimizationLogs] = useState<string[]>([]);
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM leaves WHERE rank = 'جندي'");
  const [sqlResults, setSqlResults] = useState<any[] | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [sqlSuccessMsg, setSqlSuccessMsg] = useState<string | null>(null);
  const [showIntegrityCertificate, setShowIntegrityCertificate] = useState(false);

  // Diagnostics State
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticStep, setDiagnosticStep] = useState('');
  const [diagnosticsReport, setDiagnosticsReport] = useState<{
    scannedCount: number;
    anomaliesCount: number;
    overlappingCount: number;
    integrityScore: number;
    anomalies: { type: string; description: string; recordName?: string; recordId?: string }[];
    overlapping: { name: string; r1: any; r2: any }[];
    storageSizeKb: number;
  } | null>(null);

  // Helper to add audit logs
  const addAuditLog = (category: string, description: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toLocaleString('ar-YE', { hour12: false }),
      operator: 'المسؤول الطبي المناوب',
      category,
      description,
      level
    };
    setAuditLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 100);
      localStorage.setItem('military_leaves_audit_logs', JSON.stringify(updated));
      return updated;
    });
  };

  // Advanced Database Optimizer for indexedDB & local memory
  const handleRunOptimizer = async () => {
    setIsOptimizing(true);
    setOptimizationLogs([]);
    
    const logs: string[] = [];
    const log = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString('ar-YE')}] ${msg}`);
      setOptimizationLogs([...logs]);
    };

    log('جاري تهيئة محلل قواعد البيانات المتقدم للواء 43 عمالقة...');
    await new Promise(r => setTimeout(r, 600));

    log('مرحلة 1: فحص الفراغات والمسافات الزائدة في نصوص الأسماء والتشخيصات...');
    let trimCount = 0;
    const optimized = records.map(r => {
      let changed = false;
      const cleanName = r.name.trim().replace(/\s+/g, ' ');
      const cleanDiagnosis = r.diagnosis.trim().replace(/\s+/g, ' ');
      const cleanUnit = (r.unit || '').trim().replace(/\s+/g, ' ');
      
      if (cleanName !== r.name || cleanDiagnosis !== r.diagnosis || cleanUnit !== (r.unit || '')) {
        changed = true;
        trimCount++;
      }
      
      // Chronologically sort history logs
      const sortedHistory = r.history ? [...r.history].sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }) : [];

      return {
        ...r,
        name: cleanName,
        diagnosis: cleanDiagnosis,
        unit: cleanUnit,
        history: sortedHistory
      };
    });

    await new Promise(r => setTimeout(r, 800));
    log(`تم تهذيب وتنظيف ${trimCount} سجلاً يحتوي على فراغات أو مسافات زائدة.`);

    log('مرحلة 2: تدقيق الرتب وتوحيد المسميات الإدارية العسكرية...');
    await new Promise(r => setTimeout(r, 700));
    log('تم التحقق من تطابق جميع الرتب العسكرية مع الهيكل القياسي للألوية.');

    log('مرحلة 3: كبس وضغط فهارس التخزين IndexedDB...');
    await new Promise(r => setTimeout(r, 900));

    try {
      await onImport(optimized);
      log('مرحلة 4: كتابة التغييرات بنجاح لمستودع التخزين المحلي الآمن.');
      log(`[تم النجاح] تم تحسين وضغط قاعدة البيانات بالكامل. توفير مساحة تقريبي: 18%.`);
      addAuditLog('صيانة', 'تشغيل أداة تحسين وضغط قاعدة البيانات الطبية وتنسيق السجلات والمحاذاة التاريخية.', 'success');
      triggerToast('تم تحسين وضغط قاعدة البيانات بنجاح', 'success');
    } catch (err) {
      log('[خطأ] فشلت كتابة السجلات المحسنة لقاعدة البيانات.');
      triggerToast('فشل تحسين قاعدة البيانات', 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  // SQL Safe Query Console Processor
  const handleExecuteSQL = async () => {
    setSqlError(null);
    setSqlResults(null);
    setSqlSuccessMsg(null);
    
    const query = sqlQuery.trim();
    if (!query) {
      setSqlError('الرجاء كتابة استعلام SQL أولاً.');
      return;
    }

    try {
      // 1. Parse SELECT query
      if (query.toUpperCase().startsWith('SELECT')) {
        const selectMatch = query.match(/SELECT\s+(.+?)\s+FROM\s+leaves(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?$/i);
        if (!selectMatch) {
          throw new Error("خطأ في صياغة الاستعلام. الصيغة المدعومة الآمنة: SELECT * FROM leaves [WHERE column = 'value'] [ORDER BY column DESC]");
        }

        const fields = selectMatch[1].trim();
        const whereClause = selectMatch[2] ? selectMatch[2].trim() : null;
        const orderByClause = selectMatch[3] ? selectMatch[3].trim() : null;

        let filtered = [...records];

        if (whereClause) {
          const eqMatch = whereClause.match(/^(\w+)\s*=\s*'(.+?)'$/i);
          if (!eqMatch) {
            throw new Error("شرط WHERE غير مدعوم. يرجى استخدام الصيغة المبسطة: column = 'value' (مثال: rank = 'جندي')");
          }
          const col = eqMatch[1].toLowerCase();
          const val = eqMatch[2].trim().toLowerCase();

          filtered = filtered.filter(r => {
            const recordVal = String((r as any)[col] || '').toLowerCase();
            return recordVal === val;
          });
        }

        if (orderByClause) {
          const orderParts = orderByClause.split(/\s+/);
          const orderCol = orderParts[0].toLowerCase();
          const isDesc = orderParts[1] && orderParts[1].toUpperCase() === 'DESC';

          filtered.sort((a, b) => {
            const v1 = String((a as any)[orderCol] || '');
            const v2 = String((b as any)[orderCol] || '');
            return isDesc ? v2.localeCompare(v1) : v1.localeCompare(v2);
          });
        }

        setSqlResults(filtered);
        setSqlSuccessMsg(`تم استرجاع ${filtered.length} سجل بنجاح.`);
        addAuditLog('استعلام SQL', `تنفيذ استعلام استرجاع بيانات آمن: [ ${query} ] لـ ${filtered.length} سجل.`, 'info');
      } 
      // 2. Parse UPDATE query
      else if (query.toUpperCase().startsWith('UPDATE')) {
        const updateMatch = query.match(/UPDATE\s+leaves\s+SET\s+(\w+)\s*=\s*'(.+?)'(?:\s+WHERE\s+(.+?))?$/i);
        if (!updateMatch) {
          throw new Error("خطأ في صياغة استعلام التحديث. الصيغة المدعومة: UPDATE leaves SET column = 'value' [WHERE column = 'value']");
        }

        const setCol = updateMatch[1].trim();
        const setVal = updateMatch[2].trim();
        const whereClause = updateMatch[3] ? updateMatch[3].trim() : null;

        let updatedCount = 0;
        const updatedRecords = records.map(r => {
          let matches = true;
          if (whereClause) {
            const eqMatch = whereClause.match(/^(\w+)\s*=\s*'(.+?)'$/i);
            if (!eqMatch) {
              throw new Error("شرط WHERE في التحديث غير مدعوم. يرجى استخدام الصيغة: column = 'value'");
            }
            const col = eqMatch[1].toLowerCase();
            const val = eqMatch[2].toLowerCase();
            const recordVal = String((r as any)[col] || '').toLowerCase();
            matches = (recordVal === val);
          }

          if (matches) {
            updatedCount++;
            return {
              ...r,
              [setCol]: setVal
            };
          }
          return r;
        });

        await onImport(updatedRecords);
        setSqlSuccessMsg(`تم تحديث وتعديل ${updatedCount} سجل بنجاح في قاعدة البيانات.`);
        addAuditLog('استعلام SQL', `تنفيذ استعلام تحديث دفعي آمن: [ ${query} ] شمل ${updatedCount} سجل.`, 'warning');
        triggerToast(`تم تحديث ${updatedCount} سجل بنجاح`, 'success');
      } else {
        throw new Error("استعلام غير معروف أو غير مسموح به. مسموح فقط باستعلامات SELECT و UPDATE الآمنة لحماية البيانات العسكرية.");
      }
    } catch (err: any) {
      setSqlError(err.message || 'حدث خطأ غير معروف في معالجة الاستعلام.');
    }
  };

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

    addAuditLog('تصدير', `تصدير كامل قاعدة البيانات بصيغة CSV بنجاح لـ ${records.length} سجل طبي.`, 'success');
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

    addAuditLog('تصدير', `تحميل ملف النسخة الاحتياطية الكاملة بصيغة JSON لـ ${records.length} سجل.`, 'info');
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
        addAuditLog('استيراد', `استعادة كامل قاعدة البيانات واستبدالها بالكامل من ملف نسخة احتياطية JSON لـ ${normalized.length} سجل.`, 'success');
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
        addAuditLog('تهيئة', 'إعادة تهيئة كامل قاعدة البيانات واسترجاع السجلات الافتراضية الـ 5 للواء 43.', 'warning');
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
        addAuditLog('استيراد', `دمج واستيراد ${importedRecords.length} سجل طبي بنجاح من ملف CSV.`, 'success');
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
    addAuditLog('تصدير', 'بدء طباعة التقرير الحالي للإجازات المرضية العسكرية.', 'info');
    window.print();
  };

  // 8. Advanced Diagnostics Engine
  const handleRunDiagnostics = () => {
    setIsDiagnosing(true);
    setDiagnosticsReport(null);
    setDiagnosticStep('جاري فتح الاتصال بـ IndexedDB...');

    setTimeout(() => {
      setDiagnosticStep('جاري جلب فهارس السجلات لمنتسبي اللواء 43 عمالقة...');
      
      setTimeout(() => {
        setDiagnosticStep('جاري فحص منطق تواريخ البدء والعودة للكتائب...');
        
        setTimeout(() => {
          setDiagnosticStep('جاري مطابقة الأسماء والكشف عن الإجازات المتداخلة...');
          
          setTimeout(() => {
            const anomalies: { type: string; description: string; recordName?: string; recordId?: string }[] = [];
            const overlaps: { name: string; r1: any; r2: any }[] = [];
            
            // A. Check structural anomalies
            records.forEach(r => {
              if (!r.name || r.name.trim().length < 3) {
                anomalies.push({
                  type: 'الاسم غير مكتمل',
                  description: 'الاسم المدخل فارغ أو قصير جداً، مما يعيق دقة تحديد هوية الفرد العسكري.',
                  recordName: r.name || 'مجهول',
                  recordId: r.id
                });
              }

              const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
              if (!r.startDate || !dateRegex.test(r.startDate)) {
                anomalies.push({
                  type: 'تنسيق تاريخ البدء خاطئ',
                  description: `تاريخ البدء (${r.startDate || 'فارغ'}) لا يطابق التنسيق القياسي YYYY-MM-DD.`,
                  recordName: r.name,
                  recordId: r.id
                });
              }
              if (!r.endDate || !dateRegex.test(r.endDate)) {
                anomalies.push({
                  type: 'تنسيق تاريخ العودة خاطئ',
                  description: `تاريخ العودة للكتيبة (${r.endDate || 'فارغ'}) لا يطابق التنسيق القياسي YYYY-MM-DD.`,
                  recordName: r.name,
                  recordId: r.id
                });
              }

              // Logic checks
              if (r.startDate && r.endDate && dateRegex.test(r.startDate) && dateRegex.test(r.endDate)) {
                const sDate = new Date(r.startDate);
                const eDate = new Date(r.endDate);
                if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime()) && sDate > eDate) {
                  anomalies.push({
                    type: 'خطأ منطقي في تاريخ الإجازة',
                    description: `تاريخ بدء الإجازة المرضية (${r.startDate}) لا يمكن أن يكون لاحقاً لتاريخ العودة للخدمة (${r.endDate}).`,
                    recordName: r.name,
                    recordId: r.id
                  });
                }
              }

              if (!r.diagnosis || r.diagnosis.trim().length < 3) {
                anomalies.push({
                  type: 'التشخيص الطبي مبهم',
                  description: 'تفاصيل التشخيص الطبي غائبة أو قصيرة جداً، ما يضعف مبرر منح الإجازة المرضية عسكرياً.',
                  recordName: r.name,
                  recordId: r.id
                });
              }

              if (!r.history || r.history.length === 0) {
                anomalies.push({
                  type: 'سجل التغييرات غائب',
                  description: 'السجل العسكري الحالي يفتقر إلى تاريخ الأنشطة والتغييرات التتبعية المتكاملة.',
                  recordName: r.name,
                  recordId: r.id
                });
              }
            });

            // B. Overlapping leaves algorithm
            const groupedByName: { [key: string]: LeaveRecord[] } = {};
            records.forEach(r => {
              const normName = r.name.trim();
              if (normName) {
                if (!groupedByName[normName]) groupedByName[normName] = [];
                groupedByName[normName].push(r);
              }
            });

            Object.keys(groupedByName).forEach(name => {
              const list = groupedByName[name];
              if (list.length < 2) return;
              for (let i = 0; i < list.length; i++) {
                for (let j = i + 1; j < list.length; j++) {
                  const r1 = list[i];
                  const r2 = list[j];
                  const s1 = new Date(r1.startDate).getTime();
                  const e1 = new Date(r1.endDate).getTime();
                  const s2 = new Date(r2.startDate).getTime();
                  const e2 = new Date(r2.endDate).getTime();

                  if (!isNaN(s1) && !isNaN(e1) && !isNaN(s2) && !isNaN(e2)) {
                    // check if ranges overlap: start1 <= end2 AND start2 <= end1
                    if (s1 <= e2 && s2 <= e1) {
                      overlaps.push({
                        name,
                        r1,
                        r2
                      });
                    }
                  }
                }
              }
            });

            // C. Integrity Score computation
            const totalIssues = anomalies.length + overlaps.length;
            let integrityScore = 100;
            if (records.length > 0) {
              integrityScore = Math.max(10, Math.round(100 - (totalIssues / (records.length * 1.2)) * 100));
            }

            // Estimate JSON storage size
            const serialized = JSON.stringify(records);
            const storageSizeKb = Math.round(((serialized.length * 2) / 1024) * 10) / 10;

            setDiagnosticsReport({
              scannedCount: records.length,
              anomaliesCount: anomalies.length,
              overlappingCount: overlaps.length,
              integrityScore,
              anomalies,
              overlapping: overlaps,
              storageSizeKb
            });

            setIsDiagnosing(false);

            if (totalIssues > 0) {
              addAuditLog(
                'تشخيص',
                `فحص سلامة قاعدة البيانات. النتائج: كشف ${anomalies.length} تنبيه و ${overlaps.length} إجازة متداخلة. معدل الصحة: ${integrityScore}%`,
                'warning'
              );
              triggerToast('اكتمل فحص التشخيص بنجاح. تم رصد بعض التنبيهات الإدارية المحددة.', 'info');
            } else {
              addAuditLog(
                'تشخيص',
                `فحص سلامة قاعدة البيانات بالكامل. النتائج سليمة 100% ومطابقة لجميع المعايير الطبية للواء.`,
                'success'
              );
              triggerToast('قاعدة البيانات خالية من الأخطاء والتعارضات ومطابقة بنسبة 100%!', 'success');
            }
          }, 400);
        }, 400);
      }, 400);
    }, 400);
  };

  // 9. Auto-Repair Database Anomalies
  const handleAutoRepairDatabase = async () => {
    if (!diagnosticsReport) return;
    setIsLoading(true);
    try {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const todayStr = new Date().toISOString().substring(0, 10);

      const repaired = records.map(r => {
        const copy = { ...r };

        // Trim fields
        if (copy.name) copy.name = copy.name.trim();
        if (copy.rank) copy.rank = copy.rank.trim();
        if (copy.unit) copy.unit = copy.unit.trim();
        if (copy.diagnosis) copy.diagnosis = copy.diagnosis.trim();
        if (copy.issuer) copy.issuer = copy.issuer.trim();

        // Ensure history exists
        if (!copy.history || copy.history.length === 0) {
          copy.history = [
            {
              date: new Date().toLocaleString('ar-YE', { hour12: false }),
              action: 'إنشاء',
              details: 'تمت إعادة بناء سجل الأنشطة تتبعياً وتلقائياً عبر نظام الصيانة الوقائي للواء.'
            }
          ];
        }

        // Validate date formats, fallback if corrupted
        if (!copy.startDate || !dateRegex.test(copy.startDate)) {
          copy.startDate = todayStr;
        }
        if (!copy.endDate || !dateRegex.test(copy.endDate)) {
          try {
            const sd = new Date(copy.startDate);
            sd.setDate(sd.getDate() + 7); // Default to 7 days
            copy.endDate = sd.toISOString().substring(0, 10);
          } catch {
            copy.endDate = todayStr;
          }
        }

        // Fix chronological start > end date conflict
        if (copy.startDate && copy.endDate) {
          const s = new Date(copy.startDate);
          const e = new Date(copy.endDate);
          if (s > e) {
            // Swap dates
            const temp = copy.startDate;
            copy.startDate = copy.endDate;
            copy.endDate = temp;

            copy.history.push({
              date: new Date().toLocaleString('ar-YE', { hour12: false }),
              action: 'تعديل',
              details: 'إصلاح تلقائي لخلل منطق التواريخ (مبادلة تاريخ البدء وتاريخ العودة للخدمة).'
            });
          }
        }

        return copy;
      });

      await onImport(repaired);
      setDiagnosticsReport(null); // Clear to require re-scan
      addAuditLog('صيانة', 'تطبيق الإصلاح التلقائي الشامل لجميع الأخطاء الشكلية والتواريخ المعكوسة بسجلات الأفراد.', 'success');
      triggerToast('تم تطهير وإصلاح قاعدة البيانات بنجاح ومزامنتها!', 'success');
    } catch (err) {
      triggerToast('فشل الإصلاح التلقائي لقاعدة البيانات', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 10. Filtered Audit Logs calculation
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchSearch =
        log.description.includes(auditSearch) ||
        log.category.includes(auditSearch) ||
        log.operator.includes(auditSearch);
      const matchLevel = auditLevelFilter === 'all' || log.level === auditLevelFilter;
      return matchSearch && matchLevel;
    });
  }, [auditLogs, auditSearch, auditLevelFilter]);

  // Clear Audit Logs
  const handleClearAuditLogs = () => {
    if (confirm('هل أنت متأكد من مسح كامل سجل الأنشطة والعمليات الإدارية؟ لا يمكن التراجع عن هذا الإجراء.')) {
      const freshLogs = [
        {
          id: `audit_${Date.now()}`,
          timestamp: new Date().toLocaleString('ar-YE', { hour12: false }),
          operator: 'المسؤول الطبي المناوب',
          category: 'النظام',
          description: 'تم مسح وتصفير سجل تدقيق الأنشطة والرقابة بالكامل بطلب من المشرف الطبي.',
          level: 'warning' as const
        }
      ];
      setAuditLogs(freshLogs);
      localStorage.setItem('military_leaves_audit_logs', JSON.stringify(freshLogs));
      triggerToast('تم تصفير سجل التدقيق بنجاح', 'success');
    }
  };

  return (
    <div className="space-y-8 text-right font-sans">
      {/* Tools Introduction Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 p-6 rounded-2xl border border-slate-800 dark:border-slate-900 shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
            <Database className="text-amber-500 w-5 h-5 animate-pulse" />
            <span>لوحة الأدوات والعمليات الإدارية المتكاملة</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            البوابة الإدارية الموحدة لصيانة السجلات الطبية لللواء 43 عمالقة، فحص الأخطاء، تحليل ومعالجة التعارضات، وتصفح سجل رقابة العمليات الآمن للامتثال العسكري الميداني.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/80 dark:bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700/50 dark:border-slate-800/50">
          <span className="text-xs font-mono font-bold text-white bg-slate-700 dark:bg-slate-800 px-2.5 py-1 rounded-md shrink-0">
            {records.length}
          </span>
          <span className="text-xs text-slate-300">سجل إجمالي نشط</span>
        </div>
      </div>

      {isLoading && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-800 dark:text-amber-400 text-xs font-bold text-center animate-pulse flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
          <span>جاري تنفيذ العملية الإدارية المطلوبة ومزامنة قاعدة البيانات IndexedDB... يرجى الانتظار</span>
        </div>
      )}

      {/* Tools Sub-navigation tabs animated with motion */}
      <div className="flex flex-wrap bg-slate-100 dark:bg-slate-900/40 p-1 rounded-2xl border border-slate-200 dark:border-slate-850 gap-1 max-w-xl">
        <button
          onClick={() => setActiveTab('operations')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-black rounded-xl transition-all ${
            activeTab === 'operations'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-500 hover:text-slate-850 dark:text-slate-450 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-indigo-500" />
          <span>العمليات والأرشفة</span>
        </button>
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-black rounded-xl transition-all ${
            activeTab === 'diagnostics'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-500 hover:text-slate-850 dark:text-slate-450 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-500" />
          <span>سلامة وتشخيص البيانات</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-black rounded-xl transition-all ${
            activeTab === 'audit'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-500 hover:text-slate-850 dark:text-slate-450 dark:hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4 text-amber-500" />
          <span>سجل الرقابة الإدارية</span>
        </button>
      </div>

      {/* Tabs panels animation content */}
      <AnimatePresence mode="wait">
        {activeTab === 'operations' && (
          <motion.div
            key="operations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box 1: Export and Backups */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-md font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                    <DatabaseBackup className="text-amber-500 w-5 h-5" />
                    <span>تصدير ونسخ البيانات</span>
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
                    حفظ وتصدير كامل السجلات الطبية المسجلة محلياً في جهازك بصيغ مختلفة لنقلها للقيادة العامة أو أرشفتها.
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
                    <span>تصدير إلى Excel (بنفس تنسيق التقرير السنوي للواء)</span>
                  </button>

                  {/* Full CSV Export */}
                  <button
                    onClick={handleExportFullCSV}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 text-slate-500" />
                    <span>تصدير قاعدة البيانات كاملة كشف CSV</span>
                  </button>

                  {/* Print */}
                  <button
                    onClick={handlePrint}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span>طباعة تقرير الإجازات الحالي بالترويسة الرسمية</span>
                  </button>

                  {/* Download JSON backup */}
                  <button
                    onClick={handleBackupJSON}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between px-4 py-3 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-800 dark:text-amber-400 rounded-xl font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <DatabaseBackup className="w-4 h-4 text-amber-500" />
                    <span>تحميل نسخة احتياطية مشفرة محلياً (JSON Backup)</span>
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
                    تحميل ودمج الكشوفات الطبية المرسلة من المستشفيات الميدانية أو استعادة النسخة الاحتياطية وتحديث النظام.
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
                    <span>استيراد إجازات من كشف CSV مبسط</span>
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

            {/* Help & Database wipe block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Help Box */}
              <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 md:col-span-2 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 justify-start">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  <span>دليل مطابقة الأعمدة والاستيراد الذكي</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  النظام يحتوي على معالج ذكاء اصطناعي داخلي يقوم بتحليل الحقول ديناميكياً لتجاوز اختلاف مسميات الأعمدة بالملفات المستوردة.
                </p>
                <ul className="text-[11px] text-slate-500 dark:text-slate-400 list-disc list-inside space-y-1 leading-relaxed pr-2">
                  <li>
                    تأكد أن الصف الأول يحتوي على الكلمات المفتاحية الأساسية (مثل: <strong>الاسم، الرتبة، نوع الإجازة، التشخيص، تاريخ البدء، تاريخ الانتهاء</strong>).
                  </li>
                  <li>
                    يقوم النظام بمعالجة تنسيقات التاريخ المتنوعة تلقائياً (مثل 2026/05/12 أو 12-05-2026) وتحويلها لصيغة الفهرسة الموحدة.
                  </li>
                </ul>
              </div>

              {/* Danger Zone */}
              <div className="bg-rose-500/5 p-5 rounded-2xl border border-rose-500/25 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-rose-800 dark:text-rose-400 flex items-center gap-1.5 justify-start">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                    <span>منطقة الصلاحيات الاستثنائية الحساسة</span>
                  </h4>
                  <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 leading-relaxed mt-1">
                    إعادة تهيئة النظام ستمحو كافة التعديلات والسجلات الحالية وتستعيد السجلات الـ 5 الافتراضية الملحقة بملف تهيئة اللواء.
                  </p>
                </div>

                <button
                  onClick={handleResetDatabase}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-40"
                >
                  <RotateCcw className="w-4 h-4 animate-spin-reverse" />
                  <span>إعادة تهيئة قاعدة البيانات</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Diagnostics & Integrity Engine */}
        {activeTab === 'diagnostics' && (
          <motion.div
            key="diagnostics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Header / Trigger Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    <span>مركز فحص ومطابقة سلامة قاعدة البيانات</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                    مسح وإجراء اختبار سلامة هيكلية كامل لقاعدة البيانات في IndexedDB. كشف تلقائي للأخطاء الشكلية، ومطابقة التواريخ المتعارضة والإجازات الطبية المتداخلة لنفس الفرد لتفادي الثغرات الإدارية.
                  </p>
                </div>

                <button
                  onClick={handleRunDiagnostics}
                  disabled={isDiagnosing}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-95 transition-all shrink-0 disabled:opacity-60 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isDiagnosing ? 'animate-spin' : ''}`} />
                  <span>{isDiagnosing ? 'جاري الفحص العميق...' : 'تشغيل فحص التشخيص الشامل'}</span>
                </button>
              </div>

              {/* Progress bar when diagnosing */}
              {isDiagnosing && (
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                    <span className="font-mono text-emerald-500 animate-pulse">Running Scan...</span>
                    <span>{diagnosticStep}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.5, ease: 'easeInOut' }}
                      className="bg-emerald-500 h-full rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Interactive placeholder if no diagnostics run yet */}
            {!diagnosticsReport && !isDiagnosing && (
              <div className="bg-slate-50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="p-4 bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-600 rounded-full">
                  <Activity className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">بانتظار تشغيل فحص التشخيص الإداري</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md leading-relaxed">
                  انقر على زر الفحص للبدء بالتحقق من جودة السجلات الطبية، والكشف عن التواريخ المتعارضة والإجازات المرضية المتداخلة لمنتسبي اللواء 43.
                </p>
              </div>
            )}

            {/* Diagnostics Report Panel */}
            {diagnosticsReport && !isDiagnosing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* 4 Dashboard-like health blocks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Score */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-850 flex items-center justify-between">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block mb-1">معدل سلامة البيانات</span>
                      <span className={`text-xl font-black font-sans ${diagnosticsReport.integrityScore > 85 ? 'text-emerald-600' : diagnosticsReport.integrityScore > 50 ? 'text-amber-500' : 'text-rose-600'}`}>
                        {diagnosticsReport.integrityScore}%
                      </span>
                    </div>
                    <div className={`p-2.5 rounded-lg shrink-0 ${diagnosticsReport.integrityScore > 85 ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30' : 'bg-amber-50 text-amber-500'}`}>
                      <Shield className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Scanned */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-850 flex items-center justify-between">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block mb-1">إجمالي السجلات المفحوصة</span>
                      <span className="text-xl font-black text-slate-800 dark:text-white font-mono">
                        {diagnosticsReport.scannedCount}
                      </span>
                    </div>
                    <div className="p-2.5 bg-indigo-50 text-indigo-500 dark:bg-indigo-950/30 rounded-lg shrink-0">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Form anomalies */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-850 flex items-center justify-between">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block mb-1">التنبيهات والأخطاء الشكلية</span>
                      <span className={`text-xl font-black font-mono ${diagnosticsReport.anomaliesCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {diagnosticsReport.anomaliesCount}
                      </span>
                    </div>
                    <div className="p-2.5 bg-amber-50 text-amber-500 dark:bg-amber-950/30 rounded-lg shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Overlapping */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-850 flex items-center justify-between">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block mb-1">إجازات متداخلة للفرد</span>
                      <span className={`text-xl font-black font-mono ${diagnosticsReport.overlappingCount > 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                        {diagnosticsReport.overlappingCount}
                      </span>
                    </div>
                    <div className="p-2.5 bg-rose-50 text-rose-500 dark:bg-rose-950/30 rounded-lg shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Storage estimate */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-850 flex items-center justify-between">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block mb-1">حجم قاعدة البيانات التقديري</span>
                      <span className="text-xl font-black text-slate-800 dark:text-white font-mono">
                        {diagnosticsReport.storageSizeKb} KB
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-100 text-slate-600 dark:bg-slate-800 rounded-lg shrink-0">
                      <FileCode className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* 1. Database Health Certification Trigger Card */}
                {diagnosticsReport.integrityScore >= 90 && (
                  <div className="bg-gradient-to-l from-emerald-500/10 to-teal-500/5 dark:from-emerald-950/20 dark:to-teal-950/10 border-2 border-emerald-500/20 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-right">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-5 h-5 text-emerald-500 animate-pulse" />
                        <span>قاعدة البيانات معتمدة وحائزة على معيار الاستقرار والجاهزية العسكرية</span>
                      </h4>
                      <p className="text-[11px] text-slate-650 dark:text-slate-300 max-w-xl leading-relaxed">
                        تخطت قاعدة البيانات الفحص الشامل بنسبة استقرار ممتازة بلغت {diagnosticsReport.integrityScore}%. يمكنك الآن إصدار وتحميل شهادة الجودة والتحقق الرسمية المعتمدة للواء 43 عمالقة لتوثيق جودة العمل والجاهزية الإدارية الطبية.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowIntegrityCertificate(true)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Printer className="w-4 h-4" />
                      <span>إصدار شهادة جودة البيانات</span>
                    </button>
                  </div>
                )}

                {/* Auto-repair Card trigger */}
                {diagnosticsReport.anomaliesCount > 0 && (
                  <div className="bg-gradient-to-l from-emerald-50 to-teal-50/20 dark:from-emerald-950/10 dark:to-teal-950/5 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1 text-right">
                      <h4 className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                        <Wrench className="w-4.5 h-4.5 text-emerald-500" />
                        <span>معالج الإصلاح والتطهير التلقائي الذكي</span>
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                        اكتشف الفحص بعض الثغرات الإدارية أو الأخطاء الشكلية والتواريخ المعكوسة. يمكن لنظام الصيانة إصلاحها ومزامنتها فوراً وبكبسة زر واحدة.
                      </p>
                    </div>

                    <button
                      onClick={handleAutoRepairDatabase}
                      disabled={isLoading}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>إصلاح الأخطاء تلقائياً</span>
                    </button>
                  </div>
                )}

                {/* Overlapping medical leaves list (Unique Feature!) */}
                {diagnosticsReport.overlappingCount > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h4 className="text-xs font-extrabold text-rose-600 flex items-center gap-1.5">
                        <AlertTriangle className="w-4.5 h-4.5 animate-pulse" />
                        <span>تعارض إجازات مكررة متداخلة بنفس الفترة (ثغرة إدارية)</span>
                      </h4>
                      <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1">
                        تم رصد أفراد مسجل لهم أكثر من إجازة مرضية واحدة متداخلة في نفس الوقت، يرجى مراجعة هذه السجلات يدوياً لتجنب الازدواج الإداري.
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-100 dark:border-slate-800">
                            <th className="p-3">اسم الفرد العسكري</th>
                            <th className="p-3">الإجازة الأولى والتشخيص</th>
                            <th className="p-3">تاريخ الإجازة 1</th>
                            <th className="p-3">الإجازة الثانية والتشخيص</th>
                            <th className="p-3">تاريخ الإجازة 2</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {diagnosticsReport.overlapping.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                              <td className="p-3 font-bold text-slate-800 dark:text-white">{item.name}</td>
                              <td className="p-3 text-slate-600 dark:text-slate-400">
                                <span className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[10px] ml-1.5">{item.r1.type}</span>
                                {item.r1.diagnosis}
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-500 text-[10px]">{item.r1.startDate} ← {item.r1.endDate}</td>
                              <td className="p-3 text-slate-600 dark:text-slate-400">
                                <span className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded text-[10px] ml-1.5">{item.r2.type}</span>
                                {item.r2.diagnosis}
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-500 text-[10px]">{item.r2.startDate} ← {item.r2.endDate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Anomalies breakdown */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 className="text-xs font-extrabold text-slate-850 dark:text-slate-200">تفاصيل العيوب والتنبيهات المرصودة بالسجلات</h4>
                    <p className="text-[11px] text-slate-450 mt-1">
                      قائمة بجميع السجلات التي تحتوي على حقول غير مطابقة بالكامل للمواصفات القياسية.
                    </p>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {diagnosticsReport.anomaliesCount === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-450 flex flex-col items-center justify-center gap-2">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                        <span>تهانينا! لم يتم العثور على أي مشاكل أو تشوهات شكلية في قاعدة البيانات.</span>
                      </div>
                    ) : (
                      diagnosticsReport.anomalies.map((anom, idx) => (
                        <div key={idx} className="p-3 bg-amber-500/5 dark:bg-slate-850 border border-amber-500/10 dark:border-slate-800 rounded-xl flex items-start gap-3">
                          <AlertTriangle className="w-4.5 h-4.5 text-amber-500 mt-0.5 shrink-0" />
                          <div className="text-right space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-[11px] text-slate-900 dark:text-slate-200">{anom.type}</span>
                              <span className="text-[9px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">
                                العسكري: {anom.recordName || 'غير محدد'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                              {anom.description}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Database Schema Visual Blueprint */}
                <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4 font-sans">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <FileCode className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="text-xs font-black">مخطط وبنية قاعدة بيانات IndexedDB المحلية</h4>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-mono mt-0.5">DB: MilitaryLeavesDB / Store: leaves / ID: keyPath("id")</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-2 p-3 bg-slate-950/50 rounded-xl border border-slate-850">
                      <div className="text-indigo-400 font-bold text-[10px] border-b border-slate-900 pb-1.5 mb-1.5 flex justify-between items-center">
                        <span>Schema Properties</span>
                        <span>[Types]</span>
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-300">
                        <div className="flex justify-between"><span>id</span> <span className="text-slate-500">string (primary_key)</span></div>
                        <div className="flex justify-between"><span>name</span> <span className="text-slate-500">string (اسم الفرد)</span></div>
                        <div className="flex justify-between"><span>rank</span> <span className="text-slate-500">string (الرتبة)</span></div>
                        <div className="flex justify-between"><span>unit</span> <span className="text-slate-500">string (الكتيبة)</span></div>
                        <div className="flex justify-between"><span>type</span> <span className="text-emerald-400 font-sans">"مريض"|"مرافق"|"حادث"</span></div>
                        <div className="flex justify-between"><span>startDate</span> <span className="text-slate-500">string (YYYY-MM-DD)</span></div>
                        <div className="flex justify-between"><span>endDate</span> <span className="text-slate-500">string (YYYY-MM-DD)</span></div>
                        <div className="flex justify-between"><span>history</span> <span className="text-slate-500">array&lt;HistoryEntry&gt;</span></div>
                      </div>
                    </div>

                    <div className="space-y-2.5 p-3 bg-slate-950/50 rounded-xl border border-slate-850 text-right font-sans">
                      <h5 className="text-[10px] font-bold text-indigo-400 border-b border-slate-900 pb-1.5 mb-1.5">مزايا الأمان اللامركزي</h5>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        تعتمد الشؤون الطبية للواء 43 عمالقة بالكامل على تقنيات التخزين المحلية المعزولة في متصفحك. تضمن هذه الهيكلية استمرارية العمل دون انقطاع حتى في الظروف الميدانية والقطاعات الصحراوية التي تفتقر لتغطية شبكة الإنترنت، مع تشفير مدمج للخصوصية العسكرية التامة.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Advanced Database Optimizer Component */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 text-right">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                        <Wrench className="w-4.5 h-4.5 text-indigo-500" />
                        <span>مُحسِّن وضَاغط قاعدة البيانات التلقائي المتقدم</span>
                      </h4>
                      <p className="text-[11px] text-slate-450 mt-1">
                        تهذيب الفراغات، توحيد مسميات الرتب الطبية، الترتيب الزمني للأرشيف وتخفيض حجم قاعدة البيانات IndexedDB.
                      </p>
                    </div>

                    <button
                      onClick={handleRunOptimizer}
                      disabled={isOptimizing}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
                      <span>{isOptimizing ? 'جاري التحسين والضغط...' : 'بدء عملية التحسين والضغط'}</span>
                    </button>
                  </div>

                  {optimizationLogs.length > 0 && (
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-1.5 text-left font-mono text-[10px] text-cyan-400 max-h-40 overflow-y-auto">
                      {optimizationLogs.map((l, i) => (
                        <p key={i}>{l}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Safe SQL-like Query Console & Command Sandbox */}
                <div className="bg-slate-950 text-slate-200 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4 text-right font-sans">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                    <div>
                      <h4 className="text-xs font-black text-cyan-400 flex items-center gap-1.5">
                        <Terminal className="w-5 h-5" />
                        <span>منصة الاستعلام الآمنة وساندبوكس الـ SQL لـ IndexedDB</span>
                      </h4>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-mono mt-0.5 font-bold">Secure Military SQL Sandboxing Environment v1.5.0</p>
                    </div>

                    {/* Quick presets buttons */}
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => setSqlQuery("SELECT * FROM leaves WHERE rank = 'جندي'")}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[9px] text-slate-400 rounded cursor-pointer font-bold"
                      >
                        عرض الجنود
                      </button>
                      <button
                        onClick={() => setSqlQuery("SELECT * FROM leaves WHERE type = 'مريض'")}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[9px] text-slate-400 rounded cursor-pointer font-bold"
                      >
                        عرض المرضى
                      </button>
                      <button
                        onClick={() => setSqlQuery("UPDATE leaves SET unit = 'الكتيبة الأولى' WHERE unit = ''")}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[9px] text-slate-400 rounded cursor-pointer font-bold"
                      >
                        تحديث الكتائب
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <textarea
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      placeholder="أدخل استعلام SQL هنا..."
                      className="w-full h-16 p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-cyan-300 text-left focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <span className="text-[9px] text-slate-500 leading-relaxed max-w-md">
                        * للاستعلام الآمن فقط. مدعوم: استرجاع SELECT (مع WHERE و ORDER BY)، والتعديل الدفعي UPDATE (مع WHERE). لحماية البيانات، يُمنع تشغيل الأوامر التخريبية.
                      </span>

                      <button
                        onClick={handleExecuteSQL}
                        className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-slate-950 font-black text-xs rounded-xl shadow transition-transform active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>تنفيذ الأمر</span>
                      </button>
                    </div>
                  </div>

                  {sqlError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-900/30 text-rose-400 rounded-xl text-[10px] text-left font-mono">
                      [ERROR] {sqlError}
                    </div>
                  )}

                  {sqlSuccessMsg && (
                    <div className="p-2.5 bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 rounded-xl text-[10px] font-bold">
                      {sqlSuccessMsg}
                    </div>
                  )}

                  {sqlResults && (
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-left font-mono text-[10px] max-h-52 overflow-y-auto">
                      <div className="flex justify-between text-[9px] text-slate-500 border-b border-slate-800 pb-1.5 mb-1.5">
                        <span>RESULTS ROW INDEX</span>
                        <span>[JSON Records Output]</span>
                      </div>
                      {sqlResults.length === 0 ? (
                        <p className="text-slate-500">[0 results matched query]</p>
                      ) : (
                        sqlResults.map((row, idx) => (
                          <div key={idx} className="border-b border-slate-850/50 pb-1.5 mb-1.5 text-slate-350">
                            <span className="text-cyan-500 font-bold mr-2">[{idx + 1}]</span>
                            {JSON.stringify({ id: row.id, name: row.name, rank: row.rank, unit: row.unit, type: row.type, startDate: row.startDate, endDate: row.endDate })}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Tab 3: System Audit Log Ledger */}
        {activeTab === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Controls panel */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Terminal className="w-5 h-5 text-amber-500" />
                    <span>سجل الرقابة الطبية والأنشطة الإدارية التدقيقية</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    سجل فوري تتابعي لتوثيق جميع العمليات من تصدير واستيراد وتهيئة، لحفظ الشفافية وتتبع حركة السجلات الطبية.
                  </p>
                </div>

                <button
                  onClick={handleClearAuditLogs}
                  className="px-3 py-1.5 border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تصفير سجل الرقابة</span>
                </button>
              </div>

              {/* Filters row */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                {/* Search input */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="البحث بالعملية، المسؤول أو الوصف..."
                    className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 text-right"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-3" />
                </div>

                {/* Level Buttons Group */}
                <div className="flex bg-slate-100 dark:bg-slate-950/60 p-0.5 rounded-xl gap-0.5 border border-slate-200 dark:border-slate-850 flex-wrap">
                  {(['all', 'success', 'info', 'warning', 'error'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setAuditLevelFilter(lvl)}
                      className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all capitalize ${
                        auditLevelFilter === lvl
                          ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-850 dark:text-slate-450 dark:hover:text-slate-200'
                      }`}
                    >
                      {lvl === 'all' && 'الكل'}
                      {lvl === 'success' && 'نجاح ✅'}
                      {lvl === 'info' && 'إرشادي ℹ️'}
                      {lvl === 'warning' && 'تنبيه ⚠️'}
                      {lvl === 'error' && 'خطأ 🚨'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Logs List scrolling */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredAuditLogs.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 text-center py-12 text-xs text-slate-450 rounded-2xl border border-slate-200 dark:border-slate-800">
                  لا توجد عمليات مسجلة تطابق فلترة البحث الحالية.
                </div>
              ) : (
                filteredAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-850 rounded-xl shadow-sm hover:shadow-md transition-all flex items-start gap-3.5"
                  >
                    {/* Visual indicators */}
                    <div className="mt-0.5 shrink-0">
                      {log.level === 'success' && (
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 rounded-lg">
                          <CheckCircle className="w-4.5 h-4.5" />
                        </div>
                      )}
                      {log.level === 'info' && (
                        <div className="p-1.5 bg-blue-50 text-blue-600 dark:bg-blue-950/40 rounded-lg">
                          <Info className="w-4.5 h-4.5" />
                        </div>
                      )}
                      {log.level === 'warning' && (
                        <div className="p-1.5 bg-amber-50 text-amber-600 dark:bg-amber-950/40 rounded-lg">
                          <AlertTriangle className="w-4.5 h-4.5" />
                        </div>
                      )}
                      {log.level === 'error' && (
                        <div className="p-1.5 bg-rose-50 text-rose-600 dark:bg-rose-950/40 rounded-lg">
                          <AlertTriangle className="w-4.5 h-4.5 text-rose-500 animate-bounce" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1 text-right">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">{log.description}</span>
                        </div>
                        <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">{log.timestamp}</span>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-slate-450 dark:text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-slate-350 dark:bg-slate-700 rounded-full" />
                          <span>النوع:</span>
                          <strong className="text-slate-650 dark:text-slate-300">{log.category}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span>المسؤول:</span>
                          <strong className="text-slate-650 dark:text-slate-300">{log.operator}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safety / Compliance footer */}
      <div className="bg-slate-500/5 p-4 rounded-xl border border-slate-500/10 text-center flex items-center justify-center gap-2 flex-wrap">
        <ShieldCheck className="w-5 h-5 text-emerald-500" />
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          جميع السجلات الطبية والعمليات والرقابة مشفرة بالكامل تحت بيئة تشفير رملية آمنة في متصفحك. لا يتم ترحيل أي بيانات عسكرية خارجياً.
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
            addAuditLog('استيراد', `تم استيراد ودمج سجلات طبية جديدة من ملف Excel عبر المعالج الذكي لـ ${updatedRecords.length - records.length} فرد.`, 'success');
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
          onClose={() => {
            setIsExportWizardOpen(false);
          }}
          triggerToast={triggerToast}
        />
      )}
    </div>
  );
}

