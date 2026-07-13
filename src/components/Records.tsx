/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Trash2,
  Download,
  Calendar,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Kanban,
  ChevronLeft,
  ChevronRight,
  Edit2,
  CalendarPlus,
  Eye,
  Check,
  X,
  PlusCircle,
  FileSpreadsheet,
  Clock,
  Briefcase,
  Activity,
  TrendingUp,
  Sparkles,
  Filter,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Shield,
  User,
  HeartPulse,
  Bell,
  PhoneCall,
  Phone,
  PhoneOff,
  FileText
} from 'lucide-react';
import { LeaveRecord, HistoryEntry } from '../types';
import PatientProfileModal from './PatientProfileModal';
import ExcelExportWizard from './ExcelExportWizard';
import DeleteConfirmModal from './DeleteConfirmModal';

interface RecordsProps {
  records: LeaveRecord[];
  onAdd: (record: LeaveRecord) => Promise<void>;
  onUpdate: (record: LeaveRecord) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDeleteMultiple: (ids: string[]) => Promise<void>;
  triggerToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

// Military Ranks
const RANKS = [
  'جندي',
  'عريف',
  'رقيب',
  'رقيب أول',
  'مساعد',
  'ملازم ثان',
  'ملازم أول',
  'نقيب',
  'رائد',
  'مقدم',
  'عقيد',
  'عميد'
];

const LEAVE_TYPES = [
  { id: 'مريض', label: 'مريض' },
  { id: 'مرافق', label: 'مرافق' },
  { id: 'مرض قريب', label: 'مرض قريب' },
  { id: 'حادث', label: 'حادث' }
];

const ESTIMATOR_DIAGNOSES = [
  {
    id: 'fracture_major',
    name: 'كسور مضاعفة / عمليات عظام كبرى',
    recommendedDays: 90,
    range: '60 - 120 يوم',
    needsBoard: true,
    protocol: 'تثبيت جراحي، راحة تامة، وعلاج طبيعي مكثف بعد فك الجبيرة. يمنع من الأنشطة القتالية وحمل الأوزان.',
    category: 'عمليات وجراحة عظام'
  },
  {
    id: 'fracture_minor',
    name: 'كسور بسيطة (أطراف علوية/سفلية)',
    recommendedDays: 45,
    range: '30 - 60 يوم',
    needsBoard: false,
    protocol: 'تجبير مبرم، تقييد حركة الطرف المصاب، مراجعة الطبيب كل أسبوعين للتصوير الإشعاعي وتحديث الجبيرة.',
    category: 'عمليات وجراحة عظام'
  },
  {
    id: 'shrapnel_injury',
    name: 'إصابات شظايا مقذوفات قتالية',
    recommendedDays: 60,
    range: '45 - 90 يوم',
    needsBoard: true,
    protocol: 'تنظيف جراحي مبرم للجروح، مراقبة حدوث التهاب، تبديل يومي للضماد، واستكمال كورس المضادات الحيوية الوريدية.',
    category: 'إصابات معارك وطوارئ'
  },
  {
    id: 'abdominal_surgery_major',
    name: 'عمليات فتح بطن / استكشاف / استئصال عضو كبرى',
    recommendedDays: 60,
    range: '45 - 75 يوم',
    needsBoard: true,
    protocol: 'راحة تامة في الفراش، يمنع شد عضلات البطن أو الانحناء أو السعال القاسي، نظام غذائي خفيف متدرج، ومراجعة غرز الجراحة.',
    category: 'عمليات جراحية عامة'
  },
  {
    id: 'abdominal_surgery_minor',
    name: 'عمليات جراحية صغرى (فتق، زائدة دودية بالمنظار)',
    recommendedDays: 21,
    range: '15 - 30 يوم',
    needsBoard: false,
    protocol: 'تجنب حمل أوزان ثقيلة تزيد عن 5 كجم، تنظيف يومي لموضع الشق الجراحي، راحة حركية لمدة أسبوعين ثم البدء بالمشي الخفيف.',
    category: 'عمليات جراحية عامة'
  },
  {
    id: 'heart_condition',
    name: 'جلطة قلبية / قصور تاجي حاد / جراحة قلب مفتوح',
    recommendedDays: 120,
    range: '90 - 180 يوم',
    needsBoard: true,
    protocol: 'مراقبة هرمونية ونبضية مستمرة، أدوية مسيلة للدم مدى الحياة، حظر الانفعال العاطفي والجهد البدني المتوسط والقاتل تماماً.',
    category: 'أمراض باطنية وقلبية'
  },
  {
    id: 'burns_major',
    name: 'حروق من الدرجة الثانية والثالثة (مساحة > 15%)',
    recommendedDays: 60,
    range: '45 - 90 يوم',
    needsBoard: true,
    protocol: 'عزل طبي وقائي لمنع العدوى، ترطيب جلدي مكثف بالمراهم المتخصصة، سوائل وريدية لتعويض الفاقد، وتبديل معقم للضمادات.',
    category: 'حروق وإصابات جلدية'
  },
  {
    id: 'dengue_fever',
    name: 'حمى الضنك الشديدة / الملاريا مع مضاعفات',
    recommendedDays: 14,
    range: '10 - 20 يوم',
    needsBoard: false,
    protocol: 'راحة تامة، تعويض السوائل والالكتروليتات (الإماهة الفموية والوريدية)، مراقبة مستوى الصفائح الدموية كل 48 ساعة، خافض حرارة باراسيتامول فقط ويمنع استخدام الأسبرين.',
    category: 'الأمراض السارية والمعدية'
  },
  {
    id: 'respiratory_severe',
    name: 'التهاب رئوي حاد / ربو متفاقم يتطلب تنويم',
    recommendedDays: 15,
    range: '10 - 21 يوم',
    needsBoard: false,
    protocol: 'جلسات بخاخ موسع للشعب الهوائية، استنشاق أكسجين رطب عند الحاجة، راحة بعيداً عن الغبار وعوامل التحسس والدخان، ومضادات حيوية.',
    category: 'الأمراض السارية والمعدية'
  },
  {
    id: 'lumbar_disc',
    name: 'انزلاق غضروفي قطني (ديسك) قطني متقدم',
    recommendedDays: 30,
    range: '21 - 45 يوم',
    needsBoard: false,
    protocol: 'نوم على سطح صلب، كمادات دافئة وبروتوكول مسكنات ومضادات التهاب، يمنع الجلوس الطويل والركوب بالمركبات العسكرية غير الممهدة.',
    category: 'أمراض باطنية وقلبية'
  }
];

// --- Pure Helper Functions ---
const getDurationDays = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  const diffTime = e.getTime() - s.getTime();
  if (diffTime < 0) return 0;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const getLeaveStatus = (startDateStr: string, endDateStr: string) => {
  const today = new Date('2026-07-01');
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'unknown';
  if (today < start) return 'upcoming';
  if (today > end) return 'ended';
  return 'active';
};

const highlightMatch = (text: string, search: string) => {
  if (!text) return '';
  if (!search || !search.trim()) return text;
  const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedSearch})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-200 dark:bg-amber-500/40 text-slate-950 dark:text-white px-0.5 rounded font-black">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const getArabicMonthName = (monthStr: string): string => {
  if (!monthStr) return 'جميع الشهور';
  const parts = monthStr.split('-');
  if (parts.length < 2) return monthStr;
  const monthNum = parseInt(parts[1], 10);
  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  if (monthNum >= 1 && monthNum <= 12) {
    return `${arabicMonths[monthNum - 1]} ${parts[0]}`;
  }
  return monthStr;
};

const getLeaveTypeBadgeClass = (type: string): string => {
  switch (type) {
    case 'مريض':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
    case 'مرافق':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
    case 'حادث':
      return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30';
    default:
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
  }
};

const formatDateToDMY = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export default function Records({
  records,
  onAdd,
  onUpdate,
  onDelete,
  onDeleteMultiple,
  triggerToast
}: RecordsProps) {
  // --- States ---
  const [activeSubTab, setActiveSubTab] = useState<'log' | 'repeated' | 'alerts' | 'estimator' | 'balance' | 'radar' | 'timeline'>('log');
  const [selectedRadarUnit, setSelectedRadarUnit] = useState<string>('all');
  const [radarSelectedDay, setRadarSelectedDay] = useState<number>(new Date().getDate());
  const [isRadarDiagnosing, setIsRadarDiagnosing] = useState(false);
  const [diagnosticsCompleted, setDiagnosticsCompleted] = useState(false);
  const [expandedRadarUnit, setExpandedRadarUnit] = useState<string | null>(null);
  const [repeatedSearchTerm, setRepeatedSearchTerm] = useState('');
  const [minRepeatCount, setMinRepeatCount] = useState<number>(2);

  // Alarms & Direct Return Hub States
  const [alertsSearchTerm, setAlertsSearchTerm] = useState('');
  const [alarmTypeCategory, setAlarmTypeCategory] = useState<'all' | 'ended' | 'active'>('all');
  const [alertsFilter, setAlertsFilter] = useState<'all' | 'overdue' | 'today' | 'tomorrow' | 'soon'>('all');
  const [contactStatusFilter, setContactStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'request_extension' | 'no_answer' | 'evading'>('all');
  
  // Interactive Call Log States
  const [loggingCallRecord, setLoggingCallRecord] = useState<LeaveRecord | null>(null);
  const [callStatus, setCallStatus] = useState<'pending' | 'confirmed' | 'request_extension' | 'no_answer' | 'evading'>('confirmed');
  const [callNote, setCallNote] = useState('');

  // Printable Warrant State
  const [printingWarrantRecord, setPrintingWarrantRecord] = useState<LeaveRecord | null>(null);

  // --- States for Medical Leave Estimator ---
  const [selectedEstimatorId, setSelectedEstimatorId] = useState<string>('fracture_minor');
  const [estimatorStartDate, setEstimatorStartDate] = useState<string>('2026-07-01');
  const [estimatorHospitalized, setEstimatorHospitalized] = useState<boolean>(false);
  const [estimatorSurgeryType, setEstimatorSurgeryType] = useState<'none' | 'minor' | 'major'>('none');
  const [estimatorRecoveryState, setEstimatorRecoveryState] = useState<'normal' | 'slow' | 'fast'>('normal');

  // --- States for Leave Balance Analyzer ---
  const [selectedBalanceMemberName, setSelectedBalanceMemberName] = useState<string>('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'active' | 'ended' | 'long' | 'extended'>('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedCardIds, setExpandedCardIds] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<'type' | 'month' | 'quick' | 'tags' | 'minRepeat' | 'actions' | 'alertsFilter' | 'contactFilter' | null>(null);
  const [isExportWizardOpen, setIsExportWizardOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Custom Delete Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<LeaveRecord | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  // --- Active leaves mapped by day for the selected month (July 2026) ---
  const activeLeavesByDay = useMemo(() => {
    const dayCounts: Record<number, { count: number; personnel: LeaveRecord[] }> = {};
    for (let d = 1; d <= 31; d++) {
      const dateStr = `2026-07-${String(d).padStart(2, '0')}`;
      const dObj = new Date(dateStr);
      const activeOnThisDay: LeaveRecord[] = [];
      records.forEach(r => {
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && dObj >= start && dObj <= end) {
          activeOnThisDay.push(r);
        }
      });
      dayCounts[d] = {
        count: activeOnThisDay.length,
        personnel: activeOnThisDay
      };
    }
    return dayCounts;
  }, [records]);

  // --- Dynamic Combat Readiness Attrition Index per Unit ---
  const radarUnitReadinessStats = useMemo(() => {
    // Dynamically fetch unique units in records, default to standard military divisions
    const units = Array.from(new Set(records.map(r => r.unit).filter(Boolean)));
    if (units.length === 0) {
      units.push('كتيبة الدعم الثالثة', 'لواء النخبة الأول', 'سرية الاستطلاع الفني', 'كتيبة سلاح الإشارة');
    }
    const today = new Date('2026-07-01');
    return units.map(unit => {
      const unitRecords = records.filter(r => r.unit === unit);
      const activeSick = unitRecords.filter(r => {
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        return !isNaN(start.getTime()) && !isNaN(end.getTime()) && today >= start && today <= end;
      });
      const activeSickCount = activeSick.length;
      const baselineSize = 95; // Standard military company size
      const sickPercent = Math.round((activeSickCount / baselineSize) * 1000) / 10;
      const combatReadiness = Math.max(0, 100 - Math.round((activeSickCount / 10) * 100)); // 10 active sick drops readiness to 0%
      
      let statusLevel: 'stable' | 'warning' | 'critical' = 'stable';
      if (sickPercent > 8) statusLevel = 'critical';
      else if (sickPercent > 4) statusLevel = 'warning';
      
      return {
        unit,
        totalRecords: unitRecords.length,
        activeSickCount,
        sickPercent,
        combatReadiness,
        statusLevel
      };
    });
  }, [records]);

  // --- Smart ICD-10 Compliance & Diagnostic Audit Engine ---
  const diagnosticAlerts = useMemo(() => {
    const alertsList: {
      id: string;
      type: 'duration_mismatch' | 'excessive_mild' | 'board_required' | 'unit_outbreak';
      severity: 'high' | 'medium' | 'info';
      title: string;
      description: string;
      record?: LeaveRecord;
      actionLabel: string;
    }[] = [];
    
    records.forEach(r => {
      const duration = getDurationDays(r.startDate, r.endDate);
      const diag = (r.diagnosis || '').toLowerCase();
      
      // 1. Major injury but too short duration
      const isMajor = diag.includes('كسر') || diag.includes('عملية') || diag.includes('بتر') || diag.includes('جراحة') || diag.includes('خلع') || r.type === 'حادث';
      if (isMajor && duration < 10) {
        alertsList.push({
          id: `sh-${r.id}`,
          type: 'duration_mismatch',
          severity: 'high',
          title: 'مدى استشفائي منخفض لإصابة معقدة',
          description: `الفرد (${r.rank}/ ${r.name}) سجل له (${r.diagnosis}) بمدة ${duration} أيام فقط. بروتوكولات الشفاء الطبي المشترك توصي بحد أدنى 15 يوماً للالتئام التام.`,
          record: r,
          actionLabel: 'طلب إعادة تقدير للمدة'
        });
      }

      // 2. Minor illness but too long duration
      const isMild = diag.includes('انفلونزا') || diag.includes('زكام') || diag.includes('صداع') || diag.includes('إرهاق') || diag.includes('برد') || diag.includes('التهاب بسيط');
      if (isMild && duration > 7) {
        alertsList.push({
          id: `ex-${r.id}`,
          type: 'excessive_mild',
          severity: 'medium',
          title: 'استشفاء طويل لوعكة بسيطة',
          description: `الفرد (${r.rank}/ ${r.name}) منح إجازة مدتها ${duration} يوماً لتشخيص بسيط وهو (${r.diagnosis}). الحد المعتمد هو 5 أيام لسلامة الحضور الميداني.`,
          record: r,
          actionLabel: 'استفسار من جهة الإصدار'
        });
      }

      // 3. Very long leaves requiring high medical board approval
      if (duration > 30) {
        alertsList.push({
          id: `bd-${r.id}`,
          type: 'board_required',
          severity: 'high',
          title: 'طلب توقيع المجلس الطبي المشترك',
          description: `تجاوزت إجازة الفرد (${r.rank}/ ${r.name}) المتصلة 30 يوماً (${duration} يوماً). يجب توجيه الحالة للمجلس العسكري الأعلى لاعتماد الاستثناء.`,
          record: r,
          actionLabel: 'توجيه للمجلس الطبي'
        });
      }
    });

    // 4. Cluster outbreak by unit
    const activeUnitCounts: Record<string, number> = {};
    records.forEach(r => {
      const today = new Date('2026-07-01');
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      const isActive = !isNaN(start.getTime()) && !isNaN(end.getTime()) && today >= start && today <= end;
      if (isActive && r.unit) {
        activeUnitCounts[r.unit] = (activeUnitCounts[r.unit] || 0) + 1;
      }
    });

    Object.entries(activeUnitCounts).forEach(([unitName, count]) => {
      if (count >= 3) {
        alertsList.push({
          id: `cluster-${unitName}`,
          type: 'unit_outbreak',
          severity: 'medium',
          title: 'رصد بؤرة مرضية نشطة بالوحدة',
          description: `تم رصد عدد ${count} حالات إجازة طبية نشطة جارية بالسرية (${unitName}). يوصى بالتحقق السريع من الحالة الوبائية أو مستويات الإجهاد البدني العام.`,
          actionLabel: 'بدء تحقيق طبي وقائي'
        });
      }
    });

    // 5. Overlapping dates check
    const groupedByName: Record<string, LeaveRecord[]> = {};
    records.forEach(r => {
      if (!groupedByName[r.name]) {
        groupedByName[r.name] = [];
      }
      groupedByName[r.name].push(r);
    });

    Object.keys(groupedByName).forEach(name => {
      const list = groupedByName[name];
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const r1 = list[i];
          const r2 = list[j];
          const s1 = new Date(r1.startDate).getTime();
          const e1 = new Date(r1.endDate).getTime();
          const s2 = new Date(r2.startDate).getTime();
          const e2 = new Date(r2.endDate).getTime();

          if (!isNaN(s1) && !isNaN(e1) && !isNaN(s2) && !isNaN(e2)) {
            if (s1 <= e2 && s2 <= e1) {
              alertsList.push({
                id: `overlap-${r1.id}-${r2.id}`,
                type: 'duration_mismatch',
                severity: 'high',
                title: 'تعارض زمني حرج وتداخل إجازات',
                description: `الفرد (${r1.rank}/ ${name}) لديه تداخل في تواريخ الإجازات المرضية المسجلة: الإجازة الأولى (${formatDateToDMY(r1.startDate)} إلى ${formatDateToDMY(r1.endDate)}) تتعارض مع الإجازة الثانية (${formatDateToDMY(r2.startDate)} إلى ${formatDateToDMY(r2.endDate)}).`,
                record: r1,
                actionLabel: 'تعديل وحل التعارض'
              });
            }
          }
        }
      }
    });

    // 6. Chronological Inversion Check
    records.forEach(r => {
      const s = new Date(r.startDate).getTime();
      const e = new Date(r.endDate).getTime();
      if (!isNaN(s) && !isNaN(e) && s > e) {
        alertsList.push({
          id: `inverted-${r.id}`,
          type: 'duration_mismatch',
          severity: 'high',
          title: 'تاريخ بداية مقلوب أو لاحق للنهاية',
          description: `المنتسب (${r.rank}/ ${r.name}) لديه تاريخ بدء الإجازة (${formatDateToDMY(r.startDate)}) بعد تاريخ الانتهاء (${formatDateToDMY(r.endDate)}). يرجى إصلاح التواريخ.`,
          record: r,
          actionLabel: 'تصحيح التواريخ'
        });
      }

      // 7. Missing documentation
      if (!r.issuer || r.issuer.trim() === '' || !r.diagnosis || r.diagnosis.trim() === '') {
        alertsList.push({
          id: `incomplete-${r.id}`,
          type: 'excessive_mild',
          severity: 'medium',
          title: 'قصور التوثيق والبيانات الأساسية',
          description: `الإجازة الطبية المسجلة للفرد (${r.rank}/ ${r.name}) ينقصها توثيق جهة الإصدار الطبية أو التشخيص السريري الدقيق.`,
          record: r,
          actionLabel: 'استكمال الملف'
        });
      }
    });

    return alertsList;
  }, [records]);

  // --- KPI Stats Calculation (based on records list) ---
  const kpiStats = useMemo(() => {
    const today = new Date('2026-07-01');
    
    let active = 0;
    let ended = 0;
    let long = 0;
    let critical = 0;
    
    records.forEach((r) => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      const duration = getDurationDays(r.startDate, r.endDate);
      const isDValid = !isNaN(start.getTime()) && !isNaN(end.getTime());
      
      // Active
      if (isDValid && today >= start && today <= end) {
        active++;
      }
      
      // Ended
      if (isDValid && today > end) {
        ended++;
      }
      
      // Long Duration
      if (duration >= 15) {
        long++;
      }
      
      // Critical / Accident / Surgery cases
      const diagnosis = (r.diagnosis || '').toLowerCase();
      if (r.type === 'حادث' || diagnosis.includes('عملية') || diagnosis.includes('كسر') || diagnosis.includes('بتر') || diagnosis.includes('شظايا') || diagnosis.includes('نزيف') || diagnosis.includes('جلطة')) {
        critical++;
      }
    });
    
    return {
      total: records.length,
      active,
      ended,
      long,
      critical
    };
  }, [records]);

  // Responsive screen size listener for Android Bottom Sheet style
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sheetVariants = {
    hidden: isMobile ? { y: '100%', opacity: 1 } : { scale: 0.95, opacity: 0, y: 15 },
    visible: { y: 0, scale: 1, opacity: 1, transition: { type: 'spring', damping: 26, stiffness: 340 } },
    exit: isMobile ? { y: '100%', opacity: 1 } : { scale: 0.95, opacity: 0, y: 15 }
  };

  // Table Selection & Sorting
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof LeaveRecord | 'duration'>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(null);

  // Form Record (for Add or Edit)
  const [editingRecord, setEditingRecord] = useState<LeaveRecord | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    rank: 'جندي',
    unit: 'اللواء 43 عمالقة - الكتيبة الأولى',
    type: 'مريض' as LeaveRecord['type'],
    diagnosis: '',
    issuer: '',
    startDate: '',
    endDate: '',
    notes: ''
  });

  // Extend record
  const [extendingRecord, setExtendingRecord] = useState<LeaveRecord | null>(null);
  const [newEndDate, setNewEndDate] = useState('');
  const [extendNotes, setExtendNotes] = useState('');

  // History record
  const [historyRecord, setHistoryRecord] = useState<LeaveRecord | null>(null);

  // Extract all unique months from the record start dates for filtering
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    records.forEach((r) => {
      if (r.startDate && r.startDate.length >= 7) {
        // format "YYYY-MM"
        months.add(r.startDate.substring(0, 7));
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [records]);

  // --- Computed values for Estimator ---
  const estimatedDays = useMemo(() => {
    const baseDiag = ESTIMATOR_DIAGNOSES.find(d => d.id === selectedEstimatorId);
    if (!baseDiag) return 0;
    let days = baseDiag.recommendedDays;
    
    if (estimatorHospitalized) {
      days += 10;
    }
    
    if (estimatorSurgeryType === 'minor') {
      days += 7;
    } else if (estimatorSurgeryType === 'major') {
      days += 20;
    }
    
    if (estimatorRecoveryState === 'slow') {
      days = Math.ceil(days * 1.25);
    } else if (estimatorRecoveryState === 'fast') {
      days = Math.ceil(days * 0.85);
    }
    
    return days;
  }, [selectedEstimatorId, estimatorHospitalized, estimatorSurgeryType, estimatorRecoveryState]);

  const estimatedEndDate = useMemo(() => {
    if (!estimatorStartDate) return '';
    const start = new Date(estimatorStartDate);
    if (isNaN(start.getTime())) return '';
    const end = new Date(start);
    end.setDate(start.getDate() + estimatedDays - 1);
    return end.toISOString().split('T')[0];
  }, [estimatorStartDate, estimatedDays]);

  // Apply estimator logic
  const applyEstimatorToNewLeave = () => {
    const baseDiag = ESTIMATOR_DIAGNOSES.find(d => d.id === selectedEstimatorId);
    if (!baseDiag) return;
    
    setFormData({
      id: '',
      name: selectedBalanceMemberName || '',
      rank: 'جندي',
      unit: 'اللواء 43 عمالقة - الكتيبة الأولى',
      type: 'مريض',
      diagnosis: baseDiag.name + (estimatorHospitalized ? ' (تطلب تنويم)' : '') + (estimatorSurgeryType !== 'none' ? ` (مع جراحة ${estimatorSurgeryType === 'minor' ? 'صغرى' : 'كبرى'})` : ''),
      issuer: 'اللجنة الطبية الميدانية',
      startDate: estimatorStartDate,
      endDate: estimatedEndDate,
      notes: `تم الحساب استرشادياً ببروتوكول الاستشفاء المعتمد. التوصية: ${baseDiag.protocol}`
    });
    setEditingRecord(null);
    setIsFormModalOpen(true);
    triggerToast('تم تجهيز البيانات استرشادياً وتعبئة نموذج الإجازة بنجاح', 'success');
  };

  // --- Smart Radar Compliance Run ---
  const runSmartRadarAudit = () => {
    setIsRadarDiagnosing(true);
    setDiagnosticsCompleted(false);
    setTimeout(() => {
      setIsRadarDiagnosing(false);
      setDiagnosticsCompleted(true);
      triggerToast('تم فحص الجاهزية والتدقيق القانوني لكامل الكشوفات بنجاح!', 'success');
    }, 1500);
  };

  // --- Leave Balance Calculations ---
  // Extract all unique member names from records for suggestions or dropdown
  const uniqueMemberNames = useMemo(() => {
    const names = new Set<string>();
    records.forEach(r => {
      if (r.name) names.add(r.name.trim());
    });
    return Array.from(names);
  }, [records]);

  // Compute balance details for the selected balance soldier
  const balanceDetails = useMemo(() => {
    if (!selectedBalanceMemberName) return null;
    const nameLower = selectedBalanceMemberName.trim().toLowerCase();
    const soldierRecords = records.filter(r => r.name.trim().toLowerCase() === nameLower);
    
    // Sort oldest first to display timeline properly
    const sorted = [...soldierRecords].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    const currentYear = new Date('2026-07-01').getFullYear();
    let totalSickDaysThisYear = 0;
    let totalSickDaysAllTime = 0;
    let totalLeavesCount = soldierRecords.length;

    soldierRecords.forEach(r => {
      const duration = getDurationDays(r.startDate, r.endDate);
      totalSickDaysAllTime += duration;
      
      const startYear = new Date(r.startDate).getFullYear();
      if (startYear === currentYear) {
        totalSickDaysThisYear += duration;
      }
    });

    const rank = soldierRecords[0]?.rank || 'جندي';
    const unit = soldierRecords[0]?.unit || 'اللواء 43 عمالقة';

    // Military legal limit for fully-paid sick leave per year: 60 days
    const annualLimit = 60;
    const remainingBalance = Math.max(0, annualLimit - totalSickDaysThisYear);
    const percentUsed = Math.min(100, Math.round((totalSickDaysThisYear / annualLimit) * 100));

    // Risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let riskReason = 'سجل طبي مستقر ضمن النطاق الآمن.';
    if (totalSickDaysThisYear > 45) {
      riskLevel = 'high';
      riskReason = 'تجاوز أو اقترب بشدة من الحد السنوي الأقصى للإجازات المرضية (60 يوماً). يجب عرضه على اللجنة الطبية المباشرة.';
    } else if (totalSickDaysThisYear > 25 || totalLeavesCount >= 3) {
      riskLevel = 'medium';
      riskReason = 'استهلاك متوسط لرصيد الإجازات السنوي أو تكرار متزايد للوعكات الصحية.';
    }

    return {
      name: selectedBalanceMemberName,
      rank,
      unit,
      totalSickDaysThisYear,
      totalSickDaysAllTime,
      totalLeavesCount,
      remainingBalance,
      percentUsed,
      riskLevel,
      riskReason,
      records: sorted.reverse() // newest first
    };
  }, [records, selectedBalanceMemberName]);

  // Extract all leaves of the selected member and compute smart medical statistics
  const memberRecords = useMemo(() => {
    if (!selectedMemberName) return [];
    const searchName = selectedMemberName.trim().toLowerCase();
    return records.filter((r) => r.name.trim().toLowerCase() === searchName);
  }, [records, selectedMemberName]);

  const memberStats = useMemo(() => {
    if (memberRecords.length === 0) return null;

    // Sort chronologically (oldest first for overlap detection)
    const sorted = [...memberRecords].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    let totalDays = 0;
    let activeCount = 0;
    const typesCount: Record<string, number> = {};
    const diagnosisList: string[] = [];
    const overlaps: Array<{ r1: LeaveRecord; r2: LeaveRecord; range1: string; range2: string }> = [];
    const monthsSet = new Set<string>();

    const today = new Date('2026-07-01');

    sorted.forEach((r, idx) => {
      const d = getDurationDays(r.startDate, r.endDate);
      totalDays += d;

      typesCount[r.type] = (typesCount[r.type] || 0) + 1;

      if (r.diagnosis) {
        diagnosisList.push(r.diagnosis.trim());
      }

      if (r.startDate) {
        monthsSet.add(r.startDate.substring(0, 7));
      }

      // Check current active state
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && today >= start && today <= end) {
        activeCount++;
      }

      // Check overlap with subsequent ones
      for (let j = idx + 1; j < sorted.length; j++) {
        const other = sorted[j];
        const s1 = new Date(r.startDate);
        const e1 = new Date(r.endDate);
        const s2 = new Date(other.startDate);
        const e2 = new Date(other.endDate);

        if (!isNaN(s1.getTime()) && !isNaN(e1.getTime()) && !isNaN(s2.getTime()) && !isNaN(e2.getTime())) {
          if (s1 <= e2 && s2 <= e1) {
            overlaps.push({
              r1: r,
              r2: other,
              range1: `${formatDateToDMY(r.startDate)} إلى ${formatDateToDMY(r.endDate)}`,
              range2: `${formatDateToDMY(other.startDate)} إلى ${formatDateToDMY(other.endDate)}`
            });
          }
        }
      }
    });

    // Group matching diagnoses (case-insensitive and partial match)
    const recurringDiagnoses = diagnosisList.reduce((acc, diag) => {
      const match = Object.keys(acc).find(
        (key) => key.toLowerCase().includes(diag.toLowerCase()) || diag.toLowerCase().includes(key.toLowerCase())
      );
      if (match) {
        acc[match]++;
      } else {
        acc[diag] = 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const frequentDiags = Object.entries(recurringDiagnoses)
      .filter(([_, count]) => count > 1)
      .map(([diag, count]) => ({ diagnosis: diag, count }));

    // Count leaves by month
    const monthsCount: Record<string, number> = {};
    sorted.forEach((r) => {
      if (r.startDate && r.startDate.length >= 7) {
        const m = r.startDate.substring(0, 7);
        monthsCount[m] = (monthsCount[m] || 0) + 1;
      }
    });

    const isRecurringUser = sorted.length > 1;

    return {
      total: sorted.length,
      totalDays,
      activeCount,
      avgDays: (totalDays / sorted.length).toFixed(1),
      typesCount,
      overlaps,
      frequentDiags,
      monthsCount,
      isRecurringUser,
      sortedChronologically: [...sorted].reverse() // newest first for history view
    };
  }, [memberRecords]);

  // Group leaves and extract members with repeated leaves
  const repeatedLeaves = useMemo(() => {
    const groups: Record<string, {
      name: string;
      rank: string;
      unit: string;
      records: LeaveRecord[];
      totalDuration: number;
      types: Record<string, number>;
    }> = {};

    records.forEach((r) => {
      const key = r.name.trim().toLowerCase();
      if (!groups[key]) {
        groups[key] = {
          name: r.name,
          rank: r.rank,
          unit: r.unit,
          records: [],
          totalDuration: 0,
          types: {}
        };
      }
      groups[key].records.push(r);
      groups[key].totalDuration += getDurationDays(r.startDate, r.endDate);
      groups[key].types[r.type] = (groups[key].types[r.type] || 0) + 1;
    });

    return Object.values(groups)
      .map((g) => ({
        ...g,
        count: g.records.length,
        // Sort individual leaves chronologically (newest first)
        records: g.records.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      }))
      .filter((g) => {
        // Filter by min repeat count
        if (g.count < minRepeatCount) return false;
        
        // Filter by search term
        if (repeatedSearchTerm.trim() !== '') {
          const s = repeatedSearchTerm.toLowerCase();
          return (
            g.name.toLowerCase().includes(s) ||
            g.rank.toLowerCase().includes(s) ||
            g.unit.toLowerCase().includes(s)
          );
        }
        return true;
      })
      .sort((a, b) => b.count - a.count || b.totalDuration - a.totalDuration); // highest count first, then highest total duration
  }, [records, repeatedSearchTerm, minRepeatCount]);

  // Count total unique individuals who have 2 or more leaves in the system
  const repeatedMembersCount = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => {
      const name = r.name.trim().toLowerCase();
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.values(counts).filter(c => c >= 2).length;
  }, [records]);

  // Statistics for the currently visible repeated leaves list
  const repeatedStats = useMemo(() => {
    let totalLeavesCount = 0;
    let totalDays = 0;
    let maxCount = 0;

    repeatedLeaves.forEach((g) => {
      totalLeavesCount += g.count;
      totalDays += g.totalDuration;
      if (g.count > maxCount) {
        maxCount = g.count;
      }
    });

    return {
      individualsCount: repeatedLeaves.length,
      totalLeavesCount,
      totalDays,
      maxCount
    };
  }, [repeatedLeaves]);

  // Today's date reference
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const getDaysDiff = (date1: string, date2: string) => {
    if (!date1 || !date2) return 0;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    // Set hours to midnight to compare only dates
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    const diffTime = d1.getTime() - d2.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Alarms and direct return records
  const alertRecords = useMemo(() => {
    return records
      .map((r) => {
        const diff = getDaysDiff(r.endDate, todayStr);
        let status: 'overdue' | 'today' | 'tomorrow' | 'soon' | 'other' = 'other';

        if (diff < 0) {
          status = 'overdue';
        } else if (diff === 0) {
          status = 'today';
        } else if (diff === 1) {
          status = 'tomorrow';
        } else if (diff > 1 && diff <= 7) {
          status = 'soon';
        }

        return {
          ...r,
          daysDiff: diff,
          alertStatus: status
        };
      })
      .filter((r) => {
        // We track leaves that:
        // - are overdue (daysDiff < 0, up to last 30 days of overdue for tracking)
        // - are ending today (daysDiff === 0)
        // - are ending tomorrow (daysDiff === 1)
        // - are ending soon (daysDiff > 1 && daysDiff <= 7)
        if (r.daysDiff < -30 || r.daysDiff > 7) {
          return false;
        }

        // Apply category filter (Ended vs Active leaves)
        if (alarmTypeCategory === 'ended') {
          if (r.alertStatus !== 'overdue') return false;
        } else if (alarmTypeCategory === 'active') {
          if (r.alertStatus === 'overdue' || r.alertStatus === 'other') return false;
        }

        // Apply alarm status filters
        if (alertsFilter === 'overdue' && r.alertStatus !== 'overdue') return false;
        if (alertsFilter === 'today' && r.alertStatus !== 'today') return false;
        if (alertsFilter === 'tomorrow' && r.alertStatus !== 'tomorrow') return false;
        if (alertsFilter === 'soon' && r.alertStatus !== 'soon') return false;

        // Apply contact status filters
        if (contactStatusFilter !== 'all') {
          if (contactStatusFilter === 'pending') {
            if (r.contactStatus && r.contactStatus !== 'pending') return false;
          } else {
            if (r.contactStatus !== contactStatusFilter) return false;
          }
        }

        // Apply search filter
        if (alertsSearchTerm.trim() !== '') {
          const s = alertsSearchTerm.toLowerCase();
          return (
            r.name.toLowerCase().includes(s) ||
            r.rank.toLowerCase().includes(s) ||
            r.unit.toLowerCase().includes(s) ||
            r.diagnosis.toLowerCase().includes(s) ||
            r.issuer.toLowerCase().includes(s)
          );
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by urgency: overdue first, then today, tomorrow, soon
        return a.daysDiff - b.daysDiff;
      });
  }, [records, todayStr, alertsFilter, alarmTypeCategory, contactStatusFilter, alertsSearchTerm]);

  // KPI calculations for Alarms hub
  const alertStats = useMemo(() => {
    let overdueCount = 0;
    let todayCount = 0;
    let tomorrowCount = 0;
    let soonCount = 0;
    let overdueEvadingCount = 0;
    let overdueNoAnswerCount = 0;
    let overduePendingCount = 0;
    let activeConfirmedCount = 0;
    let activeExtensionRequestCount = 0;

    records.forEach((r) => {
      const diff = getDaysDiff(r.endDate, todayStr);
      if (diff < 0 && diff >= -30) {
        overdueCount++;
        if (r.contactStatus === 'evading') {
          overdueEvadingCount++;
        } else if (r.contactStatus === 'no_answer') {
          overdueNoAnswerCount++;
        } else if (!r.contactStatus || r.contactStatus === 'pending') {
          overduePendingCount++;
        }
      } else if (diff >= 0 && diff <= 7) {
        if (diff === 0) {
          todayCount++;
        } else if (diff === 1) {
          tomorrowCount++;
        } else {
          soonCount++;
        }

        if (r.contactStatus === 'confirmed') {
          activeConfirmedCount++;
        } else if (r.contactStatus === 'request_extension') {
          activeExtensionRequestCount++;
        }
      }
    });

    return {
      overdueCount,
      todayCount,
      tomorrowCount,
      soonCount,
      overdueEvadingCount,
      overdueNoAnswerCount,
      overduePendingCount,
      activeConfirmedCount,
      activeExtensionRequestCount,
      totalAlerts: overdueCount + todayCount + tomorrowCount + soonCount
    };
  }, [records, todayStr]);

  // Action for direct return confirmation
  const handleConfirmReturn = async (record: LeaveRecord) => {
    if (confirm(`هل أنت متأكد من تأكيد مباشرة الخدمة والالتحاق الميداني للمنتسب "${record.rank} / ${record.name}"؟ سيتم إنهاء إجازته المرضية بنجاح وتسجيل عودته.`)) {
      const timestamp = new Date().toLocaleString('ar-YE', { hour12: false });
      const todayStrLocal = new Date().toISOString().split('T')[0];

      const previousData = {
        endDate: record.endDate,
        notes: record.notes
      };

      const returnHistory: HistoryEntry = {
        date: timestamp,
        action: 'تعديل',
        details: 'تم تأكيد مباشرة الخدمة والعودة للعمل الميداني والالتحاق بالكتيبة.',
        previousData
      };

      // Set endDate to today so the leave is officially terminated as of today
      // (or yesterday if today is already past original endDate, keep original)
      const finalEndDate = new Date(record.endDate) > new Date(todayStrLocal) ? todayStrLocal : record.endDate;

      const updatedRecord: LeaveRecord = {
        ...record,
        endDate: finalEndDate,
        notes: `${record.notes || ''}\n[تأكيد عودة في ${timestamp.split(' ')[0]}]: تم تأكيد عودة المنتسب لمباشرة الخدمة الفعلية والتحاقه بالكتيبة بنجاح.`.trim(),
        history: [...(record.history || []), returnHistory]
      };

      try {
        await onUpdate(updatedRecord);
        triggerToast(`تم تأكيد مباشرة الخدمة لـ ${record.name} بنجاح والتحاقه بوحدته الميدانية`, 'success');
      } catch (err) {
        triggerToast('فشل في حفظ تأكيد مباشرة الخدمة', 'error');
      }
    }
  };

  // Handle Header Sorting Click
  const handleSort = (field: keyof LeaveRecord | 'duration') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // --- Filter and Sort Logic ---
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Search filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(searchLower) ||
          r.rank.toLowerCase().includes(searchLower) ||
          r.diagnosis.toLowerCase().includes(searchLower) ||
          r.notes.toLowerCase().includes(searchLower) ||
          r.issuer.toLowerCase().includes(searchLower) ||
          r.unit.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (selectedType !== '') {
      result = result.filter((r) => r.type === selectedType);
    }

    // Month filter
    if (selectedMonth !== '') {
      result = result.filter((r) => r.startDate.startsWith(selectedMonth));
    }

    // Quick Filter
    if (quickFilter === 'active') {
      const today = new Date('2026-07-01');
      result = result.filter((r) => {
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        return !isNaN(start.getTime()) && !isNaN(end.getTime()) && today >= start && today <= end;
      });
    } else if (quickFilter === 'ended') {
      const today = new Date('2026-07-01');
      result = result.filter((r) => {
        const end = new Date(r.endDate);
        return !isNaN(end.getTime()) && today > end;
      });
    } else if (quickFilter === 'long') {
      result = result.filter((r) => getDurationDays(r.startDate, r.endDate) >= 15);
    } else if (quickFilter === 'extended') {
      result = result.filter((r) => {
        const hasHistoryExtension = r.history && r.history.some((h) => h.action === 'تمديد');
        const hasNotesExtension = r.notes && r.notes.includes('تمديد');
        return !!(hasHistoryExtension || hasNotesExtension);
      });
    }

    // Sorting
    result.sort((a, b) => {
      let valA: any = sortField === 'duration' ? getDurationDays(a.startDate, a.endDate) : a[sortField];
      let valB: any = sortField === 'duration' ? getDurationDays(b.startDate, b.endDate) : b[sortField];

      // Handle strings, dates or numbers
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [records, searchTerm, selectedType, selectedMonth, sortField, sortDirection, quickFilter]);

  // --- Filtered Stats for Real-Time Display ---
  const filteredStats = useMemo(() => {
    const today = new Date('2026-07-01');
    const totalCount = filteredRecords.length;
    const totalDays = filteredRecords.reduce((acc, r) => acc + getDurationDays(r.startDate, r.endDate), 0);
    const avgDays = totalCount ? Math.round(totalDays / totalCount) : 0;
    
    let activeCount = 0;
    let warningCount = 0;
    
    filteredRecords.forEach(r => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      const isDValid = !isNaN(start.getTime()) && !isNaN(end.getTime());
      if (isDValid && today >= start && today <= end) {
        activeCount++;
      }
      
      const isLong = getDurationDays(r.startDate, r.endDate) >= 15;
      const diag = (r.diagnosis || '').toLowerCase();
      const isCritical = r.type === 'حادث' || diag.includes('عملية') || diag.includes('كسر') || diag.includes('بتر') || diag.includes('شظايا');
      if (isLong || isCritical) {
        warningCount++;
      }
    });

    return {
      totalCount,
      totalDays,
      avgDays,
      activeCount,
      warningCount
    };
  }, [filteredRecords]);

  // --- Smart Compliance Auditor & Integrity Score ---
  const auditAnalysis = useMemo(() => {
    const overlaps: { r1: LeaveRecord; r2: LeaveRecord; memberName: string }[] = [];
    const excessiveLeaves: LeaveRecord[] = [];
    const incompleteRecords: LeaveRecord[] = [];
    const invertedDates: LeaveRecord[] = [];

    // Group by name to check overlaps
    const groupedByName: { [name: string]: LeaveRecord[] } = {};
    records.forEach(r => {
      if (!groupedByName[r.name]) {
        groupedByName[r.name] = [];
      }
      groupedByName[r.name].push(r);
    });

    Object.keys(groupedByName).forEach(name => {
      const list = groupedByName[name];
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const r1 = list[i];
          const r2 = list[j];
          const s1 = new Date(r1.startDate).getTime();
          const e1 = new Date(r1.endDate).getTime();
          const s2 = new Date(r2.startDate).getTime();
          const e2 = new Date(r2.endDate).getTime();

          if (!isNaN(s1) && !isNaN(e1) && !isNaN(s2) && !isNaN(e2)) {
            // Check overlap
            if (s1 <= e2 && s2 <= e1) {
              overlaps.push({ r1, r2, memberName: name });
            }
          }
        }
      }
    });

    records.forEach(r => {
      const duration = getDurationDays(r.startDate, r.endDate);
      const diag = (r.diagnosis || '').toLowerCase();
      const notes = (r.notes || '').toLowerCase();
      
      // 1. Inverted dates
      const s = new Date(r.startDate).getTime();
      const e = new Date(r.endDate).getTime();
      if (!isNaN(s) && !isNaN(e) && s > e) {
        invertedDates.push(r);
      }

      // 2. Excessive duration without board
      const isBoardApproved = diag.includes('لجنة') || diag.includes('هيئة') || notes.includes('لجنة') || notes.includes('هيئة') || r.diagnosis?.includes('اللجنة');
      if (duration >= 45 && !isBoardApproved) {
        excessiveLeaves.push(r);
      }

      // 3. Incomplete records
      if (!r.issuer || r.issuer.trim() === '' || !r.diagnosis || r.diagnosis.trim() === '') {
        incompleteRecords.push(r);
      }
    });

    const totalIssues = overlaps.length * 12 + excessiveLeaves.length * 8 + incompleteRecords.length * 4 + invertedDates.length * 15;
    const score = Math.max(10, 100 - totalIssues);

    return {
      overlaps,
      excessiveLeaves,
      incompleteRecords,
      invertedDates,
      score,
      totalIssuesCount: overlaps.length + excessiveLeaves.length + incompleteRecords.length + invertedDates.length
    };
  }, [records]);

  // --- Unit Readiness & Power Impact Stats ---
  const unitReadinessStats = useMemo(() => {
    const today = new Date('2026-07-01');
    const unitMap: { [unit: string]: { total: number; active: number; soldiers: LeaveRecord[] } } = {};
    
    records.forEach(r => {
      const unit = r.unit || 'قيادة اللواء والوحدات العامة';
      if (!unitMap[unit]) {
        unitMap[unit] = { total: 0, active: 0, soldiers: [] };
      }
      unitMap[unit].total++;
      
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      const isDValid = !isNaN(start.getTime()) && !isNaN(end.getTime());
      const isActive = isDValid && today >= start && today <= end;
      
      if (isActive) {
        unitMap[unit].active++;
        unitMap[unit].soldiers.push(r);
      }
    });

    return Object.keys(unitMap).map(unitName => {
      const data = unitMap[unitName];
      const activeSick = data.active;
      const readinessPercent = Math.max(50, 100 - (activeSick * 8));
      
      let statusColor = 'text-emerald-500';
      let statusBg = 'bg-emerald-500/10';
      let statusLabel = 'جاهزية قتالية متكاملة';
      let borderCol = 'border-emerald-500/25';
      
      if (activeSick >= 4) {
        statusColor = 'text-rose-500';
        statusBg = 'bg-rose-500/10';
        statusLabel = 'تأثير عملياتي حرج';
        borderCol = 'border-rose-500/25';
      } else if (activeSick >= 2) {
        statusColor = 'text-amber-500';
        statusBg = 'bg-amber-500/10';
        statusLabel = 'انخفاض متوسط وعملياتي';
        borderCol = 'border-amber-500/25';
      }

      return {
        unitName,
        totalRecords: data.total,
        activeSick,
        readinessPercent,
        statusColor,
        statusBg,
        statusLabel,
        borderCol,
        soldiers: data.soldiers
      };
    });
  }, [records]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredRecords.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredRecords, currentPage]);

  // Handle Multi-Selection Checkboxes
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = paginatedRecords.map((r) => r.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = paginatedRecords.map((r) => r.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const isAllPageSelected = paginatedRecords.length > 0 && paginatedRecords.every((r) => selectedIds.includes(r.id));

  // --- Actions ---

  // Export visible to CSV
  const handleExportVisibleCSV = () => {
    if (filteredRecords.length === 0) {
      triggerToast('لا توجد بيانات ظاهرة للتصدير', 'error');
      return;
    }

    const headers = [
      'المعرف',
      'الاسم الكامل',
      'الرتبة',
      'الوحدة العسكرية',
      'نوع الإجازة',
      'التشخيص الطبي',
      'جهة الإصدار',
      'تاريخ البداية',
      'تاريخ النهاية',
      'المدة بالأيام',
      'ملاحظات'
    ];

    const rows = filteredRecords.map((r) => [
      r.id,
      r.name,
      r.rank,
      r.unit,
      r.type,
      r.diagnosis,
      r.issuer,
      r.startDate,
      r.endDate,
      getDurationDays(r.startDate, r.endDate),
      r.notes
    ]);

    // Format with BOM for Arabic excel compatibility
    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `إجازات_اللواء_43_مصفاة_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast(`تم تصدير ${filteredRecords.length} سجل بنجاح بصيغة CSV`, 'success');
  };

  // Bulk Delete Trigger
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDelete(true);
    setRecordToDelete(null);
    setDeleteModalOpen(true);
  };

  // Single Delete Trigger
  const handleSingleDelete = async (record: LeaveRecord) => {
    setIsBulkDelete(false);
    setRecordToDelete(record);
    setDeleteModalOpen(true);
  };

  // Execute actual deletion
  const executeDelete = async () => {
    if (isBulkDelete) {
      if (selectedIds.length === 0) return;
      try {
        await onDeleteMultiple(selectedIds);
        setSelectedIds([]);
        triggerToast('تم حذف السجلات المحددة بنجاح من كشوفات السيطرة', 'success');
        if (paginatedRecords.length === selectedIds.length && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (err) {
        triggerToast('حدث خطأ أثناء محاولة حذف السجلات العسكرية', 'error');
      }
    } else if (recordToDelete) {
      try {
        await onDelete(recordToDelete.id);
        setSelectedIds((prev) => prev.filter((id) => id !== recordToDelete.id));
        triggerToast('تم حذف السجل بنجاح من قيود السيطرة والربط المالي', 'success');
      } catch (err) {
        triggerToast('حدث خطأ أثناء محاولة حذف السجل العسكري', 'error');
      }
    }
  };

  // Open Form Modal for Adding
  const openAddModal = () => {
    setEditingRecord(null);
    setFormData({
      id: `rec_${Date.now()}`,
      name: '',
      rank: 'جندي',
      unit: 'اللواء 43 عمالقة - الكتيبة الأولى',
      type: 'مريض',
      diagnosis: '',
      issuer: 'مستشفى الجمهورية - عدن',
      startDate: new Date().toISOString().substring(0, 10),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      notes: ''
    });
    setIsFormModalOpen(true);
  };

  // Open Form Modal for Editing
  const openEditModal = (record: LeaveRecord) => {
    setEditingRecord(record);
    setFormData({
      id: record.id,
      name: record.name,
      rank: record.rank,
      unit: record.unit,
      type: record.type,
      diagnosis: record.diagnosis,
      issuer: record.issuer,
      startDate: record.startDate,
      endDate: record.endDate,
      notes: record.notes || ''
    });
    setIsFormModalOpen(true);
  };

  // Save Add/Edit Form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      triggerToast('يجب إدخال الاسم الكامل للمنتسب', 'error');
      return;
    }
    if (!formData.diagnosis.trim()) {
      triggerToast('يجب كتابة التشخيص الطبي بشكل واضح', 'error');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      triggerToast('يرجى تحديد تواريخ البداية والنهاية', 'error');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      triggerToast('تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية', 'error');
      return;
    }

    const timestamp = new Date().toLocaleString('ar-YE', { hour12: false });

    if (editingRecord) {
      // Modify existing
      const previousData = {
        name: editingRecord.name,
        rank: editingRecord.rank,
        unit: editingRecord.unit,
        type: editingRecord.type,
        diagnosis: editingRecord.diagnosis,
        issuer: editingRecord.issuer,
        startDate: editingRecord.startDate,
        endDate: editingRecord.endDate,
        notes: editingRecord.notes
      };

      const newHistoryEntry: HistoryEntry = {
        date: timestamp,
        action: 'تعديل',
        details: 'تم تعديل تفاصيل الإجازة المرضية والتقرير الطبي المرافق.',
        previousData
      };

      const updatedRecord: LeaveRecord = {
        ...formData,
        history: [...(editingRecord.history || []), newHistoryEntry]
      };

      try {
        await onUpdate(updatedRecord);
        setIsFormModalOpen(false);
        triggerToast(`تم تعديل بيانات الإجازة لـ ${formData.name} بنجاح`, 'success');
      } catch (err) {
        triggerToast('فشل في حفظ التعديلات', 'error');
      }
    } else {
      // Create new
      const newHistoryEntry: HistoryEntry = {
        date: timestamp,
        action: 'إنشاء',
        details: 'تم تسجيل الإجازة الطبية وإنشاء السجل لأول مرة.'
      };

      const newRecord: LeaveRecord = {
        ...formData,
        history: [newHistoryEntry]
      };

      try {
        await onAdd(newRecord);
        setIsFormModalOpen(false);
        triggerToast(`تم تسجيل إجازة ${formData.name} بنجاح`, 'success');
      } catch (err) {
        triggerToast('فشل في إضافة السجل الجديد', 'error');
      }
    }
  };

  // Open Extension Modal
  const openExtendModal = (record: LeaveRecord) => {
    setExtendingRecord(record);
    setNewEndDate(new Date(new Date(record.endDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
    setExtendNotes('');
    setIsExtendModalOpen(true);
  };

  // Save Extension
  const handleSaveExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingRecord) return;

    if (!newEndDate) {
      triggerToast('يرجى تحديد تاريخ نهاية التمديد الجديد', 'error');
      return;
    }

    if (new Date(newEndDate) <= new Date(extendingRecord.endDate)) {
      triggerToast('تاريخ التمديد الجديد يجب أن يكون لاحقاً لتاريخ النهاية الحالي', 'error');
      return;
    }

    const timestamp = new Date().toLocaleString('ar-YE', { hour12: false });
    const oldEndDate = extendingRecord.endDate;

    const extensionHistory: HistoryEntry = {
      date: timestamp,
      action: 'تمديد',
      details: `تم تمديد الإجازة من ${oldEndDate} إلى ${newEndDate}. ملاحظات التمديد: ${extendNotes || 'لا يوجد'}`
    };

    const updatedRecord: LeaveRecord = {
      ...extendingRecord,
      endDate: newEndDate,
      notes: `${extendingRecord.notes || ''}\n[تمديد في ${timestamp.split(' ')[0]}]: تم التمديد لغاية ${newEndDate}.`.trim(),
      history: [...(extendingRecord.history || []), extensionHistory]
    };

    try {
      await onUpdate(updatedRecord);
      setIsExtendModalOpen(false);
      triggerToast(`تم تمديد إجازة ${extendingRecord.name} لغاية ${newEndDate}`, 'success');
    } catch (err) {
      triggerToast('فشل في تسجيل تمديد الإجازة', 'error');
    }
  };

  // Open History Modal
  const openHistoryModal = (record: LeaveRecord) => {
    setHistoryRecord(record);
    setIsHistoryModalOpen(true);
  };

  // Toggle Card Expanded state
  const toggleCardExpanded = (id: string) => {
    setExpandedCardIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Export Filtered/All Records to CSV
  const handleExportCSV = () => {
    const listToExport = filteredRecords.length > 0 ? filteredRecords : records;
    if (listToExport.length === 0) {
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

    const rows = listToExport.map((r) => [
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
    link.setAttribute('download', `كشف_الإجازات_الطبية_المصنف_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast('تم تصدير نسخة الكشف بصيغة CSV بنجاح', 'success');
  };

  // Save Call Log / Contact Attempt
  const handleSaveCallLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingCallRecord) return;

    const timestamp = new Date().toLocaleString('ar-YE', { hour12: false });
    const statusLabels: Record<string, string> = {
      pending: 'قيد الانتظار',
      confirmed: 'تم التأكيد ومستعد للوصول',
      request_extension: 'طلب تمديد إجازة',
      no_answer: 'الهاتف لا يجيب / مغلق',
      evading: 'متهرب ومخالف للأوامر'
    };

    const newLog = {
      date: timestamp,
      status: statusLabels[callStatus] || callStatus,
      note: callNote.trim() || 'تم إجراء محاولة الاتصال.'
    };

    const callHistory: HistoryEntry = {
      date: timestamp,
      action: 'تعديل',
      details: `تم تحديث حالة المتابعة والتواصل إلى: [${newLog.status}]. ملاحظات: ${newLog.note}`
    };

    const updatedRecord: LeaveRecord = {
      ...loggingCallRecord,
      contactStatus: callStatus,
      contactLogs: [newLog, ...(loggingCallRecord.contactLogs || [])],
      history: [...(loggingCallRecord.history || []), callHistory]
    };

    try {
      await onUpdate(updatedRecord);
      setLoggingCallRecord(null);
      setCallNote('');
      triggerToast(`تم تحديث حالة المتابعة وتوثيق المكالمة لـ ${loggingCallRecord.name}`, 'success');
    } catch (err) {
      triggerToast('فشل في حفظ سجل المكالمة', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 
        ========================================================================
        البطاقة الرئيسية (MAIN CARD CONTAINER)
        ========================================================================
        A single cohesive unified layout that beautifully holds the card header, 
        responsive toolbar, structured table of records, and the summary footer.
      */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-none print:shadow-none print:w-full print:p-0 print-container">
        
        {/* 1. تبويبات تصفح القسم الفرعي والأزرار السريعة (Sub-Tabs & Quick Action Header) - Hidden on Print */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-3 sm:p-4 sm:px-6 sm:py-4 gap-4 select-none print:hidden">
          {/* Right Side: Tab buttons in a highly polished segmented container, optimized for touch on mobile */}
          <div className="w-full lg:w-auto bg-slate-100/70 dark:bg-slate-950/60 p-1 sm:p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-inner">
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:flex sm:flex-wrap items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('log')}
                className={`group flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl text-[10px] xs:text-[11px] sm:text-xs font-black transition-all duration-300 cursor-pointer flex-1 min-h-[44px] ${
                  activeSubTab === 'log'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-900/40'
                }`}
              >
                <div className={`p-1 rounded-lg transition-all duration-300 ${
                  activeSubTab === 'log'
                    ? 'bg-slate-950/10 text-slate-950'
                    : 'bg-slate-200/50 dark:bg-slate-850 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}>
                  <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </div>
                <span className="truncate">سجل الإجازات</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('timeline')}
                className={`group flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl text-[10px] xs:text-[11px] sm:text-xs font-black transition-all duration-300 cursor-pointer flex-1 min-h-[44px] ${
                  activeSubTab === 'timeline'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-900/40'
                }`}
              >
                <div className={`p-1 rounded-lg transition-all duration-300 ${
                  activeSubTab === 'timeline'
                    ? 'bg-slate-950/10 text-slate-950'
                    : 'bg-slate-200/50 dark:bg-slate-850 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}>
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </div>
                <span className="truncate">المخطط الزمني</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('repeated')}
                className={`group flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl text-[10px] xs:text-[11px] sm:text-xs font-black transition-all duration-300 cursor-pointer flex-1 min-h-[44px] ${
                  activeSubTab === 'repeated'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-900/40'
                }`}
              >
                <div className={`p-1 rounded-lg transition-all duration-300 ${
                  activeSubTab === 'repeated'
                    ? 'bg-slate-950/10 text-slate-950'
                    : 'bg-slate-200/50 dark:bg-slate-850 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}>
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </div>
                <span className="truncate">الإجازات المتكررة</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full transition-all ${
                  activeSubTab === 'repeated'
                    ? 'bg-slate-950 text-amber-500'
                    : 'bg-rose-500 text-white shadow-sm shadow-rose-500/10 animate-pulse'
                }`}>
                  {repeatedMembersCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('alerts')}
                className={`group flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl text-[10px] xs:text-[11px] sm:text-xs font-black transition-all duration-300 cursor-pointer flex-1 min-h-[44px] ${
                  activeSubTab === 'alerts'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-900/40'
                }`}
              >
                <div className={`p-1 rounded-lg transition-all duration-300 ${
                  activeSubTab === 'alerts'
                    ? 'bg-slate-950/10 text-slate-950'
                    : 'bg-slate-200/50 dark:bg-slate-850 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}>
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </div>
                <span className="truncate">مركز الإنذار</span>
                {alertStats.totalAlerts > 0 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full transition-all ${
                    activeSubTab === 'alerts'
                      ? 'bg-slate-950 text-amber-500'
                      : 'bg-rose-500 text-white animate-pulse shadow-sm shadow-rose-500/10'
                  }`}>
                    {alertStats.totalAlerts}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('estimator')}
                className={`group flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl text-[10px] xs:text-[11px] sm:text-xs font-black transition-all duration-300 cursor-pointer flex-1 min-h-[44px] ${
                  activeSubTab === 'estimator'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-900/40'
                }`}
              >
                <div className={`p-1 rounded-lg transition-all duration-300 ${
                  activeSubTab === 'estimator'
                    ? 'bg-slate-950/10 text-slate-950'
                    : 'bg-slate-200/50 dark:bg-slate-850 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}>
                  <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </div>
                <span className="truncate">حاسبة مدد الاستشفاء</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('balance')}
                className={`group flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl text-[10px] xs:text-[11px] sm:text-xs font-black transition-all duration-300 cursor-pointer flex-1 min-h-[44px] ${
                  activeSubTab === 'balance'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-900/40'
                }`}
              >
                <div className={`p-1 rounded-lg transition-all duration-300 ${
                  activeSubTab === 'balance'
                    ? 'bg-slate-950/10 text-slate-950'
                    : 'bg-slate-200/50 dark:bg-slate-850 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}>
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </div>
                <span className="truncate">تحليل الأرصدة والحد السنوي</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('radar')}
                className={`group flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl text-[10px] xs:text-[11px] sm:text-xs font-black transition-all duration-300 cursor-pointer flex-1 min-h-[44px] relative overflow-hidden ${
                  activeSubTab === 'radar'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-900/40'
                }`}
              >
                <div className={`p-1 rounded-lg transition-all duration-300 ${
                  activeSubTab === 'radar'
                    ? 'bg-slate-950/10 text-slate-950'
                    : 'bg-slate-200/50 dark:bg-slate-850 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}>
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] text-amber-600 dark:text-amber-400 group-hover:animate-spin" />
                </div>
                <span className="truncate">رادار الجاهزية والمدقق الذكي</span>
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[7px] font-black px-1 rounded-bl-lg animate-bounce">
                  حصري
                </span>
              </button>
            </div>
          </div>

          {/* Left Side: Register New Leave & Actions Dropdown */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Actions Dropdown Button (تصدير وطباعة) */}
            <div className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'actions' ? null : 'actions')}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold rounded-xl text-xs transition-all duration-200 cursor-pointer border border-slate-200/85 dark:border-slate-700 shadow-sm min-h-[48px]"
              >
                <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>إجراءات التصدير والطباعة</span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${openDropdown === 'actions' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'actions' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute left-0 lg:left-auto lg:right-0 mt-1.5 w-60 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl shadow-xl z-50 py-1.5 text-right font-sans">
                    {/* Print Filtered List */}
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                        setOpenDropdown(null);
                      }}
                      className="w-full text-right px-4 py-2.5 text-xs font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4 text-slate-400" />
                      <span>طباعة الكشف الطبي الحالي</span>
                    </button>

                    {/* Export current list to Excel via Wizard */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportWizardOpen(true);
                        setOpenDropdown(null);
                      }}
                      className="w-full text-right px-4 py-2.5 text-xs font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800/60"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      <span>تصدير إلى Excel (تقرير سنوي)</span>
                    </button>

                    {/* Export current list as CSV */}
                    <button
                      type="button"
                      onClick={() => {
                        handleExportCSV();
                        setOpenDropdown(null);
                      }}
                      className="w-full text-right px-4 py-2.5 text-xs font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800/60"
                    >
                      <Download className="w-4 h-4 text-indigo-500" />
                      <span>تصدير الكشف بصيغة CSV</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Register New Leave Button */}
            <button
              onClick={openAddModal}
              className="w-full sm:w-auto flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs transition-all duration-200 cursor-pointer shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] min-h-[48px]"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>تسجيل إجازة جديدة</span>
            </button>
          </div>
        </div>
        {activeSubTab === 'log' ? (
          <>
            <div className="p-4 border-b border-slate-150 dark:border-slate-800/50 bg-white dark:bg-slate-900 print:hidden select-none">
          {/* Streamlined Modern Sub-navigation Toolbar with Dropdown Menus */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-right">
            
            {/* Search and Quick Filters Column */}
            <div className="flex flex-col gap-2.5 flex-1 max-w-xl">
              {/* Search Input Box */}
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="ابحث بالاسم، التشخيص الطبي، الجهة أو الملاحظات..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-4 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-right transition-all font-sans"
                />
                <Search className="w-4 h-4 text-slate-400 absolute top-3.5 right-4 pointer-events-none" />
              </div>

              {/* Quick Filter Presets Row */}
              <div className="flex flex-wrap items-center gap-1.5 select-none">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold ml-1">التصفية السريعة:</span>
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'active', label: 'النشطة حالياً 🟢' },
                  { id: 'ended', label: 'المنتهية 🛑' },
                  { id: 'long', label: 'طويلة (15+ يوم) ⏳' },
                  { id: 'extended', label: 'الممددة 🔁' }
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => {
                      setQuickFilter(pill.id as any);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer border ${
                      quickFilter === pill.id
                        ? 'bg-amber-500 border-amber-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Concise Dropdowns Row */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* 1. Case Type Custom Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border text-xs font-black rounded-xl transition-all cursor-pointer ${
                    selectedType !== ''
                      ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                      : 'border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>{selectedType === '' ? 'جميع الأنواع' : `النوع: ${selectedType}`}</span>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${openDropdown === 'type' ? 'rotate-180' : ''}`} />
                </button>
                
                {openDropdown === 'type' && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                    <div className="absolute left-0 lg:left-auto lg:right-0 mt-1.5 w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {[
                        { id: '', label: 'الكل (جميع الأنواع)' },
                        { id: 'مريض', label: 'مريض' },
                        { id: 'مرافق', label: 'مرافق' },
                        { id: 'مرض قريب', label: 'مرض (حالة قريب)' },
                        { id: 'حادث', label: 'حادث' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSelectedType(opt.id);
                            setCurrentPage(1);
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-right px-4 py-2 text-xs font-bold transition-all flex items-center justify-between ${
                            selectedType === opt.id
                              ? 'bg-amber-500/10 text-amber-500 font-black'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {selectedType === opt.id && <Check className="w-3.5 h-3.5 text-amber-500" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 2. Month Selector Custom Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border text-xs font-black rounded-xl transition-all cursor-pointer ${
                    selectedMonth !== ''
                      ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                      : 'border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>{selectedMonth === '' ? 'جميع الشهور' : getArabicMonthName(selectedMonth)}</span>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${openDropdown === 'month' ? 'rotate-180' : ''}`} />
                </button>
                
                {openDropdown === 'month' && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                    <div className="absolute left-0 lg:left-auto lg:right-0 mt-1.5 w-48 max-h-60 overflow-y-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl shadow-xl z-50 py-1.5 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMonth('');
                          setCurrentPage(1);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-right px-4 py-2 text-xs font-bold transition-all flex items-center justify-between ${
                          selectedMonth === ''
                            ? 'bg-amber-500/10 text-amber-500 font-black'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        <span>جميع الشهور</span>
                        {selectedMonth === '' && <Check className="w-3.5 h-3.5 text-amber-500" />}
                      </button>
                      {availableMonths.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(m);
                            setCurrentPage(1);
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-right px-4 py-2 text-xs font-bold transition-all flex items-center justify-between ${
                            selectedMonth === m
                              ? 'bg-amber-500/10 text-amber-500 font-black'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                          }`}
                        >
                          <span>{getArabicMonthName(m)}</span>
                          {selectedMonth === m && <Check className="w-3.5 h-3.5 text-amber-500" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 3. Intelligent Filters Custom Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'quick' ? null : 'quick')}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border text-xs font-black rounded-xl transition-all cursor-pointer ${
                    quickFilter !== 'all'
                      ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                      : 'border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>
                    {quickFilter === 'all' && 'جميع الحالات'}
                    {quickFilter === 'active' && 'النشطة الآن 🟢'}
                    {quickFilter === 'ended' && 'المنتهية ⚪'}
                    {quickFilter === 'long' && 'طويلة ⏳'}
                    {quickFilter === 'extended' && 'الممددة مسبقاً 🔁'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${openDropdown === 'quick' ? 'rotate-180' : ''}`} />
                </button>
                
                {openDropdown === 'quick' && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                    <div className="absolute left-0 lg:left-auto lg:right-0 mt-1.5 w-52 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl shadow-xl z-50 py-1.5 text-right font-sans">
                      {[
                        { id: 'all', label: `جميع الحالات (${kpiStats.total})` },
                        { id: 'active', label: `النشطة الآن 🟢 (${kpiStats.active})` },
                        { id: 'ended', label: `المنتهية ⚪ (${kpiStats.ended})` },
                        { id: 'long', label: `طويلة ⏳ (${kpiStats.long})` },
                        { id: 'extended', label: `الممددة مسبقاً 🔁 (${records.filter(r => {
                            const hasHistoryExtension = r.history && r.history.some((h) => h.action === 'تمديد');
                            const hasNotesExtension = r.notes && r.notes.includes('تمديد');
                            return !!(hasHistoryExtension || hasNotesExtension);
                          }).length})` }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setQuickFilter(opt.id as any);
                            setCurrentPage(1);
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-right px-4 py-2 text-xs font-bold transition-all flex items-center justify-between ${
                            quickFilter === opt.id
                              ? 'bg-amber-500/10 text-amber-500 font-black'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {quickFilter === opt.id && <Check className="w-3.5 h-3.5 text-amber-500" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 4. Common Keyword Searches Custom Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'tags' ? null : 'tags')}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border text-xs font-black rounded-xl transition-all cursor-pointer ${
                    ['عملية جراحية', 'حادث سير', 'كسر', 'باصهيب', 'شظايا', 'عدن'].includes(searchTerm)
                      ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                      : 'border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>
                    {['عملية جراحية', 'حادث سير', 'كسر', 'باصهيب', 'شظايا', 'عدن'].includes(searchTerm)
                      ? `#${searchTerm}`
                      : 'كلمات شائعة'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${openDropdown === 'tags' ? 'rotate-180' : ''}`} />
                </button>
                
                {openDropdown === 'tags' && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                    <div className="absolute left-0 lg:left-auto lg:right-0 mt-1.5 w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl shadow-xl z-50 py-1.5 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setCurrentPage(1);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-right px-4 py-2 text-xs font-bold transition-all flex items-center justify-between ${
                          searchTerm === ''
                            ? 'bg-amber-500/10 text-amber-500 font-black'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        <span>تصفير (كتابة حرّة)</span>
                        {searchTerm === '' && <Check className="w-3.5 h-3.5 text-amber-500" />}
                      </button>
                      {['عملية جراحية', 'حادث سير', 'كسر', 'باصهيب', 'شظايا', 'عدن'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setSearchTerm(tag);
                            setCurrentPage(1);
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-right px-4 py-2 text-xs font-bold transition-all flex items-center justify-between ${
                            searchTerm === tag
                              ? 'bg-amber-500/10 text-amber-500 font-black'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                          }`}
                        >
                          <span>#{tag}</span>
                          {searchTerm === tag && <Check className="w-3.5 h-3.5 text-amber-500" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Reset Filter Button */}
              {(selectedMonth || selectedType || searchTerm || quickFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSelectedMonth('');
                    setSelectedType('');
                    setSearchTerm('');
                    setQuickFilter('all');
                    setCurrentPage(1);
                    setOpenDropdown(null);
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-bold flex items-center gap-1.5 cursor-pointer transition-all px-3 py-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl hover:scale-[1.02] active:scale-[0.98]"
                  title="تصفير كافة الفلاتر والبحث"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>تصفير الفلاتر</span>
                </button>
              )}

              {/* View Mode Segmented Switcher */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="عرض جدول البيانات المعتمد"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">جدول</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="عرض كروت المتابعة العملياتية"
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">كروت عمليات</span>
                </button>
              </div>

            </div>
          </div>

          {/* Bulk Checkboxes Selection banner alerts */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl select-none">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>تم تحديد {selectedIds.length} من السجلات المتاحة.</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                >
                  إلغاء التحديد
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-sm shadow-rose-600/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف المحدد</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Filter Analytics Widget Panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-5 pb-5 select-none print:hidden bg-white dark:bg-slate-900">
          {/* Card 1: Filtered Count */}
          <div className="bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-150 dark:border-slate-850/60 flex items-center justify-between">
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">الإجازات المفلترة</span>
              <span className="text-xs font-black text-slate-850 dark:text-slate-100">{filteredStats.totalCount} حالة في الكشف</span>
            </div>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Active Filtered Leaves */}
          <div className="bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-150 dark:border-slate-850/60 flex items-center justify-between">
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">النشطة حالياً</span>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-450">{filteredStats.activeCount} إجازة جارية</span>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Total Days */}
          <div className="bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-150 dark:border-slate-850/60 flex items-center justify-between">
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">إجمالي الأيام الممنوحة</span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{filteredStats.totalDays} يوم استراحة</span>
            </div>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          {/* Card 4: Severity Risk / Warning cases */}
          <div className="bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-150 dark:border-slate-850/60 flex items-center justify-between">
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">حالات كبرى وجراحة</span>
              <span className={`text-xs font-black ${filteredStats.warningCount > 0 ? 'text-rose-500' : 'text-slate-550 dark:text-slate-400'}`}>
                {filteredStats.warningCount} وعكة معقدة
              </span>
            </div>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </div>

      {/* Main Records Table Container */}
      <div className="border-t border-slate-100 dark:border-slate-800">
        {/* ====================================================================
            ترويسة وثيقة عسكرية رسمية (OFFICIAL MILITARY PRINT HEADER)
            Only visible on Print (using custom print utility classes).
            ==================================================================== */}
        <div className="hidden print:block w-full text-slate-950 bg-white font-sans text-right select-none p-6" dir="rtl">
          {/* Header Grid: Right side (Republic/Ministry), Middle (Emblem/Logo), Left (Document Details) */}
          <div className="grid grid-cols-3 items-start gap-4 mb-8 text-xs border-b-2 border-slate-950 pb-5">
            
            {/* Right Column: Hierarchy */}
            <div className="space-y-1.5 font-bold leading-relaxed text-right">
              <p className="text-sm">الجمهورية اليمنية</p>
              <p className="text-sm">وزارة الدفاع ورئاسة الأركان</p>
              <p className="text-sm">المنطقة العسكرية الرابعة</p>
              <p className="text-sm text-amber-950 font-black">قيادة اللواء الأول مشاة بحري</p>
              <p className="text-[11px] text-slate-600">الشعبة الطبية / إدارة حصر الإجازات</p>
            </div>

            {/* Middle Column: Official Emblem Emblem Placeholder */}
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border border-slate-300">
                <Shield className="w-9 h-9 text-slate-800" />
              </div>
              <p className="text-[10px] tracking-wider uppercase font-extrabold text-slate-600">شعار الشعبة الطبية للواء</p>
              <p className="text-[11px] font-black border-b border-slate-950 pb-0.5 px-3">سجل الإجازات المرضية المعتمدة</p>
            </div>

            {/* Left Column: Metadata & Dynamic Date */}
            <div className="space-y-1.5 font-bold text-left leading-relaxed">
              <p>رقم الكشف: <span className="font-mono">م ص / ل١/{new Date().getFullYear()}</span></p>
              <p>تاريخ الطباعة: <span>{formatDateToDMY(new Date().toISOString())}</span></p>
              <p>الفترة الزمنية: <span className="text-amber-700 font-extrabold">{getArabicMonthName(selectedMonth)}</span></p>
              <p>حالة الكشف: <span className="text-emerald-700">معتمد ومؤرشف إلكترونياً</span></p>
            </div>
          </div>
          
          {/* Printable Warning / Context subtitle */}
          <div className="mb-6 text-center">
            <h3 className="text-base font-black underline decoration-double decoration-slate-950">كشف الإحصاء الطبي الشهري للإجازات المرضية</h3>
            <p className="text-[11px] text-slate-700 mt-1.5 leading-relaxed max-w-2xl mx-auto">
              يحتوي هذا الكشف على السجلات الرسمية الموثقة للإجازات والتقارير المرضية الصادرة والمعتمدة للشعب والكتائب الطبية التابعة لمنتسبي اللواء الأول مشاة بحري خلال شهر <span className="font-extrabold">{getArabicMonthName(selectedMonth)}</span>.
            </p>
          </div>
        </div>

        {/* Desktop view: Table layout */}
        <div className={`${viewMode === 'table' ? 'hidden min-[600px]:block' : 'hidden'} overflow-x-auto print:block print:w-full`}>
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold font-sans select-none print:bg-slate-100 print:text-slate-950">
                <th className="py-4 px-4 w-12 text-center print:hidden">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-amber-500 border-slate-300 dark:border-slate-700 rounded focus:ring-amber-500 focus:ring-offset-0 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-3 w-10 text-center font-bold text-slate-400 print:text-slate-950">م</th>
                <th onClick={() => handleSort('name')} className="py-4 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors print:pointer-events-none print:hover:bg-transparent">
                  <div className="flex items-center gap-1.5 justify-start">
                    {sortField === 'name' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-500" />)}
                    <span>الاسم الكامل للمنتسب</span>
                  </div>
                </th>
                <th onClick={() => handleSort('rank')} className="py-4 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-28 print:pointer-events-none print:hover:bg-transparent">
                  <div className="flex items-center gap-1.5 justify-start">
                    {sortField === 'rank' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-500" />)}
                    <span>الرتبة</span>
                  </div>
                </th>
                <th onClick={() => handleSort('type')} className="py-4 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-32 print:pointer-events-none print:hover:bg-transparent">
                  <div className="flex items-center gap-1.5 justify-start">
                    {sortField === 'type' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-500" />)}
                    <span>نوع الإجازة</span>
                  </div>
                </th>
                <th className="py-4 px-4 w-32 text-right">حالة الإجازة</th>
                <th onClick={() => handleSort('diagnosis')} className="py-4 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors max-w-xs print:pointer-events-none print:hover:bg-transparent">
                  <div className="flex items-center gap-1.5 justify-start">
                    {sortField === 'diagnosis' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-500" />)}
                    <span>التشخيص والتقرير الطبي</span>
                  </div>
                </th>
                <th onClick={() => handleSort('startDate')} className="py-4 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-28 print:pointer-events-none print:hover:bg-transparent">
                  <div className="flex items-center gap-1.5 justify-start">
                    {sortField === 'startDate' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-500" />)}
                    <span>تاريخ البدء</span>
                  </div>
                </th>
                <th onClick={() => handleSort('endDate')} className="py-4 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-28 print:pointer-events-none print:hover:bg-transparent">
                  <div className="flex items-center gap-1.5 justify-start">
                    {sortField === 'endDate' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-500" />)}
                    <span>تاريخ الانتهاء</span>
                  </div>
                </th>
                <th onClick={() => handleSort('duration')} className="py-4 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-24 text-center print:pointer-events-none print:hover:bg-transparent">
                  <div className="flex items-center gap-1.5 justify-center">
                    {sortField === 'duration' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-500" />)}
                    <span>المدة</span>
                  </div>
                </th>
                <th className="py-4 px-4 text-center w-40 print:hidden">الإجراءات والعمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 print:divide-slate-900">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((r, index) => {
                  const duration = getDurationDays(r.startDate, r.endDate);
                  const isSelected = selectedIds.includes(r.id);

                  // Set badge color depending on leave type
                  let typeBadge = '';
                  if (r.type === 'مريض') {
                    typeBadge = 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 print:bg-rose-100 print:text-rose-950';
                  } else if (r.type === 'مرافق') {
                    typeBadge = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 print:bg-amber-100 print:text-amber-950';
                  } else if (r.type === 'حادث') {
                    typeBadge = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30 print:bg-indigo-100 print:text-indigo-950';
                  } else {
                    typeBadge = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 print:bg-emerald-100 print:text-emerald-950';
                  }

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all text-xs text-slate-700 dark:text-slate-300 print:text-slate-950 ${
                        isSelected ? 'bg-amber-505 dark:bg-amber-500/5 font-medium' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center print:hidden">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(r.id, e.target.checked)}
                          className="w-4 h-4 text-amber-500 border-slate-300 dark:border-slate-700 rounded focus:ring-amber-500 focus:ring-offset-0 cursor-pointer"
                        />
                      </td>

                      {/* Serial Number (م) */}
                      <td className="py-3 px-3 text-center text-slate-400 dark:text-slate-500 font-mono font-bold print:text-slate-950">
                        {(currentPage - 1) * recordsPerPage + index + 1}
                      </td>

                      {/* Name & Unit info */}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white print:text-slate-950">
                        <div>
                          <button
                            type="button"
                            onClick={() => setSelectedMemberName(r.name)}
                            className="hover:text-amber-600 dark:hover:text-amber-450 hover:underline hover:underline-offset-4 decoration-amber-500/50 transition-all text-right cursor-pointer select-none font-bold block group text-xs"
                            title="عرض الملف الطبي الشامل وسجل الإجازات التاريخي"
                          >
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400 dark:text-slate-500 group-hover:text-amber-500 shrink-0" />
                              <span>{highlightMatch(r.name, searchTerm)}</span>
                            </span>
                          </button>
                          <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5 print:text-slate-600">
                            {highlightMatch(r.unit, searchTerm)}
                          </span>
                        </div>
                      </td>

                      {/* Rank */}
                      <td className="py-3 px-4 font-medium print:text-slate-950">{highlightMatch(r.rank, searchTerm)}</td>

                      {/* Leave Type Badge */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-lg font-bold border text-[10px] inline-block ${typeBadge}`}>
                          {r.type}
                        </span>
                      </td>

                      {/* Leave Status Column */}
                      <td className="py-3 px-4 text-right">
                        {(() => {
                          const status = getLeaveStatus(r.startDate, r.endDate);
                          if (status === 'active') {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 select-none print:bg-emerald-100 print:text-emerald-950">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse print:animate-none" />
                                <span>نشط حالياً</span>
                              </span>
                            );
                          } else if (status === 'upcoming') {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 select-none print:bg-blue-100 print:text-blue-950">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span>مجدولة</span>
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 select-none print:bg-slate-100 print:text-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                                <span>منتهية</span>
                              </span>
                            );
                          }
                        })()}
                      </td>

                      {/* Diagnosis */}
                      <td className="py-3 px-4 max-w-xs truncate print:truncate-none print:whitespace-normal" title={r.diagnosis}>
                        <div>
                          <p className="truncate print:whitespace-normal font-sans font-medium">{highlightMatch(r.diagnosis, searchTerm)}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate print:whitespace-normal mt-0.5 print:text-slate-600">
                            الجهة: {highlightMatch(r.issuer || 'غير محدد', searchTerm)}
                          </p>
                        </div>
                      </td>

                      {/* Start Date */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-400 print:text-slate-950 whitespace-nowrap">
                        {formatDateToDMY(r.startDate)}
                      </td>

                      {/* End Date */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-400 print:text-slate-950 whitespace-nowrap">
                        {formatDateToDMY(r.endDate)}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white font-sans bg-slate-50/30 dark:bg-slate-800/10 print:bg-transparent print:text-slate-950">
                        {duration} يوم
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit button */}
                          <button
                            onClick={() => openEditModal(r)}
                            title="تعديل البيانات"
                            className="p-1.5 text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Extend button */}
                          <button
                            onClick={() => openExtendModal(r)}
                            title="تمديد الإجازة"
                            className="p-1.5 text-slate-500 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                          </button>

                          {/* View history */}
                          <button
                            onClick={() => openHistoryModal(r)}
                            title="سجل التعديلات"
                            className="p-1.5 text-slate-500 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleSingleDelete(r)}
                            title="حذف السجل"
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                      <span className="font-medium">لم يتم العثور على أي إجازات مطابقة لخيارات البحث</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Brand New Exclusive: Operational Monitoring Card Grid */}
        {viewMode === 'grid' && (
          <div className="hidden min-[600px]:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5 bg-slate-50/20 dark:bg-slate-900/20 border-b border-slate-150 dark:border-slate-800/50 print:hidden select-none">
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((r, index) => {
                const duration = getDurationDays(r.startDate, r.endDate);
                const isSelected = selectedIds.includes(r.id);
                
                let typeBadge = '';
                if (r.type === 'مريض') {
                  typeBadge = 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
                } else if (r.type === 'مرافق') {
                  typeBadge = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
                } else if (r.type === 'حادث') {
                  typeBadge = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30';
                } else {
                  typeBadge = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
                }

                const status = getLeaveStatus(r.startDate, r.endDate);
                const isLong = duration >= 15;
                const diagLower = (r.diagnosis || '').toLowerCase();
                const isCritical = r.type === 'حادث' || diagLower.includes('عملية') || diagLower.includes('كسر') || diagLower.includes('بتر') || diagLower.includes('شظايا');
                
                return (
                  <div
                    key={r.id}
                    className={`bg-white dark:bg-slate-950 rounded-2xl border transition-all duration-300 p-5 flex flex-col justify-between gap-4 relative overflow-hidden group hover:shadow-lg hover:shadow-amber-500/[0.02] hover:border-amber-500/30 ${
                      isSelected 
                        ? 'border-amber-500 ring-2 ring-amber-500/5 bg-amber-500/[0.01]' 
                        : 'border-slate-150 dark:border-slate-800/80'
                    }`}
                  >
                    {/* Background military visual element */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-bl-3xl -z-10 transition-transform group-hover:scale-110" />

                    {/* Card Top Header */}
                    <div className="flex items-start justify-between gap-3 text-right">
                      <div className="flex items-center gap-3">
                        {/* Military Badge Style Badge */}
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center font-black text-[10px] text-slate-700 dark:text-slate-300 shadow-sm shrink-0">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold leading-none mb-0.5">رتبة</span>
                          <span className="leading-none text-[11px]">{r.rank}</span>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => setSelectedMemberName(r.name)}
                            className="text-xs font-black text-slate-850 dark:text-white hover:text-amber-500 text-right transition-colors block leading-tight"
                          >
                            {r.name}
                          </button>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 font-bold">{r.unit}</span>
                        </div>
                      </div>

                      {/* Checkbox */}
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(r.id, e.target.checked)}
                          className="w-4 h-4 text-amber-500 border-slate-300 dark:border-slate-700 rounded focus:ring-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Diagnosis content card */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850/60 space-y-1.5 text-right">
                      <div className="flex items-center gap-1.5 justify-start text-[10px] font-black text-slate-400">
                        <HeartPulse className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>التشخيص والحالة الطبية</span>
                      </div>
                      <p className="text-xs text-slate-750 dark:text-slate-200 font-bold leading-relaxed line-clamp-2" title={r.diagnosis}>
                        {r.diagnosis}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold pt-1 border-t border-slate-100/50 dark:border-slate-800/30">
                        <span>جهة التقرير: {r.issuer || 'مجهول'}</span>
                        {r.notes && <span className="text-amber-600 dark:text-amber-450 truncate max-w-[120px]">⚠️ {r.notes}</span>}
                      </div>
                    </div>

                    {/* Timeline Tracker */}
                    <div className="space-y-1.5 text-right">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-400 font-mono">{r.startDate} 🡨 {r.endDate}</span>
                        <span className="text-amber-600 dark:text-amber-450 font-black">المدى الشهري: {duration} يوم</span>
                      </div>
                      
                      {status === 'active' ? (
                        <div className="space-y-1">
                          <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: '70%' }} />
                          </div>
                          <div className="flex items-center justify-between text-[9px] font-black text-emerald-600 dark:text-emerald-450">
                            <span>● الإجازة نشطة وجارية حالياً</span>
                            <span>التحقق الطبي قائم</span>
                          </div>
                        </div>
                      ) : status === 'upcoming' ? (
                        <div className="space-y-1">
                          <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '20%' }} />
                          </div>
                          <div className="flex items-center justify-between text-[9px] font-black text-indigo-600 dark:text-indigo-400">
                            <span>● لم تبدأ بعد</span>
                            <span>استعداد لجدولة الخدمة</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-300 dark:bg-slate-700 rounded-full" style={{ width: '100%' }} />
                          </div>
                          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500">
                            <span>منتهية (مغلقة بالكامل)</span>
                            <span>تم التأكيد والمباشرة</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status Banners */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-right text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg font-black text-[9px] border ${typeBadge}`}>
                          {r.type}
                        </span>
                        {status === 'active' && (
                          <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg font-black text-[9px] border border-emerald-500/10">
                            تحت الرصد
                          </span>
                        )}
                      </div>

                      {/* Compliance Indicators */}
                      {isCritical ? (
                        <span className="text-rose-500 dark:text-rose-400 font-black flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          <span>تتطلب عناية ميدانية فائقة</span>
                        </span>
                      ) : isLong ? (
                        <span className="text-amber-600 dark:text-amber-450 font-black flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>حالة طويلة المدى</span>
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-450 font-black flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>سليمة إدارياً</span>
                        </span>
                      )}
                    </div>

                    {/* Actions Panel */}
                    <div className="flex items-center justify-end gap-1 px-1 py-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-850/50 mt-1">
                      <button
                        onClick={() => openEditModal(r)}
                        className="flex-1 py-1.5 hover:bg-white dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                        title="تعديل السجل"
                      >
                        <Edit2 className="w-3 h-3 text-amber-500" />
                        <span>تعديل</span>
                      </button>
                      <button
                        onClick={() => openExtendModal(r)}
                        className="flex-1 py-1.5 hover:bg-white dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                        title="تعديل / تمديد الإجازة"
                      >
                        <CalendarPlus className="w-3 h-3 text-indigo-500" />
                        <span>تمديد</span>
                      </button>
                      <button
                        onClick={() => openHistoryModal(r)}
                        className="flex-1 py-1.5 hover:bg-white dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                        title="سجل التتبع والعمليات الطبية"
                      >
                        <Eye className="w-3 h-3 text-emerald-500" />
                        <span>سجل</span>
                      </button>
                      <button
                        onClick={() => handleSingleDelete(r)}
                        className="px-2 py-1.5 hover:bg-rose-500/10 text-slate-450 hover:text-rose-500 rounded-lg cursor-pointer transition-all active:scale-95"
                        title="حذف هذا السجل نهائياً"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center text-slate-400 font-bold text-xs bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col items-center justify-center gap-3">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                <span>لا توجد أي سجلات أو إجازات تتوافق مع محددات البحث الحالية.</span>
              </div>
            )}
          </div>
        )}

        {/* Mobile View: Cards Layout */}
        <div className="block min-[600px]:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
          {paginatedRecords.length > 0 ? (
            paginatedRecords.map((r, index) => {
              const duration = getDurationDays(r.startDate, r.endDate);
              const isSelected = selectedIds.includes(r.id);
              const isExpanded = expandedCardIds.includes(r.id);

              let typeBadge = '';
              if (r.type === 'مريض') {
                typeBadge = 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
              } else if (r.type === 'مرافق') {
                typeBadge = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
              } else if (r.type === 'حادث') {
                typeBadge = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30';
              } else {
                typeBadge = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
              }

              return (
                <div
                  key={r.id}
                  className={`p-4 space-y-3 transition-all text-right ${
                    isSelected ? 'bg-amber-500/5' : ''
                  } ${isExpanded ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`}
                >
                  {/* Card Header: Checkbox + Rank/Name + Badge */}
                  <div className="flex items-start justify-between gap-3 text-right">
                    <div className="flex items-start gap-2.5">
                      <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(r.id, e.target.checked)}
                          className="w-4.5 h-4.5 text-amber-500 border-slate-300 dark:border-slate-700 rounded focus:ring-amber-500 cursor-pointer"
                        />
                      </div>
                      <div 
                        className="cursor-pointer select-none"
                        onClick={() => toggleCardExpanded(r.id)}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded font-bold">
                            {r.rank}
                          </span>
                          <h4 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMemberName(r.name);
                            }}
                            className="text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1.5 cursor-pointer select-none flex-wrap active:scale-95 transition-transform"
                            title="عرض الملف الطبي الشامل"
                          >
                            <span>{r.name}</span>
                            <span className="text-[9px] bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md font-bold shrink-0">الملف الطبي 🗂️</span>
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {r.unit}
                          </span>
                          <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-[10px] font-bold text-amber-500 font-sans">{duration} أيام</span>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="flex items-center gap-2 cursor-pointer select-none shrink-0"
                      onClick={() => toggleCardExpanded(r.id)}
                    >
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 rounded-lg font-bold border text-[10px] ${typeBadge}`}>
                          {r.type}
                        </span>
                        {(() => {
                          const status = getLeaveStatus(r.startDate, r.endDate);
                          if (status === 'active') {
                            return (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 select-none">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                <span>نشط</span>
                              </span>
                            );
                          } else if (status === 'upcoming') {
                            return (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 select-none">
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                                <span>مجدولة</span>
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 select-none">
                                <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500" />
                                <span>منتهية</span>
                              </span>
                            );
                          }
                        })()}
                      </div>
                      
                      {/* Expand / Collapse Indicator */}
                      <div className="text-slate-400 dark:text-slate-500 p-1">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-amber-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Collapsed view brief diagnosis line */}
                  {!isExpanded && (
                    <div 
                      onClick={() => toggleCardExpanded(r.id)}
                      className="cursor-pointer text-right text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/10 px-2.5 py-1.5 rounded-lg border border-slate-200/30 dark:border-slate-800/20"
                    >
                      <span className="truncate max-w-[180px] font-sans">التشخيص: {r.diagnosis || '-'}</span>
                      <span className="text-[10px] font-mono text-slate-400">{r.startDate}</span>
                    </div>
                  )}

                  {/* Expanded View Details */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden space-y-3 pt-1"
                      >
                        {/* Diagnosis & Issuer */}
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/60 space-y-1.5 text-right">
                          <div className="flex items-start gap-2">
                            <span className="p-1 bg-indigo-500/10 text-indigo-500 rounded mt-0.5 shrink-0">
                              <Activity className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                                {r.diagnosis}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                جهة الإصدار: {r.issuer || 'غير محدد'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Dates & Duration Grid */}
                        <div className="grid grid-cols-2 gap-3 text-right">
                          {/* Duration badge */}
                          <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">المدة</span>
                            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-lg">
                              {duration} أيام
                            </span>
                          </div>

                          {/* Dates block */}
                          <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/60 flex flex-col justify-center font-mono">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-sans">من</span>
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{r.startDate}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-sans">إلى</span>
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{r.endDate}</span>
                            </div>
                          </div>
                        </div>

                        {/* Notes if exists */}
                        {r.notes && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 text-right italic max-h-16 overflow-y-auto">
                            ملاحظة: {r.notes}
                          </p>
                        )}

                        {/* Action Buttons: Touch Friendly */}
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2.5 border-t border-slate-150 dark:border-slate-800/50">
                          <button
                            onClick={() => openEditModal(r)}
                            className="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 px-2.5 py-2 text-slate-700 dark:text-slate-200 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                            <span>تعديل</span>
                          </button>

                          <button
                            onClick={() => openExtendModal(r)}
                            className="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 px-2.5 py-2 text-slate-700 dark:text-slate-200 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            <CalendarPlus className="w-3.5 h-3.5 text-indigo-500" />
                            <span>تمديد</span>
                          </button>

                          <button
                            onClick={() => openHistoryModal(r)}
                            className="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 px-2.5 py-2 text-slate-700 dark:text-slate-200 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-500" />
                            <span>سجل</span>
                          </button>

                          <button
                            onClick={() => handleSingleDelete(r)}
                            className="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 px-2.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-150 dark:border-rose-900/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                <span className="font-semibold">لم يتم العثور على أي إجازات مطابقة</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. تذييل البطاقة (Card Footer) - Hidden on Print */}
        <div className="bg-slate-50/60 dark:bg-slate-800/20 px-6 py-4 border-t border-slate-150 dark:border-slate-800 flex flex-col min-[600px]:flex-row min-[600px]:items-center min-[600px]:justify-between gap-4 print:hidden select-none">
          {/* Right Side: Smart Monthly Summary KPI status-bar */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-right text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400">إحصاء الشهر:</span>
            
            {/* Active now count */}
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-400">نشط:</span>
              <span className="font-extrabold text-slate-850 dark:text-slate-200">{kpiStats.active}</span>
            </div>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            {/* Extended count */}
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-400">ممدد:</span>
              <span className="font-extrabold text-slate-850 dark:text-slate-200">
                {records.filter(r => {
                  const hasHistoryExtension = r.history && r.history.some((h) => h.action === 'تمديد');
                  const hasNotesExtension = r.notes && r.notes.includes('تمديد');
                  return !!(hasHistoryExtension || hasNotesExtension);
                }).length}
              </span>
            </div>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            {/* Ended count */}
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-slate-400">منتهية:</span>
              <span className="font-extrabold text-slate-850 dark:text-slate-200">{kpiStats.ended}</span>
            </div>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            {/* Total shown count */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">الظاهر الآن:</span>
              <span className="font-extrabold text-amber-500">{filteredRecords.length}</span>
            </div>
          </div>

          {/* Left Side: Pagination Controls integrated inline */}
          <div className="flex items-center justify-between min-[600px]:justify-end gap-3 text-xs text-slate-500 dark:text-slate-400 font-sans">
            <span className="font-medium hidden sm:inline">
              سجل {(currentPage - 1) * recordsPerPage + 1} -{' '}
              {Math.min(currentPage * recordsPerPage, filteredRecords.length)} من{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{filteredRecords.length}</span>
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="الصفحة السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setCurrentPage(i + 1);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className={`w-7 h-7 rounded-lg font-bold font-sans transition-all cursor-pointer ${
                      currentPage === i + 1
                        ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                        : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="الصفحة التالية"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
          </>
        ) : activeSubTab === 'timeline' ? (
          /* ==========================================
             3. مخطط الإجازات الزمني التفاعلي المبتكر (Leaves Timeline View)
             ========================================== */
          <div className="p-4 sm:p-5 space-y-6 select-none print:hidden text-right font-sans">
            {/* Upper Timeline Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-l from-slate-900 to-slate-950 dark:from-slate-950 dark:to-black text-white p-5 sm:p-6 rounded-[24px] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl">
              <div className="absolute top-1/2 left-10 -translate-y-1/2 w-48 h-48 bg-amber-500/5 rounded-full border border-amber-500/10 animate-ping pointer-events-none" />
              <div className="absolute top-1/2 left-10 -translate-y-1/2 w-24 h-24 bg-amber-500/10 rounded-full border border-amber-500/20 animate-pulse pointer-events-none" />
              
              <div className="space-y-2 z-10">
                <div className="flex items-center gap-2 justify-start flex-wrap">
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    رصد حي للغياب
                  </span>
                  <span className="text-slate-400 text-xs font-mono">• مخطط غانتس لتعقب استمرارية القوة</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                  مخطط الإجازات الزمني التفاعلي والتعقب الميداني المباشر (Gantt Chart)
                </h3>
                <p className="text-xs text-slate-400 max-w-2xl font-medium leading-relaxed">
                  خارطة ديناميكية توضح تداخل إجازات المنتسبين عبر أيام الشهر. تمكنك من معرفة مواعيد عودة الأفراد وتفادي فراغات المناوبات في السرايا والكتائب العسكرية في آن واحد.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 z-10 bg-slate-850/55 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-md">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                  <Calendar className="w-5 h-5 animate-pulse" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold leading-none">الشهر المعروض</span>
                  <span className="text-sm font-black text-emerald-400 mt-1 block">
                    {selectedMonth === '' ? 'يوليو ٢٠٢٦' : getArabicMonthName(selectedMonth)}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline Main Layout */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-sm space-y-6">
              {/* Internal Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-850 dark:text-white flex items-center gap-1.5 justify-start">
                    <Activity className="w-4 h-4 text-amber-500" />
                    <span>توزيع غياب القوة البشرية لشهر {selectedMonth === '' ? 'يوليو ٢٠٢٦' : getArabicMonthName(selectedMonth)}</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                    مرتبة تلقائياً برتب الأفراد ومحسوبة بالخوارزمية الجغرافية لتدقيق الحالات ومستويات الجاهزية.
                  </p>
                </div>
                
                {/* Micro legend */}
                <div className="flex items-center gap-3 justify-end text-[10px] font-black text-slate-450 select-none flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gradient-to-r from-rose-500 to-red-500" />
                    <span>إجازة مرضية (مريض)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gradient-to-r from-amber-500 to-orange-500" />
                    <span>مرافق طبي (مرافق)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gradient-to-r from-indigo-500 to-blue-500" />
                    <span>حوادث وكسور (حادث)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gradient-to-r from-emerald-500 to-teal-500" />
                    <span>إجازة أخرى</span>
                  </div>
                </div>
              </div>

              {/* Gantt Timeline Scroll Container */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20">
                <div className="min-w-[1100px] divide-y divide-slate-150 dark:divide-slate-850">
                  {/* Calendar Days Header */}
                  <div className="grid grid-cols-[240px_1fr] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold text-[10px] font-mono sticky top-0 z-10">
                    <div className="p-3 border-l border-slate-200 dark:border-slate-800 text-right text-xs font-sans font-black text-slate-800 dark:text-slate-200">
                      اسم المنتسب والرتبة والكتيبة
                    </div>
                    <div className="grid text-center items-center" style={{ display: 'grid', gridTemplateColumns: 'repeat(31, minmax(0, 1fr))' }}>
                      {Array.from({ length: 31 }).map((_, i) => {
                        const day = i + 1;
                        // Check if day is today (assuming today is July 1st as per system date)
                        const isToday = day === 1 && (selectedMonth === '' || selectedMonth === '2026-07');
                        return (
                          <div 
                            key={day} 
                            className={`py-3 border-l border-slate-250/50 dark:border-slate-800/40 font-black relative ${
                              isToday ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold ring-1 ring-amber-500/50' : ''
                            }`}
                          >
                            <span>{day}</span>
                            {isToday && (
                              <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[6px] font-sans bg-amber-500 text-slate-950 px-1 rounded-sm scale-75 uppercase">
                                اليوم
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Personnel Gantt Rows */}
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((r) => {
                      // Parse the selected month or default to July 2026
                      const monthStr = selectedMonth === '' ? '2026-07' : selectedMonth;
                      const [year, month] = monthStr.split('-').map(Number);
                      
                      // Calculate overlap range for current month view
                      const overlap = (() => {
                        const start = new Date(r.startDate);
                        const end = new Date(r.endDate);
                        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

                        // First and last day of current month
                        const firstDay = new Date(year, month - 1, 1);
                        const lastDay = new Date(year, month, 0);

                        // No overlap if entirely before or after current month
                        if (end < firstDay || start > lastDay) return null;

                        const overlapStart = start < firstDay ? firstDay : start;
                        const overlapEnd = end > lastDay ? lastDay : end;

                        return {
                          startDay: overlapStart.getDate(),
                          endDay: overlapEnd.getDate(),
                          isStartClamped: start < firstDay,
                          isEndClamped: end > lastDay
                        };
                      })();

                      return (
                        <div key={r.id} className="grid grid-cols-[240px_1fr] bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-all group">
                          {/* Left Column: Soldier details */}
                          <div className="p-3 border-l border-slate-150 dark:border-slate-850 flex flex-col justify-center text-right space-y-1">
                            <div className="flex items-center gap-1.5 justify-start">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[9px] font-black px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-750">
                                {r.rank}
                              </span>
                              <h5 className="text-xs font-black text-slate-850 dark:text-white truncate max-w-[130px]" title={r.name}>
                                {r.name}
                              </h5>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-450 font-bold">
                              <span>{r.unit}</span>
                              <span className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-500/5 px-1.5 py-0.2 rounded font-sans font-black">
                                {r.type}
                              </span>
                            </div>
                          </div>

                          {/* Right Column: Visual timeline bar */}
                          <div className="grid relative min-h-[48px] items-center" style={{ display: 'grid', gridTemplateColumns: 'repeat(31, minmax(0, 1fr))' }}>
                            {/* Grid cells for alignment visual cues */}
                            {Array.from({ length: 31 }).map((_, i) => (
                              <div key={i} className="h-full border-l border-slate-150/40 dark:border-slate-850/30 pointer-events-none" />
                            ))}

                            {/* Overlaid actual leave bar */}
                            {overlap && (
                              <div 
                                style={{
                                  gridColumnStart: overlap.startDay,
                                  gridColumnEnd: overlap.endDay + 1,
                                }}
                                className={`relative h-6 rounded-lg flex items-center justify-between px-2 text-[9px] font-black text-white shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer select-none mx-0.5 ${
                                  r.type === 'مريض'
                                    ? 'bg-gradient-to-r from-rose-500 to-red-500 shadow-rose-500/10'
                                    : r.type === 'مرافق'
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/10'
                                    : r.type === 'حادث'
                                    ? 'bg-gradient-to-r from-indigo-500 to-blue-500 shadow-indigo-500/10'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/10'
                                }`}
                                title={`${r.name} - ${r.diagnosis} (من ${formatDateToDMY(r.startDate)} إلى ${formatDateToDMY(r.endDate)})`}
                              >
                                {/* Left Indicator for Clamped Start */}
                                {overlap.isStartClamped ? (
                                  <ChevronRight className="w-3 h-3 text-white/80 animate-pulse shrink-0" />
                                ) : <span className="w-1 h-1 rounded-full bg-white shrink-0" />}

                                {/* Center Diagnosis Label */}
                                <span className="truncate mx-1 block font-sans select-none tracking-tight leading-none">
                                  {r.diagnosis || 'إجازة طبية'}
                                </span>

                                {/* Right Indicator for Clamped End */}
                                {overlap.isEndClamped ? (
                                  <ChevronLeft className="w-3 h-3 text-white/80 animate-pulse shrink-0" />
                                ) : <span className="text-[8px] font-mono bg-black/15 px-1 rounded-md shrink-0 select-none">
                                    {getDurationDays(r.startDate, r.endDate)}ي
                                  </span>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-16 text-center text-slate-400 bg-white dark:bg-slate-900 font-bold text-xs">
                      لا يوجد أي سجلات مطابقة للفلاتر والبحث في هذا المخطط الزمني حالياً.
                    </div>
                  )}
                </div>
              </div>

              {/* Informative tips footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2 justify-start">
                  <Shield className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>
                    <strong>تنبيه عملياتي:</strong> يرمز المخطط إلى تداخل الغيابات. تكتل الغيابات باللون الأحمر يهدد استمرارية جاهزية سرايا وكتائب اللواء. يرجى التنسيق مع الهيئات الطبية لترشيد منح الرخص.
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 shrink-0">
                  تم التحديث التلقائي: {new Date().toLocaleTimeString('ar-SA')}
                </div>
              </div>
            </div>
          </div>
        ) : activeSubTab === 'repeated' ? (
          /* 4. قسم الإجازات المتكررة (Repeated Leaves View) - Hidden on Print */
          <div className="p-5 space-y-6 select-none print:hidden">
            {/* Toolbar for Repeated Leaves */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
              {/* Text Search */}
              <div className="relative flex-1 max-w-md text-right">
                <input
                  type="text"
                  placeholder="ابحث باسم المنتسب، الرتبة أو الكتيبة..."
                  value={repeatedSearchTerm}
                  onChange={(e) => setRepeatedSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-11 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-right transition-all font-sans"
                />
                <Search className="w-4 h-4 text-slate-400 absolute top-3.5 right-4 pointer-events-none" />
              </div>

              {/* Min Repeat Filter */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'minRepeat' ? null : 'minRepeat')}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-900 border text-xs font-black rounded-xl transition-all cursor-pointer ${
                    minRepeatCount !== 2
                      ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                      : 'border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>الحد الأدنى للتكرار: {minRepeatCount} {minRepeatCount === 2 ? 'مرتين' : 'مرات'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${openDropdown === 'minRepeat' ? 'rotate-180' : ''}`} />
                </button>

                {openDropdown === 'minRepeat' && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                    <div className="absolute left-0 lg:left-auto lg:right-0 mt-1.5 w-56 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl shadow-xl z-50 py-1.5 text-right font-sans">
                      {[
                        {
                          id: 2,
                          label: 'مرتين فأكثر',
                          count: records.reduce((acc, r) => {
                            const cnt = records.filter(other => other.name.trim().toLowerCase() === r.name.trim().toLowerCase()).length;
                            if (cnt >= 2) acc.add(r.name.trim().toLowerCase());
                            return acc;
                          }, new Set<string>()).size
                        },
                        {
                          id: 3,
                          label: '3 مرات فأكثر',
                          count: records.reduce((acc, r) => {
                            const cnt = records.filter(other => other.name.trim().toLowerCase() === r.name.trim().toLowerCase()).length;
                            if (cnt >= 3) acc.add(r.name.trim().toLowerCase());
                            return acc;
                          }, new Set<string>()).size
                        },
                        {
                          id: 4,
                          label: '4 مرات فأكثر',
                          count: records.reduce((acc, r) => {
                            const cnt = records.filter(other => other.name.trim().toLowerCase() === r.name.trim().toLowerCase()).length;
                            if (cnt >= 4) acc.add(r.name.trim().toLowerCase());
                            return acc;
                          }, new Set<string>()).size
                        }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setMinRepeatCount(opt.id);
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-right px-4 py-2 text-xs font-bold transition-all flex items-center justify-between ${
                            minRepeatCount === opt.id
                              ? 'bg-amber-500/10 text-amber-500 font-black'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                          }`}
                        >
                          <span>{opt.label} ({opt.count} فرد)</span>
                          {minRepeatCount === opt.id && <Check className="w-3.5 h-3.5 text-amber-500" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Clear button */}
              {(repeatedSearchTerm || minRepeatCount !== 2) && (
                <button
                  type="button"
                  onClick={() => {
                    setRepeatedSearchTerm('');
                    setMinRepeatCount(2);
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer transition-all px-3 py-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>تفريغ الفلاتر</span>
                </button>
              )}
            </div>

            {/* Repeated KPIs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-150 dark:border-slate-800/50 p-4 rounded-2xl text-right">
                <span className="text-[10px] text-slate-400 block font-bold mb-1">أفراد لديهم إجازات متكررة</span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-sans">{repeatedStats.individualsCount}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-1">من قوام القوة المسجلة</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-150 dark:border-slate-800/50 p-4 rounded-2xl text-right">
                <span className="text-[10px] text-slate-400 block font-bold mb-1">مجموع الإجازات المتكررة</span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-sans">{repeatedStats.totalLeavesCount}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-1">إجازة طبية تراكمية</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-150 dark:border-slate-800/50 p-4 rounded-2xl text-right">
                <span className="text-[10px] text-slate-400 block font-bold mb-1">إجمالي الأيام المفقودة للخدمة</span>
                <span className="text-xl font-black text-rose-600 dark:text-rose-400 font-sans">{repeatedStats.totalDays}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-1">يوماً في البيت</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-150 dark:border-slate-800/50 p-4 rounded-2xl text-right">
                <span className="text-[10px] text-slate-400 block font-bold mb-1">أقصى معدل تكرار للفرد</span>
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-sans">{repeatedStats.maxCount}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-1">مرات غياب طبي خلال العام</span>
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-4">
              {repeatedLeaves.length > 0 ? (
                repeatedLeaves.map((g, idx) => {
                  const isExpanded = expandedCardIds.includes(`rep_${g.name}`);

                  let alertBadgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-450";
                  let alertText = "تكرار إجازات (مرتين)";
                  if (g.count === 3) {
                    alertBadgeClass = "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-450";
                    alertText = "تكرار متوسط (3 مرات)";
                  } else if (g.count >= 4) {
                    alertBadgeClass = "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-450 border border-rose-500/20";
                    alertText = "تكرار عالي / حالة مزمنة 🚨";
                  }

                  return (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/60 rounded-2xl overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700/80 shadow-sm text-right"
                    >
                      {/* Person Row Header */}
                      <div
                        onClick={() => toggleCardExpanded(`rep_${g.name}`)}
                        className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 font-bold">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 flex-wrap justify-start">
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md font-bold">{g.rank}</span>
                              <span className="font-extrabold text-slate-900 dark:text-white text-sm">{g.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">{g.unit}</span>
                          </div>
                        </div>

                        {/* Middle Info & Badges */}
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${alertBadgeClass}`}>
                            {alertText}
                          </span>

                          <span className="bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono">
                            {g.count} إجازات
                          </span>

                          <span className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono">
                            المجموع: {g.totalDuration} يوماً
                          </span>
                        </div>

                        {/* End Actions / Arrow */}
                        <div className="flex items-center gap-3 justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMemberName(g.name);
                            }}
                            className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 px-3 py-1.5 rounded-xl cursor-pointer"
                          >
                            عرض السجل الشامل
                          </button>
                          <div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expandable timeline of leaves */}
                      {isExpanded && (
                        <div className="bg-slate-50/40 dark:bg-slate-900/40 border-t border-slate-150 dark:border-slate-800/80 p-4 space-y-3 text-right">
                          <div className="text-xs font-bold text-slate-400 mb-2 border-b border-dashed border-slate-200 dark:border-slate-850 pb-1 text-right">
                            سجل الإجازات التفصيلي للمنتسب خلال السنة:
                          </div>

                          <div className="relative border-r border-slate-200 dark:border-slate-800 pr-5 mr-3 space-y-4 text-right">
                            {g.records.map((r, rIdx) => {
                              const duration = getDurationDays(r.startDate, r.endDate);
                              return (
                                <div key={rIdx} className="relative">
                                  {/* Point */}
                                  <span className="absolute top-1.5 -right-[26px] w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white dark:ring-slate-900" />

                                  <div className="space-y-1 bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-150 dark:border-slate-800/60 shadow-sm">
                                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                                      <span className="font-extrabold text-slate-850 dark:text-white">
                                        التشخيص: {r.diagnosis}
                                      </span>
                                      <span className="text-[10px] font-bold font-mono text-amber-600 dark:text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded">
                                        المدة: {duration} يوماً ({r.startDate} إلى {r.endDate})
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                      الجهة المصدرة: {r.issuer} | النوع: <span className="font-bold text-slate-500">{r.type}</span>
                                    </p>
                                    {r.notes && (
                                      <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-1 italic">
                                        ملاحظة: {r.notes}
                                      </p>
                                    )}

                                    {/* Edit / Actions inline shortcut */}
                                    <div className="flex items-center gap-2 justify-end mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                                      <button
                                        type="button"
                                        onClick={() => openEditModal(r)}
                                        className="text-[10px] font-bold text-slate-500 hover:text-amber-500 flex items-center gap-1 cursor-pointer"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                        <span>تعديل</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openExtendModal(r)}
                                        className="text-[10px] font-bold text-slate-500 hover:text-indigo-500 flex items-center gap-1 cursor-pointer"
                                      >
                                        <CalendarPlus className="w-3 h-3" />
                                        <span>تمديد</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openHistoryModal(r)}
                                        className="text-[10px] font-bold text-slate-500 hover:text-emerald-500 flex items-center gap-1 cursor-pointer"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>سجل العمليات</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center bg-slate-50/50 dark:bg-slate-800/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-750 mx-auto mb-2" />
                  <p className="text-xs text-slate-450 dark:text-slate-400 font-bold">لم نجد أي أفراد بتكرار إجازات مطابق للخيارات الحالية.</p>
                </div>
              )}
            </div>
          </div>
        ) : activeSubTab === 'alerts' ? (
          <div className="p-5 space-y-6 select-none print:hidden">
            {/* Header / Intro */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/10 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 text-right">
              <h3 className="text-xs font-black text-slate-850 dark:text-slate-200 flex items-center gap-1.5 justify-start">
                <Shield className="w-4 h-4 text-amber-500" />
                <span>المتابعة العملياتية والإنذار لانتهاء الإجازات (مركز الإنذار والعودة للخدمة)</span>
              </h3>
              <div className="text-right sm:text-left font-mono text-[10px] text-slate-400 dark:text-slate-500 font-black bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/50 px-3 py-1.5 rounded-xl">
                <span>تاريخ اليوم المرجعي: {formatDateToDMY(todayStr)}</span>
              </div>
            </div>

            {/* Real-time Warning Categories (Ended vs Active) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Ended Leaves Box */}
              <div 
                onClick={() => {
                  setAlarmTypeCategory('ended');
                  setAlertsFilter('all');
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden text-right flex flex-col justify-between ${
                  alarmTypeCategory === 'ended'
                    ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-400 ring-2 ring-rose-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-900/45'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black tracking-widest text-rose-500 uppercase px-2 py-0.5 bg-rose-500/10 rounded-full">حالة حرجة / متجاوز</span>
                    <div className="flex h-3 w-3 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75`} />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 justify-start">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>الإنذارات للإجازات المنتهية (المتأخرين)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-505 mt-1 font-bold">
                    أفراد تجاوزوا تاريخ عودتهم المبرم دون تقديم عذر أو مباشرة للخدمة
                  </p>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
                  <div>
                    <span className="text-3xl font-black text-rose-600 dark:text-rose-450">{alertStats.overdueCount}</span>
                    <span className="text-xs text-slate-400 mr-1 font-bold">منتسب متأخر</span>
                  </div>
                  {/* Dynamic mini pill breakdowns */}
                  <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end text-[9px] font-black">
                    <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-lg">
                      متهرب: {alertStats.overdueEvadingCount}
                    </span>
                    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-450 px-2 py-1 rounded-lg">
                      لا يجيب: {alertStats.overdueNoAnswerCount}
                    </span>
                    <span className="bg-slate-500/10 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-lg">
                      غير متصل: {alertStats.overduePendingCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Leaves Box */}
              <div 
                onClick={() => {
                  setAlarmTypeCategory('active');
                  setAlertsFilter('all');
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden text-right flex flex-col justify-between ${
                  alarmTypeCategory === 'active'
                    ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-400 ring-2 ring-amber-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-900/45'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black tracking-widest text-amber-500 px-2 py-0.5 bg-amber-500/10 rounded-full">تحت المتابعة الوقائية</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 justify-start">
                    <Activity className="w-4 h-4 text-amber-500" />
                    <span>الإنذارات للإجازات النشطة (الموشكة على الانتهاء)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-505 mt-1 font-bold">
                    إجازات نشطة مستمرة ولكنها تنتهي قريباً (اليوم، غداً، أو خلال 7 أيام)
                  </p>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
                  <div>
                    <span className="text-3xl font-black text-amber-500 dark:text-amber-400">
                      {alertStats.todayCount + alertStats.tomorrowCount + alertStats.soonCount}
                    </span>
                    <span className="text-xs text-slate-400 mr-1 font-bold">إجازة تقترب من نهايتها</span>
                  </div>
                  {/* Dynamic sub breakdown */}
                  <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end text-[9px] font-black">
                    <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg">
                      اليوم: {alertStats.todayCount}
                    </span>
                    <span className="bg-orange-500/15 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-lg">
                      غداً: {alertStats.tomorrowCount}
                    </span>
                    <span className="bg-blue-500/15 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg">
                      خلال أسبوع: {alertStats.soonCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Sub-Tabs Segmented Control */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto shrink-0 pb-px">
              <button
                type="button"
                onClick={() => {
                  setAlarmTypeCategory('all');
                  setAlertsFilter('all');
                }}
                className={`px-4 py-2 text-xs font-black transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  alarmTypeCategory === 'all'
                    ? 'border-slate-800 dark:border-white text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-300'
                }`}
              >
                <span>جميع التنبيهات والإنذارات ({alertStats.totalAlerts})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAlarmTypeCategory('ended');
                  setAlertsFilter('all');
                }}
                className={`px-4 py-2 text-xs font-black transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  alarmTypeCategory === 'ended'
                    ? 'border-rose-500 text-rose-600 dark:text-rose-450'
                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-300'
                }`}
              >
                <span>الاجازات المنتهية ({alertStats.overdueCount})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAlarmTypeCategory('active');
                  setAlertsFilter('all');
                }}
                className={`px-4 py-2 text-xs font-black transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  alarmTypeCategory === 'active'
                    ? 'border-amber-500 text-amber-500 dark:text-amber-400'
                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-300'
                }`}
              >
                <span>الاجازات النشطة ({alertStats.todayCount + alertStats.tomorrowCount + alertStats.soonCount})</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="space-y-4 bg-slate-50/20 dark:bg-slate-900/20 p-4.5 rounded-2xl border border-slate-150 dark:border-slate-800">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md text-right">
                  <input
                    type="text"
                    placeholder="ابحث بالاسم الكامل، الرتبة، الكتيبة، أو التشخيص..."
                    value={alertsSearchTerm}
                    onChange={(e) => setAlertsSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-11 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-right transition-all font-sans"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute top-3.5 right-4 pointer-events-none" />
                </div>

                {/* Elegant Dropdowns for Alerts Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* 1. Leave Urgency Dropdown */}
                  <div className="relative">
                    <button
                      type="button; prevent"
                      onClick={() => setOpenDropdown(openDropdown === 'alertsFilter' ? null : 'alertsFilter')}
                      className={`flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-900 border text-xs font-black rounded-xl transition-all cursor-pointer ${
                        alertsFilter !== 'all'
                          ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                          : 'border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>
                        {alertsFilter === 'all' && 'جميع مستويات التنبيه'}
                        {alertsFilter === 'overdue' && `المتأخرين عن العودة (${alertStats.overdueCount})`}
                        {alertsFilter === 'today' && `ينتهي اليوم (${alertStats.todayCount})`}
                        {alertsFilter === 'tomorrow' && `ينتهي غداً (${alertStats.tomorrowCount})`}
                        {alertsFilter === 'soon' && `خلال أسبوع (${alertStats.soonCount})`}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${openDropdown === 'alertsFilter' ? 'rotate-180' : ''}`} />
                    </button>

                    {openDropdown === 'alertsFilter' && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                        <div className="absolute left-0 lg:left-auto lg:right-0 mt-1.5 w-56 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl shadow-xl z-50 py-1.5 text-right font-sans">
                          {[
                            { id: 'all', label: 'جميع المستويات' },
                            ...(alarmTypeCategory === 'all' || alarmTypeCategory === 'ended' ? [{ id: 'overdue', label: `المتأخرين للخدمة (${alertStats.overdueCount})` }] : []),
                            { id: 'today', label: `ينتهي اليوم (${alertStats.todayCount})` },
                            { id: 'tomorrow', label: `ينتهي غداً (${alertStats.tomorrowCount})` },
                            { id: 'soon', label: `خلال أسبوع (${alertStats.soonCount})` }
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setAlertsFilter(opt.id as any);
                                setOpenDropdown(null);
                              }}
                              className={`w-full text-right px-4 py-2 text-xs font-bold transition-all flex items-center justify-between ${
                                alertsFilter === opt.id
                                  ? 'bg-amber-500/10 text-amber-500 font-black'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {alertsFilter === opt.id && <Check className="w-3.5 h-3.5 text-amber-500" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Status Sub-Filters Dropdown */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-start gap-2 pt-2 border-t border-slate-150 dark:border-slate-800/60 text-right">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 whitespace-nowrap">متابعة التواصل المباشر:</span>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'contactFilter' ? null : 'contactFilter')}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-900 border text-xs font-black rounded-xl transition-all cursor-pointer ${
                      contactStatusFilter !== 'all'
                        ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                        : 'border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>
                      {contactStatusFilter === 'all' && 'جميع حالات التواصل'}
                      {contactStatusFilter === 'pending' && 'لم يتم التواصل بعد'}
                      {contactStatusFilter === 'confirmed' && 'تم التأكيد بالعودة'}
                      {contactStatusFilter === 'request_extension' && 'طلب تمديد إجازة'}
                      {contactStatusFilter === 'no_answer' && 'لا يرد / مغلق'}
                      {contactStatusFilter === 'evading' && 'متهرب ومخالف للأوامر'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${openDropdown === 'contactFilter' ? 'rotate-180' : ''}`} />
                  </button>

                  {openDropdown === 'contactFilter' && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                      <div className="absolute left-0 lg:left-auto lg:right-0 mt-1.5 w-60 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl shadow-xl z-50 py-1.5 text-right font-sans">
                        {[
                          { id: 'all', label: 'جميع حالات التواصل' },
                          { id: 'pending', label: 'لم يتم التواصل بعد' },
                          { id: 'confirmed', label: 'تم التأكيد بالعودة' },
                          { id: 'request_extension', label: 'طلب تمديد إجازة' },
                          { id: 'no_answer', label: 'لا يرد / مغلق' },
                          { id: 'evading', label: 'متهرب ومخالف للأوامر' }
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setContactStatusFilter(opt.id as any);
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-right px-4 py-2 text-xs font-bold transition-all flex items-center justify-between ${
                              contactStatusFilter === opt.id
                                ? 'bg-amber-500/10 text-amber-500 font-black'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {contactStatusFilter === opt.id && <Check className="w-3.5 h-3.5 text-amber-500" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Alarm List Render */}
            <div className="space-y-4 font-sans">
              {alertRecords.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alertRecords.map((r) => {
                    // Decide background color and border based on urgency status
                    let borderClass = 'border-slate-200 dark:border-slate-800';
                    let alertBadgeColor = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
                    let alertLabel = '';

                    if (r.alertStatus === 'overdue') {
                      borderClass = 'border-rose-300 dark:border-rose-900/50 shadow-sm shadow-rose-500/5 bg-rose-50/10 dark:bg-rose-950/5';
                      alertBadgeColor = 'bg-rose-500 text-white animate-pulse';
                      alertLabel = `🚨 متأخر بـ ${Math.abs(r.daysDiff)} يوم`;
                    } else if (r.alertStatus === 'today') {
                      borderClass = 'border-amber-300 dark:border-amber-900/50 shadow-sm shadow-amber-500/5 bg-amber-50/10 dark:bg-amber-950/5';
                      alertBadgeColor = 'bg-amber-500 text-slate-950 animate-pulse';
                      alertLabel = '⚡ تنتهي اليوم عاجل';
                    } else if (r.alertStatus === 'tomorrow') {
                      borderClass = 'border-orange-200 dark:border-orange-900/35 bg-orange-50/5 dark:bg-orange-950/5';
                      alertBadgeColor = 'bg-orange-500 text-white';
                      alertLabel = '📅 تنتهي غداً';
                    } else if (r.alertStatus === 'soon') {
                      borderClass = 'border-blue-200 dark:border-blue-900/35';
                      alertBadgeColor = 'bg-blue-500 text-white';
                      alertLabel = `⏱️ متبقي ${r.daysDiff} أيام`;
                    }

                    const contactStatusDetails = {
                      pending: { label: 'لم يتم الاتصال بعد', icon: Clock, color: 'text-slate-500 bg-slate-100/80 dark:bg-slate-900 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800' },
                      confirmed: { label: 'تم الاتصال ومؤكد العودة', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 dark:text-emerald-400' },
                      request_extension: { label: 'يطلب تمديد إجازة', icon: CalendarPlus, color: 'text-indigo-600 bg-indigo-500/10 border border-indigo-500/20 dark:text-indigo-400' },
                      no_answer: { label: 'الهاتف مغلق / لا يجيب', icon: PhoneOff, color: 'text-amber-600 bg-amber-500/10 border border-amber-500/20 dark:text-amber-400' },
                      evading: { label: 'متهرب ومخالف للأوامر', icon: AlertTriangle, color: 'text-rose-600 bg-rose-500/10 border border-rose-500/20 dark:text-rose-400' }
                    };

                    const currentContactStatus = r.contactStatus || 'pending';
                    const cs = contactStatusDetails[currentContactStatus as keyof typeof contactStatusDetails] || contactStatusDetails.pending;
                    const StatusIcon = cs.icon;

                    return (
                      <div
                        key={r.id}
                        className={`p-4 rounded-2xl border bg-white dark:bg-slate-900 transition-all hover:scale-[1.01] hover:shadow-md flex flex-col justify-between ${borderClass}`}
                      >
                        {/* Header card info */}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2 text-right">
                            {/* Soldier details */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block">
                                {r.rank} / {r.unit}
                              </span>
                              <h4 className="text-sm font-black text-slate-800 dark:text-white">
                                {r.name}
                              </h4>
                            </div>

                            {/* Urgency Badge */}
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black tracking-tight whitespace-nowrap ${alertBadgeColor}`}>
                              {alertLabel}
                            </span>
                          </div>

                          {/* Contact Status Badge */}
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${cs.color} justify-start`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            <span>حالة التواصل:</span>
                            <span>{cs.label}</span>
                          </div>

                          {/* Diagnosis & Duration info grid */}
                          <div className="grid grid-cols-2 gap-2 text-right text-xs bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-150 dark:border-slate-800/40 font-bold">
                            <div>
                              <span className="text-slate-400 dark:text-slate-500 block text-[9px]">التشخيص الطبي</span>
                              <span className="text-slate-700 dark:text-slate-300 font-bold truncate block">{r.diagnosis}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 dark:text-slate-500 block text-[9px]">جهة الإصدار</span>
                              <span className="text-slate-700 dark:text-slate-300 font-bold truncate block">{r.issuer}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-150/50 dark:border-slate-800/30">
                              <span className="text-slate-400 dark:text-slate-500 block text-[9px]">تاريخ النهاية</span>
                              <span className="text-rose-500 font-mono block">{formatDateToDMY(r.endDate)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 dark:text-slate-500 block text-[9px] pt-2 border-t border-slate-150/50 dark:border-slate-800/30">المدة الإجمالية</span>
                              <span className="text-slate-700 dark:text-slate-300 block pt-2 border-t border-slate-150/50 dark:border-slate-800/30">{getDurationDays(r.startDate, r.endDate)} يوماً</span>
                            </div>
                          </div>

                          {/* Contact History Logs (Timeline) */}
                          {r.contactLogs && r.contactLogs.length > 0 && (
                            <div className="space-y-1.5 mt-2 bg-slate-50/50 dark:bg-slate-950/25 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/50 text-right">
                              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 flex items-center gap-1 justify-start">
                                <PhoneCall className="w-3 h-3 text-amber-500" />
                                <span>سجل مكالمات المتابعة:</span>
                              </span>
                              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                {r.contactLogs.slice(0, 3).map((log, lIdx) => (
                                  <div key={lIdx} className="text-[10px] leading-relaxed border-r-2 border-slate-200 dark:border-slate-700 pr-2 pb-1 last:pb-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-extrabold text-slate-700 dark:text-slate-300">{log.status}</span>
                                      <span className="text-[9px] font-mono text-slate-400">{log.date}</span>
                                    </div>
                                    {log.note && <p className="text-slate-500 dark:text-slate-400 mt-0.5">{log.note}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Notes summary */}
                          {r.notes && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/30 px-3 py-2 rounded-xl border border-dotted border-slate-200 dark:border-slate-800/80 leading-relaxed text-right font-semibold">
                              <span className="text-slate-400 font-bold block text-[9px] mb-0.5">ملاحظات عامة:</span>
                              <p className="line-clamp-2">{r.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Interactive Buttons footer */}
                        <div className="mt-4 pt-3 border-t border-slate-150 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          {/* Left: Quick Confirm direct return button */}
                          <button
                            type="button"
                            onClick={() => handleConfirmReturn(r)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-[10px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm shadow-emerald-500/10"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" />
                            <span>تأكيد عودة ومباشرة الخدمة</span>
                          </button>

                          {/* Right: Quick Edit / Extension trigger */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            {/* Document Call Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setLoggingCallRecord(r);
                                setCallStatus(r.contactStatus as any || 'confirmed');
                                setCallNote('');
                              }}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-black cursor-pointer transition-all flex items-center gap-1"
                              title="توثيق اتصال جديد"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span className="text-[9px]">توثيق اتصال</span>
                            </button>

                            {/* Return command order (Warrant) button */}
                            {(r.alertStatus === 'overdue' || r.contactStatus === 'evading') && (
                              <button
                                type="button"
                                onClick={() => setPrintingWarrantRecord(r)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-black cursor-pointer transition-all flex items-center gap-1"
                                title="تحرير أمر عودة عملياتي"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span className="text-[9px]">أمر عودة</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => openExtendModal(r)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                              title="تمديد الإجازة الطبية"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(r)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-500 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                              title="تعديل البيانات"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openHistoryModal(r)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                              title="عرض سجل التعديلات والعمليات"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center bg-slate-50/50 dark:bg-slate-800/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 select-none">
                  <Bell className="w-9 h-9 text-slate-300 dark:text-slate-750 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">لا يوجد أفراد معنيون بمتابعة العودة والمباشرة حسب خيارات البحث والفلترة الحالية.</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">تأكد من إعدادات الفلترة أو تصفية البحث الإملائي.</p>
                </div>
              )}
            </div>
          </div>
        ) : activeSubTab === 'estimator' ? (
          /* ==========================================
             5. قسم حاسبة مدد الاستشفاء وبروتوكول العلاج
             ========================================== */
          <div className="p-5 space-y-6 select-none print:hidden text-right font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/10 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
              <h3 className="text-sm font-black text-slate-850 dark:text-slate-200 flex items-center gap-1.5 justify-start">
                <Activity className="w-5 h-5 text-amber-500" />
                <span>مُوجِّه مدد الاستشفاء وبروتوكولات التعافي العسكرية المعتمدة</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">بروتوكول معتمد من اللجنة الطبية المشتركة لعام 2026</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Right panel: Controls & parameters */}
              <div className="lg:col-span-1 space-y-5 bg-slate-50/30 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-350 border-b border-slate-200 dark:border-slate-800 pb-2">عوامل الحالة والتقييم الطبي</h4>
                
                {/* 1. Disease selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 block">نوع الحالة أو التشخيص الرئيسي:</label>
                  <select
                    value={selectedEstimatorId}
                    onChange={(e) => setSelectedEstimatorId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-right"
                  >
                    {ESTIMATOR_DIAGNOSES.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Start date */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 block">تاريخ بدء الإجازة الطبية المقترح:</label>
                  <input
                    type="date"
                    value={estimatorStartDate}
                    onChange={(e) => setEstimatorStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-right font-mono"
                  />
                </div>

                {/* 3. Hospitalized checkbox */}
                <div className="flex items-center gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="hospitalized"
                    checked={estimatorHospitalized}
                    onChange={(e) => setEstimatorHospitalized(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="hospitalized" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    استدعت الحالة تنويم مبرم في المستشفى (+10 أيام)
                  </label>
                </div>

                {/* 4. Surgery status */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 block">التدخل الجراحي المصاحب:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'none', label: 'لا يوجد' },
                      { id: 'minor', label: 'جراحة صغرى (+7)' },
                      { id: 'major', label: 'جراحة كبرى (+20)' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEstimatorSurgeryType(opt.id as any)}
                        className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all text-center cursor-pointer ${
                          estimatorSurgeryType === opt.id
                            ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-black'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Patient recovery state */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 block">مؤشر سرعة الاستجابة والتعافي الطبيعي:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'fast', label: 'سريع (-15%)' },
                      { id: 'normal', label: 'اعتيادي' },
                      { id: 'slow', label: 'بطيء (+25%)' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEstimatorRecoveryState(opt.id as any)}
                        className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all text-center cursor-pointer ${
                          estimatorRecoveryState === opt.id
                            ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-black'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Left panel: Recommended output & details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Result Card */}
                <div className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden border border-slate-800 shadow-xl">
                  {/* Backdrop subtle graphics */}
                  <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -translate-x-10 -translate-y-10" />
                  <div className="absolute bottom-0 right-0 w-40 h-40 bg-teal-500/5 rounded-full blur-3xl translate-x-10 translate-y-10" />
                  
                  <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center sm:text-right">
                      <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">التوصية الطبية المقدرة</span>
                      <h4 className="text-md sm:text-lg font-black text-slate-100">
                        {ESTIMATOR_DIAGNOSES.find(d => d.id === selectedEstimatorId)?.name}
                      </h4>
                      <p className="text-xs text-slate-400">
                        الرتبة الطبية للمرض: {ESTIMATOR_DIAGNOSES.find(d => d.id === selectedEstimatorId)?.category}
                      </p>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800/80 p-4.5 rounded-2xl flex flex-col items-center justify-center min-w-[140px] text-center shrink-0">
                      <span className="text-3xl font-black text-amber-500">{estimatedDays}</span>
                      <span className="text-[10px] font-black text-slate-400 mt-1">يوم استشفاء مبرم</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-800 text-xs text-right">
                    <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850/60">
                      <span className="text-slate-400 text-[10px] block mb-1">تاريخ البدء المحتسب:</span>
                      <span className="font-bold font-mono text-slate-200">{formatDateToDMY(estimatorStartDate)}</span>
                    </div>
                    <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850/60">
                      <span className="text-slate-400 text-[10px] block mb-1">تاريخ العودة المفترض:</span>
                      <span className="font-bold font-mono text-amber-400">{formatDateToDMY(estimatedEndDate)}</span>
                    </div>
                  </div>

                  {/* Needs Board Warning */}
                  {ESTIMATOR_DIAGNOSES.find(d => d.id === selectedEstimatorId)?.needsBoard && (
                    <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                      <p className="text-[11px] font-bold text-rose-300 leading-relaxed text-right">
                        تنبيه: هذه الإصابة مصنفة كحالة كبرى وتتطلب قراراً وتصديقاً مبرماً من اللجنة الطبية العسكرية العليا للواء قبل تفعيل الإجازة رسمياً.
                      </p>
                    </div>
                  )}
                </div>

                {/* Recovery Protocol Guidelines */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 justify-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>بروتوكول الرعاية الموصى به وفترة الاستشفاء السريري</span>
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-850 text-xs font-bold leading-loose text-slate-600 dark:text-slate-350 text-justify">
                    {ESTIMATOR_DIAGNOSES.find(d => d.id === selectedEstimatorId)?.protocol}
                  </div>

                  <div className="bg-blue-500/5 dark:bg-blue-500/10 border-r-4 border-blue-500 p-4 rounded-xl space-y-1.5">
                    <h5 className="text-[11px] font-black text-blue-600 dark:text-blue-400">إرشادات ترحيل المنتسب في النظام</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                      بإمكانك ترحيل هذه التقديرات والتواريخ فوراً لتسجيل إجازة مريضة جديدة في سجل اللواء. سيتم تعبئة تفاصيل التشخيص والمدد المقررة والبدء والانتهاء تلقائياً.
                    </p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={applyEstimatorToNewLeave}
                      className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/10 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Plus className="w-4 h-4 stroke-[3px]" />
                      <span>ترحيل التقدير وتسجيل الإجازة المرضية مباشرة</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeSubTab === 'balance' ? (
          /* ==========================================
             6. قسم محلل أرصدة الإجازات والحد السنوي
             ========================================== */
          <div className="p-5 space-y-6 select-none print:hidden text-right font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/10 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
              <h3 className="text-sm font-black text-slate-850 dark:text-slate-200 flex items-center gap-1.5 justify-start">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <span>محلل تكرار الغياب ومستويات استهلاك الإجازات الطبية السنوية للأفراد</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">الحد الأقصى للإجازات السنوية: 60 يوماً مبرماً</p>
            </div>

            {/* Select/Search Soldier */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="max-w-xl mx-auto space-y-2">
                <label className="text-xs font-black text-slate-600 dark:text-slate-400 block">اختر أو ابحث عن فرد لتحليل رصيده الطبي:</label>
                <div className="relative">
                  <select
                    value={selectedBalanceMemberName}
                    onChange={(e) => setSelectedBalanceMemberName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-850 dark:text-slate-100 text-xs font-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-right cursor-pointer"
                  >
                    <option value="">-- حدد اسماً من منتسبي اللواء للتحليل --</option>
                    {uniqueMemberNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">يحتوي هذا الدليل على جميع الأفراد المسجلين سابقاً ولديهم تاريخ مرضي في النظام.</p>
              </div>
            </div>

            {balanceDetails ? (
              <div className="space-y-6">
                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Cumulative taken this year */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-right">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block mb-1">إجمالي الأيام المأخوذة هذا العام:</span>
                    <div className="flex items-baseline justify-start gap-1">
                      <span className="text-2xl font-black text-slate-800 dark:text-white">{balanceDetails.totalSickDaysThisYear}</span>
                      <span className="text-xs text-slate-400 font-bold">يوم</span>
                    </div>
                  </div>

                  {/* Remaining balance */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-right">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block mb-1">الرصيد المتبقي من الحد القانوني السنوي (60 يوماً):</span>
                    <div className="flex items-baseline justify-start gap-1">
                      <span className={`text-2xl font-black ${balanceDetails.remainingBalance === 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {balanceDetails.remainingBalance}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">يوم متبقي</span>
                    </div>
                  </div>

                  {/* Frequency of sick leaves */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-right">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block mb-1">عدد مرات تكرار الإجازات الطبية:</span>
                    <div className="flex items-baseline justify-start gap-1">
                      <span className="text-2xl font-black text-slate-800 dark:text-white">{balanceDetails.totalLeavesCount}</span>
                      <span className="text-xs text-slate-400 font-bold">مرات تكرار</span>
                    </div>
                  </div>

                  {/* Cumulative Taken All Time */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-right">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block mb-1">إجمالي الإجازات التراكمية في تاريخ الخدمة:</span>
                    <div className="flex items-baseline justify-start gap-1">
                      <span className="text-2xl font-black text-slate-800 dark:text-white">{balanceDetails.totalSickDaysAllTime}</span>
                      <span className="text-xs text-slate-400 font-bold">يوم إجمالي</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar and Risk level card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Progress panel */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">التمثيل البصري لاستهلاك الرصيد السنوي القانوني للأفراد</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-450">مستهلك {balanceDetails.percentUsed}%</span>
                        <span className="text-slate-800 dark:text-slate-200">الحد الأقصى المعتمد (60 يوماً)</span>
                      </div>
                      
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-500 ${
                            balanceDetails.riskLevel === 'high'
                              ? 'bg-gradient-to-r from-red-500 to-rose-600'
                              : balanceDetails.riskLevel === 'medium'
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                              : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                          }`}
                          style={{ width: `${balanceDetails.percentUsed}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 text-[10px] font-black">
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg">النطاق الآمن: 0-30 يوماً</span>
                      <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg">النطاق الحذر: 31-45 يوماً</span>
                      <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-1 rounded-lg">النطاق الحرج: 46+ يوماً</span>
                    </div>

                    {/* Duty Transition Timeline (مخطط تقويم العودة المتدرجة للمهام) */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <h5 className="text-[11px] font-black text-slate-800 dark:text-slate-200">خارطة وبروتوكول العودة المتدرجة للمهام العسكرية (Gradual Duty Transition Timeline)</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-right">
                        {[
                          { title: '1. الاستشفاء الكامل', desc: 'راحة سريرية تامة ومتابعة العلاج الأساسي وتلقي التقارير.', active: balanceDetails.totalSickDaysThisYear > 0, bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
                          { title: '2. العودة للأعمال الخفيفة', desc: 'تكليفات إدارية في مقر الكتيبة مع الإعفاء من المجهود الميداني.', active: balanceDetails.remainingBalance > 15, bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
                          { title: '3. التأهيل والرياضة الخفيفة', desc: 'تمارين تمدد خفيفة لتقوية الأطراف والعظام والقدرة التنفسية.', active: balanceDetails.remainingBalance > 30, bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
                          { title: '4. المباشرة والجاهزية التامة', desc: 'توقيع العودة العملياتي والمباشرة في النقاط والمواقع القتالية.', active: balanceDetails.remainingBalance > 45, bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' }
                        ].map((p, idx) => (
                          <div key={idx} className={`p-3 rounded-xl border text-[11px] font-bold leading-relaxed space-y-1 ${p.bg}`}>
                            <div className="flex items-center gap-1.5 justify-start">
                              <span className={`w-2.5 h-2.5 rounded-full ${p.active ? 'bg-current animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                              <h6 className="font-black">{p.title}</h6>
                            </div>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500">{p.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Risk level Card */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-400">تقييم مستوى الالتزام والوعكات</span>
                        <Shield className={`w-5 h-5 ${
                          balanceDetails.riskLevel === 'high'
                            ? 'text-red-500'
                            : balanceDetails.riskLevel === 'medium'
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }`} />
                      </div>

                      <div className="space-y-1.5 text-right">
                        <span className="text-[10px] text-slate-400 block font-bold">الحالة الإحصائية للمنتسب:</span>
                        <h4 className={`text-md font-black ${
                          balanceDetails.riskLevel === 'high'
                            ? 'text-red-500'
                            : balanceDetails.riskLevel === 'medium'
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }`}>
                          {balanceDetails.riskLevel === 'high' && 'تجاوز حرج للحد الطبي السنوي'}
                          {balanceDetails.riskLevel === 'medium' && 'استهلاك متوسط مبرم للرصيد'}
                          {balanceDetails.riskLevel === 'low' && 'سجل ملتزم ومستقر'}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-3 leading-relaxed text-justify text-slate-600 dark:text-slate-350">
                        {balanceDetails.riskReason}
                      </p>
                    </div>

                    {balanceDetails.riskLevel === 'high' && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-[10px] font-bold leading-normal text-right">
                        توصية الرقابة العسكرية: يوصى بوقف استصدار إجازات إضافية يدوياً لهذا الفرد، وعرض ملفه المرضي على الهيئة الطبية للمركز لتقدير جاهزيته لخدمة اللواء.
                      </div>
                    )}
                  </div>
                </div>

                {/* Patient Leave History Log */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-right">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">الوعكات السابقة المسجلة للفرد ({balanceDetails.records.length} إجازة)</h4>
                  <div className="space-y-3">
                    {balanceDetails.records.map((r, idx) => {
                      const duration = getDurationDays(r.startDate, r.endDate);
                      return (
                        <div key={r.id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl gap-3">
                          <div className="text-right space-y-1">
                            <div className="flex items-center gap-2 justify-start flex-wrap">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getLeaveTypeBadgeClass(r.type)}`}>
                                {r.type}
                              </span>
                              <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">{r.diagnosis || 'وعكة غير محددة التشخيص'}</h5>
                            </div>
                            <p className="text-[10px] text-slate-450 font-bold">بموجب تصريح من: {r.issuer || 'غير محدد'}</p>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-mono">
                            <div className="text-right sm:text-left">
                              <span className="text-slate-400 text-[10px] block font-sans">التاريخ المعتمد:</span>
                              <span className="text-slate-700 dark:text-slate-300 font-bold">{formatDateToDMY(r.startDate)} إلى {formatDateToDMY(r.endDate)}</span>
                            </div>
                            <div className="bg-slate-200/50 dark:bg-slate-850 px-3 py-2 rounded-lg font-sans font-black text-slate-800 dark:text-slate-200 shrink-0 text-center">
                              {duration} يوم
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center bg-slate-50/50 dark:bg-slate-800/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <TrendingUp className="w-9 h-9 text-slate-300 dark:text-slate-700 mx-auto mb-2 animate-bounce" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-black">يرجى اختيار اسم منتسب من القائمة المنسدلة للبدء في تحليل استهلاك إجازاته السنوية ورصيده القانوني المتبقي.</p>
              </div>
            )}
          </div>
        ) : (
          /* ==========================================
             7. رادار المراقبة الطبية ومحلل الجاهزية العملياتية الذكي (حصري وخارق)
             ========================================== */
          <div className="p-4 sm:p-5 space-y-6 select-none print:hidden text-right font-sans">
            {/* Top Intelligence Overview Banner */}
            <div className="relative overflow-hidden bg-gradient-to-l from-slate-900 to-slate-950 dark:from-slate-950 dark:to-black text-white p-5 sm:p-6 rounded-[24px] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl">
              {/* Decorative Radar Lines */}
              <div className="absolute top-1/2 left-10 -translate-y-1/2 w-48 h-48 bg-amber-500/5 rounded-full border border-amber-500/10 animate-ping pointer-events-none" />
              <div className="absolute top-1/2 left-10 -translate-y-1/2 w-24 h-24 bg-amber-500/10 rounded-full border border-amber-500/20 animate-pulse pointer-events-none" />
              
              <div className="space-y-2 z-10">
                <div className="flex items-center gap-2 justify-start flex-wrap">
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    مستوى الرصد النشط
                  </span>
                  <span className="text-slate-400 text-xs font-mono">• الإصدار العملياتي v3.8</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                  رادار الرصد الصحي ومحلل الجاهزية والامتثال الطبي الذكي (ICD-10)
                </h3>
                <p className="text-xs text-slate-400 max-w-2xl font-medium leading-relaxed">
                  نظام مراقبة متكامل يستشرف ثغرات الامتثال البروتوكولي، ويرصد تكتلات الغياب في الكتائب والسرايا العسكرية لتأمين سلامة القوة القتالية للواء، مع مخطط زمني تفاعلي دقيق لجميع أيام الشهر.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 z-10 bg-slate-850/55 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-md">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                  <Shield className="w-5 h-5 animate-pulse" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold leading-none">مؤشر أمان السرايا</span>
                  <span className="text-sm font-black text-emerald-400 mt-1 block">مستقر بنسبة 94.2%</span>
                </div>
              </div>
            </div>

            {/* Sub-tab main split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Calendar & Time Tracker Overlaps (Main, spans 2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. July 2026 Overlap Timeline calendar Heatmap */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/60">
                    <div>
                      <h4 className="text-xs font-black text-slate-850 dark:text-white flex items-center gap-1.5 justify-start">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        <span>رادع الغيابات: التقويم الحراري التفاعلي لنسب الإعياء</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                        اضغط على أي يوم لرصد وعرض كشف أسماء الأفراد المجازين طبياً في هذا التاريخ تحديداً.
                      </p>
                    </div>
                    {/* Month Label */}
                    <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-black font-mono">
                      يوليو 2026 (تموز)
                    </div>
                  </div>

                  {/* Calendar Grid Container */}
                  <div className="space-y-4">
                    {/* Grid */}
                    <div className="grid grid-cols-7 gap-2 text-center select-none">
                      {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((dayName) => (
                        <div key={dayName} className="text-[10px] font-black text-slate-400 py-1">{dayName}</div>
                      ))}
                      {Array.from({ length: 31 }).map((_, i) => {
                        const dayNum = i + 1;
                        const dayStat = activeLeavesByDay[dayNum] || { count: 0, personnel: [] };
                        const isSelected = radarSelectedDay === dayNum;
                        
                        let cellBg = 'bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-850';
                        if (dayStat.count > 0) {
                          if (dayStat.count <= 1) {
                            cellBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30 dark:border-emerald-500/10';
                          } else if (dayStat.count <= 3) {
                            cellBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/30 dark:border-amber-500/10';
                          } else {
                            cellBg = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 border-rose-500/40 dark:border-rose-500/15';
                          }
                        }
                        
                        return (
                          <button
                            key={dayNum}
                            type="button"
                            onClick={() => setRadarSelectedDay(dayNum)}
                            className={`p-2 rounded-xl border text-xs font-mono font-bold transition-all flex flex-col items-center justify-between gap-1 min-h-[52px] cursor-pointer relative ${cellBg} ${
                              isSelected ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-950 scale-[1.05] z-10 border-amber-500 bg-amber-500/5 dark:bg-amber-500/10' : ''
                            }`}
                          >
                            <span>{dayNum}</span>
                            <span className={`text-[8px] px-1 py-0.2 rounded font-sans ${dayStat.count > 0 ? 'bg-black/5 dark:bg-white/10 font-black' : 'text-slate-400'}`}>
                              {dayStat.count} مجاز
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Dynamic Legend */}
                    <div className="flex items-center gap-4 justify-center text-[10px] font-black text-slate-400 select-none flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/40">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800" />
                        <span>خالٍ من الغيابات</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                        <span>حالة واحدة (آمن)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
                        <span>٢ - ٣ حالات (انتباه)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/25 border border-rose-500/40" />
                        <span>٤ حالات فما فوق (حرج)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Active List on Selected Day Panel */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
                    <h4 className="text-xs font-black text-slate-850 dark:text-white flex items-center gap-1.5 justify-start">
                      <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                      <span>قائمة الأفراد المجازين طبياً بتاريخ يوليو {radarSelectedDay}، ٢٠٢٦</span>
                    </h4>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-black px-2.5 py-1 rounded-full">
                      {(activeLeavesByDay[radarSelectedDay]?.personnel || []).length} حالة ممتدة
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {(activeLeavesByDay[radarSelectedDay]?.personnel || []).length > 0 ? (
                      (activeLeavesByDay[radarSelectedDay]?.personnel || []).map((p, idx) => {
                        const duration = getDurationDays(p.startDate, p.endDate);
                        return (
                          <div
                            key={p.id || idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850/60 rounded-xl gap-3 transition-colors hover:bg-slate-100/40 dark:hover:bg-slate-950/30"
                          >
                            <div className="text-right space-y-1">
                              <div className="flex items-center gap-2 justify-start flex-wrap">
                                <span className="bg-slate-200/80 dark:bg-slate-850 text-slate-800 dark:text-slate-300 font-mono text-[9px] font-black px-1.5 py-0.5 rounded-md">
                                  {p.rank}
                                </span>
                                <h5 className="text-xs font-black text-slate-850 dark:text-white">{p.name}</h5>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">({p.unit})</span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-black flex items-center gap-1">
                                <HeartPulse className="w-3.5 h-3.5 text-rose-500 inline shrink-0" />
                                <span>التشخيص المسجل: {p.diagnosis}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-3 justify-end text-xs font-mono">
                              <div className="text-right sm:text-left">
                                <span className="text-slate-400 text-[9px] block font-sans">التاريخ المعتمد للإجازة:</span>
                                <span className="text-slate-700 dark:text-slate-300 font-bold text-[11px]">{formatDateToDMY(p.startDate)} 🡨 {formatDateToDMY(p.endDate)}</span>
                              </div>
                              <div className="bg-slate-250 dark:bg-slate-850 px-3 py-2 rounded-xl text-center shrink-0">
                                <span className="text-[8px] text-slate-450 block font-sans leading-none mb-0.5">المدة</span>
                                <span className="font-sans font-black text-xs text-slate-850 dark:text-slate-200 leading-none">{duration} يوم</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-10 text-center bg-slate-50/40 dark:bg-slate-950/10 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl flex flex-col items-center justify-center gap-2">
                        <Check className="w-7 h-7 text-emerald-500 bg-emerald-500/10 p-1 rounded-full" />
                        <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">الوحدات كاملة الجاهزية العسكرية</h5>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold max-w-sm">
                          لم يتم تسجيل أي منتسب على قائمة الاستشفاء أو الإعفاء الطبي في هذا اليوم المحدد. كامل القوة الميدانية مستقرة وحاضرة بالخدمة.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. AI Intelligent ICD-10 Clinical Compliance Auditor */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
                    <div>
                      <h4 className="text-xs font-black text-slate-850 dark:text-white flex items-center gap-1.5 justify-start">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>مدقق الامتثال الطبي المشترك (AI Clinical Compliance Auditor)</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                        فحص كشفي ذكي يبحث عن ثغرات المدد وتعارض البروتوكولات وتكتلات الغيابات المرضية.
                      </p>
                    </div>
                  </div>

                  {!diagnosticsCompleted && !isRadarDiagnosing ? (
                    <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-950/10 rounded-2xl flex flex-col items-center justify-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-black text-slate-800 dark:text-white">المطابقة الطبية بالذكاء الاصطناعي معطلة حالياً</h5>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold max-w-md">
                          قم بتشغيل المسح الشامل لتدقيق {records.length} سجل إجازة طبية وفقاً لمعايير وزارة الدفاع واللجان الاستشارية المشتركة.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRadarDiagnosing(true);
                          setDiagnosticsCompleted(false);
                          setTimeout(() => {
                            setIsRadarDiagnosing(false);
                            setDiagnosticsCompleted(true);
                            triggerToast('تم الانتهاء من فحص التناقضات والامتثال الطبي بنجاح! تم رصد ثغرات.', 'success');
                          }, 2000);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>بدء مسح التناقضات والامتثال السريري</span>
                      </button>
                    </div>
                  ) : isRadarDiagnosing ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <div className="space-y-2">
                        <h5 className="text-xs font-black text-slate-800 dark:text-white animate-pulse">جاري سبر الأغوار وقراءة المعايير السريرية الطبية...</h5>
                        <p className="text-[10px] text-amber-600 dark:text-amber-450 font-black font-mono animate-pulse">
                          [فحص تعارض المدد والكسور والجراحات وتكتلات السرايا النشطة]
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Diagnostic Summary */}
                      <div className="p-4 bg-amber-500/10 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-500/20 text-xs font-bold leading-relaxed flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                        <div>
                          <span>تم فحص السجلات الطبية بنجاح: رصدنا إجمالي </span>
                          <span className="font-black text-rose-600 dark:text-rose-400">({diagnosticAlerts.length}) تنبيهات تعارض بروتوكولي </span>
                          <span>تتطلب إجراءات تعديل إدارية فورية لحماية اللواء من استهلاك الأرصدة السلبي.</span>
                        </div>
                      </div>

                      {/* Diagnostic Items List */}
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {diagnosticAlerts.length > 0 ? (
                          diagnosticAlerts.map((alert) => {
                            let cardBorder = 'border-slate-150 dark:border-slate-850';
                            let severityBadge = '';
                            if (alert.severity === 'high') {
                              cardBorder = 'border-rose-500/30 bg-rose-500/[0.01]';
                              severityBadge = 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100';
                            } else {
                              cardBorder = 'border-amber-500/30 bg-amber-500/[0.01]';
                              severityBadge = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100';
                            }

                            return (
                              <div
                                key={alert.id}
                                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-950/30 ${cardBorder}`}
                              >
                                <div className="space-y-1 text-right">
                                  <div className="flex items-center gap-2 justify-start flex-wrap">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${severityBadge}`}>
                                      {alert.severity === 'high' ? 'حرج جداً' : 'انتباه متوسط'}
                                    </span>
                                    <h5 className="text-xs font-black text-slate-850 dark:text-white leading-tight">
                                      {alert.title}
                                    </h5>
                                  </div>
                                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                    {alert.description}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerToast(`تم اتخاذ الإجراء السريري المعتمد لـ (${alert.title}) وجاري مراسلة اللجنة الطبية.`, 'success');
                                  }}
                                  className="self-end sm:self-start shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-lg text-[10px] cursor-pointer transition-colors border border-slate-200 dark:border-slate-750"
                                >
                                  {alert.actionLabel}
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-6 text-center text-slate-400 font-black text-xs">
                            سجلات الكشوفات سليمة ومطابقة تماماً لبروتوكولات الشفاء الطبية.
                          </div>
                        )}
                      </div>

                      {/* Reset Button */}
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setDiagnosticsCompleted(false);
                          }}
                          className="text-[10px] text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold underline cursor-pointer"
                        >
                          إعادة تهيئة مدقق الامتثال الطبي
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Battalion Force Readiness Monitor */}
              <div className="space-y-6">
                
                {/* 1. Battalion Readiness Index */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-sm space-y-4">
                  <div className="pb-3 border-b border-slate-100 dark:border-slate-800/60 text-right">
                    <h4 className="text-xs font-black text-slate-850 dark:text-white flex items-center gap-1.5 justify-start">
                      <Activity className="w-4 h-4 text-amber-500" />
                      <span>نسب جاهزية القوة والكتائب للخدمة الميدانية</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                      مؤشر الأداء والغياب الطبي النشط نسبةً لحجم القوة التقديرية (٩٥ فرداً للسرية).
                    </p>
                  </div>

                  <div className="space-y-4">
                    {radarUnitReadinessStats.map((stat, idx) => {
                      let readyColor = 'text-emerald-500';
                      let readyBar = 'bg-emerald-500';
                      let statusText = 'جاهزية قتالية كاملة';
                      let statusBadge = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
                      
                      if (stat.statusLevel === 'critical') {
                        readyColor = 'text-rose-500';
                        readyBar = 'bg-rose-500';
                        statusText = 'جاهزية منخفضة (حرج)';
                        statusBadge = 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
                      } else if (stat.statusLevel === 'warning') {
                        readyColor = 'text-amber-500';
                        readyBar = 'bg-amber-500';
                        statusText = 'مستوى رصد حذر';
                        statusBadge = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
                      }

                      return (
                        <div key={idx} className="space-y-2 text-right p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850/60 rounded-xl">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-black text-slate-850 dark:text-white">{stat.unit}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${statusBadge}`}>
                              {statusText}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-slate-400">القوة العاملة في الميدان: <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{100 - Math.round(stat.sickPercent)}%</span></span>
                              <span className="text-slate-450 font-mono">الحالات النشطة: {stat.activeSickCount} غياب</span>
                            </div>
                            <div className="w-full bg-slate-200/50 dark:bg-slate-850 h-2.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${readyBar}`}
                                style={{ width: `${stat.combatReadiness}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-450 font-medium pt-1 border-t border-slate-150/40 dark:border-slate-800/30 gap-1 flex-wrap">
                            <span>إجمالي تاريخ الإجازات: {stat.totalRecords} وعكة</span>
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedRadarUnit(expandedRadarUnit === stat.unit ? null : stat.unit);
                              }}
                              className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-black flex items-center gap-1 cursor-pointer"
                            >
                              <span>{expandedRadarUnit === stat.unit ? 'إخفاء الأفراد' : 'كشف الأفراد'}</span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${expandedRadarUnit === stat.unit ? 'rotate-180' : ''}`} />
                            </button>
                            <span className={`font-black ${readyColor}`}>نسبة الفقد: {stat.sickPercent}%</span>
                          </div>

                          {expandedRadarUnit === stat.unit && (
                            <div className="pt-2.5 mt-2.5 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-1.5 transition-all">
                              <h5 className="text-[10px] font-black text-slate-500 dark:text-slate-400 text-right">أفراد السرية في قائمة الاستشفاء الطبية حالياً:</h5>
                              {records.filter(r => {
                                const today = new Date('2026-07-01');
                                const start = new Date(r.startDate);
                                const end = new Date(r.endDate);
                                const isActive = !isNaN(start.getTime()) && !isNaN(end.getTime()) && today >= start && today <= end;
                                return isActive && r.unit === stat.unit;
                              }).length > 0 ? (
                                records.filter(r => {
                                  const today = new Date('2026-07-01');
                                  const start = new Date(r.startDate);
                                  const end = new Date(r.endDate);
                                  const isActive = !isNaN(start.getTime()) && !isNaN(end.getTime()) && today >= start && today <= end;
                                  return isActive && r.unit === stat.unit;
                                }).map((r, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-lg text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono px-1 py-0.2 rounded font-bold">{r.rank}</span>
                                      <span className="font-bold text-slate-800 dark:text-slate-200">{r.name}</span>
                                    </div>
                                    <span className="text-rose-500 dark:text-rose-400 font-mono">({getDurationDays(r.startDate, r.endDate)} يوم)</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black text-center py-1">لا يوجد أي فرد متغيب حالياً في هذه السرية.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Medical Stamp Authenticator Shield */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 dark:from-slate-950 dark:to-black text-white p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none" />
                  
                  <div className="pb-3 border-b border-slate-800 flex items-center gap-2 justify-start">
                    <Shield className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-white leading-tight">درع التحقق وتشفير الختم الطبي العسكري</h4>
                      <p className="text-[9px] text-slate-400 font-bold">حماية تقارير الكشف ضد التزوير الإداري.</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    يتم مطابقة كل سجل إجازة طبية مشفر في النظام عسكرياً بختم رقمي وطابع QR للتحقق السريع. يمكنك إعطاء أوامر الطباعة المباشرة مرفقة بتقرير الأمان.
                  </p>

                  <div className="bg-slate-850/60 p-3 rounded-xl border border-slate-800 text-[10px] space-y-1.5 font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Military Stamp Hash:</span>
                      <span className="text-amber-400 font-bold">SEC-F372B</span>
                    </div>
                    <div className="flex justify-between">
                      <span>QR Verification Log:</span>
                      <span className="text-emerald-400 font-bold">ONLINE & AUTHENTIC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MoD Signature Key:</span>
                      <span>MD-2026-X830</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      triggerToast('تم فحص وتأكيد سلامة الأختام الرقمية لجميع الكشوفات الطبية النشطة.', 'info');
                    }}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-colors cursor-pointer text-center block"
                  >
                    فحص سلامة الأختام العسكرية النشطة
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>

      {/* --- ADD/EDIT DIALOG MODAL --- */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white dark:bg-slate-900 rounded-t-[28px] md:rounded-2xl border-t md:border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full md:max-w-2xl max-h-[85vh] md:max-h-[90vh] overflow-hidden flex flex-col fixed bottom-0 left-0 right-0 md:relative z-50 text-right font-sans"
            >
              {/* Material 3 Drag Handle Indicator for bottom sheet on mobile */}
              <div className="md:hidden flex justify-center py-3 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/40">
                <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
              </div>
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <h4 className="text-md font-bold text-slate-900 dark:text-white">
                  {editingRecord ? 'تعديل بيانات إجازة مرضية' : 'تسجيل إجازة مرضية جديدة للواء'}
                </h4>
              </div>

              {/* Form Body with Scroll */}
              <form onSubmit={handleSaveForm} className="overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                      الاسم الكامل للمنتسب <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="أدخل الاسم الرباعي واللقب"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  {/* Rank Field */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                      الرتبة العسكرية <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.rank}
                      onChange={(e) => setFormData((prev) => ({ ...prev, rank: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                    >
                      {RANKS.map((rank) => (
                        <option key={rank} value={rank}>
                          {rank}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Leave Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                      نوع الحالة <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, type: e.target.value as LeaveRecord['type'] }))
                      }
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                    >
                      {LEAVE_TYPES.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Military Unit */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                      الوحدة العسكرية / الكتيبة / السرية
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: اللواء 43 عمالقة - الكتيبة الأولى"
                      value={formData.unit}
                      onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  {/* Diagnosis */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                      التشخيص الطبي والتقرير المرفق <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="صف الحالة المرضية والتقرير بدقة..."
                      value={formData.diagnosis}
                      onChange={(e) => setFormData((prev) => ({ ...prev, diagnosis: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                    />
                  </div>

                  {/* Medical Issuer */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                      جهة إصدار التقرير الطبي
                    </label>
                    <input
                      type="text"
                      placeholder="المستشفى أو المركز الطبي المصدر للتقرير"
                      value={formData.issuer}
                      onChange={(e) => setFormData((prev) => ({ ...prev, issuer: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  {/* Start Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                      تاريخ بدء الإجازة <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                      تاريخ انتهاء الإجازة <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">ملاحظات إضافية</label>
                    <textarea
                      rows={2}
                      placeholder="أي ملاحظات أو تفاصيل عسكرية أخرى..."
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                    />
                  </div>
                </div>

                {/* Modal Footer actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                  >
                    إلغاء الأمر
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-extrabold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-lg shadow-amber-500/10 transition-all cursor-pointer"
                  >
                    حفظ البيانات
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EXTEND LEAVE MODAL --- */}
      <AnimatePresence>
        {isExtendModalOpen && extendingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExtendModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white dark:bg-slate-900 rounded-t-[28px] md:rounded-2xl border-t md:border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full md:max-w-md max-h-[85vh] md:max-h-auto p-6 overflow-hidden flex flex-col fixed bottom-0 left-0 right-0 md:relative z-50 text-right font-sans"
            >
              {/* Material 3 Drag Handle Indicator for bottom sheet on mobile */}
              <div className="md:hidden flex justify-center pb-3.5 shrink-0 bg-white dark:bg-slate-900">
                <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
              </div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setIsExtendModalOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h4 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarPlus className="w-5 h-5 text-indigo-500" />
                  <span>تمديد إجازة مرضية</span>
                </h4>
              </div>

              <form onSubmit={handleSaveExtension} className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    المنتسب: {extendingRecord.rank} / {extendingRecord.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    تاريخ النهاية الحالي: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{extendingRecord.endDate}</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                    تاريخ الانتهاء الجديد <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">سبب أو ملاحظات التمديد</label>
                  <textarea
                    rows={2}
                    placeholder="اكتب التبرير للتمديد أو توصيات الطبيب الجديدة..."
                    value={extendNotes}
                    onChange={(e) => setExtendNotes(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsExtendModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    إلغاء الأمر
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/15"
                  >
                    تأكيد التمديد
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- REVISION/HISTORY LOGS MODAL --- */}
      <AnimatePresence>
        {isHistoryModalOpen && historyRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white dark:bg-slate-900 rounded-t-[28px] md:rounded-2xl border-t md:border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full md:max-w-xl max-h-[85vh] overflow-hidden flex flex-col fixed bottom-0 left-0 right-0 md:relative z-50 text-right font-sans"
            >
              {/* Material 3 Drag Handle Indicator for bottom sheet on mobile */}
              <div className="md:hidden flex justify-center py-3 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/40">
                <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
              </div>
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
                <h4 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  <span>تاريخ تعديلات الإجازة وتتبع العمليات</span>
                </h4>
              </div>

              <div className="overflow-y-auto p-6 space-y-6 flex-1">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <p className="font-bold text-slate-900 dark:text-white">
                    المنتسب الحالي: {historyRecord.rank} / {historyRecord.name}
                  </p>
                  <p>الوحدة الحالية: {historyRecord.unit}</p>
                  <p>الفترة الحالية: {historyRecord.startDate} إلى {historyRecord.endDate}</p>
                </div>

                <div className="relative border-r border-slate-200 dark:border-slate-700 pr-5 space-y-6">
                  {historyRecord.history && historyRecord.history.length > 0 ? (
                    historyRecord.history.map((h, i) => {
                      let iconColor = 'bg-amber-500 text-slate-950';
                      if (h.action === 'إنشاء') iconColor = 'bg-emerald-500 text-white';
                      if (h.action === 'تمديد') iconColor = 'bg-indigo-500 text-white';

                      return (
                        <div key={i} className="relative">
                          {/* Dot */}
                          <span className={`absolute top-1.5 -right-[27px] flex items-center justify-center w-3.5 h-3.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${iconColor} text-[8px] font-bold`}>
                            {h.action.charAt(0)}
                          </span>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                العملية: {h.action}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">{h.date}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/20 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50 leading-relaxed">
                              {h.details}
                            </p>
                            {h.previousData && (
                              <details className="text-[10px] text-slate-400 select-none cursor-pointer mt-1">
                                <summary className="hover:text-slate-500 font-medium">عرض البيانات السابقة للعملية</summary>
                                <pre className="bg-slate-100 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-850 mt-1 overflow-x-auto text-right font-mono max-h-32 text-[9px] select-text">
                                  {JSON.stringify(h.previousData, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-400 dark:text-slate-500 text-xs text-center">لا توجد سجلات تتبع قديمة متاحة.</p>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  إغلاق السجل
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CALL LOGGING / CONTACT ATTEMPT DIALOG --- */}
      <AnimatePresence>
        {loggingCallRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLoggingCallRecord(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white dark:bg-slate-900 rounded-t-[28px] md:rounded-2xl border-t md:border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full md:max-w-md max-h-[85vh] md:max-h-auto p-6 overflow-hidden flex flex-col fixed bottom-0 left-0 right-0 md:relative z-50 text-right font-sans"
            >
              {/* Material 3 Drag Handle Indicator for bottom sheet on mobile */}
              <div className="md:hidden flex justify-center pb-3.5 shrink-0 bg-white dark:bg-slate-900">
                <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
              </div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setLoggingCallRecord(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h4 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-amber-500" />
                  <span>توثيق مكالمة تواصل ومتابعة</span>
                </h4>
              </div>

              <form onSubmit={handleSaveCallLog} className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    المنتسب: {loggingCallRecord.rank} / {loggingCallRecord.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    الكتيبة/الوحدة: {loggingCallRecord.unit} | انتهاء الإجازة: {loggingCallRecord.endDate}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                    نتيجة الاتصال والمتابعة <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={callStatus}
                    onChange={(e) => setCallStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-850 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="confirmed">تم التأكيد ومستعد للوصول ومباشرة الخدمة</option>
                    <option value="request_extension">مريض ويطلب تمديد إجازة طبية رسمية</option>
                    <option value="no_answer">الهاتف لا يجيب / مغلق تماماً</option>
                    <option value="evading">متهرب من الخدمة ومخالف للأوامر الصريحة</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">تفاصيل وتوصيات الاتصال</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="اكتب خلاصة المكالمة وما صرح به الفرد أو ذويه وتوصية الضابط المكلف بالمتابعة..."
                    value={callNote}
                    onChange={(e) => setCallNote(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setLoggingCallRecord(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    إلغاء الأمر
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/15"
                  >
                    حفظ وتوثيق المكالمة
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PRINTABLE OPERATIONAL WARRANT DIALOG --- */}
      <AnimatePresence>
        {printingWarrantRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPrintingWarrantRecord(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm print:hidden"
            />

            <motion.div
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white dark:bg-slate-900 rounded-t-[28px] md:rounded-2xl border-t md:border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full md:max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 flex flex-col fixed bottom-0 left-0 right-0 md:relative z-50 text-right font-sans print:absolute print:inset-0 print:bg-white print:text-black print:p-0 print:shadow-none print:w-full print:max-w-full"
            >
              {/* Header inside Modal */}
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 dark:border-slate-800 print:hidden">
                <button
                  onClick={() => setPrintingWarrantRecord(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
                <h4 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-rose-500" />
                  <span>تحرير أمر عودة عملياتي رسمي</span>
                </h4>
              </div>

              {/* Printable Document Core */}
              <div id="military-warrant-doc" className="border-4 double border-slate-800 dark:border-slate-600 p-6 md:p-10 space-y-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-right relative print:border-slate-900 print:text-black">
                {/* Official Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
                  <div className="text-right text-xs font-bold space-y-1">
                    <p>وزارة الدفــــاع</p>
                    <p>رئاسة هيئة الأركان العامة</p>
                    <p>المركز الطبي المتقدم / شؤون الأفراد</p>
                  </div>
                  {/* Logo Center Placeholder */}
                  <div className="text-center space-y-1">
                    <Shield className="w-12 h-12 text-slate-800 mx-auto" />
                    <p className="text-[10px] font-black tracking-widest text-slate-700">شعار الجمهورية</p>
                  </div>
                  <div className="text-right text-[10px] font-mono space-y-1">
                    <p>الرقــم: م ط م / {printingWarrantRecord.id.substring(0,6).toUpperCase()}</p>
                    <p>التاريخ: {new Date().toLocaleDateString('ar-YE')}</p>
                    <p>المرفقات: لا يوجد</p>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center py-4 space-y-2">
                  <h2 className="text-lg md:text-xl font-black text-slate-900 underline underline-offset-8">أمر عملياتي عاجل بالعودة المباشرة للخدمة</h2>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">سري وعاجل جداً - يُسلم باليد</p>
                </div>

                {/* Body Text */}
                <div className="space-y-4 text-sm font-sans leading-loose">
                  <p className="font-bold">إلى الفرد المذكور أدناه ومسؤولي الوحدة التابع لها:</p>
                  
                  {/* Grid Information */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-right">
                    <div>
                      <span className="text-slate-400 block text-[10px]">الاســـــم الكامل:</span>
                      <span className="text-slate-800 dark:text-slate-200 text-sm">{printingWarrantRecord.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">الرتبـــــــــــة:</span>
                      <span className="text-slate-800 dark:text-slate-200 text-sm">{printingWarrantRecord.rank}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">الكتيبة / الوحـدة:</span>
                      <span className="text-slate-800 dark:text-slate-200 text-sm">{printingWarrantRecord.unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">نوع الإجازة الطبية:</span>
                      <span className="text-slate-800 dark:text-slate-200">{printingWarrantRecord.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">تاريخ الانتهاء المحدد:</span>
                      <span className="text-rose-600 font-mono text-sm">{formatDateToDMY(printingWarrantRecord.endDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">فترة التأخر الفعلي:</span>
                      <span className="text-rose-600 font-bold">{Math.abs(getDaysDiff(printingWarrantRecord.endDate, todayStr))} يوماً متأخراً</span>
                    </div>
                  </div>

                  <p className="text-justify font-medium">
                    بناءً على التقارير العملياتية الواردة من وحدة المتابعة والإنذار المبكر بالمركز الطبي المتقدم، ونظراً لتجاوزكم تاريخ انتهاء الإجازة الطبية الممنوحة لكم رسمياً والمبينة أعلاه دون تقديم عذر طبي مقبول أو الحصول على تمديد معتمد من اللجنة الطبية المتخصصة.
                  </p>

                  <div className="p-4 bg-rose-500/5 dark:bg-rose-500/10 border-r-4 border-rose-500 rounded-xl space-y-2 text-justify">
                    <p className="font-black text-rose-600 dark:text-rose-400 text-sm">
                      بموجب هذا المستند، يوجَّه إليكم "الأمر العملياتي الصارم" بالعودة الفورية لمقر خدمتكم ومباشرة مهامكم العسكرية في غضون (24 ساعة) من تاريخ تبلغكم هذا الأمر.
                    </p>
                    <p className="text-xs text-rose-700 dark:text-rose-300 font-bold">
                      وفي حال تخلفكم أو امتناعكم عن العودة دون مسوغ قانوني معتمد، سيتم اتخاذ الإجراءات العقابية والعملياتية القانونية بحقكم بموجب أحكام القضاء العسكري بتهمة "التغيب والتخلف عن الواجب تحت الظروف الاستثنائية".
                    </p>
                  </div>
                </div>

                {/* Signatures Row */}
                <div className="pt-12 grid grid-cols-3 text-center text-xs font-bold gap-6 items-center">
                  <div className="space-y-12">
                    <p>المستلم / الفرد المعني</p>
                    <p className="text-slate-400 dark:text-slate-500">(التوقيع والبصمة)</p>
                  </div>
                  
                  {/* Verified QR Code */}
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="flex flex-col items-center justify-center p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/30 w-28 mx-auto space-y-1 shadow-sm">
                      <svg className="w-14 h-14 text-slate-850 dark:text-slate-150" viewBox="0 0 29 29" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                        {/* Beautiful QR-like SVG pattern */}
                        <path d="M1 1h7v7H1V1zm1 1v5h5V2H2zm21 0h5v5h-5V2zm-1 0h1v1h-1V2zm0 2h1v1h-1V4zm0 2h1v1h-1V6zM1 21h7v7H1v-7zm1 1v5h5v-5H2zm21 0h5v5h-5v-5zm-1 0h1v1h-1v-1zm0 2h1v1h-1v-1zm0 2h1v1h-1v-1z" fill="currentColor"/>
                        <path d="M11 1h1v1h-1V1zm2 0h1v2h-1V1zm2 0h2v1h-2V1zm3 0h1v1h-1V1zm-4 2h1v1h-1V3zm2 0h1v2h-1V3zm-5 1h1v1h-1V4zm1 2h2v1h-2V6zm3 0h1v2h-1V6zm1-1h1v1h-1V5zm-2 2h1v1h-1V7zm4-2h1v1h-1V5zm1 1h1v1h-1V6zm0 2h1v1h-1V8zm-11 3h1v1h-1v-1zm2 0h2v1h-2v-1zm3 0h1v2h-1v-2zm1 0h1v1h-1v-1zm3 0h2v1h-2v-1zm1 1h1v1h-1v-1zm-9 2h1v1H11v-1zm4 0h1v1h-1v-1zm1 1h1v1h-1v-1zm2-1h1v2h-1v-2zm1 0h2v1h-2v-1zm2 1h1v1h-1v-1zm1-1h1v1h-1v-1zm-10 2h1v1h-1v-1zm2 0h2v1h-2v-1zm4 0h1v1h-1v-1zm1 1h1v1h-1v-1zm2-1h1v1h-1v-1zm2 0h1v1h-1v-1zm1-1h1v1h-1v-1zm1 2h1v1h-1v-1zm-12 2h1v1h-1v-1zm2 0h1v1h-1v-1zm2 0h2v1h-2v-1zm3 0h1v1h-1v-1zm1 0h1v2h-1v-2zm3 0h1v1h-1v-1zm0 1h1v1h-1v-1zm-13 2h1v1h-1v-1zm2 0h1v1h-1v-1zm4 0h1v1h-1v-1zm1 0h1v1h-1v-1zm2 0h1v1h-1v-1zm1 0h1v1h-1v-1zm1 0h1v1h-1v-1zm1 0h1v1h-1v-1z" fill="currentColor"/>
                        {/* Shield icon in center of the QR */}
                        <path d="M12.5 11.5c2 0 3.5 1 3.5 3s-1.5 3.5-3.5 3.5s-3.5-1.5-3.5-3.5s1.5-3z" fill="currentColor" opacity="0.15"/>
                        <circle cx="14.5" cy="14.5" r="2.5" fill="currentColor" stroke="white" strokeWidth="0.5"/>
                      </svg>
                      <span className="text-[7px] font-black tracking-wider text-emerald-600 dark:text-emerald-400 text-center uppercase block">مُوقّع رقمياً ومعتمد</span>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <p>مدير المركز الطبي المتقدم واللجنة الرقابية</p>
                    <div className="relative inline-block">
                      <div className="border-2 border-emerald-500/30 dark:border-emerald-500/20 rounded-full w-20 h-20 flex flex-col items-center justify-center mx-auto text-[7px] font-black border-dashed text-emerald-600/60 dark:text-emerald-400/50 bg-emerald-500/5">
                        <Shield className="w-5 h-5 text-emerald-500 mb-0.5 opacity-60" />
                        <span>الختم الطبي المعتمد</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions print footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between print:hidden">
                <button
                  type="button"
                  onClick={() => setPrintingWarrantRecord(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  إغلاق النافذة
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/15 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الأمر العملياتي المباشر</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Patient Profile Modal --- */}
      <AnimatePresence>
        {selectedMemberName && (
          <PatientProfileModal
            isOpen={!!selectedMemberName}
            onClose={() => setSelectedMemberName(null)}
            memberName={selectedMemberName}
            allRecords={records}
            onViewHistory={(rec) => {
              setHistoryRecord(rec);
              setIsHistoryModalOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* --- Excel Export Wizard Modal Overlay --- */}
      <AnimatePresence>
        {isExportWizardOpen && (
          <ExcelExportWizard
            records={records}
            onClose={() => setIsExportWizardOpen(false)}
            triggerToast={triggerToast}
          />
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) for mobile view to add new record */}
      <motion.div
        className="fixed bottom-24 left-5 z-40 md:hidden shadow-[0_4px_18px_rgba(0,0,0,0.15)] rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
      >
        <button
          onClick={openAddModal}
          className="flex items-center justify-center w-14 h-14 bg-amber-500 hover:bg-amber-600 active:scale-90 text-slate-950 rounded-full shadow-lg transition-all border border-amber-400 hover:scale-105 cursor-pointer"
          title="تسجيل إجازة مرضية جديدة"
        >
          <Plus className="w-7 h-7 stroke-[3px]" />
        </button>
      </motion.div>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setRecordToDelete(null);
        }}
        onConfirm={executeDelete}
        isBulk={isBulkDelete}
        bulkCount={selectedIds.length}
        recordName={recordToDelete ? `${recordToDelete.rank} / ${recordToDelete.name}` : ''}
        recordUnit={recordToDelete?.unit || 'اللواء 43 عمالقة'}
        recordType={recordToDelete ? recordToDelete.type : ''}
      />
    </div>
  );
}
