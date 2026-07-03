/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Clock,
  CalendarDays,
  Gauge,
  Percent,
  ListFilter,
  Stethoscope,
  Info
} from 'lucide-react';
import { LeaveRecord, DiagnosisStats } from '../types';

interface AnalyticsProps {
  records: LeaveRecord[];
}

export default function Analytics({ records }: AnalyticsProps) {
  // Helper for duration
  const getDurationDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    const diffTime = e.getTime() - s.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // 1. Core Analytics Calculations
  const metrics = useMemo(() => {
    if (records.length === 0) {
      return {
        avgDuration: 0,
        longestLeave: 0,
        shortestLeave: 0,
        patientPercentage: 0,
        totalPatients: 0
      };
    }

    const durations = records.map((r) => getDurationDays(r.startDate, r.endDate));
    const totalDuration = durations.reduce((acc, curr) => acc + curr, 0);
    const avgDuration = Number((totalDuration / records.length).toFixed(1));
    const longestLeave = Math.max(...durations);
    const shortestLeave = Math.min(...durations);

    const totalPatients = records.filter((r) => r.type === 'مريض').length;
    const patientPercentage = Number(((totalPatients / records.length) * 100).toFixed(1));

    return {
      avgDuration,
      longestLeave,
      shortestLeave,
      patientPercentage,
      totalPatients
    };
  }, [records]);

  // 2. Diagnosis Table Aggregate Calculations
  const diagnosisStatsList = useMemo((): DiagnosisStats[] => {
    const grouped: Record<string, { count: number; totalDuration: number }> = {};

    records.forEach((r) => {
      const d = r.diagnosis.trim();
      const dur = getDurationDays(r.startDate, r.endDate);

      if (!grouped[d]) {
        grouped[d] = { count: 0, totalDuration: 0 };
      }
      grouped[d].count++;
      grouped[d].totalDuration += dur;
    });

    return Object.entries(grouped)
      .map(([diagnosis, data]) => ({
        diagnosis,
        count: data.count,
        avgDuration: Number((data.totalDuration / data.count).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count); // Sorted by frequency of diagnosis
  }, [records]);

  // Framer motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="space-y-5 md:space-y-8 text-right">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 p-4 md:p-6 rounded-2xl border border-slate-800 dark:border-slate-900 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-1.5 flex items-center justify-start gap-2">
          <Gauge className="text-amber-500 w-5 h-5" />
          <span>المؤشرات والتحليلات العميقة للغرض الطبي</span>
        </h2>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          تعرض هذه الصفحة تحليلاً مجمعاً ومؤشرات دقيقة حول مديات الإجازات الطبية ونسبة توزيعها، بالإضافة إلى تفصيل شامل لكل تشخيص طبي مع مكرراته ومتوسطات الأيام لتتبع الكفاءة الصحية لأفراد اللواء.
        </p>
      </div>

      {/* 4 Stat metrics Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {/* Avg Duration */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 p-4.5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">متوسط مدة الإجازة</span>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans">
                {metrics.avgDuration} <span className="text-xs font-medium text-slate-400">أيام</span>
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 leading-normal">
            معدل الأيام الممنوحة في الإجازة الواحدة
          </p>
        </motion.div>

        {/* Longest Leave */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 p-4.5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">أطول إجازة مرضية</span>
              <h3 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-sans">
                {metrics.longestLeave} <span className="text-xs font-medium text-slate-400">يوم</span>
              </h3>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 leading-normal">
            الحد الأقصى للإجازات المسجلة بقاعدة البيانات
          </p>
        </motion.div>

        {/* Shortest Leave */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 p-4.5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">أقصر إجازة مرضية</span>
              <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-sans">
                {metrics.shortestLeave} <span className="text-xs font-medium text-slate-400">أيام</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 leading-normal">
            الحد الأدنى للإجازات المسجلة كحالات عارضة
          </p>
        </motion.div>

        {/* Percentage of patients */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 p-4.5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">نسبة الحالات المرضية</span>
              <h3 className="text-3xl font-extrabold text-amber-500 dark:text-amber-400 font-sans">
                {metrics.patientPercentage}%
              </h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400 rounded-xl">
              <Percent className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${metrics.patientPercentage}%` }}
              />
            </div>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5">
              {metrics.totalPatients} حالة مرض من إجمالي {records.length} إجازات
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Aggregate Diagnosis table details */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-xl font-medium font-sans">
            إجمالي التشخيصات الفرعية الفريدة: <span className="font-bold text-slate-850 dark:text-white">{diagnosisStatsList.length}</span>
          </div>
          <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-indigo-500" />
            <span>تقرير تكرار التشخيص الطبي ومتوسط المدد بالأيام</span>
          </h3>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold font-sans select-none">
                <th className="py-4 px-6 w-16 text-center">الرقم</th>
                <th className="py-4 px-6">التشخيص الطبي</th>
                <th className="py-4 px-6 text-center w-40">عدد الحالات المتأثرة</th>
                <th className="py-4 px-6 text-center w-52">متوسط مدة الإجازة (أيام)</th>
                <th className="py-4 px-6 text-center w-48">كثافة التأثير</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {diagnosisStatsList.length > 0 ? (
                diagnosisStatsList.map((stat, idx) => {
                  // Calculate dynamic percentage of total cases for this diagnosis
                  const percentageOfTotal = records.length ? ((stat.count / records.length) * 100).toFixed(0) : '0';

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors text-xs text-slate-700 dark:text-slate-300"
                    >
                      <td className="py-3.5 px-6 text-center font-bold text-slate-400 font-sans">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2.5 justify-start">
                          <span className="p-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded">
                            <Stethoscope className="w-3.5 h-3.5" />
                          </span>
                          <span>{stat.diagnosis}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-center font-extrabold text-slate-900 dark:text-white font-sans bg-slate-50/20 dark:bg-slate-800/5">
                        {stat.count}
                      </td>
                      <td className="py-3.5 px-6 text-center font-extrabold text-indigo-600 dark:text-indigo-400 font-sans">
                        {stat.avgDuration} يوم
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-[10px] text-slate-400 font-sans font-medium w-8 text-left">
                            {percentageOfTotal}%
                          </span>
                          <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden shrink-0">
                            <div
                              className="bg-indigo-500 h-1.5 rounded-full"
                              style={{ width: `${percentageOfTotal}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <p className="font-medium">لم يتم العثور على أي سجلات لحساب مؤشرات التشخيصات الطبية.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Diagnosis Analytics cards */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
          {diagnosisStatsList.length > 0 ? (
            diagnosisStatsList.map((stat, idx) => {
              const percentageOfTotal = records.length ? ((stat.count / records.length) * 100).toFixed(0) : '0';

              return (
                <div key={idx} className="p-5 space-y-4 text-right">
                  {/* Card Header: rank index + Diagnosis name */}
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-xs font-bold font-sans shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex items-start gap-2.5">
                      <span className="p-1 bg-indigo-500/10 text-indigo-500 rounded mt-0.5 shrink-0">
                        <Stethoscope className="w-4 h-4" />
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                        {stat.diagnosis}
                      </h4>
                    </div>
                  </div>

                  {/* Grid for values */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/60 flex flex-col justify-center">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">عدد الحالات</span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white font-sans">
                        {stat.count} <span className="text-[10px] font-medium text-slate-400">أفراد</span>
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/60 flex flex-col justify-center">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5 font-sans">متوسط المدة</span>
                      <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-sans">
                        {stat.avgDuration} <span className="text-[10px] font-medium text-slate-400">أيام</span>
                      </span>
                    </div>
                  </div>

                  {/* Impact percentage bar */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-150 dark:border-slate-800/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">كثافة التأثير الإجمالي</span>
                      <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 font-sans">
                        {percentageOfTotal}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{ width: `${percentageOfTotal}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <p className="font-medium text-xs">لم يتم العثور على أي سجلات لحساب مؤشرات التشخيصات.</p>
            </div>
          )}
        </div>

        {/* Informative Tip */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-850 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-start gap-2 leading-relaxed">
          <Info className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
          <span>
            يتم حساب متوسط المدد وصيغ كثافة التأثير بشكل آلي من قاعدة بيانات IndexedDB فور أي إدخال أو تعديل في تواريخ الإجازات المرضية.
          </span>
        </div>
      </div>
    </div>
  );
}
