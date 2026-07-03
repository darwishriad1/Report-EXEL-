/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Layers,
  Settings,
  Eye,
  CheckCircle,
  AlertTriangle,
  Trash2,
  HelpCircle,
  Info,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader,
  Sparkles,
  Clock,
  Plus,
  RefreshCw,
  X,
  Stethoscope,
  ChevronDown
} from 'lucide-react';
import { LeaveRecord, HistoryEntry } from '../types';

interface ExcelImportWizardProps {
  file: File;
  existingRecords: LeaveRecord[];
  onClose: () => void;
  onComplete: (newRecords: LeaveRecord[]) => Promise<void>;
  triggerToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

interface ColumnMapping {
  name: number;
  rank: number;
  unit: number;
  type: number;
  diagnosis: number;
  issuer: number;
  startDate: number;
  endDate: number;
  notes: number;
}

interface ParsedRow {
  index: number;
  sheetName: string;
  originalRowNumber: number;
  raw: any[];
  
  // Cleaned / Parsed fields
  name: string;
  rank: string;
  unit: string;
  type: 'مريض' | 'مرافق' | 'مرض قريب' | 'حادث';
  diagnosis: string;
  issuer: string;
  startDate: string;
  endDate: string;
  notes: string;
  tags: string[];

  // Validation & status
  isValid: boolean;
  errors: string[];
  isExtension: boolean;
  extensionLinkedId?: string; // ID of the record it was linked to
  
  // Duplicate detection
  isDuplicate: boolean;
  duplicateType?: 'exact' | 'overlap';
  existingRecordId?: string;
  resolutionStrategy: 'skip' | 'update' | 'add';
}

export default function ExcelImportWizard({
  file,
  existingRecords,
  onClose,
  onComplete,
  triggerToast
}: ExcelImportWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Column headers for each sheet to help mapping
  const [sheetHeaders, setSheetHeaders] = useState<Record<string, { headers: string[]; rIndex: number }>>({});
  // Selected mapping (we use first sheet's map as default, but let user customize)
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: -1,
    rank: -1,
    unit: -1,
    type: -1,
    diagnosis: -1,
    issuer: -1,
    startDate: -1,
    endDate: -1,
    notes: -1
  });

  // Parsed records list
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  
  // Search and filters for Step 3 Preview
  const [filterQuery, setFilterQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'invalid' | 'duplicate' | 'extension'>('all');
  const [previewPage, setPreviewPage] = useState(1);
  const itemsPerPage = 8;

  // Read workbook on load
  useEffect(() => {
    const readWorkbook = async () => {
      try {
        setIsLoading(true);
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        
        // Auto-select sheets that look like monthly logs
        const autoSelected = wb.SheetNames.filter(
          (name) =>
            name.includes('كشف') ||
            name.includes('إجازات') ||
            name.includes('مرضية') ||
            name.includes('شهر') ||
            /^(يناير|فبراير|مارس|أبريل|ابريل|مايو|يونيو|يوليو|أغسطس|اغسطس|سبتمبر|أكتوبر|اكتوبر|نوفمبر|ديسمبر|\d{1,2})/.test(name)
        );
        
        setSelectedSheets(autoSelected.length > 0 ? autoSelected : [wb.SheetNames[0]]);
        
        // Extract headers from sheets
        const headersMap: Record<string, { headers: string[]; rIndex: number }> = {};
        wb.SheetNames.forEach((sheetName) => {
          const sheet = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
          
          // Smart Header finding: Search for first row containing keywords
          let headerRowIndex = 0;
          let bestHeaders: string[] = [];
          let maxMatches = 0;
          
          const keywords = ['اسم', 'رتبة', 'رتبه', 'تشخيص', 'مرض', 'بداية', 'بدء', 'من', 'نهاية', 'انتهاء', 'إلى', 'ملاحظات'];
          
          for (let r = 0; r < Math.min(rows.length, 15); r++) {
            const cells = rows[r]?.map(c => String(c).trim().toLowerCase()) || [];
            const matches = cells.filter(cell => keywords.some(k => cell.includes(k))).length;
            if (matches > maxMatches) {
              maxMatches = matches;
              headerRowIndex = r;
              bestHeaders = rows[r].map(c => String(c).trim());
            }
          }
          
          if (bestHeaders.length === 0 && rows.length > 0) {
            bestHeaders = rows[0].map(c => String(c).trim());
            headerRowIndex = 0;
          }
          
          headersMap[sheetName] = {
            headers: bestHeaders,
            rIndex: headerRowIndex
          };
        });
        
        setSheetHeaders(headersMap);
        
        // Generate automatic mapping from first sheet
        if (wb.SheetNames.length > 0) {
          const firstSheet = wb.SheetNames[0];
          const heads = headersMap[firstSheet]?.headers || [];
          autoMapColumns(heads);
        }
        
        setIsLoading(false);
      } catch (err: any) {
        triggerToast(`خطأ في قراءة ملف Excel: ${err.message}`, 'error');
        onClose();
      }
    };
    
    readWorkbook();
  }, [file]);

  const autoMapColumns = (heads: string[]) => {
    const map: ColumnMapping = {
      name: -1,
      rank: -1,
      unit: -1,
      type: -1,
      diagnosis: -1,
      issuer: -1,
      startDate: -1,
      endDate: -1,
      notes: -1
    };
    
    heads.forEach((h, idx) => {
      const sh = h.toLowerCase();
      if (sh.includes('اسم') || sh.includes('الكامل') || sh.includes('name')) map.name = idx;
      else if (sh.includes('رتبة') || sh.includes('رتبه') || sh.includes('العسكرية') || sh.includes('rank')) map.rank = idx;
      else if (sh.includes('وحدة') || sh.includes('كتيبة') || sh.includes('سرية') || sh.includes('unit')) map.unit = idx;
      else if (sh.includes('نوع') || sh.includes('الحالة') || sh.includes('حالة') || sh.includes('type')) map.type = idx;
      else if (sh.includes('تشخيص') || sh.includes('المرض') || sh.includes('العذر') || sh.includes('diagnosis')) map.diagnosis = idx;
      else if (sh.includes('جهة') || sh.includes('مستشفى') || sh.includes('مصدر') || sh.includes('issuer')) map.issuer = idx;
      else if (sh.includes('بدء') || sh.includes('بداية') || sh.includes('تاريخ البدء') || sh.includes('من') || sh.includes('start')) map.startDate = idx;
      else if (sh.includes('انتهاء') || sh.includes('نهاية') || sh.includes('إلى') || sh.includes('الى') || sh.includes('end')) map.endDate = idx;
      else if (sh.includes('ملاحظة') || sh.includes('ملاحظات') || sh.includes('notes') || sh.includes('بيان')) map.notes = idx;
    });
    
    // Default fallback order if any is unmapped
    if (map.name === -1) map.name = 0;
    if (map.rank === -1) map.rank = 1;
    if (map.unit === -1) map.unit = 2;
    if (map.type === -1) map.type = 3;
    if (map.diagnosis === -1) map.diagnosis = 4;
    if (map.issuer === -1) map.issuer = 5;
    if (map.startDate === -1) map.startDate = 6;
    if (map.endDate === -1) map.endDate = 7;
    if (map.notes === -1) map.notes = 8;
    
    setMapping(map);
  };

  // Gracefully parse dates from string or Excel serial number
  const parseExcelDate = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val).trim();
    if (str === '' || str === '-' || str.includes('تمديد')) return str; // Return literal for extension handling

    // Excel serial date check
    if (!isNaN(Number(str)) && Number(str) > 30000) {
      try {
        const serial = Number(str);
        const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
        return date.toISOString().substring(0, 10);
      } catch (err) {
        // Fall through
      }
    }

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }

    // DD/MM/YYYY or D/M/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
      const parts = str.split('/');
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }

    // DD-MM-YYYY or D-M-YYYY
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
      const parts = str.split('-');
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }

    // Standard parser
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().substring(0, 10);
    }

    return str;
  };

  const normalizeLeaveType = (val: any): LeaveRecord['type'] => {
    const str = String(val).trim().toLowerCase();
    if (['مرافق', 'مرافقة', 'escort', 'عائلية'].includes(str)) return 'مرافق';
    if (['مرض قريب', 'قريب', 'عائلي'].includes(str)) return 'مرض قريب';
    if (['حادث', 'حوادث', 'إصابة', 'اصابة', 'accident'].includes(str)) return 'حادث';
    return 'مريض'; // default fallback
  };

  // Dynamic tags extractor from notes text
  const extractTags = (notes: string, diagnosis: string): string[] => {
    const tags: string[] = [];
    const text = (notes + ' ' + diagnosis).toLowerCase();
    
    if (text.includes('حادث') || text.includes('سيكل') || text.includes('مرور')) tags.push('إصابة حادث');
    if (text.includes('كسر') || text.includes('تجبير') || text.includes('جبيرة')) tags.push('كسور عظام');
    if (text.includes('عملية') || text.includes('جراحة') || text.includes('استئصال')) tags.push('تدخل جراحي');
    if (text.includes('حمى') || text.includes('ضنك') || text.includes('تيفوئيد')) tags.push('حميات موسمية');
    if (text.includes('قلب') || text.includes('قسطرة')) tags.push('أمراض القلب');
    if (text.includes('رئة') || text.includes('تنفس') || text.includes('التهاب رئوي')) tags.push('جهاز تنفسي');
    if (text.includes('عسكري') || text.includes('ميداني')) tags.push('مستشفى ميداني');
    if (text.includes('راحة') || text.includes('سريرية')) tags.push('راحة تامة');

    return tags;
  };

  // Core parsing engine
  const parseSelectedSheetsData = () => {
    if (!workbook) return;
    
    setIsLoading(true);
    const allParsedRows: ParsedRow[] = [];
    let recordIndexCounter = 0;

    selectedSheets.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const headerInfo = sheetHeaders[sheetName] || { headers: [], rIndex: 0 };
      const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
      
      // Start reading rows after the detected header row
      const dataStartRowIndex = headerInfo.rIndex + 1;
      
      for (let r = dataStartRowIndex; r < rawRows.length; r++) {
        const row = rawRows[r];
        // Skip empty rows or rows without names
        if (!row || row.length === 0) continue;
        const rawName = row[mapping.name] ? String(row[mapping.name]).trim() : '';
        if (!rawName || rawName === '' || rawName === 'الاسم' || rawName.includes('إجمالي') || rawName.includes('المجموع')) continue;

        // Extract raw values
        const name = rawName;
        const rank = row[mapping.rank] ? String(row[mapping.rank]).trim() : 'جندي';
        const unit = row[mapping.unit] ? String(row[mapping.unit]).trim() : 'اللواء 43 عمالقة';
        const typeStr = row[mapping.type] ? String(row[mapping.type]).trim() : '';
        const diagnosis = row[mapping.diagnosis] ? String(row[mapping.diagnosis]).trim() : 'تشخيص طبي مستورد';
        const issuer = row[mapping.issuer] ? String(row[mapping.issuer]).trim() : 'جهة غير محددة';
        let rawStart = row[mapping.startDate] ? String(row[mapping.startDate]).trim() : '';
        let rawEnd = row[mapping.endDate] ? String(row[mapping.endDate]).trim() : '';
        const notes = row[mapping.notes] ? String(row[mapping.notes]).trim() : '';

        // Check if leave is an extension ("تمديد" or "-")
        const isExtension = 
          rawStart === 'تمديد' || 
          rawStart === '-' || 
          rawStart === '' || 
          notes.includes('تمديد') || 
          diagnosis.includes('تمديد');

        let startDate = parseExcelDate(rawStart);
        let endDate = parseExcelDate(rawEnd);
        const type = normalizeLeaveType(typeStr || diagnosis);
        const tags = extractTags(notes, diagnosis);

        const errors: string[] = [];
        let linkedId: string | undefined;

        // Resolve leaves extensions (التمديد)
        if (isExtension) {
          // Look back in the current parsed rows for the same person
          const previousImported = [...allParsedRows].reverse().find(pr => pr.name === name);
          if (previousImported) {
            startDate = previousImported.endDate; // Starts where previous leave ended
            linkedId = previousImported.index.toString();
          } else {
            // Check existing DB records for same name
            const previousInDB = [...existingRecords]
              .sort((a, b) => b.endDate.localeCompare(a.endDate))
              .find(rec => rec.name === name);

            if (previousInDB) {
              startDate = previousInDB.endDate;
              linkedId = previousInDB.id;
            } else {
              errors.push('تم التعرف على السجل كتمديد، لكن لم يتم العثور على إجازة سابقة مطابقة لهذا العسكري.');
              startDate = ''; // must be supplied
            }
          }
        }

        // Validate mandatory fields
        if (!name) errors.push('حقل الاسم فارغ.');
        if (!diagnosis) errors.push('التشخيص الطبي فارغ.');
        if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) errors.push(`تاريخ البدء غير صالح: ${rawStart || 'فارغ'}`);
        if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) errors.push(`تاريخ الانتهاء غير صالح: ${rawEnd || 'فارغ'}`);
        
        // Date chronological order check
        if (startDate && endDate && startDate > endDate) {
          errors.push(`تاريخ البدء (${startDate}) لا يمكن أن يكون بعد تاريخ الانتهاء (${endDate}).`);
        }

        // Duplicate detection logic against existing DB
        let isDuplicate = false;
        let duplicateType: 'exact' | 'overlap' | undefined;
        let existingId: string | undefined;

        const matchedRecord = existingRecords.find(rec => rec.name === name);
        if (matchedRecord) {
          // If name + dates overlap or exact
          if (matchedRecord.startDate === startDate && matchedRecord.endDate === endDate) {
            isDuplicate = true;
            duplicateType = 'exact';
            existingId = matchedRecord.id;
          } else if (
            (startDate >= matchedRecord.startDate && startDate <= matchedRecord.endDate) ||
            (endDate >= matchedRecord.startDate && endDate <= matchedRecord.endDate) ||
            (startDate <= matchedRecord.startDate && endDate >= matchedRecord.endDate)
          ) {
            isDuplicate = true;
            duplicateType = 'overlap';
            existingId = matchedRecord.id;
          }
        }

        allParsedRows.push({
          index: recordIndexCounter++,
          sheetName,
          originalRowNumber: r + 1,
          raw: row,
          name,
          rank,
          unit,
          type,
          diagnosis,
          issuer,
          startDate,
          endDate,
          notes,
          tags,
          isValid: errors.length === 0,
          errors,
          isExtension,
          extensionLinkedId: linkedId,
          isDuplicate,
          duplicateType,
          existingRecordId: existingId,
          resolutionStrategy: isDuplicate ? 'skip' : 'add'
        });
      }
    });

    setParsedRows(allParsedRows);
    setIsLoading(false);
    setCurrentStep(3); // Go to preview directly
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (selectedSheets.length === 0) {
        triggerToast('الرجاء اختيار ورقة عمل واحدة على الأقل للاستيراد منها', 'error');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Execute the parsing with the active mapping
      parseSelectedSheetsData();
    } else if (currentStep === 3) {
      // Go to final summary confirmation
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) setCurrentStep(1);
    else if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 4) setCurrentStep(3);
  };

  // Toggle sheet selection
  const handleToggleSheet = (sheetName: string) => {
    if (selectedSheets.includes(sheetName)) {
      setSelectedSheets(selectedSheets.filter((s) => s !== sheetName));
    } else {
      setSelectedSheets([...selectedSheets, sheetName]);
    }
  };

  // Modify individual row inline in the preview (Step 3) to fix errors manually
  const handleUpdateParsedRow = (index: number, fields: Partial<ParsedRow>) => {
    setParsedRows(prev => prev.map(row => {
      if (row.index !== index) return row;
      
      const updated = { ...row, ...fields };
      // Re-validate fields
      const errors: string[] = [];
      if (!updated.name) errors.push('حقل الاسم فارغ.');
      if (!updated.diagnosis) errors.push('التشخيص الطبي فارغ.');
      if (!updated.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(updated.startDate)) {
        errors.push(`تاريخ البدء غير صالح.`);
      }
      if (!updated.endDate || !/^\d{4}-\d{2}-\d{2}$/.test(updated.endDate)) {
        errors.push(`تاريخ الانتهاء غير صالح.`);
      }
      if (updated.startDate && updated.endDate && updated.startDate > updated.endDate) {
        errors.push(`تاريخ البدء لا يمكن أن يكون بعد تاريخ الانتهاء.`);
      }

      updated.isValid = errors.length === 0;
      updated.errors = errors;
      return updated;
    }));
  };

  // Toggle strategy for all duplicates at once
  const handleSetGlobalDuplicateStrategy = (strategy: 'skip' | 'update' | 'add') => {
    setParsedRows(prev => prev.map(row => {
      if (row.isDuplicate) {
        return { ...row, resolutionStrategy: strategy };
      }
      return row;
    }));
    triggerToast(`تم تحويل معالجة كافة التكرارات المكتشفة إلى: ${
      strategy === 'skip' ? 'تخطي الاستيراد' : strategy === 'update' ? 'تحديث البيانات' : 'استيراد كنسخة جديدة'
    }`, 'info');
  };

  // Execute the import and write to IndexedDB!
  const handleExecuteImport = async () => {
    try {
      setIsLoading(true);
      const toAdd: LeaveRecord[] = [];
      const toUpdate: LeaveRecord[] = [];
      const toSkip: ParsedRow[] = [];

      parsedRows.forEach((row) => {
        if (!row.isValid) {
          // Can't import invalid rows
          return;
        }

        const leaveItem: LeaveRecord = {
          id: row.existingRecordId && row.resolutionStrategy === 'update' 
            ? row.existingRecordId 
            : `rec_xls_${Math.random().toString(36).substring(2, 11)}`,
          name: row.name,
          rank: row.rank,
          unit: row.unit,
          type: row.type,
          diagnosis: row.diagnosis,
          issuer: row.issuer,
          startDate: row.startDate,
          endDate: row.endDate,
          notes: row.notes || (row.isExtension ? 'تمديد تلقائي لإجازة سابقة' : ''),
          history: [
            {
              date: new Date().toLocaleString('ar-YE', { hour12: false }),
              action: row.existingRecordId && row.resolutionStrategy === 'update' ? 'تعديل' : 'إنشاء',
              details: `تم الاستيراد والمزامنة عبر ملف Excel: ورقة [${row.sheetName}]، صف [${row.originalRowNumber}].`
            }
          ]
        };

        if (row.isDuplicate) {
          if (row.resolutionStrategy === 'skip') {
            toSkip.push(row);
          } else if (row.resolutionStrategy === 'update') {
            toUpdate.push(leaveItem);
          } else {
            toAdd.push(leaveItem);
          }
        } else {
          toAdd.push(leaveItem);
        }
      });

      // Construct final record list
      let finalRecordsList = [...existingRecords];

      // Process Updates
      toUpdate.forEach((updatedItem) => {
        const idx = finalRecordsList.findIndex(r => r.id === updatedItem.id);
        if (idx !== -1) {
          // Retain historical elements of existing record and append new entry
          const prevHistory = finalRecordsList[idx].history || [];
          updatedItem.history = [
            ...prevHistory,
            {
              date: new Date().toLocaleString('ar-YE', { hour12: false }),
              action: 'تعديل',
              details: 'تم تحديث السجل واستبداله بالكامل عبر مستورد ملفات Excel الذكي.'
            }
          ];
          finalRecordsList[idx] = updatedItem;
        }
      });

      // Process Adds
      finalRecordsList = [...finalRecordsList, ...toAdd];

      // Save database through parent
      await onComplete(finalRecordsList);
      
      triggerToast(`تمت عملية الاستيراد بنجاح! السجلات المستوردة: ${toAdd.length}، تم تحديثها: ${toUpdate.length}، تم تخطيها: ${toSkip.length} سجلات مكررة.`, 'success');
      onClose();
    } catch (err: any) {
      triggerToast(`فشل أثناء كتابة البيانات المستوردة: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter parsed rows for Step 3 Preview table
  const filteredParsedRows = parsedRows.filter((row) => {
    const matchesSearch = 
      row.name.includes(filterQuery) || 
      row.diagnosis.includes(filterQuery) || 
      row.sheetName.includes(filterQuery);

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    if (filterStatus === 'valid') return row.isValid;
    if (filterStatus === 'invalid') return !row.isValid;
    if (filterStatus === 'duplicate') return row.isDuplicate;
    if (filterStatus === 'extension') return row.isExtension;

    return true;
  });

  const totalFilteredPages = Math.ceil(filteredParsedRows.length / itemsPerPage);
  const paginatedPreviewRows = filteredParsedRows.slice(
    (previewPage - 1) * itemsPerPage,
    previewPage * itemsPerPage
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto text-right font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              <FileSpreadsheet className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm md:text-base">معالج استيراد ملفات Excel الذكي</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Indicator Bar */}
        <div className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80 px-6 py-3.5 flex items-center justify-between flex-wrap gap-2 select-none">
          {[
            { step: 1, label: 'أوراق العمل', desc: 'تحديد الشيتات', icon: Layers },
            { step: 2, label: 'تخطيط الأعمدة', desc: 'مطابقة البيانات', icon: Settings },
            { step: 3, label: 'الفحص والمعاينة', desc: 'تصحيح وفلترة', icon: Eye },
            { step: 4, label: 'التقرير والاعتماد', desc: 'إتمام الحفظ المباشر', icon: CheckCircle }
          ].map((s) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.step;
            const isActive = currentStep === s.step;
            
            return (
              <div key={s.step} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-sans text-xs border transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                      : isActive
                      ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                      : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-750 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4.5 h-4.5 stroke-[3px]" /> : s.step}
                </div>
                <div className="hidden sm:block text-right">
                  <p className={`text-xs font-bold leading-none ${isActive ? 'text-amber-500' : isCompleted ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {s.label}
                  </p>
                  <span className="text-[9px] text-slate-400 block mt-0.5">{s.desc}</span>
                </div>
                {s.step < 4 && (
                  <div className="hidden md:block w-8 h-px bg-slate-200 dark:bg-slate-800 mx-1.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Loading Spinner Overlays */}
        {isLoading ? (
          <div className="flex-1 p-16 flex flex-col items-center justify-center gap-4">
            <Loader className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 animate-pulse">
              جاري تحليل ومعالجة ملف Excel وتدقيق السجلات... يرجى الانتظار
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
            {/* STEP 1: SHEET SELECTION */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-800 dark:text-amber-400 mb-1">استيراد متعدد الشيتات (الأوراق)</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      يحتوي ملف Excel المرفق على أوراق متعددة. يمثل كل شيت كشف إجازات شهرياً. تم اختيار الشيتات التي تحتوي على كشوفات اللواء تلقائياً، ويمكنك تعديل الاختيار أدناه:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sheetNames.map((sheetName) => {
                    const isSelected = selectedSheets.includes(sheetName);
                    const isRecommended = sheetHeaders[sheetName]?.headers.length > 3;
                    
                    return (
                      <div
                        key={sheetName}
                        onClick={() => handleToggleSheet(sheetName)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/5 border-amber-500 dark:border-amber-500/30 text-amber-900 dark:text-amber-400'
                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl border ${
                            isSelected ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-100 dark:bg-slate-800 border-slate-250 dark:border-slate-700 text-slate-500'
                          }`}>
                            <Layers className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-normal">{sheetName}</p>
                            <span className="text-[9px] text-slate-400 block mt-0.5">
                              {sheetHeaders[sheetName]?.headers.length || 0} عمود مكتشف في الصف {sheetHeaders[sheetName]?.rIndex + 1 || 1}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isRecommended && (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">
                              جدول مطابق
                            </span>
                          )}
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isSelected ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-300 dark:border-slate-700'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: COLUMN MAPPING */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-extrabold text-indigo-800 dark:text-indigo-400 mb-1">مطابقة وهندسة الأعمدة الفنية</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      قام معالج الاستيراد بمطابقة أعمدة الجدول تلقائياً بذكاء مع حقول قاعدة البيانات. يرجى مراجعة المطابقة وتغيير الخيارات إذا كانت هناك أعمدة مخصصة في ملفك لحفظ الهيكل:
                    </p>
                  </div>
                </div>

                {/* Grid of database fields and Excel headers selection */}
                <div className="bg-slate-50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                      { field: 'name', label: 'الاسم الكامل للعسكري', required: true, icon: CheckCircle },
                      { field: 'rank', label: 'الرتبة العسكرية', required: false, icon: Settings },
                      { field: 'unit', label: 'الوحدة / الكتيبة / السرية', required: false, icon: Layers },
                      { field: 'type', label: 'نوع الإجازة (مرضية/مرافق...)', required: false, icon: HelpCircle },
                      { field: 'diagnosis', label: 'التشخيص الطبي للحالة', required: true, icon: Stethoscope },
                      { field: 'issuer', label: 'جهة الإصدار (المستشفى)', required: false, icon: CheckCircle },
                      { field: 'startDate', label: 'تاريخ بداية الإجازة', required: true, icon: Calendar },
                      { field: 'endDate', label: 'تاريخ انتهاء الإجازة', required: true, icon: Calendar },
                      { field: 'notes', label: 'ملاحظات إضافية', required: false, icon: Info }
                    ].map((f) => {
                      const fieldKey = f.field as keyof ColumnMapping;
                      const selectedVal = mapping[fieldKey];
                      const firstSheet = selectedSheets[0] || sheetNames[0];
                      const sheetHeads = sheetHeaders[firstSheet]?.headers || [];
                      
                      return (
                        <div key={f.field} className="space-y-1.5 text-right">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-start gap-1">
                            <span>{f.label}</span>
                            {f.required && <span className="text-rose-500 font-sans">*</span>}
                          </label>
                          <div className="relative">
                            <select
                              value={selectedVal}
                              onChange={(e) => setMapping({ ...mapping, [fieldKey]: Number(e.target.value) })}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 font-sans appearance-none cursor-pointer"
                            >
                              <option value={-1}>-- لا توجد مطابقة / حقل افتراضي --</option>
                              {sheetHeads.map((headName, hIdx) => (
                                <option key={hIdx} value={hIdx}>
                                  العمود {String.fromCharCode(65 + hIdx)} ({headName || 'فارغ'})
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PREVIEW, VERIFICATION AND DUPLICATE STRATEGY */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Statistics panel in step 3 */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 text-center">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">إجمالي المقروء</span>
                    <span className="text-lg font-black font-sans text-slate-900 dark:text-white mt-1 block">
                      {parsedRows.length} <span className="text-xs font-normal text-slate-500">أفراد</span>
                    </span>
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl text-center">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">سليم وجاهز</span>
                    <span className="text-lg font-black font-sans text-emerald-600 dark:text-emerald-400 mt-1 block">
                      {parsedRows.filter(r => r.isValid && !r.isDuplicate).length}
                    </span>
                  </div>

                  <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-2xl text-center">
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 block">أخطاء التنسيق</span>
                    <span className="text-lg font-black font-sans text-rose-600 dark:text-rose-400 mt-1 block">
                      {parsedRows.filter(r => !r.isValid).length}
                    </span>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-2xl text-center">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 block">تكرار محتمل</span>
                    <span className="text-lg font-black font-sans text-amber-600 dark:text-amber-400 mt-1 block">
                      {parsedRows.filter(r => r.isValid && r.isDuplicate).length}
                    </span>
                  </div>

                  <div className="bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-2xl text-center col-span-2 md:col-span-1">
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block">تمديد الإجازة</span>
                    <span className="text-lg font-black font-sans text-indigo-600 dark:text-indigo-400 mt-1 block">
                      {parsedRows.filter(r => r.isExtension).length}
                    </span>
                  </div>
                </div>

                {/* Filter and search bar for preview */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-200/55 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="البحث بالاسم أو المرض..."
                      value={filterQuery}
                      onChange={(e) => { setFilterQuery(e.target.value); setPreviewPage(1); }}
                      className="w-full md:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/25"
                    />
                    <select
                      value={filterStatus}
                      onChange={(e) => { setFilterStatus(e.target.value as any); setPreviewPage(1); }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/25"
                    >
                      <option value="all">كل الحالات المستخرجة</option>
                      <option value="valid">السليمة وجاهزة للحفظ</option>
                      <option value="invalid">التي تحتوي على أخطاء</option>
                      <option value="duplicate">حالات مكررة بالقاعدة</option>
                      <option value="extension">حالات تمديد الإجازة</option>
                    </select>
                  </div>

                  {/* Batch duplicates policy */}
                  {parsedRows.some(r => r.isDuplicate) && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400">قرار معالجة التكرارات الجماعية:</span>
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 flex">
                        <button
                          onClick={() => handleSetGlobalDuplicateStrategy('skip')}
                          className="px-2.5 py-1 rounded text-[10px] font-bold transition-all hover:bg-white dark:hover:bg-slate-700 cursor-pointer text-rose-500"
                        >
                          تخطي الكل
                        </button>
                        <button
                          onClick={() => handleSetGlobalDuplicateStrategy('update')}
                          className="px-2.5 py-1 rounded text-[10px] font-bold transition-all hover:bg-white dark:hover:bg-slate-700 cursor-pointer text-amber-500"
                        >
                          تحديث الكل
                        </button>
                        <button
                          onClick={() => handleSetGlobalDuplicateStrategy('add')}
                          className="px-2.5 py-1 rounded text-[10px] font-bold transition-all hover:bg-white dark:hover:bg-slate-700 cursor-pointer text-indigo-500"
                        >
                          استيراد كنسخ
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                          <th className="px-4 py-3 w-12 text-center">الصف</th>
                          <th className="px-4 py-3">الاسم والوحدة</th>
                          <th className="px-4 py-3">تاريخ الإجازة ومؤشر تمديد</th>
                          <th className="px-4 py-3">التشخيص واستخراج Tags</th>
                          <th className="px-4 py-3">التدقيق والتكرار</th>
                          <th className="px-4 py-3 w-36">الإجراء المعتمد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {paginatedPreviewRows.length > 0 ? (
                          paginatedPreviewRows.map((row) => {
                            const isDuplicate = row.isDuplicate;
                            const isError = !row.isValid;
                            
                            return (
                              <tr
                                key={row.index}
                                className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${
                                  isError ? 'bg-rose-500/5' : isDuplicate ? 'bg-amber-500/5' : ''
                                }`}
                              >
                                <td className="px-4 py-3.5 text-center font-mono text-slate-400">{row.originalRowNumber}</td>
                                <td className="px-4 py-3.5">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold">
                                        {row.rank}
                                      </span>
                                      <span className="font-bold text-slate-900 dark:text-white">
                                        {row.name}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">{row.unit}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="font-mono">
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-400 text-[10px]">من:</span>
                                      <input
                                        type="date"
                                        value={row.startDate}
                                        onChange={(e) => handleUpdateParsedRow(row.index, { startDate: e.target.value })}
                                        className="bg-transparent border border-slate-200 dark:border-slate-800 focus:border-amber-500 rounded px-1 text-[11px] font-sans text-slate-700 dark:text-slate-300"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-slate-400 text-[10px]">إلى:</span>
                                      <input
                                        type="date"
                                        value={row.endDate}
                                        onChange={(e) => handleUpdateParsedRow(row.index, { endDate: e.target.value })}
                                        className="bg-transparent border border-slate-200 dark:border-slate-800 focus:border-amber-500 rounded px-1 text-[11px] font-sans text-slate-700 dark:text-slate-300"
                                      />
                                    </div>
                                    {row.isExtension && (
                                      <span className="inline-flex items-center gap-1 mt-1 text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold">
                                        <Clock className="w-2.5 h-2.5 animate-pulse" />
                                        <span>تمديد تلقائي</span>
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200 leading-snug">{row.diagnosis}</p>
                                    <p className="text-[10px] text-slate-400 block mt-0.5">الجهة: {row.issuer}</p>
                                    {/* extracted tags */}
                                    {row.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {row.tags.map(tag => (
                                          <span key={tag} className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded font-bold">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5">
                                  {isError ? (
                                    <div className="text-rose-500 font-bold flex flex-col gap-1">
                                      {row.errors.map((e, idx) => (
                                        <span key={idx} className="flex items-center gap-1 text-[10px]">
                                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                          {e}
                                        </span>
                                      ))}
                                    </div>
                                  ) : isDuplicate ? (
                                    <div className="text-amber-500 flex flex-col gap-0.5">
                                      <span className="flex items-center gap-1 text-[10px] font-bold">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        تكرار {row.duplicateType === 'exact' ? 'مطابق تماماً' : 'متداخل بالتاريخ'}
                                      </span>
                                      <span className="text-[9px] text-slate-400">موجود بالقاعدة</span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-emerald-500 font-bold text-[10px]">
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      سليم وجاهز
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5">
                                  {isError ? (
                                    <span className="text-rose-400 text-[10px] italic">قم بتصحيح التواريخ للتمكين</span>
                                  ) : isDuplicate ? (
                                    <div className="relative">
                                      <select
                                        value={row.resolutionStrategy}
                                        onChange={(e) => handleUpdateParsedRow(row.index, { resolutionStrategy: e.target.value as any })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                                      >
                                        <option value="skip">تخطي (Skip)</option>
                                        <option value="update">تحديث (Update)</option>
                                        <option value="add">إضافة نسخة جديدة</option>
                                      </select>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">سيتم الاستيراد كجديد</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500 font-bold">
                              لم يتم العثور على أي سجلات مطابقة للفلترة الحالية.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination inside Step 3 */}
                  {totalFilteredPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                      <span>أظهر {paginatedPreviewRows.length} من {filteredParsedRows.length} سجلات مفلترة</span>
                      <div className="flex items-center gap-1">
                        <button
                          disabled={previewPage === 1}
                          onClick={() => setPreviewPage(prev => Math.max(1, prev - 1))}
                          className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                        >
                          السابق
                        </button>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 px-2">{previewPage} / {totalFilteredPages}</span>
                        <button
                          disabled={previewPage === totalFilteredPages}
                          onClick={() => setPreviewPage(prev => Math.min(totalFilteredPages, prev + 1))}
                          className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                        >
                          التالي
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: SUMMARY & FINAL EXECUTION REPORT */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-3xl text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-500/15 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-extrabold text-emerald-800 dark:text-emerald-400">جاهز لحفظ ومزامنة السجلات!</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    تمت معالجة كافة السجلات الطبية بنجاح وتدقيق تكراراتها وتمديداتها وتصفيتها بالكامل. انقر على "إتمام الاستيراد النهائي" لإضافتها فوراً لقاعدة البيانات المركزية الآمنة.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">تقرير إجمالي النتائج:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">سجلات سيتم استيرادها كجديد</span>
                      <span className="text-2xl font-black font-sans text-emerald-500 mt-1 block">
                        {parsedRows.filter(r => r.isValid && (!r.isDuplicate || r.resolutionStrategy === 'add')).length}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">سجلات مكررة سيتم تحديثها</span>
                      <span className="text-2xl font-black font-sans text-amber-500 mt-1 block">
                        {parsedRows.filter(r => r.isValid && r.isDuplicate && r.resolutionStrategy === 'update').length}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">سجلات سيتم تخطيها بالكامل</span>
                      <span className="text-2xl font-black font-sans text-slate-400 mt-1 block">
                        {parsedRows.filter(r => !r.isValid || (r.isDuplicate && r.resolutionStrategy === 'skip')).length}
                      </span>
                    </div>
                  </div>

                  {/* Audit information */}
                  <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl text-right space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans border border-slate-200/40 dark:border-slate-800/50">
                    <p className="font-bold text-slate-800 dark:text-slate-300">سجل التدقيق والمصادر (Audit Trail Log):</p>
                    <ul className="list-disc list-inside pr-1 space-y-1">
                      <li>تاريخ الاستيراد: {new Date().toLocaleString('ar-YE', { hour12: false })}</li>
                      <li>اسم الملف المصدر: {file.name}</li>
                      <li>الجهة المعنية: قيادة اللواء 43 عمالقة</li>
                      <li>ملاحظة: سيتم دمج البيانات الجديدة والتواريخ مع الحفاظ على الأرشفة والسير التاريخي لكافة العمليات المحلية.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            إلغاء المعالج
          </button>
          
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                onClick={handlePrevStep}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
            )}

            {currentStep < 4 ? (
              <button
                onClick={handleNextStep}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/10 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>المتابعة للمرحلة التالية</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleExecuteImport}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4.5 h-4.5" />
                <span>إتمام الاستيراد النهائي وقيد البيانات</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
