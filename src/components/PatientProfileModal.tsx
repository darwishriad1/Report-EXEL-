/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  X,
  User,
  Shield,
  HeartPulse,
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { LeaveRecord } from '../types';

interface PatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string | null;
  allRecords: LeaveRecord[];
  onViewHistory?: (record: LeaveRecord) => void;
}

// Pure Helpers
const getDurationDays = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  const diffTime = e.getTime() - s.getTime();
  if (diffTime < 0) return 0;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const formatDateToDMY = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
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

export default function PatientProfileModal({
  isOpen,
  onClose,
  memberName,
  allRecords,
  onViewHistory
}: PatientProfileModalProps) {
  
  // 1. Filter records for the selected member
  const memberRecords = useMemo(() => {
    if (!memberName) return [];
    const searchName = memberName.trim().toLowerCase();
    return allRecords.filter((r) => r.name.trim().toLowerCase() === searchName);
  }, [allRecords, memberName]);

  // 2. Compute detailed statistics & health insights
  const memberStats = useMemo(() => {
    if (memberRecords.length === 0) return null;

    // Sort chronologically (oldest first for overlap detection)
    const sorted = [...memberRecords].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

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

    return {
      total: sorted.length,
      totalDays,
      activeCount,
      avgDays: (totalDays / sorted.length).toFixed(1),
      typesCount,
      overlaps,
      frequentDiags,
      monthsCount,
      sortedChronologically: [...sorted].reverse() // newest first for history view
    };
  }, [memberRecords]);

  if (!isOpen || !memberName || !memberStats) return null;

  // Animation variants
  const modalVariants = {
    hidden: { opacity: 0, y: 100 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', damping: 25, stiffness: 350 } 
    },
    exit: { opacity: 0, y: 100 }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full md:max-w-3xl h-[85vh] md:h-auto md:max-h-[85vh] overflow-hidden flex flex-col fixed bottom-0 left-0 right-0 md:relative z-50 text-right font-sans"
      >
        {/* Mobile Drag Indicator */}
        <div className="md:hidden flex justify-center py-3 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/40">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-150 dark:border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <HeartPulse className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-right">
              <h4 className="text-md font-bold text-slate-900 dark:text-white leading-tight">
                الملف الصحي وسجل الإجازات التاريخي
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                تفاصيل الحالات والتشخيصات التراكمية للمنتسب
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body with Scroll */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-700 dark:text-slate-300 text-sm">
          
          {/* 1. Personal Header Info Banner */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="absolute top-0 left-0 translate-y-[-20%] translate-x-[-20%] text-slate-200 dark:text-slate-800/40 select-none pointer-events-none">
              <User className="w-40 h-40 opacity-10" />
            </div>
            
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-slate-950 text-[10px] px-2 py-0.5 rounded font-black">
                  {memberRecords[0]?.rank || 'منتسب'}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {memberName}
                </h3>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>الوحدة العسكرية:</span>
                <span className="font-bold text-slate-600 dark:text-slate-300">{memberRecords[0]?.unit || 'غير محدد'}</span>
              </p>
            </div>

            <div className="text-right z-10 border-t md:border-t-0 md:border-r border-slate-200 dark:border-slate-800 pt-3 md:pt-0 md:pr-6 shrink-0 font-sans">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                <span className="font-bold text-slate-500">الحالة الطبية الحالية:</span>
                <span className="font-black text-slate-800 dark:text-slate-200">
                  {memberStats.activeCount > 0 ? (
                    <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md text-[10px] font-black border border-emerald-500/20">نشط في إجازة حالياً</span>
                  ) : (
                    <span className="text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px] border border-slate-200/50 dark:border-slate-800">لا يوجد إجازة نشطة</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Key Statistics Grid (Bento style) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 font-sans">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-3 shadow-sm">
              <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">عدد الإجازات</span>
                <span className="text-base font-black text-slate-800 dark:text-white font-mono">{memberStats.total}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-3 shadow-sm">
              <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-lg shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">مجموع الأيام</span>
                <span className="text-base font-black text-slate-800 dark:text-white font-mono">{memberStats.totalDays} يوم</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-3 shadow-sm">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-lg shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">متوسط المدة</span>
                <span className="text-base font-black text-slate-800 dark:text-white font-mono">{memberStats.avgDays} أيام</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-3 shadow-sm">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">توزع الأشهر</span>
                <span className="text-xs font-black text-slate-800 dark:text-white leading-tight">
                  {Object.keys(memberStats.monthsCount).length} أشهر مختلفة
                </span>
              </div>
            </div>
          </div>

          {/* 3. Annual Monthly Analytics and Heatmap */}
          <div className="bg-slate-50/65 dark:bg-slate-800/10 border border-slate-200/80 dark:border-slate-850 p-5 rounded-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-2.5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-amber-500" />
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                  تحليل الوضع الصحي السنوي وتواتر الإجازات
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                مخطط التكرار السنوي حسب أشهر السنة
              </span>
            </div>

            {/* Severity status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400">مؤشر وتيرة التكرار المرضي:</span>
                  {memberStats.total >= 4 || memberStats.overlaps.length > 0 || memberStats.frequentDiags.length > 0 ? (
                    <span className="text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full text-[10px] font-black border border-rose-500/10">متابعة حثيثة (مستوى مرتفع) ⚠️</span>
                  ) : memberStats.total >= 2 ? (
                    <span className="text-amber-600 dark:text-amber-450 bg-amber-500/10 px-2 py-0.5 rounded-full text-[10px] font-black border border-amber-500/10">مراقبة دورية (مستوى متوسط) ⏳</span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] font-black border border-emerald-500/10">حالة مستقرة (مستوى منخفض) ✅</span>
                  )}
                </div>

                {/* Slider */}
                <div className="relative pt-1">
                  <div className="overflow-hidden h-1.5 text-xs flex rounded bg-slate-100 dark:bg-slate-800">
                    <div 
                      style={{ width: `${Math.min((memberStats.total / 6) * 100, 100)}%` }} 
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                        memberStats.total >= 4 || memberStats.overlaps.length > 0 || memberStats.frequentDiags.length > 0
                          ? 'bg-rose-500' 
                          : memberStats.total >= 2 
                          ? 'bg-amber-500' 
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1.5 font-bold">
                    <span>مستقرة (1)</span>
                    <span>مراقبة (2-3)</span>
                    <span>حرجة / متكررة (+4)</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-150/40 dark:border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">معدل التغيب الطبي</span>
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                  <span className="text-base font-black text-amber-500 font-mono">
                    {((memberStats.totalDays / 365) * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-450 font-normal mr-1">من أيام السنة</span>
                </p>
              </div>
            </div>

            {/* 12-Month Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">سجل الإجازات التفصيلي مفرداً لكل شهر:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {[
                  { name: 'يناير', code: '01' },
                  { name: 'فبراير', code: '02' },
                  { name: 'مارس', code: '03' },
                  { name: 'أبريل', code: '04' },
                  { name: 'مايو', code: '05' },
                  { name: 'يونيو', code: '06' },
                  { name: 'يوليو', code: '07' },
                  { name: 'أغسطس', code: '08' },
                  { name: 'سبتمبر', code: '09' },
                  { name: 'أكتوبر', code: '10' },
                  { name: 'نوفمبر', code: '11' },
                  { name: 'ديسمبر', code: '12' }
                ].map((m) => {
                  const leavesInMonth = memberRecords.filter((r) => {
                    if (!r.startDate) return false;
                    const monthPart = r.startDate.substring(5, 7);
                    return monthPart === m.code;
                  });

                  const leaveCount = leavesInMonth.length;
                  const totalDaysInMonth = leavesInMonth.reduce((sum, r) => sum + getDurationDays(r.startDate, r.endDate), 0);

                  let monthStyle = 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/45 text-slate-400';
                  let badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-400';

                  if (leaveCount > 1) {
                    monthStyle = 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/30 dark:border-rose-500/20 text-rose-800 dark:text-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.05)] ring-1 ring-rose-500/20';
                    badgeStyle = 'bg-rose-500 text-white font-black';
                  } else if (leaveCount === 1) {
                    monthStyle = 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30 dark:border-amber-500/20 text-slate-800 dark:text-amber-450';
                    badgeStyle = 'bg-amber-500 text-slate-950 font-black';
                  }

                  return (
                    <div 
                      key={m.code} 
                      className={`border p-2.5 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] ${monthStyle}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{m.name}</span>
                        {leaveCount > 0 ? (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${badgeStyle}`}>
                            {leaveCount} إجازة
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-300 dark:text-slate-700 font-normal">سليم</span>
                        )}
                      </div>

                      {leaveCount > 0 ? (
                        <div className="mt-2 space-y-1 text-right">
                          <span className="text-[9px] font-mono block text-slate-500 dark:text-slate-400 leading-tight">
                            ⏱️ المجموع: {totalDaysInMonth} أيام
                          </span>
                          {leaveCount > 1 && (
                            <span className="text-[8px] font-extrabold text-rose-500 block leading-none">
                              تكرار حرج ⚠️
                            </span>
                          )}
                          <div className="flex flex-wrap gap-1 mt-1 max-h-8 overflow-hidden">
                            {leavesInMonth.map((l, li) => (
                              <span key={li} className="text-[7px] font-black px-1 py-0.2 bg-slate-200/50 dark:bg-slate-800 rounded text-slate-650 dark:text-slate-300 truncate max-w-[50px]">
                                {l.type === 'مريض' ? '🩺' : l.type === 'حادث' ? '🚨' : '👥'} {l.diagnosis || l.type}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 h-5 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Alerts and Diagnostics check */}
          {(memberStats.overlaps.length > 0 || memberStats.frequentDiags.length > 0) && (
            <div className="space-y-3.5">
              
              {/* Overlaps warning */}
              {memberStats.overlaps.length > 0 && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/30 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <h4 className="font-bold text-xs">تنبيه حرج: تم رصد تداخل في تواريخ الإجازات!</h4>
                  </div>
                  <p className="text-[11px] text-rose-600 dark:text-rose-450 leading-relaxed">
                    هناك فترات متقاطعة بين الإجازات المسجلة لهذا المنتسب، يرجى مراجعة التواريخ المدرجة لتجنب الازدواجية:
                  </p>
                  <div className="space-y-1 pl-1">
                    {memberStats.overlaps.map((ov, i) => (
                      <div key={i} className="text-[10px] text-rose-700 dark:text-rose-400 bg-rose-500/5 dark:bg-rose-500/10 px-2.5 py-1.5 rounded border border-rose-200/30 dark:border-rose-900/20 flex flex-wrap items-center justify-between gap-2">
                        <span>• تداخل الإجازة ({ov.r1.type}) مع الإجازة ({ov.r2.type})</span>
                        <span className="font-mono font-bold">{ov.range1} ⇄ {ov.range2}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Frequent / Repeated Diagnosis Analysis */}
              {memberStats.frequentDiags.length > 0 && (
                <div className="bg-amber-50/60 dark:bg-amber-950/10 border border-amber-150 dark:border-amber-900/20 p-4 rounded-xl space-y-2 font-sans">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Activity className="w-5 h-5 shrink-0" />
                    <h4 className="font-bold text-xs">تحليل تكرار التشخيصات الطبية (إجازة متكررة):</h4>
                  </div>
                  <p className="text-[11px] text-amber-600 dark:text-amber-450 leading-relaxed">
                    تم الكشف عن تشخيصات طبية متكررة لنفس المنتسب في سجلات مختلفة، مما قد يشير إلى حالة مزمنة أو إصابة مستمرة:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {memberStats.frequentDiags.map((fd, i) => (
                      <div key={i} className="bg-amber-500/5 dark:bg-amber-500/10 p-2.5 rounded-lg border border-amber-200/30 dark:border-amber-900/20 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-amber-300">"{fd.diagnosis}"</span>
                        <span className="bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-md font-black text-[10px] font-mono">
                          تكرر {fd.count} مرات
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 5. Complete Leave Timeline History */}
          <div className="space-y-3.5">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Calendar className="w-4.5 h-4.5 text-amber-500" />
              <span>السجل التاريخي للإجازات ({memberStats.total} إجازة)</span>
            </h4>

            <div className="space-y-3">
              {memberStats.sortedChronologically.map((rec) => {
                const duration = getDurationDays(rec.startDate, rec.endDate);
                const status = getLeaveStatus(rec.startDate, rec.endDate);
                const typeClass = getLeaveTypeBadgeClass(rec.type);

                return (
                  <div 
                    key={rec.id} 
                    className="bg-slate-50/50 dark:bg-slate-800/10 hover:bg-slate-50 dark:hover:bg-slate-800/30 border border-slate-150 dark:border-slate-800/60 p-4 rounded-xl space-y-3 transition-all text-right"
                  >
                    {/* Leave Card Header */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-lg font-bold border text-[10px] ${typeClass}`}>
                            {rec.type}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200/55 dark:border-slate-800/80">
                            {formatDateToDMY(rec.startDate)} ◀ {formatDateToDMY(rec.endDate)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans mt-1">
                          المدة الكلية: <span className="font-extrabold text-slate-800 dark:text-slate-250 font-mono">{duration}</span> يوماً
                        </p>
                      </div>

                      <div className="shrink-0 font-sans">
                        {status === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>نشط حالياً</span>
                          </span>
                        )}
                        {status === 'upcoming' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <span>مجدولة مستقبلاً</span>
                          </span>
                        )}
                        {status === 'ended' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-slate-800/80">
                            <span>منتهية</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Leave Details Block */}
                    <div className="bg-white dark:bg-slate-900/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800/40 space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">التشخيص الطبي والتقرير المعتمد:</span>
                        <p className="font-sans font-bold text-slate-800 dark:text-slate-100 text-xs mt-0.5">{rec.diagnosis}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-50 dark:border-slate-800/20 text-slate-450">
                        <p>
                          <span className="text-slate-400">الجهة المصدرة:</span> <span className="font-semibold text-slate-600 dark:text-slate-300">{rec.issuer || 'غير محدد'}</span>
                        </p>
                        {rec.notes && (
                          <p className="col-span-1 sm:col-span-2">
                            <span className="text-slate-400">الملاحظات:</span> <span className="italic text-slate-500 dark:text-slate-400">{rec.notes}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action tracking indicator */}
                    {rec.history && rec.history.length > 0 && onViewHistory && (
                      <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-100/40 dark:bg-slate-850/20 px-2.5 py-1.5 rounded-md border border-slate-150/40 dark:border-slate-800/40 font-sans">
                        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>يحتوي على تعديلات أو تمديدات سابقة</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onViewHistory(rec)}
                          className="text-amber-500 hover:text-amber-600 font-bold cursor-pointer"
                        >
                          تتبع العمليات ◀
                        </button>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-650 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md select-none font-sans"
          >
            إغلاق الملف الطبي
          </button>
        </div>
      </motion.div>
    </div>
  );
}
