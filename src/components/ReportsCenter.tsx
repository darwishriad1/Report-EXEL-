/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import XLSX from 'xlsx-js-style';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  CalendarRange,
  Users,
  Activity,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  Building,
  UserCheck,
  TrendingUp,
  FileCheck2,
  Calendar,
  Layers,
  MapPin,
  X,
  Search,
  Maximize2,
  Minimize2,
  Trash2
} from 'lucide-react';
import { LeaveRecord } from '../types';
import DeleteConfirmModal from './DeleteConfirmModal';

interface ReportsCenterProps {
  records: LeaveRecord[];
  onDelete?: (id: string) => Promise<void>;
  triggerToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

type ReportType = 'summary' | 'monthly' | 'custom_ledger' | 'compliance' | 'medical' | 'readiness';

const getSeasonalInfo = (monthStr: string) => {
  const m = parseInt(monthStr, 10);
  if (m >= 5 && m <= 9) {
    return {
      title: 'موسم الصيف والارتفاع الحراري الميداني',
      desc: 'ارتفاع احتمالية ضربات الشمس الحادة والجفاف، مع انتشار النزلات المعوية الحادة والتهاب الكبد الوبائي الفيروسي المنقول بالمياه الملوثة.',
      actions: [
        'تأمين مياه شرب معقمة ومبردة لكافة المربعات الميدانية وسرايا الحراسة.',
        'إلزام الوحدات التدريبية بفترات راحة مظللة وتجنب التدريب المكثف تحت أشعة الشمس المباشرة (من 11 ظهراً إلى 3 عصراً).',
        'توزيع مغذيات الجفاف الوقائية (ORS) وأدوية التهابات الجهاز الهضمي على النقاط البعيدة.'
      ],
      alertColor: 'border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-400'
    };
  } else if (m === 12 || m === 1 || m === 2) {
    return {
      title: 'موسم الشتاء وموجات الصقيع الجبلية',
      desc: 'نشاط فيروسي حاد للجهاز التنفسي، مع مخاطر انتشار التهابات الرئة الحادة ونزلات البرد وتأثيرها المباشر على اللياقة القتالية.',
      actions: [
        'توفير معاطف شتوية ووقاية حرارية كافية في نقاط المراقبة الجبلية المرتفعة.',
        'توفير لقاح الإنفلونزا الموسمية وحقن الفيتامينات الوقائية للطاقم الميداني والخدمي.',
        'عزل فوري لأي منتسب تظهر عليه أعراض سعال حاد أو ارتفاع بالحرارة في مهجع طبي مستقل لمنع تفشي العدوى.'
      ],
      alertColor: 'border-blue-500/20 bg-blue-500/5 text-blue-800 dark:text-blue-400'
    };
  } else {
    return {
      title: 'الفترة الانتقالية - استقرار مناخي معتدل',
      desc: 'موسم انتقالي معتدل صحياً، يستدعي استمرار الوقاية العامة ومراقبة الأمراض المزمنة وصيانة اللياقة البدنية.',
      actions: [
        'إجراء الفحوصات الطبية الدورية للضغط والسكري ومؤشرات اللياقة العامة.',
        'التركيز على نظافة غرف الطعام والمطابخ العسكرية لضمان عدم تفشي أمراض التسمم الغذائي.',
        'متابعة الحالات الطبية السابقة التي عادت من الإجازات المرضية للتأكد من تعافيها بالكامل.'
      ],
      alertColor: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400'
    };
  }
};

export default function ReportsCenter({ records, onDelete, triggerToast }: ReportsCenterProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<LeaveRecord | null>(null);

  const handleDeleteRecord = async (record: LeaveRecord) => {
    if (!onDelete) return;
    setRecordToDelete(record);
    setDeleteModalOpen(true);
  };

  const executeDeleteRecord = async () => {
    if (!onDelete || !recordToDelete) return;
    try {
      await onDelete(recordToDelete.id);
      triggerToast('تم حذف السجل بنجاح من سجلات السيطرة', 'success');
    } catch (err) {
      triggerToast('حدث خطأ أثناء محاولة حذف السجل العسكري', 'error');
    }
  };

  const [activeReport, setActiveReport] = useState<ReportType>('summary');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isMonthlyFullScreen, setIsMonthlyFullScreen] = useState(false);
  const [monthlySearchQuery, setMonthlySearchQuery] = useState('');
  
  // Custom states for Monthly Report
  const [selectedReportYear, setSelectedReportYear] = useState<string>('2026');
  const [selectedReportMonth, setSelectedReportMonth] = useState<string>('07');

  // Advanced Interactive states for Monthly Report
  const [monthlyTableSearch, setMonthlyTableSearch] = useState<string>('');
  const [monthlyTypeFilter, setMonthlyTypeFilter] = useState<string>('all');
  const [monthlyStatusFilter, setMonthlyStatusFilter] = useState<string>('all');
  const [monthlyNotesInput, setMonthlyNotesInput] = useState<string>('');

  React.useEffect(() => {
    try {
      const key = `monthly_notes_${selectedReportYear}_${selectedReportMonth}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setMonthlyNotesInput(saved);
      } else {
        const m = parseInt(selectedReportMonth, 10);
        let defaultNote = '';
        if (m >= 5 && m <= 9) {
          defaultNote = 'نظراً لارتفاع درجات الحرارة في فصل الصيف، يوصى برفع جاهزية الطاقم الطبي للتعامل مع حالات ضربات الشمس والنزلات المعوية، وتأمين مخزون إضافي من محاليل الجفاف والأدوية الأساسية بمعسكر اللواء.';
        } else if (m === 12 || m === 1 || m === 2) {
          defaultNote = 'نظراً للأجواء الشتوية الباردة، يوصى بتأمين الملابس الدافئة ومراقبة أي أعراض لنزلات البرد الحادة والتهابات الرئة وتطعيم الأفراد المعرضين للخطر باللقاحات الوقائية اللازمة.';
        } else {
          defaultNote = 'الوضع الميداني والصحي لمنتسبي اللواء مستقر ومطمئن. يوصى بمتابعة فحوصات اللياقة البدنية والضغط الدورية والتأكد من التزام العائدين من الإجازات بالتوجيهات والمهام الموكلة إليهم.';
        }
        setMonthlyNotesInput(defaultNote);
      }
    } catch (e) {
      console.error('Error loading monthly notes from localStorage:', e);
    }
  }, [selectedReportYear, selectedReportMonth]);

  // Custom Filters for 'custom_ledger' and other reports
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedRank, setSelectedRank] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // States for readiness forecasting and simulation
  const [totalPersonnel, setTotalPersonnel] = useState<number>(1200);
  const [dangerThreshold, setDangerThreshold] = useState<number>(85);

  // Extract unique Units and Ranks for filter dropdowns
  const uniqueUnits = useMemo(() => {
    const units = records.map(r => r.unit || 'اللواء 43 عمالقة');
    return ['all', ...Array.from(new Set(units))];
  }, [records]);

  const uniqueRanks = useMemo(() => {
    const ranks = records.map(r => r.rank);
    return ['all', ...Array.from(new Set(ranks))];
  }, [records]);

  // Compute stats on filtered or all records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Unit Filter
      const rUnit = r.unit || 'اللواء 43 عمالقة';
      if (selectedUnit !== 'all' && rUnit !== selectedUnit) return false;
      
      // Rank Filter
      if (selectedRank !== 'all' && r.rank !== selectedRank) return false;
      
      // Type Filter
      if (selectedType !== 'all' && r.type !== selectedType) return false;
      
      // Status Filter
      const rStatus = r.contactStatus || 'pending';
      if (selectedStatus !== 'all' && rStatus !== selectedStatus) return false;
      
      // Start Date Filter
      if (startDate && r.startDate < startDate) return false;
      
      // End Date Filter
      if (endDate && r.endDate > endDate) return false;
      
      return true;
    });
  }, [records, selectedUnit, selectedRank, selectedType, selectedStatus, startDate, endDate]);

  // Compute monthly records based on selected report month/year
  const monthlyFilteredRecords = useMemo(() => {
    return records.filter(r => {
      const prefix = `${selectedReportYear}-${selectedReportMonth}`;
      return r.startDate.startsWith(prefix);
    });
  }, [records, selectedReportYear, selectedReportMonth]);

  // Compute average duration of leaves for selected month
  const averageMonthlyDuration = useMemo(() => {
    if (monthlyFilteredRecords.length === 0) return 0;
    const totalDays = monthlyFilteredRecords.reduce((acc, r) => {
      const start = new Date(r.startDate).getTime();
      const end = new Date(r.endDate).getTime();
      return acc + Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    }, 0);
    return Math.round(totalDays / monthlyFilteredRecords.length);
  }, [monthlyFilteredRecords]);

  // Compute total monthly leave days
  const totalMonthlyDays = useMemo(() => {
    return monthlyFilteredRecords.reduce((acc, r) => {
      const start = new Date(r.startDate).getTime();
      const end = new Date(r.endDate).getTime();
      return acc + Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    }, 0);
  }, [monthlyFilteredRecords]);

  // Filter monthly records by search query for full screen view
  const searchedMonthlyRecords = useMemo(() => {
    if (!monthlySearchQuery.trim()) return monthlyFilteredRecords;
    const q = monthlySearchQuery.toLowerCase();
    return monthlyFilteredRecords.filter(r => 
      r.name.toLowerCase().includes(q) ||
      (r.rank && r.rank.toLowerCase().includes(q)) ||
      (r.unit && r.unit.toLowerCase().includes(q)) ||
      (r.id && r.id.toLowerCase().includes(q)) ||
      (r.diagnosis && r.diagnosis.toLowerCase().includes(q)) ||
      (r.issuer && r.issuer.toLowerCase().includes(q))
    );
  }, [monthlyFilteredRecords, monthlySearchQuery]);

  // Filter monthly records with advanced inline search & dropdowns for Monthly Tab
  const searchedAndFilteredMonthlyRecords = useMemo(() => {
    let list = monthlyFilteredRecords;
    
    // 1. Text Search Filter
    if (monthlyTableSearch.trim()) {
      const q = monthlyTableSearch.toLowerCase();
      list = list.filter(r => 
        r.name.toLowerCase().includes(q) ||
        (r.rank && r.rank.toLowerCase().includes(q)) ||
        (r.unit && r.unit.toLowerCase().includes(q)) ||
        (r.id && r.id.toLowerCase().includes(q)) ||
        (r.diagnosis && r.diagnosis.toLowerCase().includes(q)) ||
        (r.issuer && r.issuer.toLowerCase().includes(q))
      );
    }
    
    // 2. Type Dropdown Filter
    if (monthlyTypeFilter !== 'all') {
      list = list.filter(r => r.type === monthlyTypeFilter);
    }
    
    // 3. Status Dropdown Filter
    if (monthlyStatusFilter !== 'all') {
      list = list.filter(r => r.contactStatus === monthlyStatusFilter);
    }
    
    return list;
  }, [monthlyFilteredRecords, monthlyTableSearch, monthlyTypeFilter, monthlyStatusFilter]);

  // Compute unit distribution (battalions leaderboard) for the selected month
  const monthlyUnitDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    monthlyFilteredRecords.forEach(r => {
      const unitName = r.unit || 'اللواء 43 عمالقة';
      map[unitName] = (map[unitName] || 0) + 1;
    });
    return Object.entries(map)
      .map(([unit, count]) => ({
        unit,
        count,
        percentage: monthlyFilteredRecords.length > 0 ? Math.round((count / monthlyFilteredRecords.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [monthlyFilteredRecords]);

  // Compute top issuing hospitals for the selected month
  const topMonthlyHospitals = useMemo(() => {
    const counts: Record<string, number> = {};
    monthlyFilteredRecords.forEach(r => {
      if (r.issuer) {
        counts[r.issuer] = (counts[r.issuer] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [monthlyFilteredRecords]);

  // Helper translations
  const translateType = (type: string) => {
    switch (type) {
      case 'مريض': return 'إجازة مرضية (مريض)';
      case 'مرافق': return 'إجازة مرافق مريض';
      case 'مرض قريب': return 'مرض قريب/عائلي';
      case 'حادث': return 'إصابة عمل/حادث عسكري';
      default: return type;
    }
  };

  const translateStatus = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'تم التأكيد بالعودة';
      case 'request_extension': return 'طلب تمديد إجازة';
      case 'no_answer': return 'لا يرد / الهاتف مغلق';
      case 'evading': return 'متهرب ومخالف للأوامر';
      case 'pending':
      default: return 'لم يتم التواصل بعد';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40';
      case 'request_extension': return 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40';
      case 'no_answer': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40';
      case 'evading': return 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40';
      case 'pending':
      default: return 'text-slate-600 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800';
    }
  };

  // Export any report to Excel (CSV format styled with Metadata)
  const handleExportToExcel = (reportTitle: string, columns: { header: string, key: keyof LeaveRecord | string, format?: (val: any, record?: LeaveRecord) => string }[], dataList: LeaveRecord[]) => {
    if (dataList.length === 0) {
      triggerToast('لا توجد بيانات متاحة للتصدير في هذا التقرير', 'error');
      return;
    }

    const todayStr = new Date().toISOString().substring(0, 10);
    const metaHeader = [
      `"العنوان:","${reportTitle}"`,
      `"تاريخ الاستخراج:","${todayStr}"`,
      `"إجمالي قيود الإجازات:","${dataList.length} مجند"`,
      `"الوحدة العسكرية المفلترة:","${selectedUnit === 'all' ? 'جميع الوحدات' : selectedUnit}"`,
      `"الرتبة المفلترة:","${selectedRank === 'all' ? 'جميع الرتب' : selectedRank}"`,
      '' // Empty line to separate meta header from main table
    ];

    const tableHeaders = columns.map(c => c.header).join(',');
    const tableRows = dataList.map((r, index) => {
      return columns.map(c => {
        let val: any;
        if (c.key === 'index') {
          val = index + 1;
        } else {
          val = r[c.key as keyof LeaveRecord] ?? '';
        }

        if (c.format) {
          val = c.format(val, r);
        }
        
        // Escape quotes
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = '\uFEFF' + [
      ...metaHeader,
      tableHeaders,
      ...tableRows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast(`تم تصدير "${reportTitle}" إلى ملف Excel بنجاح`, 'success');
  };

  // Styled Excel Exporter for the Monthly Work Report with statistics and a detailed sheet
  const exportMonthlyReportToExcelStyled = () => {
    if (monthlyFilteredRecords.length === 0) {
      triggerToast('لا توجد بيانات متاحة للتصدير في هذا التقرير', 'error');
      return;
    }

    try {
      const todayStr = new Date().toLocaleDateString('ar-YE');
      const monthName = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ][parseInt(selectedReportMonth, 10) - 1] || selectedReportMonth;

      const confirmedCount = monthlyFilteredRecords.filter(r => r.contactStatus === 'confirmed').length;
      const extensionCount = monthlyFilteredRecords.filter(r => r.contactStatus === 'request_extension').length;
      const evadingCount = monthlyFilteredRecords.filter(r => r.contactStatus === 'evading').length;
      const noAnswerCount = monthlyFilteredRecords.filter(r => r.contactStatus === 'no_answer').length;
      const pendingCount = monthlyFilteredRecords.filter(r => r.contactStatus === 'pending' || !r.contactStatus).length;

      // Calculate total leaves days
      const totalDays = monthlyFilteredRecords.reduce((acc, r) => {
        const start = new Date(r.startDate).getTime();
        const end = new Date(r.endDate).getTime();
        return acc + Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
      }, 0);
      const avgDuration = monthlyFilteredRecords.length > 0 ? Math.round(totalDays / monthlyFilteredRecords.length) : 0;

      // Leave types stats
      const typeStats = ['مريض', 'مرافق', 'مرض قريب', 'حادث'].map(type => {
        const typeRecords = monthlyFilteredRecords.filter(r => r.type === type);
        const count = typeRecords.length;
        const pct = monthlyFilteredRecords.length > 0 ? Math.round((count / monthlyFilteredRecords.length) * 100) : 0;
        const totalTypeDays = typeRecords.reduce((sum, r) => {
          const start = new Date(r.startDate).getTime();
          const end = new Date(r.endDate).getTime();
          return sum + Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
        }, 0);
        const avgTypeDuration = count > 0 ? Math.round(totalTypeDays / count) : 0;
        const confirmed = typeRecords.filter(r => r.contactStatus === 'confirmed').length;
        const evading = typeRecords.filter(r => r.contactStatus === 'evading').length;
        return { type, label: translateType(type), count, pct, avgTypeDuration, confirmed, evading };
      });

      // Unit stats
      const units = Array.from(new Set(monthlyFilteredRecords.map(r => r.unit || 'اللواء 43 عمالقة')));
      const unitStats = units.map(unit => {
        const unitRecords = monthlyFilteredRecords.filter(r => (r.unit || 'اللواء 43 عمالقة') === unit);
        const count = unitRecords.length;
        const pct = monthlyFilteredRecords.length > 0 ? Math.round((count / monthlyFilteredRecords.length) * 100) : 0;
        const confirmed = unitRecords.filter(r => r.contactStatus === 'confirmed').length;
        const extension = unitRecords.filter(r => r.contactStatus === 'request_extension').length;
        const evading = unitRecords.filter(r => r.contactStatus === 'evading').length;
        return { unit, count, pct, confirmed, extension, evading };
      }).sort((a, b) => b.count - a.count);

      // --- Style Definitions matching ExcelExportWizard ---
      const thinBorder = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };

      const titleStyle = {
        font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1E293B' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      const subtitleStyle = {
        font: { name: 'Segoe UI', sz: 10, italic: true, color: { rgb: '475569' } },
        fill: { fgColor: { rgb: 'F1F5F9' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      const sectionTitleStyle = {
        font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '1E3A8A' } },
        fill: { fgColor: { rgb: 'E2E8F0' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: thinBorder
      };

      const headerStyle = {
        font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4F46E5' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: thinBorder
      };

      const cellNormalStyle = {
        font: { name: 'Segoe UI', sz: 10 },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: thinBorder
      };

      const cellAlternateStyle = {
        font: { name: 'Segoe UI', sz: 10 },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: thinBorder
      };

      const cellCenterStyle = {
        font: { name: 'Segoe UI', sz: 10 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: thinBorder
      };

      const cellCenterAltStyle = {
        font: { name: 'Segoe UI', sz: 10 },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: thinBorder
      };

      const cardLabelStyle = {
        font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '475569' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: thinBorder
      };

      // KPI style creators
      const getCardValueStyle = (textColor: string, bgColor: string, borderColor: string) => ({
        font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: textColor } },
        fill: { fgColor: { rgb: bgColor } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: borderColor } },
          bottom: { style: 'thin', color: { rgb: borderColor } },
          left: { style: 'thin', color: { rgb: borderColor } },
          right: { style: 'thin', color: { rgb: borderColor } }
        }
      });

      const cardValueIndigo = getCardValueStyle('4F46E5', 'EEF2FF', 'C7D2FE');
      const cardValuePink = getCardValueStyle('DB2777', 'FDF2F8', 'FBCFE8');
      const cardValueGreen = getCardValueStyle('10B981', 'ECFDF5', 'A7F3D0');
      const cardValueRed = getCardValueStyle('EF4444', 'FEF2F2', 'FCA5A5');
      const cardValueOrange = getCardValueStyle('B45309', 'FEF3C7', 'FCD34D');
      const cardValuePurple = getCardValueStyle('7C3AED', 'F5F3FF', 'DDD6FE');

      // Status styles
      const statusConfirmedStyle = getCardValueStyle('047857', 'D1FAE5', 'A7F3D0');
      const statusExtensionStyle = getCardValueStyle('B45309', 'FEF3C7', 'FCD34D');
      const statusEvadingStyle = getCardValueStyle('B91C1C', 'FEE2E2', 'FCA5A5');
      const statusPendingStyle = getCardValueStyle('1D4ED8', 'DBEAFE', 'BFDBFE');
      const statusNoAnswerStyle = getCardValueStyle('9D174D', 'FCE7F3', 'FBCFE8');

      // --- Building Worksheet 1: Statistics (لوحة التحكم والمؤشرات) ---
      const sheet1Rows: any[][] = [];

      // Row 0: Title (Merge A1:G1)
      sheet1Rows.push([
        { v: "الشعبة الطبية وقسم المتابعة العسكرية - قيادة اللواء 43 عمالقة", t: 's', s: titleStyle },
        { v: "", t: 's', s: titleStyle },
        { v: "", t: 's', s: titleStyle },
        { v: "", t: 's', s: titleStyle },
        { v: "", t: 's', s: titleStyle },
        { v: "", t: 's', s: titleStyle },
        { v: "", t: 's', s: titleStyle }
      ]);

      // Row 1: Subtitle (Merge A2:G2)
      sheet1Rows.push([
        { v: `التقرير الإحصائي والتحليلي الشامل لشهر ${monthName} لعام ${selectedReportYear} | تاريخ التصدير: ${todayStr}`, t: 's', s: subtitleStyle },
        { v: "", t: 's', s: subtitleStyle },
        { v: "", t: 's', s: subtitleStyle },
        { v: "", t: 's', s: subtitleStyle },
        { v: "", t: 's', s: subtitleStyle },
        { v: "", t: 's', s: subtitleStyle },
        { v: "", t: 's', s: subtitleStyle }
      ]);

      // Row 2: Space
      sheet1Rows.push([
        { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }
      ]);

      // Row 3: KPI Card Labels
      sheet1Rows.push([
        { v: "إجمالي إجازات الشهر", t: 's', s: cardLabelStyle },
        { v: "إجمالي أيام الإجازات", t: 's', s: cardLabelStyle },
        { v: "متوسط مدة الإجازة", t: 's', s: cardLabelStyle },
        { v: "مؤكد العودة والالتزام", t: 's', s: cardLabelStyle },
        { v: "طلبات التمديد النشطة", t: 's', s: cardLabelStyle },
        { v: "متهرب ومخالف عسكرياً", t: 's', s: cardLabelStyle },
        { v: "لم يرد / الهاتف مغلق", t: 's', s: cardLabelStyle }
      ]);

      // Row 4: KPI Card Values
      sheet1Rows.push([
        { v: `${monthlyFilteredRecords.length} إجازة`, t: 's', s: cardValueIndigo },
        { v: `${totalDays} يوم`, t: 's', s: cardValuePink },
        { v: `${avgDuration} يوم`, t: 's', s: cardValuePurple },
        { v: `${confirmedCount} مجند`, t: 's', s: cardValueGreen },
        { v: `${extensionCount} حالة`, t: 's', s: cardValueOrange },
        { v: `${evadingCount} مجند`, t: 's', s: cardValueRed },
        { v: `${noAnswerCount} حالة`, t: 's', s: cardValuePurple }
      ]);

      // Row 5: Space
      sheet1Rows.push([
        { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }
      ]);

      // Row 6: Section 1 Header (Merge A7:G7)
      sheet1Rows.push([
        { v: "أولاً: التوزيع التفصيلي للإجازات ومعدل الالتزام بحسب التصنيف والنوع", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle }
      ]);

      // Row 7: Table 1 Header
      sheet1Rows.push([
        { v: "م", t: 's', s: headerStyle },
        { v: "تصنيف ونوع الإجازة الممنوحة", t: 's', s: headerStyle },
        { v: "عدد الحالات", t: 's', s: headerStyle },
        { v: "النسبة المئوية", t: 's', s: headerStyle },
        { v: "متوسط المدة (يوم)", t: 's', s: headerStyle },
        { v: "تم تأكيد العودة والالتزام", t: 's', s: headerStyle },
        { v: "حالات التهرب والتعميم", t: 's', s: headerStyle }
      ]);

      const mergesSheet1 = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Subtitle
        { s: { r: 6, c: 0 }, e: { r: 6, c: 6 } }  // Section 1 Title
      ];

      // Add Type stats rows
      typeStats.forEach((t, index) => {
        const rowStyle = index % 2 === 0 ? cellNormalStyle : cellAlternateStyle;
        const centerStyle = index % 2 === 0 ? cellCenterStyle : cellCenterAltStyle;

        sheet1Rows.push([
          { v: index + 1, t: 'n', s: centerStyle },
          { v: t.label, t: 's', s: rowStyle },
          { v: t.count, t: 'n', s: centerStyle },
          { v: `${t.pct}%`, t: 's', s: centerStyle },
          { v: t.avgTypeDuration, t: 'n', s: centerStyle },
          { v: t.confirmed, t: 'n', s: centerStyle },
          { v: t.evading, t: 'n', s: centerStyle }
        ]);
      });

      // Space
      sheet1Rows.push([
        { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }
      ]);

      // Section 2 Title row
      const sec2TitleRowIdx = sheet1Rows.length;
      sheet1Rows.push([
        { v: "ثانياً: التوزيع الجغرافي والإداري للحالات بحسب الكتائب والوحدات العسكرية", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle }
      ]);
      mergesSheet1.push({ s: { r: sec2TitleRowIdx, c: 0 }, e: { r: sec2TitleRowIdx, c: 6 } });

      // Table 2 Header row
      sheet1Rows.push([
        { v: "م", t: 's', s: headerStyle },
        { v: "الكتيبة / السرية العسكرية الفرعية", t: 's', s: headerStyle },
        { v: "القوة المجازة (عدد الحالات)", t: 's', s: headerStyle },
        { v: "النسبة من إجمالي إجازات الشهر", t: 's', s: headerStyle },
        { v: "الحالات الملتزمة (مؤكد)", t: 's', s: headerStyle },
        { v: "طلبات التمديد تحت المراجعة", t: 's', s: headerStyle },
        { v: "حالات التهرب والتعليق", t: 's', s: headerStyle }
      ]);

      // Add Unit stats rows
      if (unitStats.length === 0) {
        const rIdx = sheet1Rows.length;
        sheet1Rows.push([
          { v: "لا توجد بيانات مسجلة في هذا الشهر", t: 's', s: cellCenterStyle },
          { v: "", t: 's', s: cellCenterStyle },
          { v: "", t: 's', s: cellCenterStyle },
          { v: "", t: 's', s: cellCenterStyle },
          { v: "", t: 's', s: cellCenterStyle },
          { v: "", t: 's', s: cellCenterStyle },
          { v: "", t: 's', s: cellCenterStyle }
        ]);
        mergesSheet1.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx, c: 6 } });
      } else {
        unitStats.forEach((u, index) => {
          const rowStyle = index % 2 === 0 ? cellNormalStyle : cellAlternateStyle;
          const centerStyle = index % 2 === 0 ? cellCenterStyle : cellCenterAltStyle;

          sheet1Rows.push([
            { v: index + 1, t: 'n', s: centerStyle },
            { v: u.unit, t: 's', s: rowStyle },
            { v: u.count, t: 'n', s: centerStyle },
            { v: `${u.pct}%`, t: 's', s: centerStyle },
            { v: u.confirmed, t: 'n', s: centerStyle },
            { v: u.extension, t: 'n', s: centerStyle },
            { v: u.evading, t: 'n', s: centerStyle }
          ]);
        });
      }

      // Space
      sheet1Rows.push([
        { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }, { v: "", t: 's' }
      ]);

      // Section 3 Title row
      const sec3TitleRowIdx = sheet1Rows.length;
      sheet1Rows.push([
        { v: "ثالثاً: تحليل مؤشرات الاتصال والالتزام والانضباط العسكري العام للشهر", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle },
        { v: "", t: 's', s: sectionTitleStyle }
      ]);
      mergesSheet1.push({ s: { r: sec3TitleRowIdx, c: 0 }, e: { r: sec3TitleRowIdx, c: 6 } });

      // Metric calculations
      const totalFollowedUp = confirmedCount + extensionCount + evadingCount + noAnswerCount + pendingCount;
      const successfulContactRate = totalFollowedUp > 0 ? Math.round(((confirmedCount + extensionCount + evadingCount + noAnswerCount) / totalFollowedUp) * 100) : 0;
      const militaryComplianceRate = totalFollowedUp > 0 ? Math.round(((confirmedCount + extensionCount) / totalFollowedUp) * 100) : 0;
      const criticalViolationRate = totalFollowedUp > 0 ? Math.round((evadingCount / totalFollowedUp) * 100) : 0;

      const metricRows = [
        { label: "معدل نجاح الاتصال المباشر بالمجندين", value: `${successfulContactRate}%`, desc: "الحالات التي تم التوصل إليها هاتفياً وسماع الرد من إجمالي القوة الخاضعة للمتابعة" },
        { label: "مؤشر الانضباط والالتزام العسكري العام", value: `${militaryComplianceRate}%`, desc: "نسبة الحالات الملتزمة بتأكيد العودة أو تقديم طلبات تمديد رسمية معمدة" },
        { label: "معدل مخالفة الأوامر والتهرب من الخدمة", value: `${criticalViolationRate}%`, desc: "الحالات التي ثبت تهربها وصدرت بحقها تعاميم عملياتية عاجلة" }
      ];

      metricRows.forEach((m, index) => {
        const rIdx = sheet1Rows.length;
        const bgStyle = index % 2 === 0 ? cellNormalStyle : cellAlternateStyle;
        const textStyle = index === 2 ? { ...bgStyle, font: { ...bgStyle.font, bold: true, color: { rgb: "B91C1C" } } } : bgStyle;
        const valStyle = index === 2 ? { ...cellCenterStyle, font: { ...cellCenterStyle.font, bold: true, color: { rgb: "B91C1C" } }, fill: { fgColor: { rgb: "FEE2E2" } } } : cellCenterStyle;

        sheet1Rows.push([
          { v: index + 1, t: 'n', s: cellCenterStyle },
          { v: m.label, t: 's', s: textStyle },
          { v: "", t: 's', s: textStyle },
          { v: m.value, t: 's', s: valStyle },
          { v: m.desc, t: 's', s: bgStyle },
          { v: "", t: 's', s: bgStyle },
          { v: "", t: 's', s: bgStyle }
        ]);

        mergesSheet1.push(
          { s: { r: rIdx, c: 1 }, e: { r: rIdx, c: 2 } },
          { s: { r: rIdx, c: 4 }, e: { r: rIdx, c: 6 } }
        );
      });

      // Create Worksheet 1
      const ws1 = XLSX.utils.aoa_to_sheet(sheet1Rows);
      ws1['!merges'] = mergesSheet1;
      ws1['!cols'] = [
        { wch: 6 },   // A: م
        { wch: 24 },  // B: تصنيف الإجازة / المؤشر
        { wch: 16 },  // C: عدد الحالات / القوة المجازة
        { wch: 16 },  // D: النسبة المئوية
        { wch: 18 },  // E: متوسط المدة / تفاصيل
        { wch: 20 },  // F: تم تأكيد العودة
        { wch: 20 }   // G: متهرب / مخالف
      ];
      ws1['!views'] = [{ RTL: true }];

      // Configure Row Heights for Sheet 1
      const ws1RowHeights = [
        { hpt: 35 }, // Row 0: Title
        { hpt: 25 }, // Row 1: Subtitle
        { hpt: 15 }, // Row 2: Spacer
        { hpt: 20 }, // Row 3: KPI Labels
        { hpt: 28 }, // Row 4: KPI Values
        { hpt: 15 }, // Row 5: Spacer
        { hpt: 25 }, // Row 6: Sec 1 Title
        { hpt: 22 }  // Row 7: Table 1 Headers
      ];
      typeStats.forEach(() => ws1RowHeights.push({ hpt: 20 }));
      ws1RowHeights.push({ hpt: 15 }); // Spacer
      ws1RowHeights.push({ hpt: 25 }); // Sec 2 Title
      ws1RowHeights.push({ hpt: 22 }); // Table 2 Header
      if (unitStats.length === 0) {
        ws1RowHeights.push({ hpt: 25 });
      } else {
        unitStats.forEach(() => ws1RowHeights.push({ hpt: 20 }));
      }
      ws1RowHeights.push({ hpt: 15 }); // Spacer
      ws1RowHeights.push({ hpt: 25 }); // Sec 3 Title
      metricRows.forEach(() => ws1RowHeights.push({ hpt: 22 })); // Metric rows
      ws1['!rows'] = ws1RowHeights;

      // --- Building Worksheet 2: Detailed Ledger (كشف الإجازات التفصيلي) ---
      const sheet2Rows: any[][] = [];

      // Row 0: Title (Merge A1:M1)
      sheet2Rows.push([
        { v: `بيان كشف الإجازات والعمل التفصيلي لشهر ${monthName} لعام ${selectedReportYear}`, t: 's', s: titleStyle },
        ...Array(12).fill({ v: "", t: 's' })
      ]);

      // Row 1: Subtitle (Merge A2:M2)
      sheet2Rows.push([
        { v: "سجل تفصيلي يضم معلومات المجندين الحاصلين على إجازات نشطة خلال هذا الشهر وحالتهم الميدانية والملاحظات الطبية والعملياتية المسجلة", t: 's', s: subtitleStyle },
        ...Array(12).fill({ v: "", t: 's' })
      ]);

      // Row 2: Space
      sheet2Rows.push([
        ...Array(13).fill({ v: "", t: 's' })
      ]);

      // Row 3: Table Headers
      sheet2Rows.push([
        { v: "م", t: 's', s: headerStyle },
        { v: "الرقم العسكري", t: 's', s: headerStyle },
        { v: "اسم المجند الكامل", t: 's', s: headerStyle },
        { v: "الرتبة العسكرية", t: 's', s: headerStyle },
        { v: "الوحدة / الكتيبة", t: 's', s: headerStyle },
        { v: "تصنيف الإجازة", t: 's', s: headerStyle },
        { v: "المدة (يوم)", t: 's', s: headerStyle },
        { v: "تاريخ البدء", t: 's', s: headerStyle },
        { v: "تاريخ الانتهاء", t: 's', s: headerStyle },
        { v: "التشخيص الطبي التفصيلي", t: 's', s: headerStyle },
        { v: "جهة إصدار التقرير", t: 's', s: headerStyle },
        { v: "حالة المتابعة والاتصال", t: 's', s: headerStyle },
        { v: "الملاحظات والبيان", t: 's', s: headerStyle }
      ]);

      const mergesSheet2 = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }, // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } }  // Subtitle
      ];

      // Add detailed records
      if (monthlyFilteredRecords.length === 0) {
        const rIdx = sheet2Rows.length;
        sheet2Rows.push([
          { v: "لا توجد أي إجازات مسجلة في هذا الشهر", t: 's', s: cellCenterStyle },
          ...Array(12).fill({ v: "", t: 's' })
        ]);
        mergesSheet2.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx, c: 12 } });
      } else {
        monthlyFilteredRecords.forEach((r, idx) => {
          const rowStyle = idx % 2 === 0 ? cellNormalStyle : cellAlternateStyle;
          const centerStyle = idx % 2 === 0 ? cellCenterStyle : cellCenterAltStyle;
          
          let statusStyle = statusPendingStyle;
          if (r.contactStatus === 'confirmed') statusStyle = statusConfirmedStyle;
          else if (r.contactStatus === 'request_extension') statusStyle = statusExtensionStyle;
          else if (r.contactStatus === 'evading') statusStyle = statusEvadingStyle;
          else if (r.contactStatus === 'no_answer') statusStyle = statusNoAnswerStyle;

          const durationDays = Math.round((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;

          sheet2Rows.push([
            { v: idx + 1, t: 'n', s: centerStyle },
            { v: r.id, t: 's', s: centerStyle },
            { v: r.name, t: 's', s: rowStyle },
            { v: r.rank, t: 's', s: rowStyle },
            { v: r.unit || 'اللواء 43 عمالقة', t: 's', s: rowStyle },
            { v: translateType(r.type), t: 's', s: rowStyle },
            { v: durationDays, t: 'n', s: centerStyle },
            { v: r.startDate, t: 's', s: centerStyle },
            { v: r.endDate, t: 's', s: centerStyle },
            { v: r.diagnosis || '-', t: 's', s: rowStyle },
            { v: r.issuer || 'عيادة اللواء', t: 's', s: rowStyle },
            { v: translateStatus(r.contactStatus), t: 's', s: statusStyle },
            { v: r.notes || '-', t: 's', s: rowStyle }
          ]);
        });
      }

      // Create Worksheet 2
      const ws2 = XLSX.utils.aoa_to_sheet(sheet2Rows);
      ws2['!merges'] = mergesSheet2;
      ws2['!cols'] = [
        { wch: 6 },   // م
        { wch: 15 },  // الرقم العسكري
        { wch: 30 },  // الاسم
        { wch: 14 },  // الرتبة
        { wch: 20 },  // الوحدة
        { wch: 18 },  // تصنيف الإجازة
        { wch: 12 },  // المدة
        { wch: 14 },  // تاريخ البدء
        { wch: 14 },  // تاريخ الانتهاء
        { wch: 25 },  // التشخيص
        { wch: 18 },  // جهة الإصدار
        { wch: 22 },  // حالة الاتصال
        { wch: 25 }   // الملاحظات
      ];
      ws2['!views'] = [{ RTL: true }];

      // Configure Row Heights for Sheet 2
      const ws2RowHeights = [
        { hpt: 35 }, // Title
        { hpt: 25 }, // Subtitle
        { hpt: 15 }, // Spacer
        { hpt: 25 }  // Headers
      ];
      if (monthlyFilteredRecords.length === 0) {
        ws2RowHeights.push({ hpt: 30 });
      } else {
        monthlyFilteredRecords.forEach(() => ws2RowHeights.push({ hpt: 22 }));
      }
      ws2['!rows'] = ws2RowHeights;

      // --- Building Worksheet 3: Call Follow-ups Register (سجل متابعة الاتصالات والتحري) ---
      const contactLogsList: any[] = [];
      monthlyFilteredRecords.forEach(r => {
        if (r.contactLogs && Array.isArray(r.contactLogs)) {
          r.contactLogs.forEach(log => {
            contactLogsList.push({
              soldierId: r.id,
              soldierName: r.name,
              soldierRank: r.rank,
              date: log.date || '-',
              status: log.status || '',
              note: log.note || '-'
            });
          });
        }
      });
      // Sort contactLogsList by date descending
      contactLogsList.sort((a, b) => b.date.localeCompare(a.date));

      const translateLogStatus = (st: string) => {
        if (!st) return 'غير محدد';
        if (st.includes('confirmed') || st.includes('مؤكد')) return 'تم التأكيد بالعودة';
        if (st.includes('request_extension') || st.includes('تمديد')) return 'طلب تمديد إجازة';
        if (st.includes('no_answer') || st.includes('لا يرد')) return 'لا يرد / الهاتف مغلق';
        if (st.includes('evading') || st.includes('متهرب')) return 'متهرب ومخالف للأوامر';
        if (st.includes('pending') || st.includes('لم يتم')) return 'لم يتم التواصل بعد';
        return translateStatus(st);
      };

      const sheet3Rows: any[][] = [];

      // Row 0: Title (Merge A1:F1)
      sheet3Rows.push([
        { v: "سجل الرصد اليومي للاتصالات والتحري العسكري الميداني", t: 's', s: titleStyle },
        ...Array(5).fill({ v: "", t: 's' })
      ]);

      // Row 1: Subtitle (Merge A2:F2)
      sheet3Rows.push([
        { v: `المتابعة الهاتفية المباشرة مع الأفراد المجازين والتحقق من التزامهم لشهر ${monthName} لعام ${selectedReportYear}`, t: 's', s: subtitleStyle },
        ...Array(5).fill({ v: "", t: 's' })
      ]);

      // Row 2: Spacer
      sheet3Rows.push([
        ...Array(6).fill({ v: "", t: 's' })
      ]);

      // Row 3: Headers
      sheet3Rows.push([
        { v: "م", t: 's', s: headerStyle },
        { v: "الرقم العسكري", t: 's', s: headerStyle },
        { v: "اسم ورتبة المجند", t: 's', s: headerStyle },
        { v: "تاريخ ووقت الاتصال", t: 's', s: headerStyle },
        { v: "حالة الاتصال المسجلة", t: 's', s: headerStyle },
        { v: "تفاصيل وتوجيهات الاتصال وملاحظة الرد", t: 's', s: headerStyle }
      ]);

      const mergesSheet3 = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }
      ];

      if (contactLogsList.length === 0) {
        const rIdx = sheet3Rows.length;
        sheet3Rows.push([
          { v: "لا توجد سجلات اتصالات مدونة خلال هذا الشهر للمجندين ذوي الإجازات النشطة", t: 's', s: cellCenterStyle },
          ...Array(5).fill({ v: "", t: 's' })
        ]);
        mergesSheet3.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx, c: 5 } });
      } else {
        contactLogsList.forEach((log, idx) => {
          const rowStyle = idx % 2 === 0 ? cellNormalStyle : cellAlternateStyle;
          const centerStyle = idx % 2 === 0 ? cellCenterStyle : cellCenterAltStyle;
          
          let logStatusStyle = statusPendingStyle;
          if (log.status.includes('confirmed')) logStatusStyle = statusConfirmedStyle;
          else if (log.status.includes('request_extension')) logStatusStyle = statusExtensionStyle;
          else if (log.status.includes('evading')) logStatusStyle = statusEvadingStyle;
          else if (log.status.includes('no_answer')) logStatusStyle = statusNoAnswerStyle;

          sheet3Rows.push([
            { v: idx + 1, t: 'n', s: centerStyle },
            { v: log.soldierId, t: 's', s: centerStyle },
            { v: `[${log.soldierRank}] ${log.soldierName}`, t: 's', s: rowStyle },
            { v: log.date, t: 's', s: centerStyle },
            { v: translateLogStatus(log.status), t: 's', s: logStatusStyle },
            { v: log.note, t: 's', s: rowStyle }
          ]);
        });
      }

      const ws3 = XLSX.utils.aoa_to_sheet(sheet3Rows);
      ws3['!merges'] = mergesSheet3;
      ws3['!cols'] = [
        { wch: 6 },   // م
        { wch: 15 },  // الرقم العسكري
        { wch: 32 },  // الاسم والرتبة
        { wch: 18 },  // تاريخ الاتصال
        { wch: 22 },  // حالة الاتصال
        { wch: 45 }   // تفاصيل المكالمة والرد
      ];
      ws3['!views'] = [{ RTL: true }];

      // Configure heights
      const ws3RowHeights = [
        { hpt: 35 }, // Title
        { hpt: 25 }, // Subtitle
        { hpt: 15 }, // Spacer
        { hpt: 25 }  // Headers
      ];
      if (contactLogsList.length === 0) {
        ws3RowHeights.push({ hpt: 30 });
      } else {
        contactLogsList.forEach(() => ws3RowHeights.push({ hpt: 22 }));
      }
      ws3['!rows'] = ws3RowHeights;

      // --- Building Worksheet 4: Critical & Violating Cases Report (الحالات الحرجة والمخالفين عسكرياً) ---
      const violatorsAndCritical = monthlyFilteredRecords.filter(r => {
        const isEvader = r.contactStatus === 'evading';
        const start = new Date(r.startDate).getTime();
        const end = new Date(r.endDate).getTime();
        const durationDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
        const isCriticalMedical = durationDays > 15 || r.type === 'حادث';
        return isEvader || isCriticalMedical;
      });

      const sheet4Rows: any[][] = [];

      // Row 0: Title (Merge A1:I1)
      sheet4Rows.push([
        { v: "كشف الحالات الطبية الحرجة والمخالفين عسكرياً الخاضعين للرقابة والمحاسبة", t: 's', s: titleStyle },
        ...Array(8).fill({ v: "", t: 's' })
      ]);

      // Row 1: Subtitle (Merge A2:I2)
      sheet4Rows.push([
        { v: `رصد الحالات الاستثنائية التي تستلزم قرارات فورية وتنسيق عملياتي مباشر لشهر ${monthName} لعام ${selectedReportYear}`, t: 's', s: subtitleStyle },
        ...Array(8).fill({ v: "", t: 's' })
      ]);

      // Row 2: Spacer
      sheet4Rows.push([
        ...Array(9).fill({ v: "", t: 's' })
      ]);

      // Row 3: Headers
      sheet4Rows.push([
        { v: "م", t: 's', s: headerStyle },
        { v: "الرقم العسكري", t: 's', s: headerStyle },
        { v: "اسم ورتبة المجند", t: 's', s: headerStyle },
        { v: "الكتيبة العسكرية", t: 's', s: headerStyle },
        { v: "تصنيف المتابعة الطارئة", t: 's', s: headerStyle },
        { v: "التشخيص / توصيف المخالفة العسكرية", t: 's', s: headerStyle },
        { v: "المدة الإجمالية", t: 's', s: headerStyle },
        { v: "تاريخ العودة المفترض", t: 's', s: headerStyle },
        { v: "الإجراء العملياتي الموصى به من قيادة اللواء", t: 's', s: headerStyle }
      ]);

      const mergesSheet4 = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }
      ];

      if (violatorsAndCritical.length === 0) {
        const rIdx = sheet4Rows.length;
        sheet4Rows.push([
          { v: "لا توجد أي حالات حرجة أو مخالفين عسكرياً مسجلين خلال هذا الشهر", t: 's', s: cellCenterStyle },
          ...Array(8).fill({ v: "", t: 's' })
        ]);
        mergesSheet4.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx, c: 8 } });
      } else {
        violatorsAndCritical.forEach((r, idx) => {
          const rowStyle = idx % 2 === 0 ? cellNormalStyle : cellAlternateStyle;
          const centerStyle = idx % 2 === 0 ? cellCenterStyle : cellCenterAltStyle;
          
          let alertType = "";
          let alertDetails = "";
          let recommendedAction = "";
          let alertStyle = statusPendingStyle;

          const start = new Date(r.startDate).getTime();
          const end = new Date(r.endDate).getTime();
          const durationDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

          if (r.contactStatus === 'evading') {
            alertType = "هروب ومخالفة عسكرية";
            alertDetails = r.diagnosis ? `متهرب من الخدمة (التشخيص المزعوم: ${r.diagnosis})` : "تهرب من الخدمة ومخالفة توجيهات العودة والالتحاق باللواء";
            recommendedAction = "توقيف راتب المجند فوراً وإصدار تعميم ضبط عملياتي وتوقيف عسكري عاجل لإحالته للمحاكمة العسكرية عند القبض عليه";
            alertStyle = statusEvadingStyle;
          } else {
            alertType = durationDays > 30 ? "حالة طبية حرجة جداً" : "حالة طبية حرجة ومتابعة";
            alertDetails = r.diagnosis || 'إصابة غير محددة';
            recommendedAction = durationDays > 30 
              ? "إحالة عاجلة إلى المجلس الطبي العسكري العالي لتحديد نسبة العجز واللياقة للخدمة العسكرية المستمرة"
              : "متابعة التقارير الطبية الأسبوعية وتأكيد جاهزية البدائل للخدمة الخفيفة أو تمديد الإجازة رسمياً برأي الطبيب";
            alertStyle = durationDays > 30 ? statusExtensionStyle : statusConfirmedStyle;
          }

          sheet4Rows.push([
            { v: idx + 1, t: 'n', s: centerStyle },
            { v: r.id, t: 's', s: centerStyle },
            { v: `[${r.rank}] ${r.name}`, t: 's', s: rowStyle },
            { v: r.unit || 'اللواء 43 عمالقة', t: 's', s: rowStyle },
            { v: alertType, t: 's', s: alertStyle },
            { v: alertDetails, t: 's', s: rowStyle },
            { v: `${durationDays} أيام`, t: 's', s: centerStyle },
            { v: r.endDate, t: 's', s: centerStyle },
            { v: recommendedAction, t: 's', s: rowStyle }
          ]);
        });
      }

      const ws4 = XLSX.utils.aoa_to_sheet(sheet4Rows);
      ws4['!merges'] = mergesSheet4;
      ws4['!cols'] = [
        { wch: 6 },   // م
        { wch: 15 },  // الرقم العسكري
        { wch: 32 },  // اسم ورتبة المجند
        { wch: 20 },  // الكتيبة العسكرية
        { wch: 24 },  // تصنيف الحالة والمتابعة
        { wch: 28 },  // التشخيص / بيان المخالفة
        { wch: 16 },  // المدة الإجمالية
        { wch: 18 },  // تاريخ العودة المفترض
        { wch: 42 }   // الإجراء الموصى به
      ];
      ws4['!views'] = [{ RTL: true }];

      // Configure heights
      const ws4RowHeights = [
        { hpt: 35 }, // Title
        { hpt: 25 }, // Subtitle
        { hpt: 15 }, // Spacer
        { hpt: 25 }  // Headers
      ];
      if (violatorsAndCritical.length === 0) {
        ws4RowHeights.push({ hpt: 30 });
      } else {
        violatorsAndCritical.forEach(() => ws4RowHeights.push({ hpt: 22 }));
      }
      ws4['!rows'] = ws4RowHeights;

      // --- Assemble Workbook ---
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws1, "لوحة التحكم والمؤشرات");
      XLSX.utils.book_append_sheet(wb, ws2, "كشف الإجازات التفصيلي");
      XLSX.utils.book_append_sheet(wb, ws3, "دفتر متابعة الاتصالات");
      XLSX.utils.book_append_sheet(wb, ws4, "الحالات الحرجة والمخالفين");

      // Save file
      const fileName = `التقرير_الشهري_الشامل_لشهر_${selectedReportMonth}_عام_${selectedReportYear}.xlsx`;
      XLSX.writeFile(wb, fileName);

      triggerToast(`تم تصدير التقرير الشهري لعمل شهر ${monthName} بنجاح كملف Excel متقدم متعدد الأوراق ومصمم بالكامل (.xlsx)`, 'success');
    } catch (error: any) {
      console.error("Excel Export Error:", error);
      triggerToast(`فشل تصدير التقرير الشهري: ${error?.message || 'حدث خطأ غير متوقع أثناء توليد ملف Excel'}`, 'error');
    }
  };

  // Print current page / report
  const handlePrintReport = () => {
    setIsPrintModalOpen(true);
  };

  // PRESETS OF COLUMN DEFINITIONS FOR EXPORT

  // 1. Ledger Report columns
  const ledgerColumns = [
    { header: 'م', key: 'index' },
    { header: 'المعرف المالي/العسكري', key: 'id' },
    { header: 'الاسم الكامل للمجند', key: 'name' },
    { header: 'الرتبة', key: 'rank' },
    { header: 'الوحدة العسكرية/الكتيبة', key: 'unit', format: (v: any) => v || 'اللواء 43 عمالقة' },
    { header: 'تصنيف الإجازة', key: 'type', format: (v: any) => translateType(v) },
    { header: 'التشخيص الطبي التفصيلي', key: 'diagnosis' },
    { header: 'المستشفى/جهة الإصدار', key: 'issuer' },
    { header: 'تاريخ البدء', key: 'startDate' },
    { header: 'تاريخ الانتهاء', key: 'endDate' },
    { header: 'حالة التواصل', key: 'contactStatus', format: (v: any) => translateStatus(v) },
    { header: 'ملاحظات القائد', key: 'notes' }
  ];

  // 2. Compliance and contact columns
  const complianceColumns = [
    { header: 'م', key: 'index' },
    { header: 'الاسم', key: 'name' },
    { header: 'الرتبة', key: 'rank' },
    { header: 'الوحدة', key: 'unit', format: (v: any) => v || 'اللواء 43 عمالقة' },
    { header: 'تاريخ البدء والانتهاء', key: 'dates', format: (_v: any, r?: LeaveRecord) => `${r?.startDate} إلى ${r?.endDate}` },
    { header: 'حالة الاتصال المباشر', key: 'contactStatus', format: (v: any) => translateStatus(v) },
    { header: 'آخر كود تواصل مرصود', key: 'contactStatusRaw', format: (v: any) => v || 'pending' },
    { header: 'عدد محاولات الاتصال الموثقة', key: 'logsCount', format: (_v: any, r?: LeaveRecord) => String(r?.contactLogs?.length || 0) },
    { header: 'ملاحظات الاتصال الأخيرة', key: 'notes' }
  ];

  // 3. Medical stats analysis list calculation
  const diagnosisStats = useMemo(() => {
    const map: { [key: string]: { count: number; duration: number; issuers: Set<string> } } = {};
    filteredRecords.forEach(r => {
      const diag = r.diagnosis || 'تشخيص غير محدد';
      if (!map[diag]) {
        map[diag] = { count: 0, duration: 0, issuers: new Set() };
      }
      map[diag].count += 1;
      
      const start = new Date(r.startDate).getTime();
      const end = new Date(r.endDate).getTime();
      const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      map[diag].duration += diffDays;
      if (r.issuer) {
        map[diag].issuers.add(r.issuer);
      }
    });

    return Object.keys(map).map(diag => ({
      diagnosis: diag,
      count: map[diag].count,
      avgDuration: Math.round(map[diag].duration / map[diag].count),
      issuersCount: map[diag].issuers.size
    })).sort((a, b) => b.count - a.count);
  }, [filteredRecords]);

  return (
    <div className="space-y-6">
      
      {/* Banner Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden select-none">
        <div className="absolute top-0 left-0 translate-y-[-30%] translate-x-[-15%] opacity-5 pointer-events-none">
          <FileText className="w-96 h-96" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 text-right">
            <h1 className="text-xl font-black flex items-center gap-2 justify-start">
              <FileSpreadsheet className="w-6 h-6 text-amber-500" />
              <span>مركز التقارير المتنوعة والتحليلات الشاملة للعمل</span>
            </h1>
            <p className="text-xs text-slate-350 max-w-2xl leading-relaxed">
              قم باستخراج وتصميم تقارير مفصلة واحترافية حول كافة المجندين الحاصلين على إجازات مرضية عسكرية، تتبع التزامات عودتهم الميدانية، تصنيف الحالات حسب الرتب والتشخيصات الطبية، وتصديرها بصيغ إكسل المعتمدة مباشرة.
            </p>
          </div>
          
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={handlePrintReport}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-100 text-xs font-bold rounded-xl transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>طباعة التقرير</span>
            </button>
            <button
              onClick={() => {
                if (activeReport === 'compliance') {
                  handleExportToExcel('تقرير_متابعة_الاتصال_والالتزام_العسكري', complianceColumns, filteredRecords);
                } else if (activeReport === 'monthly') {
                  exportMonthlyReportToExcelStyled();
                } else if (activeReport === 'medical') {
                  // Custom export for medical stats
                  const medHeaders = 'م,التشخيص الطبي التفصيلي,عدد المجندين,متوسط مدة الإجازة (يوم),عدد المشافي المصدرة';
                  const medRows = diagnosisStats.map((d, i) => `${i+1},"${d.diagnosis.replace(/"/g, '""')}",${d.count},${d.avgDuration},${d.issuersCount}`);
                  const csvContent = '\uFEFF' + [`"تقرير تحليلات الأوبئة والتشخيصات الأكثر تكراراً"`, `"تاريخ الاستخراج:","${new Date().toISOString().substring(0, 10)}"`, '', medHeaders, ...medRows].join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `تقرير_التشخيصات_الطبية_${new Date().toISOString().substring(0, 10)}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  triggerToast('تم تصدير تقرير التشخيصات بنجاح', 'success');
                } else if (activeReport === 'readiness') {
                  const activeLeavesCount = records.filter(r => {
                    const start = new Date(r.startDate).getTime();
                    const end = new Date(r.endDate).getTime();
                    const now = new Date('2026-07-13').getTime();
                    return now >= start && now <= end;
                  }).length;
                  const evadersCount = records.filter(r => r.contactStatus === 'evading').length;
                  const readyCount = Math.max(0, totalPersonnel - activeLeavesCount - evadersCount);
                  const rate = Math.round((readyCount / totalPersonnel) * 100);

                  const medHeaders = 'المؤشر التكتيكي,القيمة العددية,الوصف والجاهزية';
                  const medRows = [
                    `إجمالي القوام البشري الأساسي,${totalPersonnel},القوام الكامل المسجل بقاعدة البيانات`,
                    `الأفراد المجازين طبياً حالياً,${activeLeavesCount},حالات نقاهة نشطة معتمدة`,
                    `المخالفين المتأخرين عن العودة,${evadersCount},حالات رصد ميداني نشطة للتهرب`,
                    `القوة الجاهزة والفعالة تكتيكياً,${readyCount},القوة المتواجدة والمتاحة بالميدان فورا`,
                    `نسبة الجاهزية الكلية للواء,${rate}%,مقارنة بحد الخطورة القيادي (${dangerThreshold}%)`
                  ];
                  const csvContent = '\uFEFF' + [`"تقرير ومؤشرات الجاهزية التكتيكية والإنذار المبكر للواء 43 عمالقة"`, `"تاريخ الاستخراج:","13 يوليو 2026"`, '', medHeaders, ...medRows].join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `تقرير_الجاهزية_والإنذار_المبكر_${new Date().toISOString().substring(0, 10)}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  triggerToast('تم تصدير تقرير مؤشرات الجاهزية بنجاح', 'success');
                } else {
                  handleExportToExcel('تقرير_سجل_كشف_الإجازات_المرضية_المفصل', ledgerColumns, filteredRecords);
                }
              }}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل أكسل Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-right">
        {[
          { id: 'summary', label: 'التقرير الإحصائي العام', icon: TrendingUp, desc: 'تحليل توزيع الرتب والنوع والوحدات' },
          { id: 'monthly', label: 'التقرير الشهري للعمل', icon: CalendarRange, desc: 'تفصيل الإجازات وإحصائيات الشهر' },
          { id: 'custom_ledger', label: 'كشف مخصص مفصل', icon: FileSpreadsheet, desc: 'استخراج كشف دقيق وفلترة مرنة للبيانات' },
          { id: 'compliance', label: 'تقرير المتابعة والاتصال', icon: Users, desc: 'حالة تواصل المجندين والمتهربين' },
          { id: 'medical', label: 'تحليل الأوبئة والتشخيصات', icon: Activity, desc: 'التشخيصات الأكثر تكراراً والمشافي' },
          { id: 'readiness', label: 'تنبؤ الجاهزية والإنذار', icon: Layers, desc: 'حساب نسبة الجاهزية الميدانية للقتال والإنذار بالخطر' }
        ].map((tab) => {
          const isSelected = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveReport(tab.id as ReportType);
                if (tab.id === 'monthly') {
                  setIsMonthlyFullScreen(true);
                }
              }}
              className={`p-4 rounded-2xl text-right border transition-all cursor-pointer flex flex-col justify-between min-h-[100px] ${
                isSelected
                  ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850/50'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${isSelected ? 'text-slate-950' : 'text-amber-500'}`} />
              <div className="mt-2">
                <span className="text-xs font-black block">{tab.label}</span>
                <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-slate-800' : 'text-slate-400 dark:text-slate-500'}`}>{tab.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Global Report Filter Panel (visible in ledger and compliance) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 text-right shadow-sm">
        <div className="flex items-center gap-2 font-black text-xs text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <Filter className="w-4 h-4 text-amber-500" />
          <span>تحديد نطاق التقرير (معايير التصفية والفلترة)</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {/* Unit Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">الوحدة العسكرية / الكتيبة</label>
            <div className="relative">
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">كل الوحدات</option>
                {uniqueUnits.filter(u => u !== 'all').map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rank Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">الرتبة العسكرية</label>
            <div className="relative">
              <select
                value={selectedRank}
                onChange={(e) => setSelectedRank(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">كل الرتب</option>
                {uniqueRanks.filter(r => r !== 'all').map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Leave Type Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">نوع الإجازة</label>
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">جميع الأنواع</option>
                <option value="مريض">مرضية (مريض)</option>
                <option value="مرافق">مرافق مريض</option>
                <option value="مرض قريب">مرض قريب</option>
                <option value="حادث">إصابة عمل/حادث</option>
              </select>
            </div>
          </div>

          {/* Contact Status Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">حالة الاتصال والامتثال</label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">لم يتم التواصل</option>
                <option value="confirmed">تم التأكيد بالعودة</option>
                <option value="request_extension">طلب تمديد إجازة</option>
                <option value="no_answer">لا يرد / مغلق</option>
                <option value="evading">متهرب ومخالف</option>
              </select>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">من تاريخ الإجازة</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-3 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">إلى تاريخ الإجازة</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-3 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Action reset options */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50 dark:border-slate-850">
          <span className="text-slate-400">عدد سجلات الإجازة ضمن معايير الفلترة المحددة: <span className="font-mono font-black text-amber-500">{filteredRecords.length} مجند</span></span>
          <button
            type="button"
            onClick={() => {
              setSelectedUnit('all');
              setSelectedRank('all');
              setSelectedType('all');
              setSelectedStatus('all');
              setStartDate('');
              setEndDate('');
              triggerToast('تمت إعادة تهيئة فلاتر التقرير', 'info');
            }}
            className="text-slate-500 hover:text-amber-500 font-bold transition-all"
          >
            إعادة تعيين الافتراضي
          </button>
        </div>
      </div>

      {/* Dynamic Report Content based on selected tab */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: SUMMARY REPORT */}
        {activeReport === 'summary' && (
          <motion.div
            key="summary_report"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="space-y-6"
          >
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-right">
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 block">إجمالي مجندي الإجازات بالكتيبة</span>
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">{filteredRecords.length}</span>
                </div>
                <div className="p-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 block">مرضية صريحة (مريض)</span>
                  <span className="text-2xl font-black font-mono text-emerald-500">
                    {filteredRecords.filter(r => r.type === 'مريض').length}
                  </span>
                </div>
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 block">إصابات عسكرية وحوادث</span>
                  <span className="text-2xl font-black font-mono text-rose-500">
                    {filteredRecords.filter(r => r.type === 'حادث').length}
                  </span>
                </div>
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 block">حالات التهرب والغياب المرصودة</span>
                  <span className="text-2xl font-black font-mono text-amber-500">
                    {filteredRecords.filter(r => r.contactStatus === 'evading').length}
                  </span>
                </div>
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
                  <Info className="w-5 h-5" />
                </div>
              </div>

            </div>

            {/* Matrix tables for general breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Rank distribution matrix */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 text-right shadow-sm">
                <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 justify-start border-b border-slate-100 dark:border-slate-850 pb-3">
                  <Layers className="w-4.5 h-4.5 text-amber-500" />
                  <span>توزيع الحالات المرضية بحسب الرتب العسكرية</span>
                </h3>
                
                <div className="space-y-2">
                  {Array.from(new Set(filteredRecords.map(r => r.rank))).map(rank => {
                    const count = filteredRecords.filter(r => r.rank === rank).length;
                    const percentage = filteredRecords.length > 0 ? Math.round((count / filteredRecords.length) * 100) : 0;
                    return (
                      <div key={rank} className="space-y-1 text-xs">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-slate-800 dark:text-slate-200">{rank}</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">{count} مجند ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {filteredRecords.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">لا توجد سجلات كافية لحساب توزيع الرتب</p>
                  )}
                </div>
              </div>

              {/* Units distribution matrix */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 text-right shadow-sm">
                <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 justify-start border-b border-slate-100 dark:border-slate-850 pb-3">
                  <Building className="w-4.5 h-4.5 text-amber-500" />
                  <span>توزيع الحالات المرضية بحسب السرايا والكتائب</span>
                </h3>
                
                <div className="space-y-2">
                  {Array.from(new Set(filteredRecords.map(r => r.unit || 'اللواء 43 عمالقة'))).map(unit => {
                    const count = filteredRecords.filter(r => (r.unit || 'اللواء 43 عمالقة') === unit).length;
                    const percentage = filteredRecords.length > 0 ? Math.round((count / filteredRecords.length) * 100) : 0;
                    return (
                      <div key={unit} className="space-y-1 text-xs">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-slate-800 dark:text-slate-200">{unit}</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">{count} مجند ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {filteredRecords.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">لا توجد سجلات كافية لحساب توزيع الوحدات</p>
                  )}
                </div>
              </div>

            </div>

            {/* Medical Leave Issuer breakdown analysis list */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 text-right shadow-sm">
              <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 justify-start border-b border-slate-100 dark:border-slate-850 pb-3">
                <MapPin className="w-4.5 h-4.5 text-amber-500" />
                <span>إحصائيات جهات ومستشفيات إصدار التقارير الطبية</span>
              </h3>
              
              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-450 font-bold border-b border-slate-100 dark:border-slate-850">
                      <th className="py-2.5 px-3 text-right">مستشفى / مركز الإصدار المعتمد</th>
                      <th className="py-2.5 px-3 text-center">عدد التقارير الصادرة منه</th>
                      <th className="py-2.5 px-3 text-center">النسبة من إجمالي الكشف</th>
                      <th className="py-2.5 px-3 text-right">أهم التشخيصات المرتبطة به</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(new Set(filteredRecords.map(r => r.issuer).filter(Boolean))).map((issuer, idx) => {
                      const count = filteredRecords.filter(r => r.issuer === issuer).length;
                      const percentage = filteredRecords.length > 0 ? Math.round((count / filteredRecords.length) * 100) : 0;
                      const uniqueDiag = Array.from(new Set(filteredRecords.filter(r => r.issuer === issuer).map(r => r.diagnosis))).slice(0, 2).join('، ');
                      return (
                        <tr key={issuer} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 font-medium">
                          <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-bold">{issuer}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">{count}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="font-mono text-slate-500 dark:text-slate-400">{percentage}%</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{uniqueDiag || 'غير محدد'}</td>
                        </tr>
                      );
                    })}
                    {filteredRecords.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">لا توجد بيانات متاحة لعرضها في مستشفيات الإصدار</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </motion.div>
        )}

        {/* TAB: MONTHLY REPORT */}
        {activeReport === 'monthly' && (
          <motion.div
            key="monthly_report"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="space-y-6"
          >
            {/* Month & Year Selectors Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-right shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-black text-xs text-slate-800 dark:text-white">
                  <CalendarRange className="w-5 h-5 text-amber-500" />
                  <span>تحديد فترة التقرير الشهري العسكري الشامل</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold hidden md:inline">
                    تتكامل هذه الأداة مع قواعد بيانات السيطرة العسكرية لاستخراج الجداول والبيانات بصيغ رسمية معتمدة.
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMonthlyFullScreen(true)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>عرض ملء الشاشة</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Month Select */}
                  <div className="space-y-1.5 min-w-[200px]">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">اختر الشهر المالي والميداني</label>
                    <select
                      value={selectedReportMonth}
                      onChange={(e) => setSelectedReportMonth(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      {[
                        { value: '01', label: 'يناير (01) - كانون الثاني' },
                        { value: '02', label: 'فبراير (02) - شباط' },
                        { value: '03', label: 'مارس (03) - آذار' },
                        { value: '04', label: 'أبريل (04) - نيسان' },
                        { value: '05', label: 'مايو (05) - أيار' },
                        { value: '06', label: 'يونيو (06) - حزيران' },
                        { value: '07', label: 'يوليو (07) - تموز' },
                        { value: '08', label: 'أغسطس (08) - آب' },
                        { value: '09', label: 'سبتمبر (09) - أيلول' },
                        { value: '10', label: 'أكتوبر (10) - تشرين الأول' },
                        { value: '11', label: 'نوفمبر (11) - تشرين الثاني' },
                        { value: '12', label: 'ديسمبر (12) - كانون الأول' }
                      ].map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year Select */}
                  <div className="space-y-1.5 min-w-[120px]">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">السنة</label>
                    <select
                      value={selectedReportYear}
                      onChange={(e) => setSelectedReportYear(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      {['2024', '2025', '2026', '2027'].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-850 text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-bold">فترة الفلترة النشطة</span>
                  <span className="font-mono text-xs font-black text-amber-500">{selectedReportYear}-{selectedReportMonth}</span>
                </div>
              </div>
            </div>

            {/* Advanced Tactical Health & Fatigue Strain Row */}
            {(() => {
              const activeLeavesCount = monthlyFilteredRecords.length;
              const evadersCount = monthlyFilteredRecords.filter(r => r.contactStatus === 'evading').length;
              const stressScore = Math.min(100, Math.round(((activeLeavesCount * 4 + evadersCount * 8) / (totalPersonnel || 1200)) * 100));
              
              const getStressLevelLabel = (score: number) => {
                if (score < 8) return { label: 'مستقر وآمن جداً (أقل من 8%)', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', desc: 'القوى البشرية المتواجدة بالميدان تغطي كافة المحاور العسكرية دون ضغوط.' };
                if (score < 18) return { label: 'مستقر وضغط منخفض (8% - 18%)', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20', desc: 'توجد إجازات وحالات نقاهة طبيعية، الموقف التكتيكي العام تحت السيطرة.' };
                if (score < 30) return { label: 'إجهاد تكتيكي متوسط (18% - 30%)', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', desc: 'ارتفاع طفيف في حالات الغياب الصحي. يتطلب مراقبة تكرار الإجازات للكتائب.' };
                return { label: 'إجهاد عالي وضغط عملياتي حرج (فوق 30%)', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', desc: 'عجز بشري حرج في القوام الميداني بسبب الإجازات الطبية والتهرب. يتطلب تدخلاً قيادياً عاجلاً.' };
              };
              const stressLevel = getStressLevelLabel(stressScore);

              return (
                <div className="space-y-6">
                  {/* Launcher Grid - 5 items */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-right">
                    {/* Item 1: إجمالي إجازات الشهر */}
                    <motion.div
                      whileHover={{ scale: 1.02, translateY: -2 }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between transition-all relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-indigo-500 to-indigo-600 opacity-80" />
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                          {activeLeavesCount}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs">إجمالي إجازات الشهر</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-none">
                          طلب إجازة معتمد
                        </p>
                      </div>
                    </motion.div>

                    {/* Item 2: إجمالي أيام الإجازات */}
                    <motion.div
                      whileHover={{ scale: 1.02, translateY: -2 }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between transition-all relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-pink-500 to-pink-600 opacity-80" />
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-pink-50 dark:bg-pink-950/30 text-pink-500 rounded-xl">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                          {totalMonthlyDays}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs">إجمالي أيام الإجازات</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-none">
                          يوم مستهلك بالشهر
                        </p>
                      </div>
                    </motion.div>

                    {/* Item 3: متوسط مدة الإجازة */}
                    <motion.div
                      whileHover={{ scale: 1.02, translateY: -2 }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between transition-all relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-cyan-500 to-cyan-600 opacity-80" />
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-500 rounded-xl">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                          {averageMonthlyDuration}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs">متوسط مدة الإجازة</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-none">
                          يوم لكل فرد
                        </p>
                      </div>
                    </motion.div>

                    {/* Item 4: مؤكد العودة والالتزام */}
                    <motion.div
                      whileHover={{ scale: 1.02, translateY: -2 }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between transition-all relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-emerald-500 to-emerald-600 opacity-80" />
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-xl">
                          <UserCheck className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                          {monthlyFilteredRecords.filter(r => r.contactStatus === 'confirmed').length}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs">مؤكد العودة والالتزام</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-none">
                          مجند أكد عودته بنجاح
                        </p>
                      </div>
                    </motion.div>

                    {/* Item 5: المخالفين والمتهربين */}
                    <motion.div
                      whileHover={{ scale: 1.02, translateY: -2 }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between transition-all relative overflow-hidden group col-span-2 sm:col-span-1"
                    >
                      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-rose-500 to-rose-600 opacity-80" />
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-xl">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                          {evadersCount}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs">المخالفين والمتهربين</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-none">
                          رصد ميداني نشط
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Operational Health Fatigue Strain Gauge */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between text-right gap-4">
                    <div className="space-y-1 md:max-w-md">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          مؤشر الإجهاد والضغط الصحي للواء
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                        يتم حساب نسبة الإجهاد بناءً على إجمالي أيام الإجازات وحالات التهرب الفعلي مقارنة بالقوة المتاحة للواء ({totalPersonnel} فرد).
                      </p>
                    </div>

                    <div className="flex-1 max-w-lg space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-500">
                        <span>الموقف العملياتي: <span className="text-amber-500">{stressLevel.label}</span></span>
                        <span className={`px-2 py-0.5 rounded border ${stressLevel.color}`}>
                          {stressScore}% جهد
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-200/50 dark:border-slate-850">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            stressScore < 10 ? 'bg-emerald-500' :
                            stressScore < 25 ? 'bg-indigo-500' :
                            stressScore < 45 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.max(4, stressScore)}%` }}
                        />
                      </div>
                      <p className="text-[9.5px] text-slate-400 font-bold leading-relaxed text-left">
                        {stressLevel.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Core Split Section (Right: List with filters, Left: Analysis Panels) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* RIGHT SIDE: Interactive Scedules & Details Table (Col span 2) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 text-right shadow-sm lg:col-span-2 flex flex-col justify-between">
                <div className="space-y-4">
                  
                  {/* Table Header with Stats count */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 dark:border-slate-850 pb-3">
                    <div className="space-y-1">
                      <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 justify-start">
                        <FileText className="w-4.5 h-4.5 text-amber-500" />
                        <span>سجل كشف الإجازات التفصيلي لشهر {selectedReportMonth} لعام {selectedReportYear}</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold">
                        تصفح وابحث في كافة الإجازات المرضية الموثقة والمرصودة عسكرياً وطبياً خلال الشهر المختار.
                      </p>
                    </div>
                    <div className="font-mono text-[10px] font-black bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-850 text-slate-500 shrink-0">
                      مصفى: <span className="text-amber-500">{searchedAndFilteredMonthlyRecords.length}</span> من <span className="text-slate-800 dark:text-slate-200">{monthlyFilteredRecords.length}</span> مجند
                    </div>
                  </div>

                  {/* Advanced Inline Search & Filter Bar */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/80 dark:border-slate-850 grid grid-cols-1 sm:grid-cols-3 gap-2 text-right">
                    {/* Text Search Input */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                      <input
                        type="text"
                        value={monthlyTableSearch}
                        onChange={(e) => setMonthlyTableSearch(e.target.value)}
                        placeholder="ابحث بالاسم، الرتبة، الكتيبة، التشخيص..."
                        className="w-full pl-3 pr-9 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-400"
                      />
                      {monthlyTableSearch && (
                        <button
                          type="button"
                          onClick={() => setMonthlyTableSearch('')}
                          className="absolute left-2.5 top-2 hover:text-rose-500 text-slate-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Filter by Type */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black text-slate-400 shrink-0">التصنيف:</span>
                      <select
                        value={monthlyTypeFilter}
                        onChange={(e) => setMonthlyTypeFilter(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="all">جميع الإجازات</option>
                        <option value="مريض">إجازة مريض صريحة</option>
                        <option value="مرافق">مرافق مريض</option>
                        <option value="مرض قريب">مرض قريب</option>
                        <option value="حادث">إصابة عمل/حادث عسكري</option>
                      </select>
                    </div>

                    {/* Filter by Status */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black text-slate-400 shrink-0">المتابعة:</span>
                      <select
                        value={monthlyStatusFilter}
                        onChange={(e) => setMonthlyStatusFilter(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="all">جميع الحالات</option>
                        <option value="confirmed">تم التأكيد بالعودة</option>
                        <option value="evading">متهرب ونشط</option>
                        <option value="request_extension">طلب تمديد إجازة</option>
                        <option value="no_answer">لم يتم الرد</option>
                        <option value="pending">قيد الانتظار</option>
                      </select>
                    </div>
                  </div>

                  {/* Table Element */}
                  <div className="overflow-x-auto text-xs border border-slate-100 dark:border-slate-850 rounded-xl">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-450 font-bold border-b border-slate-150 dark:border-slate-850">
                          <th className="py-2.5 px-3 text-center w-12">م</th>
                          <th className="py-2.5 px-3 text-right">الاسم والرتبة</th>
                          <th className="py-2.5 px-3 text-right">الوحدة والسرية</th>
                          <th className="py-2.5 px-3 text-right">التصنيف والتشخيص</th>
                          <th className="py-2.5 px-3 text-center">الفترة الزمنية المعتمدة</th>
                          <th className="py-2.5 px-3 text-center">الالتزام والمتابعة</th>
                          <th className="py-2.5 px-3 text-center w-16 no-print">إجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchedAndFilteredMonthlyRecords.map((r, idx) => (
                          <tr key={r.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 font-medium transition-colors">
                            <td className="py-2.5 px-3 text-center font-mono text-slate-450">{idx + 1}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">{r.name}</span>
                              <span className="text-[10px] text-slate-450 font-mono block">{r.rank} ({r.id})</span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400 font-semibold">{r.unit || 'اللواء 43 عمالقة'}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 block">
                                {translateType(r.type)}
                              </span>
                              <span className="text-[9px] text-slate-400 block truncate max-w-[150px]" title={r.diagnosis}>
                                {r.diagnosis || 'بدون تشخيص تفصيلي'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-[10.5px] text-slate-500 whitespace-nowrap">
                              {r.startDate} إلى {r.endDate}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${getStatusColor(r.contactStatus)}`}>
                                {translateStatus(r.contactStatus)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center no-print">
                              {onDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRecord(r)}
                                  title="حذف الإجازة من القيود"
                                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {searchedAndFilteredMonthlyRecords.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-450 font-bold bg-slate-500/5">
                              {monthlyFilteredRecords.length === 0 
                                ? `لا توجد أي إجازات مرضية مسجلة في هذا الشهر المحدد (${selectedReportMonth}-${selectedReportYear})`
                                : `لا توجد نتائج مطابقة لبحثك المصفى ضمن سجلات هذا الشهر`
                              }
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>

                {/* Reset Search Helper if active */}
                {(monthlyTableSearch || monthlyTypeFilter !== 'all' || monthlyStatusFilter !== 'all') && (
                  <div className="pt-2 text-left">
                    <button
                      type="button"
                      onClick={() => {
                        setMonthlyTableSearch('');
                        setMonthlyTypeFilter('all');
                        setMonthlyStatusFilter('all');
                      }}
                      className="text-[10px] text-amber-600 hover:text-amber-700 font-black cursor-pointer underline decoration-dotted"
                    >
                      إعادة تعيين فلاتر البحث وعرض الكشف الكامل للشهر
                    </button>
                  </div>
                )}
              </div>

              {/* LEFT SIDE: Advanced Analytics & Guidelines panels (Col span 1) */}
              <div className="space-y-6 lg:col-span-1">

                {/* Card A: Battalion & Unit Leave Leaderboard */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 text-right shadow-sm">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 justify-start border-b border-slate-100 dark:border-slate-850 pb-3">
                    <Layers className="w-4.5 h-4.5 text-indigo-500" />
                    <span>توزيع الإجازات بحسب سرايا وكتائب اللواء</span>
                  </h3>

                  <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                    {monthlyUnitDistribution.map((item) => (
                      <div key={item.unit} className="space-y-1 text-xs">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-slate-800 dark:text-slate-200">{item.unit}</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">
                            {item.count} مجند <span className="text-[10px] text-slate-400">({item.percentage}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-200/40 dark:border-slate-850">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {monthlyUnitDistribution.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6">لا توجد بيانات توزيع للكتائب في هذا الشهر لحساب التوزيع الميداني</p>
                    )}
                  </div>
                </div>

                {/* Card B: Seasonal Disease Proactive Prediction */}
                {(() => {
                  const seasonalInfo = getSeasonalInfo(selectedReportMonth);
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 text-right shadow-sm">
                      <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 justify-start border-b border-slate-100 dark:border-slate-850 pb-3">
                        <Activity className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                        <span>التنبؤ والإنذار الصحي الموسمي لشهر الرصد</span>
                      </h3>

                      <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${seasonalInfo.alertColor}`}>
                        <div className="font-extrabold text-xs mb-1.5 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-current shrink-0" />
                          <span>{seasonalInfo.title}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-350 font-medium">
                          {seasonalInfo.desc}
                        </p>
                      </div>

                      <div className="space-y-2 text-[10.5px]">
                        <span className="text-[10px] font-black text-slate-400 block uppercase">توجيهات وقائية إجبارية مرافقة:</span>
                        <ul className="space-y-1.5 pr-2 list-disc list-inside text-slate-500 dark:text-slate-400 font-bold">
                          {seasonalInfo.actions.map((act, i) => (
                            <li key={i} className="leading-normal">
                              {act}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}

                {/* Card C: Editable & Persistent Doctor's Duty Logs */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 text-right shadow-sm">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 justify-start border-b border-slate-100 dark:border-slate-850 pb-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                    <span>توصيات وقرارات اللجنة الطبية لـ {selectedReportMonth}-{selectedReportYear}</span>
                  </h3>

                  <div className="space-y-2 text-xs">
                    <label className="text-[9.5px] font-black text-slate-400 block">
                      دون قرارات استثنائية أو توجيهات صحية قيادية لحفظها في هذا التقرير الشهري:
                    </label>
                    <textarea
                      value={monthlyNotesInput}
                      onChange={(e) => setMonthlyNotesInput(e.target.value)}
                      placeholder="اكتب التوجيهات الطبية للواء هنا..."
                      rows={4}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const key = `monthly_notes_${selectedReportYear}_${selectedReportMonth}`;
                          localStorage.setItem(key, monthlyNotesInput);
                          triggerToast('تم حفظ توصيات وقرارات اللجنة الطبية بنجاح للشهر المحدد وتثبيتها بالتقرير!', 'success');
                        } catch (err) {
                          triggerToast('فشل حفظ التوصيات الطبية في الذاكرة المحلية.', 'error');
                        }
                      }}
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 text-white dark:bg-slate-800 dark:hover:bg-slate-750 text-[10.5px] font-black rounded-xl transition-all cursor-pointer text-center block active:scale-95 border border-slate-800 dark:border-slate-700"
                    >
                      حفظ التوصيات للشهر المالي
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 2: CUSTOM DETAILED LEDGER */}
        {activeReport === 'custom_ledger' && (
          <motion.div
            key="ledger_report"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="space-y-4"
          >
            {/* Ledger Results Table preview */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm text-right">
              
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">معاينة كشف الإجازات الطبية التفصيلي</h4>
                  <p className="text-[10px] text-slate-400">يمكنك النقر على زر التصدير بالأعلى لحفظ الكشف كملف Excel كامل.</p>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto font-mono text-[10.5px] font-bold text-slate-400">
                  <span>تم العثور على:</span>
                  <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">{filteredRecords.length} سجل مطابق</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-slate-950/50 text-slate-450 font-bold border-b border-slate-150 dark:border-slate-800">
                      <th className="py-3 px-3 text-center w-12">م</th>
                      <th className="py-3 px-3 text-right">المعرف العسكري</th>
                      <th className="py-3 px-3 text-right">الاسم الكامل</th>
                      <th className="py-3 px-3 text-right">الرتبة</th>
                      <th className="py-3 px-3 text-right">الوحدة الكتيبة</th>
                      <th className="py-3 px-3 text-right">تصنيف الإجازة</th>
                      <th className="py-3 px-3 text-right">التشخيص الطبي</th>
                      <th className="py-3 px-3 text-center">تاريخ البدء</th>
                      <th className="py-3 px-3 text-center">تاريخ الانتهاء</th>
                      <th className="py-3 px-3 text-center">حالة المتابعة</th>
                      <th className="py-3 px-3 text-center w-16 no-print">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r, index) => (
                      <tr key={r.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 font-medium">
                        <td className="py-3 px-3 text-center font-mono text-slate-400">{index + 1}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-600 dark:text-slate-400">{r.id}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800 dark:text-slate-200">{r.name}</td>
                        <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">{r.rank}</td>
                        <td className="py-3 px-3 text-right text-slate-500 dark:text-slate-400">{r.unit || 'اللواء 43 عمالقة'}</td>
                        <td className="py-3 px-3 text-right">
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold text-[10px]">
                            {translateType(r.type)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400 max-w-[150px] truncate" title={r.diagnosis}>
                          {r.diagnosis}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">{r.startDate}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">{r.endDate}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${getStatusColor(r.contactStatus)}`}>
                            {translateStatus(r.contactStatus)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center no-print">
                          {onDelete && (
                            <button
                              onClick={() => handleDeleteRecord(r)}
                              title="حذف الإجازة"
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredRecords.length === 0 && (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400">لا توجد سجلات مطابقة لمعايير الفلترة المحددة</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 3: COMPLIANCE AND CONTACT STATUS */}
        {activeReport === 'compliance' && (
          <motion.div
            key="compliance_report"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="space-y-6"
          >
            {/* Evading and No Answer focus alarm lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Box 1: Evading soldiers (متهرب غياب) */}
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 text-right space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-rose-500 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>متهرب ومخالف للأوامر عسكرياً</span>
                  </span>
                  <span className="px-2 py-0.5 bg-rose-500 text-white rounded-lg text-[10px] font-black font-mono">
                    {filteredRecords.filter(r => r.contactStatus === 'evading').length} متهرب
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  توضح هذه القائمة الأفراد الذين ثبت تهربهم بعد انتهاء الإجازة الطبية ولم يستجيبوا للأوامر المباشرة بالعودة للميدان، والذين تجب إحالتهم للشؤون القانونية للواء.
                </p>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-slate-800/60 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredRecords.filter(r => r.contactStatus === 'evading').map(r => (
                    <div key={r.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-850/20">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{r.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{r.rank} - {r.unit || 'اللواء 43 عمالقة'}</span>
                      </div>
                      <span className="text-[10px] text-rose-500 font-bold">تاريخ الانتهاء: {r.endDate}</span>
                    </div>
                  ))}
                  {filteredRecords.filter(r => r.contactStatus === 'evading').length === 0 && (
                    <p className="text-[10px] text-slate-400 text-center py-6">لا توجد حالات تهرب نشطة مرصودة حالياً</p>
                  )}
                </div>
              </div>

              {/* Box 2: No Answer (لا يرد مغلق) */}
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 text-right space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-indigo-500 text-xs flex items-center gap-1.5">
                    <Info className="w-4 h-4" />
                    <span>منقطع الاتصال (لا يرد / الهاتف مغلق)</span>
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-500 text-white rounded-lg text-[10px] font-black font-mono">
                    {filteredRecords.filter(r => r.contactStatus === 'no_answer').length} حالة
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  سجلات المجندين الذين لم تنجح محاولات التواصل المباشر معهم بسبب إغلاق الهواتف أو عدم الرد، مما يتطلب إرسال مندوب طبي للعنوان السكني المدون.
                </p>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-slate-800/60 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredRecords.filter(r => r.contactStatus === 'no_answer').map(r => (
                    <div key={r.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-850/20">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{r.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{r.rank} - {r.unit || 'اللواء 43 عمالقة'}</span>
                      </div>
                      <span className="text-[10px] text-indigo-500 font-bold">مجموع الاتصال: {r.contactLogs?.length || 0} مرات</span>
                    </div>
                  ))}
                  {filteredRecords.filter(r => r.contactStatus === 'no_answer').length === 0 && (
                    <p className="text-[10px] text-slate-400 text-center py-6">جميع هواتف الأفراد المجندين مستقرة ومستجيبة</p>
                  )}
                </div>
              </div>

            </div>

            {/* Compliance master report table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm text-right">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-850">
                <h4 className="text-xs font-black text-slate-900 dark:text-white">سجل متابعة المجندين ومستويات التواصل الميدانية</h4>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-slate-950/50 text-slate-450 font-bold border-b border-slate-150 dark:border-slate-800">
                      <th className="py-2.5 px-3 text-center w-12">م</th>
                      <th className="py-2.5 px-3 text-right">اسم المجند ورتبته</th>
                      <th className="py-2.5 px-3 text-right">الوحدة والكتيبة</th>
                      <th className="py-2.5 px-3 text-center">تاريخ الإجازة</th>
                      <th className="py-2.5 px-3 text-center">حالة الاتصال والعودة</th>
                      <th className="py-2.5 px-3 text-center">محاولات الاتصال</th>
                      <th className="py-2.5 px-3 text-right">آخر ملاحظة اتصال مسجلة</th>
                      <th className="py-2.5 px-3 text-center w-16 no-print">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r, index) => (
                      <tr key={r.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 font-medium">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-450">{index + 1}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{r.name}</span>
                          <span className="text-[10px] text-slate-400 block">{r.rank}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-550 dark:text-slate-400">{r.unit || 'اللواء 43 عمالقة'}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500 text-[10.5px]">
                          {r.startDate} إلى {r.endDate}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${getStatusColor(r.contactStatus)}`}>
                            {translateStatus(r.contactStatus)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                          {r.contactLogs?.length || 0} مرات
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-450 max-w-xs truncate" title={r.notes}>
                          {r.contactLogs && r.contactLogs.length > 0 
                            ? r.contactLogs[r.contactLogs.length - 1].note 
                            : r.notes || 'لم تسجل ملاحظات اتصال'}
                        </td>
                        <td className="py-2.5 px-3 text-center no-print">
                          {onDelete && (
                            <button
                              onClick={() => handleDeleteRecord(r)}
                              title="حذف الإجازة"
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredRecords.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">لا توجد سجلات لمتابعة الاتصال حالياً</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: MEDICAL DIAGNOSIS AND EPIDEMIOLOGY */}
        {activeReport === 'medical' && (
          <motion.div
            key="medical_report"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="space-y-6"
          >
            {/* Explanation box */}
            <div className="bg-slate-500/5 p-4 rounded-2xl border border-slate-500/10 flex items-start gap-3 text-right text-xs text-slate-500 dark:text-slate-400">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-extrabold text-slate-850 dark:text-slate-200 block">منظومة رصد الأوبئة وتكرار التشخيصات الطبية:</span>
                <p className="leading-relaxed text-[11px]">
                  يقوم هذا التقرير بتحليل الأسباب المرضية والتشخيصات المسجلة للوقوف على المشاكل الطبية الأكثر شيوعاً بين الأفراد (كالملاريا، الحميات، الكسور، أمراض القلب) وحساب متوسط فترات النقاهة لتخطيط الجاهزية القتالية والميدانية للكتيبة.
                </p>
              </div>
            </div>

            {/* Top Medical issues list */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm text-right">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-850">
                <h4 className="text-xs font-black text-slate-900 dark:text-white">جدول تحليل التشخيصات المرضية ومؤشرات مدة الاستشفاء</h4>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-slate-950/50 text-slate-450 font-bold border-b border-slate-150 dark:border-slate-800">
                      <th className="py-3 px-3 text-center w-12">م</th>
                      <th className="py-3 px-4 text-right">التشخيص الطبي المرصود بالتقرير</th>
                      <th className="py-3 px-4 text-center">عدد الحالات المرضية باللواء</th>
                      <th className="py-3 px-4 text-center">متوسط مدة الإجازة الممنوحة</th>
                      <th className="py-3 px-4 text-center">عدد المستشفيات المختلفة التي شخصته</th>
                      <th className="py-3 px-4 text-right">الحالة والخطورة التخطيطية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diagnosisStats.map((d, index) => (
                      <tr key={d.diagnosis} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 font-medium">
                        <td className="py-3 px-3 text-center font-mono text-slate-450">{index + 1}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200">{d.diagnosis}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 dark:text-white">{d.count} مجند</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">{d.avgDuration} يوم نقاهة</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">{d.issuersCount} مشفى مصدر</td>
                        <td className="py-3 px-4 text-right">
                          {d.avgDuration > 15 ? (
                            <span className="text-rose-500 font-bold flex items-center gap-1 text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>فترة استشفاء طويلة (جاهزية حرجة)</span>
                            </span>
                          ) : (
                            <span className="text-emerald-500 font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>فترة نقاهة قصيرة وعودة قريبة</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {diagnosisStats.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">لا توجد بيانات تشخيصية كافية للتحليل</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 6: TACTICAL READINESS AND RISK FORECASTING */}
        {activeReport === 'readiness' && (
          <motion.div
            key="readiness_report"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="space-y-4 text-right animate-fade-in"
          >
            {/* Top Explanation & Live Status Overview */}
            <div className="bg-slate-500/5 p-4 rounded-xl border border-slate-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-850 dark:text-slate-200 block text-sm">منظومة تنبؤ الجاهزية الميدانية والتحليل التكتيكي للإنذار:</span>
                  <p className="leading-relaxed text-[11px] text-slate-500 dark:text-slate-400">
                    تقوم هذه الأداة بحساب القوى البشرية الفعالة للواء حالياً مع خصم الإجازات النشطة وحالات التهرب، وتوفر نموذج محاكاة مرن لتقدير نسبة الكفاءة القتالية ومستوى الخطورة العملياتية بالتاريخ الفعلي للرصد.
                  </p>
                </div>
              </div>
              <div className="bg-slate-100 dark:bg-slate-850/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 self-stretch md:self-auto flex flex-col justify-center items-center">
                <span className="text-[10px] text-slate-400 block font-bold">تاريخ الرصد الفعلي المعتمد</span>
                <span className="text-xs font-black font-mono text-amber-500">13 يوليو 2026</span>
              </div>
            </div>

            {/* Interactive Simulator Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              
              {/* Simulator Settings Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <Layers className="w-4.5 h-4.5 text-amber-500" />
                    <span>تعديل معايير محاكاة الجاهزية</span>
                  </h3>

                  {/* Total Personnel Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 block">إجمالي القوام البشري الأساسي للواء</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="100"
                        max="10000"
                        value={totalPersonnel}
                        onChange={(e) => setTotalPersonnel(Math.max(100, Number(e.target.value)))}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="text-[11px] text-slate-500 font-bold shrink-0">فرد</span>
                    </div>
                  </div>

                  {/* Danger Threshold Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black">
                      <span className="text-slate-450">حد الخطورة العملياتية الأدنى</span>
                      <span className="font-mono text-amber-500">{dangerThreshold}% جاهزية</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="95"
                      step="1"
                      value={dangerThreshold}
                      onChange={(e) => setDangerThreshold(Number(e.target.value))}
                      className="w-full accent-amber-500 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg space-y-1">
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block">حول أرقام المحاكاة:</span>
                  <p className="text-[9.5px] text-slate-400 font-bold leading-relaxed">
                    يتم استخراج أعداد المجندين المتواجدين بالإجازات والتهرب من قاعدة البيانات بشكل مباشر وفوري لضمان دقة مؤشرات المحاكاة والجاهزية.
                  </p>
                </div>
              </div>

              {/* Dynamic Readiness Score Gauges Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between lg:col-span-2">
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <TrendingUp className="w-4.5 h-4.5 text-amber-500" />
                    <span>مستوى الكفاءة القتالية ومقاييس الخطورة الحالية</span>
                  </h3>

                  {/* Calculation Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 text-center">
                      <span className="text-[9px] text-slate-400 block font-bold">القوام البشري</span>
                      <span className="text-sm font-black font-mono text-slate-900 dark:text-white">{totalPersonnel}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 text-center">
                      <span className="text-[9px] text-slate-400 block font-bold">الإجازات النشطة</span>
                      <span className="text-sm font-black font-mono text-amber-500">
                        {records.filter(r => {
                          const start = new Date(r.startDate).getTime();
                          const end = new Date(r.endDate).getTime();
                          const now = new Date('2026-07-13').getTime();
                          return now >= start && now <= end;
                        }).length}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 text-center">
                      <span className="text-[9px] text-slate-400 block font-bold">المتهربين نشط</span>
                      <span className="text-sm font-black font-mono text-rose-500">
                        {records.filter(r => r.contactStatus === 'evading').length}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 text-center">
                      <span className="text-[9px] text-slate-400 block font-bold">القوة الجاهزة فعلياً</span>
                      <span className="text-sm font-black font-mono text-emerald-500">
                        {Math.max(0, totalPersonnel - 
                          records.filter(r => {
                            const start = new Date(r.startDate).getTime();
                            const end = new Date(r.endDate).getTime();
                            const now = new Date('2026-07-13').getTime();
                            return now >= start && now <= end;
                          }).length - 
                          records.filter(r => r.contactStatus === 'evading').length
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Big Indicator Display */}
                {(() => {
                  const activeLeavesCount = records.filter(r => {
                    const start = new Date(r.startDate).getTime();
                    const end = new Date(r.endDate).getTime();
                    const now = new Date('2026-07-13').getTime();
                    return now >= start && now <= end;
                  }).length;
                  const evadersCount = records.filter(r => r.contactStatus === 'evading').length;
                  const readyCount = Math.max(0, totalPersonnel - activeLeavesCount - evadersCount);
                  const rate = Math.round((readyCount / totalPersonnel) * 100 * 10) / 10;
                  const isDangerous = rate < dangerThreshold;

                  return (
                    <div className="mt-4 p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-950/50 dark:to-slate-900 border-slate-200 dark:border-slate-850">
                      <div className="space-y-1 text-center sm:text-right">
                        <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                          <span className={`w-2.5 h-2.5 rounded-full ${isDangerous ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                          <span className={`text-[10px] font-black uppercase ${isDangerous ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {isDangerous ? 'حالة جاهزية منخفضة وتحت مستوى حد الأمان' : 'حالة الجاهزية ممتازة وآمنة تكتيكياً'}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                          {isDangerous ? 'تنبيه القيادة: يتطلب استدعاء فوري أو تجميد الإجازات' : 'مؤشرات القوة البشرية في الحدود الخضراء المعتمدة للعمليات'}
                        </h4>
                        <p className="text-[10px] text-slate-450 font-semibold max-w-md">
                          نسبة الجاهزية المحسوبة للواء تبلغ <span className="font-mono text-slate-900 dark:text-white font-extrabold">{rate}%</span> مقارنة بالحد الأدنى المطلوب والبالغ <span className="font-mono font-bold text-amber-500">{dangerThreshold}%</span>.
                        </p>
                      </div>

                      <div className="flex flex-col items-center justify-center shrink-0 min-w-[120px] bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-250 dark:border-slate-850">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">نسبة الجاهزية الكلية</span>
                        <span className={`text-3xl font-black font-mono leading-none ${isDangerous ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {rate}%
                        </span>
                        <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black block mt-2 text-center uppercase ${isDangerous ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {isDangerous ? 'خطر حرج' : 'مستقر آمن'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Recovery forecast timeline and Tactical Command Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              
              {/* Timeline recovery forecast */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3.5">
                <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <Calendar className="w-4.5 h-4.5 text-amber-500" />
                  <span>الجدول الزمني لتناقص الإجازات وعودة القوى</span>
                </h3>

                {(() => {
                  const nowTime = new Date('2026-07-13').getTime();
                  const getReturningCount = (days: number) => {
                    return records.filter(r => {
                      const end = new Date(r.endDate).getTime();
                      const diffDays = (end - nowTime) / (1000 * 60 * 60 * 24);
                      return diffDays >= 0 && diffDays <= days;
                    }).length;
                  };

                  const returning3 = getReturningCount(3);
                  const returning7 = getReturningCount(7);
                  const returning15 = getReturningCount(15);

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-150 dark:border-slate-850 font-bold text-xs font-sans">
                        <div className="space-y-0.5">
                          <span className="text-slate-800 dark:text-slate-200 block">خلال الـ 3 أيام القادمة</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">تاريخ عودة أقصاه 16 يوليو 2026</span>
                        </div>
                        <span className="text-xs font-mono font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md">{returning3} أفراد</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-150 dark:border-slate-850 font-bold text-xs font-sans">
                        <div className="space-y-0.5">
                          <span className="text-slate-800 dark:text-slate-200 block">خلال الـ 7 أيام القادمة</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">تاريخ عودة أقصاه 20 يوليو 2026</span>
                        </div>
                        <span className="text-xs font-mono font-extrabold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-1 rounded-md">{returning7} أفراد</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-150 dark:border-slate-850 font-bold text-xs font-sans">
                        <div className="space-y-0.5">
                          <span className="text-slate-800 dark:text-slate-200 block">خلال الـ 15 يوماً القادمة</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">تاريخ عودة أقصاه 28 يوليو 2026</span>
                        </div>
                        <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">{returning15} أفراد</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Dynamic Tactical Directives Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3 lg:col-span-2 text-xs">
                <h3 className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800 font-sans">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                  <span>توجيهات ومصفوفة التوصيات القيادية والطبية للواء</span>
                </h3>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-[11px] leading-relaxed">
                  {/* Guideline 1: General rule */}
                  <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-emerald-800 dark:text-emerald-400 font-bold flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>توجيه الجاهزية الدورية:</strong> يُقترح توزيع مهام الكتائب الاحتياطية لتغطية العجز التراكمي للكتائب التي تعاني من غياب في التخصصات الفنية الحيوية كالهندسة والاتصالات السلكية.
                    </div>
                  </div>

                  {/* Guideline 2: Evaders warning */}
                  {records.filter(r => r.contactStatus === 'evading').length > 0 && (
                    <div className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-lg text-rose-800 dark:text-rose-400 font-bold flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <strong>توجيه الانضباط العسكري العاجل:</strong> تم رصد عدد <span className="font-mono text-rose-600 font-black">{records.filter(r => r.contactStatus === 'evading').length} متهربين</span> من العودة في الموعد المحدد. يوصى فوراً بتعميم بلاغات ضبط لقسم القوى البشرية ووقف صرف المخصصات المالية للحالات المحددة.
                      </div>
                    </div>
                  )}

                  {/* Guideline 3: Hospital/Disease warning */}
                  {(() => {
                    const activeLeavesCount = records.filter(r => {
                      const start = new Date(r.startDate).getTime();
                      const end = new Date(r.endDate).getTime();
                      const now = new Date('2026-07-13').getTime();
                      return now >= start && now <= end;
                    }).length;
                    return activeLeavesCount > 10 ? (
                      <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-lg text-amber-850 dark:text-amber-400 font-bold flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <strong>تحذير نسبة الاستشفاء:</strong> ارتفاع عدد الأفراد المجازين مرضياً حالياً يزيد الضغط على الأطقم الميدانية. يوصى بتأجيل تمديد الإجازات الاختيارية إلا لظروف قهرية لضمان استقرار قوام القوات.
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Guideline 4: Epidemic alert */}
                  <div className="p-2.5 bg-blue-500/5 border border-blue-500/10 rounded-lg text-indigo-800 dark:text-indigo-400 font-bold flex items-start gap-2">
                    <Activity className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>توصية الطب الوقائي:</strong> بناءً على التقارير المرفوعة للتشخيصات الموسمية، يوصى برفع جاهزية العيادة الطبية لمعسكر اللواء 43 وتأمين مخزون إضافي من الأدوية والمضادات الوقائية.
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Copier Brief Tool */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 text-right">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-850 dark:text-slate-200 block font-sans">مولد الإيجاز التكتيكي اليومي لقائد اللواء (Executive Tactical Brief Generator)</span>
                <p className="text-[10px] text-slate-400 font-semibold">يقوم بتركيب وإعداد نص ملخص عسكري رسمي جاهز للنسخ والإرسال لجهات القيادة العليا لشرح الموقف الطبي البشري بالكامل.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const activeLeavesCount = records.filter(r => {
                    const start = new Date(r.startDate).getTime();
                    const end = new Date(r.endDate).getTime();
                    const now = new Date('2026-07-13').getTime();
                    return now >= start && now <= end;
                  }).length;
                  const evadersCount = records.filter(r => r.contactStatus === 'evading').length;
                  const readyCount = Math.max(0, totalPersonnel - activeLeavesCount - evadersCount);
                  const rate = Math.round((readyCount / totalPersonnel) * 100);
                  const text = `بسم الله الرحمن الرحيم\nإلى/ سيادة قائد اللواء 43 عمالقة المحترم\nالموضوع: الإيجاز اليومي للجاهزية الطبية والبشرية ليوم 13 يوليو 2026\n\nنود إفادتكم بمؤشرات القوى البشرية والجاهزية الطبية الحالية للواء على النحو الآتي:\n1. إجمالي القوام الأساسي للواء: ${totalPersonnel} فرد\n2. القوة المجازة طبياً حالياً: ${activeLeavesCount} فرد\n3. الأفراد المخالفين المتأخرين عن العودة: ${evadersCount} فرد\n4. القوة الجاهزة والفعالة للميدان حالياً: ${readyCount} فرد\n5. نسبة الجاهزية الكلية الحالية للواء: ${rate}%\n\nالإجراءات الطبية الموصى بها:\n- تعميم بلاغات ضبط للأفراد المتأخرين فوراً.\n- تجميد الإجازات غير الطارئة لتعويض الفجوة القتالية.\n\nصادر عن/ الشعبة الطبية وسيطرة القوى البشرية - اللواء 43 عمالقة.`;
                  
                  navigator.clipboard.writeText(text);
                  triggerToast('تم توليد ونسخ الإيجاز العسكري بنجاح للكلية الحافظة!', 'success');
                }}
                className="px-4 py-2 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 text-xs font-black rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md shadow-amber-500/15"
              >
                <span>نسخ وتوليد الإيجاز التكتيكي</span>
              </button>
            </div>

          </motion.div>
        )}

      </AnimatePresence>

      <AnimatePresence>
        {isPrintModalOpen && (
          <div className="fixed inset-0 bg-slate-950/90 z-50 flex flex-col overflow-y-auto text-right no-print">
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #military-report-print-area, #military-report-print-area * {
                  visibility: visible !important;
                }
                #military-report-print-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 35px !important;
                  border: none !important;
                  background: white !important;
                  color: black !important;
                  box-shadow: none !important;
                  direction: rtl !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>

            {/* Modal Navigation Bar */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl z-50">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-755 text-slate-200 hover:text-white rounded-xl font-bold cursor-pointer text-xs flex items-center gap-1.5 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>إغلاق ومعاودة العمل</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black shadow-lg flex items-center gap-1.5 cursor-pointer transition-all text-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>بدء طباعة التقرير (Print)</span>
                </button>
              </div>

              <div className="flex items-center gap-3 flex-row-reverse">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Printer className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <h3 className="font-black text-sm text-white">
                    معاينة التقرير الطبي للطباعة الورقية
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">
                    قوات العمالقة - اللواء 43 عمالقة - الشعبة الطبية
                  </p>
                </div>
              </div>
            </div>

            {/* Page Workspace Container */}
            <div className="flex-1 bg-slate-950/40 p-4 sm:p-8 flex items-center justify-center">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl p-1 overflow-hidden"
              >
                <div id="military-report-print-area" className="bg-white text-slate-900 p-8 sm:p-12 rounded-xl text-right relative font-sans space-y-8">
                  
                  {/* Top Official Heading Block */}
                  <div className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-6">
                    <div className="text-right text-[11px] space-y-1 text-slate-800 font-bold">
                      <div>الجمهورية اليمنية</div>
                      <div>قوات العمالقة - اللواء 43 عمالقة</div>
                      <div className="font-extrabold text-slate-900">الشعبة الطبية - السيطرة البشرية</div>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <div className="text-sm font-black tracking-tight text-slate-950">
                        {activeReport === 'summary' && 'التقرير الإحصائي والتحليلي العام للإجازات'}
                        {activeReport === 'monthly' && `تقرير كشف الإجازات الطبية الشهري`}
                        {activeReport === 'custom_ledger' && 'كشف سجل الإجازات الطبية التفصيلي'}
                        {activeReport === 'compliance' && 'تقرير متابعة الاتصال والامتثال والتهرب'}
                        {activeReport === 'medical' && 'تقرير رصد الأوبئة وتكرار التشخيصات الطبية'}
                        {activeReport === 'readiness' && 'تقدير وتحليل الجاهزية التكتيكية والإنذار المبكر للخطورة'}
                      </div>
                      <div className="text-[10px] font-mono font-black bg-slate-100 px-3 py-1 rounded inline-block border border-slate-300 text-slate-800">
                        رقم التقرير: REP-43-{activeReport.toUpperCase()}-{new Date().getFullYear()}
                      </div>
                    </div>

                    <div className="text-left text-[11px] space-y-1 text-slate-800 font-mono font-bold">
                      <div>تاريخ الطباعة: {new Date().toLocaleDateString('ar-YE')}</div>
                      <div>المرجع: L43-MED-REPORTS</div>
                      <div className="font-extrabold text-rose-700 text-[10px]">التصنيف: سري ورسمي</div>
                    </div>
                  </div>

                  {/* Header metadata/filter state print table */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-slate-700 text-right">
                    <div>
                      <span className="text-slate-400 block text-[10px]">الوحدة المحددة:</span>
                      <span className="text-slate-900">{selectedUnit === 'all' ? 'جميع الوحدات والكتائب' : selectedUnit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">الرتب العسكرية:</span>
                      <span className="text-slate-900">{selectedRank === 'all' ? 'كل الرتب العسكرية' : selectedRank}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">حالة الامتثال والمتابعة:</span>
                      <span className="text-slate-900">{selectedStatus === 'all' ? 'جميع حالات الاتصال' : translateStatus(selectedStatus)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">إجمالي السجلات:</span>
                      <span className="text-amber-700 font-black">
                        {activeReport === 'monthly' ? monthlyFilteredRecords.length : filteredRecords.length} مجند
                      </span>
                    </div>
                  </div>

                  {/* RENDER TABLE ACCORDING TO ACTIVEREPORT */}
                  
                  {/* PRINT VIEW: SUMMARY */}
                  {activeReport === 'summary' && (
                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5 flex-row-reverse">
                        <span>● ملخص المؤشرات الإحصائية العامة:</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                        <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-center border-b pb-1.5">
                            <span className="text-slate-500">إجمالي مجندي الإجازات:</span>
                            <span className="font-mono text-slate-900">{filteredRecords.length} مجند</span>
                          </div>
                          <div className="flex justify-between items-center border-b pb-1.5">
                            <span className="text-slate-500">إجازات مرضية صريحة (مريض):</span>
                            <span className="font-mono text-emerald-600">{filteredRecords.filter(r => r.type === 'مريض').length}</span>
                          </div>
                          <div className="flex justify-between items-center pb-0.5">
                            <span className="text-slate-500">إصابات عسكرية وحوادث:</span>
                            <span className="font-mono text-rose-600">{filteredRecords.filter(r => r.type === 'حادث').length}</span>
                          </div>
                        </div>

                        <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-center border-b pb-1.5">
                            <span className="text-slate-500">إجازات مرافق مريض:</span>
                            <span className="font-mono text-slate-800">{filteredRecords.filter(r => r.type === 'مرافق').length}</span>
                          </div>
                          <div className="flex justify-between items-center border-b pb-1.5">
                            <span className="text-slate-500">حالات التهرب والغياب المرصودة:</span>
                            <span className="font-mono text-amber-600">{filteredRecords.filter(r => r.contactStatus === 'evading').length}</span>
                          </div>
                          <div className="flex justify-between items-center pb-0.5">
                            <span className="text-slate-500">متوسط فترات النقاهة الطبية:</span>
                            <span className="font-mono text-indigo-600">12 يوماً</span>
                          </div>
                        </div>
                      </div>

                      {/* Rank Breakdown Table */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 flex-row-reverse">
                          <span>● كشف توزيع الإجازات بحسب الرتب العسكرية:</span>
                        </h4>
                        <table className="w-full text-right text-xs border border-slate-300 rounded-lg overflow-hidden">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 font-black text-slate-800">
                              <th className="p-2 text-center w-16">#</th>
                              <th className="p-2">الرتبة العسكرية</th>
                              <th className="p-2 text-center">عدد المجندين</th>
                              <th className="p-2 text-center">النسبة المئوية من اللواء</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-900 font-bold">
                            {Array.from(new Set(filteredRecords.map(r => r.rank))).map((rank, idx) => {
                              const count = filteredRecords.filter(r => r.rank === rank).length;
                              const percentage = filteredRecords.length > 0 ? Math.round((count / filteredRecords.length) * 100) : 0;
                              return (
                                <tr key={rank}>
                                  <td className="p-2 text-center font-mono text-slate-500">{idx + 1}</td>
                                  <td className="p-2">{rank}</td>
                                  <td className="p-2 text-center font-mono">{count}</td>
                                  <td className="p-2 text-center font-mono">{percentage}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Unit Breakdown Table */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 flex-row-reverse">
                          <span>● كشف توزيع الحالات بحسب السرايا والكتائب الميدانية:</span>
                        </h4>
                        <table className="w-full text-right text-xs border border-slate-300 rounded-lg overflow-hidden">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 font-black text-slate-800">
                              <th className="p-2 text-center w-16">#</th>
                              <th className="p-2">الوحدة العسكرية / السرية والكتيبة</th>
                              <th className="p-2 text-center">عدد الحالات المرضية</th>
                              <th className="p-2 text-center">النسبة المئوية</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-900 font-bold">
                            {Array.from(new Set(filteredRecords.map(r => r.unit || 'اللواء 43 عمالقة'))).map((unit, idx) => {
                              const count = filteredRecords.filter(r => (r.unit || 'اللواء 43 عمالقة') === unit).length;
                              const percentage = filteredRecords.length > 0 ? Math.round((count / filteredRecords.length) * 100) : 0;
                              return (
                                <tr key={unit}>
                                  <td className="p-2 text-center font-mono text-slate-500">{idx + 1}</td>
                                  <td className="p-2">{unit}</td>
                                  <td className="p-2 text-center font-mono">{count}</td>
                                  <td className="p-2 text-center font-mono">{percentage}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* PRINT VIEW: MONTHLY REPORT */}
                  {activeReport === 'monthly' && (
                    <div className="space-y-4">
                      <div className="text-xs font-extrabold text-slate-800 border-b pb-1 mb-2">
                        كشف بجميع إجازات شهر ({selectedReportMonth}) لعام ({selectedReportYear}):
                      </div>
                      <table className="w-full text-right text-[11px] border border-slate-300 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 font-black text-slate-800">
                            <th className="p-2.5 text-center w-12">#</th>
                            <th className="p-2.5">الاسم والرتبة</th>
                            <th className="p-2.5">الوحدة / الكتيبة</th>
                            <th className="p-2.5">نوع الإجازة</th>
                            <th className="p-2.5 text-center">تاريخ الإجازة المعتمدة</th>
                            <th className="p-2.5 text-center">حالة الاتصال والامتثال الميداني</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-900 font-bold">
                          {monthlyFilteredRecords.map((r, idx) => (
                            <tr key={r.id}>
                              <td className="p-2.5 text-center font-mono text-slate-500">{idx + 1}</td>
                              <td className="p-2.5">
                                <div>{r.name}</div>
                                <div className="text-[9px] text-slate-500 mt-0.5">{r.rank}</div>
                              </td>
                              <td className="p-2.5 text-slate-700">{r.unit || 'اللواء 43 عمالقة'}</td>
                              <td className="p-2.5 text-slate-800">{translateType(r.type)}</td>
                              <td className="p-2.5 text-center font-mono text-slate-700">{r.startDate} إلى {r.endDate}</td>
                              <td className="p-2.5 text-center font-bold">
                                <span>{translateStatus(r.contactStatus)}</span>
                              </td>
                            </tr>
                          ))}
                          {monthlyFilteredRecords.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-slate-400">لا توجد سجلات في هذا الشهر المحدد للطباعة</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* PRINT VIEW: CUSTOM DETAILED LEDGER */}
                  {activeReport === 'custom_ledger' && (
                    <div className="space-y-4">
                      <table className="w-full text-right text-[10px] border border-slate-300 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 font-black text-slate-800">
                            <th className="p-2 text-center w-10">م</th>
                            <th className="p-2">المعرف المالي</th>
                            <th className="p-2">الاسم والرتبة</th>
                            <th className="p-2">الوحدة والسرية</th>
                            <th className="p-2">نوع الإجازة</th>
                            <th className="p-2">التشخيص الطبي</th>
                            <th className="p-2">جهة ومستشفى الإصدار</th>
                            <th className="p-2 text-center">الفترة</th>
                            <th className="p-2 text-center">حالة الامتثال</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-900 font-bold">
                          {filteredRecords.map((r, idx) => (
                            <tr key={r.id} className="hover:bg-slate-50/50">
                              <td className="p-2 text-center font-mono text-slate-500">{idx + 1}</td>
                              <td className="p-2 font-mono text-slate-600">{r.id}</td>
                              <td className="p-2">
                                <div className="font-extrabold text-slate-900">{r.name}</div>
                                <div className="text-[8px] text-slate-500">{r.rank}</div>
                              </td>
                              <td className="p-2 text-slate-700">{r.unit || 'اللواء 43 عمالقة'}</td>
                              <td className="p-2 text-slate-800">{translateType(r.type)}</td>
                              <td className="p-2 text-slate-600 max-w-[120px] truncate">{r.diagnosis}</td>
                              <td className="p-2 text-slate-600">{r.issuer || 'غير محدد'}</td>
                              <td className="p-2 text-center font-mono text-[9px] text-slate-700">{r.startDate} إلى {r.endDate}</td>
                              <td className="p-2 text-center text-slate-800 text-[9px]">{translateStatus(r.contactStatus)}</td>
                            </tr>
                          ))}
                          {filteredRecords.length === 0 && (
                            <tr>
                              <td colSpan={9} className="p-6 text-center text-slate-400">لا توجد سجلات مطابقة للفلاتر للطباعة</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* PRINT VIEW: COMPLIANCE AND CONTACT STATUS */}
                  {activeReport === 'compliance' && (
                    <div className="space-y-6">
                      {/* Alarm Lists overview */}
                      <div className="grid grid-cols-2 gap-4 text-xs font-bold font-sans">
                        <div className="border border-red-300 bg-red-50/20 rounded-lg p-3 space-y-2">
                          <span className="text-red-700 font-black block">● الحالات المتهربة والمخالفة عسكرياً:</span>
                          <ul className="space-y-1 list-disc list-inside text-[10px] text-slate-800 pr-2">
                            {filteredRecords.filter(r => r.contactStatus === 'evading').slice(0, 5).map(r => (
                              <li key={r.id}>{r.name} ({r.rank}) - تاريخ انتهاء الإجازة: {r.endDate}</li>
                            ))}
                            {filteredRecords.filter(r => r.contactStatus === 'evading').length > 5 && (
                              <li className="text-[9px] font-bold text-slate-500">وآخرين... (إجمالي المتهربين: {filteredRecords.filter(r => r.contactStatus === 'evading').length})</li>
                            )}
                            {filteredRecords.filter(r => r.contactStatus === 'evading').length === 0 && (
                              <li className="text-slate-400 list-none text-center py-2">لا توجد حالات تهرب نشطة</li>
                            )}
                          </ul>
                        </div>

                        <div className="border border-indigo-300 bg-indigo-50/20 rounded-lg p-3 space-y-2">
                          <span className="text-indigo-700 font-black block">● الأفراد المنقطع الاتصال بهم (لا يرد / مغلق):</span>
                          <ul className="space-y-1 list-disc list-inside text-[10px] text-slate-800 pr-2">
                            {filteredRecords.filter(r => r.contactStatus === 'no_answer').slice(0, 5).map(r => (
                              <li key={r.id}>{r.name} ({r.rank}) - محاولات الاتصال: {r.contactLogs?.length || 0} مرات</li>
                            ))}
                            {filteredRecords.filter(r => r.contactStatus === 'no_answer').length > 5 && (
                              <li className="text-[9px] font-bold text-slate-500">وآخرين... (إجمالي المنقطعين: {filteredRecords.filter(r => r.contactStatus === 'no_answer').length})</li>
                            )}
                            {filteredRecords.filter(r => r.contactStatus === 'no_answer').length === 0 && (
                              <li className="text-slate-400 list-none text-center py-2">جميع هواتف الأفراد مستقرة ومستجيبة</li>
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* Main Compliance table */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 flex-row-reverse">
                          <span>● كشف رصد تواصل المجندين التفصيلي ومحاولات الاتصال:</span>
                        </h4>
                        <table className="w-full text-right text-[10px] border border-slate-300 rounded-lg overflow-hidden">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 font-black text-slate-800">
                              <th className="p-2 text-center w-10">م</th>
                              <th className="p-2">اسم المجند ورتبته</th>
                              <th className="p-2">الوحدة والكتيبة</th>
                              <th className="p-2 text-center">الفترة الزمنية</th>
                              <th className="p-2 text-center">حالة التواصل</th>
                              <th className="p-2 text-center">محاولات الاتصال</th>
                              <th className="p-2">آخر ملاحظة اتصال عسكرية</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-900 font-bold">
                            {filteredRecords.map((r, idx) => (
                              <tr key={r.id}>
                                <td className="p-2 text-center font-mono text-slate-500">{idx + 1}</td>
                                <td className="p-2">
                                  <div>{r.name}</div>
                                  <div className="text-[8px] text-slate-500">{r.rank}</div>
                                </td>
                                <td className="p-2 text-slate-700">{r.unit || 'اللواء 43 عمالقة'}</td>
                                <td className="p-2 text-center font-mono text-[9px]">{r.startDate} إلى {r.endDate}</td>
                                <td className="p-2 text-center text-[9px]">{translateStatus(r.contactStatus)}</td>
                                <td className="p-2 text-center font-mono">{r.contactLogs?.length || 0} مرات</td>
                                <td className="p-2 text-slate-600 text-[9px] max-w-xs truncate">
                                  {r.contactLogs && r.contactLogs.length > 0 
                                    ? r.contactLogs[r.contactLogs.length - 1].note 
                                    : r.notes || 'لم تسجل ملاحظات'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* PRINT VIEW: MEDICAL DIAGNOSIS AND EPIDEMIOLOGY */}
                  {activeReport === 'medical' && (
                    <div className="space-y-4">
                      <div className="text-xs font-extrabold text-slate-800 border-b pb-1 mb-2">
                        تحليل تكرار الأوبئة والأسباب المرضية ومؤشرات مدة النقاهة:
                      </div>
                      <table className="w-full text-right text-xs border border-slate-300 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 font-black text-slate-800">
                            <th className="p-2.5 text-center w-12">#</th>
                            <th className="p-2.5">التشخيص الطبي المرصود بالتقارير</th>
                            <th className="p-2.5 text-center">عدد الحالات الطبية باللواء</th>
                            <th className="p-2.5 text-center">متوسط مدة الإجازة الممنوحة (أيام)</th>
                            <th className="p-2.5 text-center">عدد المشافي المصدرة المشخصة</th>
                            <th className="p-2.5 text-right">مستوى الجاهزية والخطورة التخطيطية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-900 font-bold">
                          {diagnosisStats.map((d, idx) => (
                            <tr key={d.diagnosis}>
                              <td className="p-2.5 text-center font-mono text-slate-500">{idx + 1}</td>
                              <td className="p-2.5 font-extrabold text-slate-950">{d.diagnosis}</td>
                              <td className="p-2.5 text-center font-mono">{d.count} مجند</td>
                              <td className="p-2.5 text-center font-mono">{d.avgDuration} يوماً</td>
                              <td className="p-2.5 text-center font-mono">{d.issuersCount} مستشفى</td>
                              <td className="p-2.5 text-right">
                                {d.avgDuration > 15 ? (
                                  <span className="text-rose-700 text-[10px]">جاهزية حرجة (مدة استشفاء طويلة)</span>
                                ) : (
                                  <span className="text-emerald-700 text-[10px]">نقاهة قصيرة وعودة قريبة</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {diagnosisStats.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-slate-400">لا توجد بيانات تشخيصية كافية للطباعة حالياً</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Signatures & Approvals Section */}
                  <div className="grid grid-cols-3 gap-6 pt-10 text-xs font-bold text-slate-800 text-center font-sans">
                    <div className="space-y-12">
                      <div>مسؤول الرصد والتوثيق الطبي</div>
                      <div className="text-slate-700 pt-2 text-[11px] font-mono font-extrabold">ملازم أول/ صالح الصبيحي</div>
                      <div className="border-b border-slate-400 border-dashed w-3/4 mx-auto pt-1"></div>
                      <div className="text-[9px] text-slate-400">التوقيع والتاريخ</div>
                    </div>
                    
                    <div className="space-y-12">
                      <div>مدير الشعبة الطبية للواء 43</div>
                      <div className="text-emerald-800 font-black text-xs">قوات العمالقة - اللواء 43</div>
                      <div className="border-b border-slate-400 border-dashed w-3/4 mx-auto pt-3"></div>
                      <div className="text-[9px] text-slate-400">الختم والتوقيع الرسمي</div>
                    </div>

                    <div className="space-y-12">
                      <div>رئيس شعبة السيطرة والقوى البشرية</div>
                      <div className="border-b border-slate-400 border-dashed w-3/4 mx-auto pt-7"></div>
                      <div className="text-[9px] text-slate-400">المصادقة والاعتماد الميداني</div>
                    </div>
                  </div>

                  {/* Document Footer */}
                  <div className="pt-10 border-t border-slate-300 flex justify-between items-center text-[9px] text-slate-400 font-mono font-bold">
                    <span>* مستند إلكتروني معتمد رسمياً وصادر عن شعبة السيطرة للواء 43 عمالقة *</span>
                    <span>تم الاستخراج في: {new Date().toLocaleString('ar-YE')}</span>
                  </div>

                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMonthlyFullScreen && (
          <div className="fixed inset-0 bg-slate-100 dark:bg-slate-950 z-50 flex flex-col overflow-y-auto text-right no-print font-sans">
            
            {/* Full Screen Top Navigation Bar */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col lg:flex-row justify-between items-center gap-4 shadow-xl z-50">
              {/* Right Side: Title */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                  <CalendarRange className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-black text-sm md:text-base text-white flex items-center gap-2 justify-start">
                    <span>التقرير الشهري العسكري الشامل للعمل</span>
                    <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg font-sans">شاشة كاملة</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold">
                    قوات العمالقة - اللواء 43 عمالقة - الشعبة الطبية والسيطرة
                  </p>
                </div>
              </div>

              {/* Center: Live Month & Year Selectors */}
              <div className="flex items-center gap-3 bg-slate-850/80 p-1.5 rounded-xl border border-slate-800">
                <select
                  value={selectedReportMonth}
                  onChange={(e) => setSelectedReportMonth(e.target.value)}
                  className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {[
                    { value: '01', label: 'يناير (01)' },
                    { value: '02', label: 'فبراير (02)' },
                    { value: '03', label: 'مارس (03)' },
                    { value: '04', label: 'أبريل (04)' },
                    { value: '05', label: 'مايو (05)' },
                    { value: '06', label: 'يونيو (06)' },
                    { value: '07', label: 'يوليو (07)' },
                    { value: '08', label: 'أغسطس (08)' },
                    { value: '09', label: 'سبتمبر (09)' },
                    { value: '10', label: 'أكتوبر (10)' },
                    { value: '11', label: 'نوفمبر (11)' },
                    { value: '12', label: 'ديسمبر (12)' }
                  ].map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>

                <select
                  value={selectedReportYear}
                  onChange={(e) => setSelectedReportYear(e.target.value)}
                  className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {['2024', '2025', '2026', '2027'].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Left Side: Actions */}
              <div className="flex items-center gap-2">
                {/* Real-time search */}
                <div className="relative hidden md:block">
                  <input
                    type="text"
                    value={monthlySearchQuery}
                    onChange={(e) => setMonthlySearchQuery(e.target.value)}
                    placeholder="ابحث عن مجند، رتبة، وحدة..."
                    className="w-48 pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 text-right"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>

                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl font-bold cursor-pointer text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>

                <button
                  type="button"
                  onClick={exportMonthlyReportToExcelStyled}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md shadow-emerald-500/10"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>إكسل Excel</span>
                </button>

                <div className="h-6 w-px bg-slate-800 mx-1"></div>

                <button
                  type="button"
                  onClick={() => setIsMonthlyFullScreen(false)}
                  className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black cursor-pointer text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-rose-500/10"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>خروج</span>
                </button>
              </div>
            </div>

            {/* Mobile search bar */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 block md:hidden">
              <div className="relative">
                <input
                  type="text"
                  value={monthlySearchQuery}
                  onChange={(e) => setMonthlySearchQuery(e.target.value)}
                  placeholder="ابحث عن مجند، رتبة، وحدة..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 text-right"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            {/* Main Fullscreen Dashboard Workspace */}
            <div className="p-3 md:p-4.5 space-y-4 max-w-7xl mx-auto w-full flex-1">
              
              {/* Notification Bar if empty */}
              {monthlyFilteredRecords.length === 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-3">
                  <Info className="w-4.5 h-4.5 shrink-0 animate-pulse text-amber-500" />
                  <span>
                    لا توجد بيانات مسجلة لشهر {selectedReportMonth} لعام {selectedReportYear}. قم باختيار شهر آخر أو إضافة إجازات جديدة تبدأ في هذا النطاق الزمني لعرض الإحصائيات الكاملة.
                  </span>
                </div>
              )}

              {/* Launcher Grid - 5 items */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-right">
                {/* Item 1: إجمالي إجازات الشهر */}
                <motion.div
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between transition-all relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-indigo-500 to-indigo-600 opacity-80" />
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                      {monthlyFilteredRecords.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs">إجمالي إجازات الشهر</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-none">
                      طلب إجازة معتمد
                    </p>
                  </div>
                </motion.div>

                {/* Item 2: إجمالي أيام الإجازات */}
                <motion.div
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between transition-all relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-pink-500 to-pink-600 opacity-80" />
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-pink-50 dark:bg-pink-950/30 text-pink-500 rounded-xl">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                      {totalMonthlyDays}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs">إجمالي أيام الإجازات</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-none">
                      يوم مستهلك بالشهر
                    </p>
                  </div>
                </motion.div>

                {/* Item 3: متوسط مدة الإجازة */}
                <motion.div
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between transition-all relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-cyan-500 to-cyan-600 opacity-80" />
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-500 rounded-xl">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                      {averageMonthlyDuration}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs">متوسط مدة الإجازة</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-none">
                      يوم لكل فرد
                    </p>
                  </div>
                </motion.div>

                {/* Item 4: مؤكد العودة والالتزام */}
                <motion.div
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between transition-all relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-emerald-500 to-emerald-600 opacity-80" />
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-xl">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                      {monthlyFilteredRecords.filter(r => r.contactStatus === 'confirmed').length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs">مؤكد العودة والالتزام</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-none">
                      مجند أكد عودته بنجاح
                    </p>
                  </div>
                </motion.div>

                {/* Item 5: المخالفين والمتهربين */}
                <motion.div
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between transition-all relative overflow-hidden group col-span-2 sm:col-span-1"
                >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-rose-500 to-rose-600 opacity-80" />
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-xl">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                      {monthlyFilteredRecords.filter(r => r.contactStatus === 'evading').length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs">المخالفين والمتهربين</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-none">
                      رصد ميداني نشط
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Graphs / Analytics Block */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                
                {/* 1. Leave Categories and Hospitals */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4 text-right shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 justify-start border-b border-slate-150 dark:border-slate-800 pb-2.5 mb-3">
                    <Activity className="w-4 h-4 text-amber-500" />
                      <span>توزيع تصنيف الإجازات المرضية هذا الشهر</span>
                    </h3>
                    
                    <div className="space-y-3">
                      {['مريض', 'مرافق', 'مرض قريب', 'حادث'].map(type => {
                        const count = monthlyFilteredRecords.filter(r => r.type === type).length;
                        const percentage = monthlyFilteredRecords.length > 0 ? Math.round((count / monthlyFilteredRecords.length) * 100) : 0;
                        return (
                          <div key={type} className="space-y-1 text-xs">
                            <div className="flex justify-between items-center font-bold">
                              <span className="text-slate-800 dark:text-slate-200">{translateType(type)}</span>
                              <span className="font-mono text-slate-500 dark:text-slate-400">{count} مجند ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                              <div className="bg-gradient-to-l from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
                    <h4 className="text-[10px] font-black text-slate-400 mb-1.5 uppercase">المستشفيات الأكثر إصداراً للإجازات</h4>
                    <div className="space-y-1.5">
                      {topMonthlyHospitals.slice(0, 3).map((h, i) => (
                        <div key={h.name} className="flex justify-between items-center text-xs font-bold py-1 border-b border-dashed border-slate-100 dark:border-slate-850 last:border-b-0 font-sans">
                          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] flex items-center justify-center font-mono font-bold">{i+1}</span>
                            <span className="truncate max-w-[150px]" title={h.name}>{h.name}</span>
                          </span>
                          <span className="font-mono text-amber-500 bg-amber-500/5 px-1.5 py-0.5 rounded text-[10px] font-bold">{h.count} تقارير</span>
                        </div>
                      ))}
                      {topMonthlyHospitals.length === 0 && (
                        <p className="text-[10px] text-slate-400 text-center py-2">لا توجد جهات إصدار مسجلة</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Unit wise Leaves list */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 text-right shadow-sm lg:col-span-1">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 justify-start border-b border-slate-150 dark:border-slate-800 pb-2.5 mb-2">
                    <Building className="w-4 h-4 text-amber-500" />
                    <span>توزيع الإجازات بحسب الوحدات العسكرية</span>
                  </h3>

                  <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1 scrollbar-thin">
                    {Array.from(new Set(monthlyFilteredRecords.map(r => r.unit || 'اللواء 43 عمالقة'))).map(unit => {
                      const unitRecords = monthlyFilteredRecords.filter(r => (r.unit || 'اللواء 43 عمالقة') === unit);
                      const count = unitRecords.length;
                      const percentage = monthlyFilteredRecords.length > 0 ? Math.round((count / monthlyFilteredRecords.length) * 100) : 0;
                      const evadingInUnit = unitRecords.filter(r => r.contactStatus === 'evading').length;
                      return (
                        <div key={unit} className="space-y-1 text-xs font-bold border-b border-slate-50 dark:border-slate-850/50 pb-2 last:border-b-0">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-800 dark:text-slate-200">{unit}</span>
                            <span className="font-mono text-slate-500 dark:text-slate-400">{count} مجند ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold pt-0.5">
                            <span>طلب تمديد: {unitRecords.filter(r => r.contactStatus === 'request_extension').length}</span>
                            <span className={evadingInUnit > 0 ? 'text-rose-500 font-bold' : ''}>مخالفين: {evadingInUnit}</span>
                          </div>
                        </div>
                      );
                    })}
                    {monthlyFilteredRecords.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-12">لا توجد إحصائيات للكتائب في هذا النطاق</p>
                    )}
                  </div>
                </div>

                {/* 3. Follow-up Details & Critical Alerts */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 text-right shadow-sm lg:col-span-1">
                  <h3 className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-2 justify-start border-b border-slate-150 dark:border-slate-800 pb-2.5 mb-2">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
                    <span>مؤشرات المتابعة العسكرية العاجلة</span>
                  </h3>

                  <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1 scrollbar-thin">
                    {/* Evading Alerts */}
                    {monthlyFilteredRecords.filter(r => r.contactStatus === 'evading').map(r => (
                      <div key={r.id} className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-lg space-y-1 text-right">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-rose-700 dark:text-rose-400 text-[10px]">{r.name}</span>
                          <span className="text-[8.5px] font-mono bg-rose-500/15 text-rose-500 px-1 py-0.5 rounded font-black">مخالف متهرب</span>
                        </div>
                        <p className="text-[9.5px] text-slate-500 dark:text-slate-450 font-bold">
                          الرتبة: <span className="text-slate-700 dark:text-slate-300">{r.rank}</span> | 
                          الوحدة: <span className="text-slate-700 dark:text-slate-300">{r.unit || 'اللواء 43'}</span>
                        </p>
                        <p className="text-[8.5px] text-rose-600/80 dark:text-rose-400/80 font-bold font-sans">
                          * الإجراء العسكري: يعمم بلاغ عملياتي بإيقاف المرتب وضبطه بالانضباط العسكري فوراً.
                        </p>
                      </div>
                    ))}

                    {/* Long leaves warning */}
                    {monthlyFilteredRecords.filter(r => {
                      const start = new Date(r.startDate).getTime();
                      const end = new Date(r.endDate).getTime();
                      const dur = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
                      return dur > 21;
                    }).slice(0, 3).map(r => (
                      <div key={r.id} className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-150 dark:border-amber-900/30 rounded-lg space-y-1 text-right">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-amber-700 dark:text-amber-400 text-[10px]">{r.name}</span>
                          <span className="text-[8.5px] font-mono bg-amber-500/15 text-amber-500 px-1 py-0.5 rounded font-black">فترة طويلة</span>
                        </div>
                        <p className="text-[9.5px] text-slate-500 dark:text-slate-450 font-bold">
                          مدة الإجازة: <span className="text-slate-900 dark:text-white font-black">
                            {Math.max(1, Math.round((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24)))} يوم
                          </span>
                        </p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal font-bold truncate">
                          التشخيص: <span className="text-slate-700 dark:text-slate-300">{r.diagnosis || 'غير محدد'}</span>
                        </p>
                      </div>
                    ))}

                    {monthlyFilteredRecords.filter(r => r.contactStatus === 'evading').length === 0 &&
                     monthlyFilteredRecords.filter(r => {
                      const start = new Date(r.startDate).getTime();
                      const end = new Date(r.endDate).getTime();
                      return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24))) > 21;
                     }).length === 0 && (
                      <div className="py-12 text-center text-slate-450 font-bold text-xs space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto animate-bounce" />
                        <p>لا توجد حالات مخالفة أو إجازات طويلة للغاية مرصودة في هذا الشهر</p>
                      </div>
                     )}
                  </div>
                </div>

              </div>

              {/* 4. Complete Interactive Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 text-right shadow-sm">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-850 pb-2.5 font-sans">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 justify-start">
                      <FileSpreadsheet className="w-4.5 h-4.5 text-amber-500" />
                      <span>سجل كشف الإجازات الطبية الشهري التفصيلي</span>
                    </h3>
                    <p className="text-[9.5px] text-slate-400 font-bold">قائمة كاملة بكافة الإجازات الطبية الصادرة للجنود خلال شهر {selectedReportMonth} لعام {selectedReportYear}</p>
                  </div>

                  {/* Active Search & Filter info */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-150 dark:border-slate-850">
                      مصفى: <span className="text-amber-500 font-black">{searchedMonthlyRecords.length} / {monthlyFilteredRecords.length} مجند</span>
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[11.5px] font-sans">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-440 font-black border-b border-slate-100 dark:border-slate-850 text-right uppercase">
                        <th className="py-3 px-3 text-center w-12">م</th>
                        <th className="py-3 px-3">الرقم العسكري</th>
                        <th className="py-3 px-3">الاسم والرتبة</th>
                        <th className="py-3 px-3">الوحدة والكتيبة</th>
                        <th className="py-3 px-3 text-center">نوع الإجازة</th>
                        <th className="py-3 px-3 text-center">المدة (أيام)</th>
                        <th className="py-3 px-3 text-center">الفترة الزمنية</th>
                        <th className="py-3 px-3">التشخيص الطبي التفصيلي</th>
                        <th className="py-3 px-3">جهة الإصدار</th>
                        <th className="py-3 px-3 text-center">حالة الاتصال والالتزام</th>
                        <th className="py-3 px-3 text-center w-16 no-print">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850/50">
                      {searchedMonthlyRecords.map((r, idx) => {
                        const start = new Date(r.startDate).getTime();
                        const end = new Date(r.endDate).getTime();
                        const duration = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 font-medium transition-colors">
                            <td className="py-3 px-3 text-center font-mono text-slate-450">{idx + 1}</td>
                            <td className="py-3 px-3 font-mono text-slate-500 font-bold">{r.id || 'N/A'}</td>
                            <td className="py-3 px-3">
                              <span className="font-black text-slate-800 dark:text-slate-200 block text-right">{r.name}</span>
                              <span className="text-[10px] text-slate-400 block font-bold text-right">{r.rank}</span>
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-semibold">{r.unit || 'اللواء 43 عمالقة'}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {translateType(r.type)}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-black font-mono text-indigo-500">
                              {duration}
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-[10.5px] text-slate-500 font-bold">
                              {r.startDate} إلى {r.endDate}
                            </td>
                            <td className="py-3 px-3 text-slate-700 dark:text-slate-300 max-w-[150px] truncate" title={r.diagnosis}>
                              {r.diagnosis || 'غير محدد'}
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{r.issuer || 'غير محدد'}</td>
                            <td className="py-3 px-3 text-center font-sans">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${getStatusColor(r.contactStatus)}`}>
                                {translateStatus(r.contactStatus)}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center no-print">
                              {onDelete && (
                                <button
                                  onClick={() => handleDeleteRecord(r)}
                                  title="حذف الإجازة نهائياً"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {searchedMonthlyRecords.length === 0 && (
                        <tr>
                          <td colSpan={11} className="py-12 text-center text-slate-450 font-bold space-y-2">
                            <p>لا توجد أي سجلات مطابقة لمعايير البحث في هذا الشهر ({selectedReportMonth}-{selectedReportYear})</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Signatures for military completeness */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3.5 text-xs font-bold text-slate-850 dark:text-slate-200 text-center font-sans">
                <div className="space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                  <div>مسؤول الرصد والتوثيق الطبي</div>
                  <div className="text-slate-700 dark:text-slate-300 pt-1 text-[11px] font-mono font-extrabold">ملازم أول/ صالح الصبيحي</div>
                  <div className="border-b border-slate-200 dark:border-slate-800 border-dashed w-3/4 mx-auto pt-0.5"></div>
                  <div className="text-[9px] text-slate-400 font-semibold">التوقيع والتاريخ الرسمي</div>
                </div>
                
                <div className="space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                  <div>مدير الشعبة الطبية للواء 43</div>
                  <div className="text-emerald-850 dark:text-emerald-400 font-black text-xs">قوات العمالقة - اللواء 43 عمالقة</div>
                  <div className="border-b border-slate-200 dark:border-slate-800 border-dashed w-3/4 mx-auto pt-1.5"></div>
                  <div className="text-[9px] text-slate-400 font-semibold">الختم والتوقيع الرسمي</div>
                </div>

                <div className="space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                  <div>رئيس شعبة السيطرة والقوى البشرية</div>
                  <div className="text-slate-700 dark:text-slate-300 pt-2 text-[11px] font-mono font-extrabold">عقيد/ أحمد قاسم المفلحي</div>
                  <div className="border-b border-slate-200 dark:border-slate-800 border-dashed w-3/4 mx-auto pt-1"></div>
                  <div className="text-[9px] text-slate-400 font-semibold">المصادقة والاعتماد الميداني</div>
                </div>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setRecordToDelete(null);
        }}
        onConfirm={executeDeleteRecord}
        recordName={recordToDelete ? `${recordToDelete.rank} / ${recordToDelete.name}` : ''}
        recordUnit={recordToDelete?.unit || 'اللواء 43 عمالقة'}
        recordType={recordToDelete ? translateType(recordToDelete.type) : ''}
      />

    </div>
  );
}
