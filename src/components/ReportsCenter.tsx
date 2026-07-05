/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  MapPin
} from 'lucide-react';
import { LeaveRecord } from '../types';

interface ReportsCenterProps {
  records: LeaveRecord[];
  triggerToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

type ReportType = 'summary' | 'monthly' | 'custom_ledger' | 'compliance' | 'medical';

export default function ReportsCenter({ records, triggerToast }: ReportsCenterProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('summary');
  
  // Custom states for Monthly Report
  const [selectedReportYear, setSelectedReportYear] = useState<string>('2026');
  const [selectedReportMonth, setSelectedReportMonth] = useState<string>('07');

  // Custom Filters for 'custom_ledger' and other reports
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedRank, setSelectedRank] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

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

  // Print current page / report
  const handlePrintReport = () => {
    window.print();
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
              <span>طباعة المستند</span>
            </button>
            <button
              onClick={() => {
                if (activeReport === 'compliance') {
                  handleExportToExcel('تقرير_متابعة_الاتصال_والالتزام_العسكري', complianceColumns, filteredRecords);
                } else if (activeReport === 'monthly') {
                  handleExportToExcel(`التقرير_الشهري_للإجازات_المرضية_شهر_${selectedReportMonth}_عام_${selectedReportYear}`, ledgerColumns, monthlyFilteredRecords);
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-right">
        {[
          { id: 'summary', label: 'التقرير الإحصائي العام', icon: TrendingUp, desc: 'تحليل توزيع الرتب والنوع والوحدات' },
          { id: 'monthly', label: 'التقرير الشهري للعمل', icon: CalendarRange, desc: 'تفصيل الإجازات وإحصائيات الشهر' },
          { id: 'custom_ledger', label: 'كشف مخصص مفصل', icon: FileSpreadsheet, desc: 'استخراج كشف دقيق وفلترة مرنة للبيانات' },
          { id: 'compliance', label: 'تقرير المتابعة والاتصال', icon: Users, desc: 'حالة تواصل المجندين والمتهربين' },
          { id: 'medical', label: 'تحليل الأوبئة والتشخيصات', icon: Activity, desc: 'التشخيصات الأكثر تكراراً والمشافي' }
        ].map((tab) => {
          const isSelected = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as ReportType)}
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
                  <span>تحديد فترة التقرير الشهري العسكري</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">
                  سيتم عرض كافة الإجازات الطبية التي بدأت خلال الشهر المحدد أدناه مع إحصائياتها.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Month Select */}
                <div className="space-y-1.5 min-w-[200px]">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">اختر الشهر</label>
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

                <div className="self-end pb-1 font-mono text-xs text-slate-500">
                  فترة الفلترة النشطة: <span className="font-bold text-amber-500">{selectedReportYear}-{selectedReportMonth}</span>
                </div>
              </div>
            </div>

            {/* Monthly Stats Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-right">
              {/* Stat 1: Month total */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 block">إجمالي إجازات الشهر</span>
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {monthlyFilteredRecords.length}
                  </span>
                </div>
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
              </div>

              {/* Stat 2: Avg duration */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 block">متوسط مدة الإجازة</span>
                  <span className="text-2xl font-black font-mono text-indigo-500">
                    {averageMonthlyDuration} <span className="text-xs font-bold text-slate-400">أيام</span>
                  </span>
                </div>
                <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              {/* Stat 3: Confirmed returning */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 block">تم التأكيد بالعودة</span>
                  <span className="text-2xl font-black font-mono text-emerald-500">
                    {monthlyFilteredRecords.filter(r => r.contactStatus === 'confirmed').length}
                  </span>
                </div>
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>

              {/* Stat 4: Evading list size */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 block">حالات التهرب المرصودة</span>
                  <span className="text-2xl font-black font-mono text-rose-500">
                    {monthlyFilteredRecords.filter(r => r.contactStatus === 'evading').length}
                  </span>
                </div>
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Monthly Leave Types distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Type summary pie equivalent */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 text-right shadow-sm lg:col-span-1">
                <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 justify-start border-b border-slate-100 dark:border-slate-850 pb-3">
                  <Activity className="w-4.5 h-4.5 text-amber-500" />
                  <span>توزيع تصنيف الإجازات المرضية هذا الشهر</span>
                </h3>
                
                <div className="space-y-3 pt-1">
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
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {monthlyFilteredRecords.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">لا توجد سجلات في هذا الشهر لحساب التوزيع</p>
                  )}
                </div>
              </div>

              {/* Monthly Details Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 text-right shadow-sm lg:col-span-2">
                <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 justify-start border-b border-slate-100 dark:border-slate-850 pb-3">
                  <FileText className="w-4.5 h-4.5 text-amber-500" />
                  <span>سجل كشف الإجازات التفصيلي لشهر {selectedReportMonth} لعام {selectedReportYear}</span>
                </h3>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-450 font-bold border-b border-slate-100 dark:border-slate-850">
                        <th className="py-2.5 px-3 text-center w-12">م</th>
                        <th className="py-2.5 px-3 text-right">الاسم والرتبة</th>
                        <th className="py-2.5 px-3 text-right">الوحدة</th>
                        <th className="py-2.5 px-3 text-right">نوع الإجازة</th>
                        <th className="py-2.5 px-3 text-center">الفترة الزمنية</th>
                        <th className="py-2.5 px-3 text-center">حالة الاتصال والامتثال</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyFilteredRecords.map((r, idx) => (
                        <tr key={r.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 font-medium">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-450">{idx + 1}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{r.name}</span>
                            <span className="text-[10px] text-slate-400 block">{r.rank}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">{r.unit || 'اللواء 43 عمالقة'}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {translateType(r.type)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-[10.5px] text-slate-500">
                            {r.startDate} إلى {r.endDate}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${getStatusColor(r.contactStatus)}`}>
                              {translateStatus(r.contactStatus)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {monthlyFilteredRecords.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            لا توجد أي إجازات مسجلة أو مضافة في هذا الشهر ({selectedReportMonth}-{selectedReportYear})
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
                      </tr>
                    ))}
                    {filteredRecords.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">لا توجد سجلات مطابقة لمعايير الفلترة المحددة</td>
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
                      </tr>
                    ))}
                    {filteredRecords.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">لا توجد سجلات لمتابعة الاتصال حالياً</td>
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

      </AnimatePresence>

    </div>
  );
}
