/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import {
  Users,
  HeartPulse,
  UserCheck,
  Stethoscope,
  TrendingUp,
  Activity,
  AlertTriangle,
  CalendarDays,
  ShieldAlert,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  ChevronLeft,
  Calculator,
  RotateCcw,
  BookOpen,
  Info,
  UserPlus
} from 'lucide-react';
import { LeaveRecord } from '../types';

interface DashboardProps {
  records: LeaveRecord[];
}

const RECOVERY_GUIDE = [
  { disease: 'كسر العظام الطويلة (ساق/فخذ)', category: 'عظام', period: '45 - 90 يوماً', advice: 'يتطلب تجبيس وتثبيت طبي كامل مع علاج طبيعي مكثف بعد إزالة الجبس والتحقق بالأشعة.' },
  { disease: 'إصابة بطلق ناري أو شظايا (سطحية)', category: 'جراحة', period: '15 - 30 يوماً', advice: 'غيار يومي وتطهير لمنع الالتهاب البكتيري، مع راحة تامة ومضادات حيوية مناسبة.' },
  { disease: 'إصابة بطلق ناري أو شظايا (عميقة/عملية)', category: 'جراحة', period: '60 - 120 يوماً', advice: 'تستدعي جراحة لاستخراج المقذوف/الشظايا ومتابعة التئام الأنسجة والعضلات المصابة.' },
  { disease: 'عملية جراحية كبرى (استئصال/رتق عضلات)', category: 'جراحة', period: '30 - 60 يوماً', advice: 'راحة تامة وتجنب حمل الأوزان الثقيلة لمنع الفتق الجراحي والتئام تام للجدار.' },
  { disease: 'عملية جراحية صغرى (الزائدة/الفتق)', category: 'جراحة', period: '15 - 30 يوماً', advice: 'راحة نسبية مع العودة التدريجية للحركة الخفيفة والمشي لمنع الجلطات.' },
  { disease: 'حمى الضنك أو الملاريا الحادة', category: 'باطنية', period: '7 - 14 يوماً', advice: 'راحة تامة بالسرير، إماهة مستمرة بالسوائل والمغذيات، ومتابعة نسبة الصفائح الدموية.' },
  { disease: 'التهاب رئوي حاد أو حمى شديدة', category: 'باطنية', period: '7 - 10 أيام', advice: 'استخدام موسعات الشعب الهوائية، المضادات الحيوية تحت الإشراف، والراحة في بيئة دافئة.' },
  { disease: 'كسر اليد أو التواء المفاصل الحاد', category: 'عظام', period: '21 - 45 يوماً', advice: 'رباط ضاغط أو جبيرة خفيفة مع تجنب الضغط الميكانيكي على الطرف المصاب لضمان التئام الأربطة.' },
];

export default function Dashboard({ records }: DashboardProps) {
  // Today's date reference
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // 1. Calculations for Core Metrics
  const totalLeaves = records.length;

  const activeLeavesList = useMemo(() => {
    return records.filter((r) => r.startDate <= todayStr && r.endDate >= todayStr);
  }, [records, todayStr]);

  const activeLeavesCount = activeLeavesList.length;

  const totalPatients = useMemo(() => {
    return records.filter((r) => r.type === 'مريض').length;
  }, [records]);

  const totalEscorts = useMemo(() => {
    return records.filter((r) => r.type === 'مرافق').length;
  }, [records]);

  // Critical/Accident leaves
  const criticalLeavesCount = useMemo(() => {
    return records.filter((r) => {
      const diag = r.diagnosis.toLowerCase();
      return r.type === 'حادث' || diag.includes('حادث') || diag.includes('كسر') || diag.includes('عملية') || diag.includes('شظايا');
    }).length;
  }, [records]);

  // Nominal brigade strength state for Combat Readiness calculation
  const [nominalStrength, setNominalStrength] = useState<number>(1200);

  // Calculate medical readiness (percent of brigade NOT currently on active sick leave)
  const medicalReadinessRate = useMemo(() => {
    if (nominalStrength <= 0) return 100;
    const activeSickRatio = (activeLeavesCount / nominalStrength) * 100;
    const readiness = 100 - activeSickRatio;
    return Math.max(0, Math.min(100, Number(readiness.toFixed(1))));
  }, [activeLeavesCount, nominalStrength]);

  // 2. Calculations for Case Type distribution (Doughnut Chart)
  const pieData = useMemo(() => {
    const types: Record<string, number> = {
      'مريض': 0,
      'مرافق': 0,
      'مرض قريب': 0,
      'حادث': 0,
    };
    records.forEach((r) => {
      if (types[r.type] !== undefined) {
        types[r.type]++;
      }
    });

    return [
      { name: 'مريض', value: types['مريض'], color: '#ef4444' }, // Red-500
      { name: 'مرافق', value: types['مرافق'], color: '#f59e0b' }, // Amber-500
      { name: 'مرض قريب', value: types['مرض قريب'], color: '#10b981' }, // Emerald-500
      { name: 'حادث', value: types['حادث'], color: '#6366f1' }, // Indigo-500
    ];
  }, [records]);

  const hasPieData = useMemo(() => {
    return pieData.some((d) => d.value > 0);
  }, [pieData]);

  // Top Diagnoses (Bar Chart)
  const barData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const d = r.diagnosis.trim();
      counts[d] = (counts[d] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [records]);

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1'];

  // 3. Upcoming Returns Hub (Ends in next 7 days, or recently ended)
  const upcomingReturns = useMemo(() => {
    const today = new Date(todayStr);
    return records
      .filter((r) => {
        const end = new Date(r.endDate);
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // Leaves ending soon (between 0 and 7 days from now) or recently ended (last 2 days)
        return diffDays >= -2 && diffDays <= 7;
      })
      .map((r) => {
        const end = new Date(r.endDate);
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...r,
          daysRemaining: diffDays,
        };
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [records, todayStr]);

  // 4. Leave Calculator State
  const [calcStartDate, setCalcStartDate] = useState<string>(todayStr);
  const [calcDuration, setCalcDuration] = useState<number>(15);
  const calculatedEndDate = useMemo(() => {
    if (!calcStartDate || calcDuration <= 0) return '';
    const start = new Date(calcStartDate);
    start.setDate(start.getDate() + calcDuration - 1);
    return start.toISOString().split('T')[0];
  }, [calcStartDate, calcDuration]);

  // Format Date to Beautiful Arabic String
  const formatArabicFullDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('ar-YE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 5. Unit breakdown stats
  const unitBreakdown = useMemo(() => {
    const counts: Record<string, { total: number; active: number }> = {};
    records.forEach((r) => {
      const u = r.unit || 'قيادة اللواء';
      if (!counts[u]) {
        counts[u] = { total: 0, active: 0 };
      }
      counts[u].total++;
      if (r.startDate <= todayStr && r.endDate >= todayStr) {
        counts[u].active++;
      }
    });

    return Object.entries(counts)
      .map(([name, data]) => ({
        name,
        total: data.total,
        active: data.active,
      }))
      .sort((a, b) => b.active - a.active)
      .slice(0, 4);
  }, [records, todayStr]);

  // 6. Recovery Guide Search State
  const [guideSearch, setGuideSearch] = useState('');
  const filteredGuide = useMemo(() => {
    if (!guideSearch.trim()) return RECOVERY_GUIDE;
    return RECOVERY_GUIDE.filter(
      (item) =>
        item.disease.includes(guideSearch) ||
        item.category.includes(guideSearch) ||
        item.advice.includes(guideSearch)
    );
  }, [guideSearch]);

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <div className="space-y-6 md:space-y-8 text-right">
      {/* 1. Welcome and General Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-indigo-950/70 dark:to-slate-950 p-5 md:p-6 rounded-2xl border border-slate-800 dark:border-indigo-900/40 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        {/* Decorative ambient gradient circle */}
        <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-50px] right-[-50px] w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              نظام موحد ومحمي
            </span>
            <span className="text-emerald-500 flex items-center gap-1 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              قاعدة البيانات المحلية آمنة
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Activity className="text-amber-500 w-6 h-6 animate-pulse shrink-0" />
            <span>لوحة المتابعة الإحصائية والجاهزية الطبية</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            مرحباً بك في مركز إدارة الشؤون الطبية العسكرية للواء 43 عمالقة. تعرض هذه المنصة تحليلات تفصيلية، مؤشرات استشفاء فورية، ومستوى الجاهزية التشغيلية للحد من غيابات الأفراد وتتبع الحالات بكفاءة تامة.
          </p>
        </div>

        <div className="bg-slate-800/80 dark:bg-slate-900/60 px-4 py-3 rounded-xl border border-slate-700/50 dark:border-slate-800/60 text-right shrink-0 relative z-10">
          <span className="text-[10px] text-slate-400 block font-bold mb-1">التقويم العسكري المصدق</span>
          <span className="text-xs font-mono font-bold text-amber-500 block">
            {new Date().toLocaleDateString('ar-YE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <span className="text-[9px] text-slate-500 block mt-1">توقيت مكة المكرمة المعتمد</span>
        </div>
      </div>

      {/* 2. Interactive KPI Stats Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
      >
        {/* Total Leaves Registered */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all group relative overflow-hidden text-right"
        >
          <div className="absolute top-0 right-0 w-1.5 h-full bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400 transition-colors" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">إجمالي سجلات الإجازة</span>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white font-sans">{totalLeaves}</h3>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 rounded-xl">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40 text-[10px] text-slate-400">
            <span>تراكمي جميع الحالات</span>
            <span className="font-bold text-slate-600 dark:text-slate-300">مريض ومرافق</span>
          </div>
        </motion.div>

        {/* Active Leaves Right Now */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all group relative overflow-hidden text-right"
        >
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500 group-hover:bg-emerald-600 transition-colors" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">الحالات النشطة (حالياً بالمنزل)</span>
              <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-sans">{activeLeavesCount}</h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <HeartPulse className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${totalLeaves > 0 ? (activeLeavesCount / totalLeaves) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-400">
              <span>نسبة من إجمالي السجلات:</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {totalLeaves > 0 ? ((activeLeavesCount / totalLeaves) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Critical, Trauma and Accidents */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all group relative overflow-hidden text-right"
        >
          <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500 group-hover:bg-rose-600 transition-colors" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">حالات طارئة وإصابات عمل</span>
              <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 font-sans">{criticalLeavesCount}</h3>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40 text-[10px] text-slate-400">
            <span>تشخيصات حوادث/كسور/عمليات</span>
            <span className="font-bold text-rose-500">{totalLeaves > 0 ? ((criticalLeavesCount / totalLeaves) * 100).toFixed(0) : 0}% من القوة</span>
          </div>
        </motion.div>

        {/* Dynamic Combat Readiness Index */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all group relative overflow-hidden text-right"
        >
          <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-500 group-hover:bg-indigo-600 transition-colors" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">جاهزية القوة البشرية الطبية</span>
              <h3 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-sans">
                {medicalReadinessRate}%
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full transition-all duration-500"
                style={{ width: `${medicalReadinessRate}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400">
              <span>القوام الإجمالي الفعلي المعتمد:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{nominalStrength} فرد</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* 3. Additional Services Row: Readiness Configuration & Duty Return Early Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Widget A: Force Strength & Readiness Adjuster (Col Span 1) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between text-right">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="text-amber-500 w-4 h-4" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">أداة محاكاة جاهزية اللواء القتالية</h3>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed mb-4">
              اضبط القوام الإجمالي لمنتسبي اللواء بالأسفل لحساب الجاهزية الطبية الحقيقية باستبعاد المجازين طبياً حالياً.
            </p>

            {/* Slider / Range picker for nominal Strength */}
            <div className="space-y-4 my-5 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-150 dark:border-slate-800/40">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">قوام اللواء الاسمي</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold font-mono text-sm bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded">
                  {nominalStrength} فرد
                </span>
              </div>
              
              <input
                type="range"
                min="300"
                max="3000"
                step="50"
                value={nominalStrength}
                onChange={(e) => setNominalStrength(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                <span>300 فرد (حد أدنى)</span>
                <span>3000 فرد (لواء كامل)</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/20 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-semibold">المتواجدون بالخدمة حالياً:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {Math.max(0, nominalStrength - activeLeavesCount)} فرد
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-semibold">قيد الاستشفاء والغياب:</span>
              <span className="font-bold text-rose-500 font-mono">
                {activeLeavesCount} فرد
              </span>
            </div>
          </div>
        </div>

        {/* Widget B: Duty Return & Early Alarms Hub (Col Span 2) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm lg:col-span-2 flex flex-col justify-between text-right">
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="text-indigo-500 w-5 h-5 shrink-0" />
                <h3 className="font-bold text-slate-900 dark:text-white text-md">
                  مركز الإنذار والعودة المباشرة للخدمة
                </h3>
              </div>
              <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold">
                أفراد تنتهي إجازاتهم قريباً
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-4">
              قائمة تفاعلية بالجنود والضباط الذين تنتهي إجازاتهم الطبية خلال الأيام القادمة للمتابعة الهاتفية والتأكد من عودتهم للمعسكر والواجب.
            </p>
          </div>

          {/* List stage of upcoming returnees */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {upcomingReturns.length > 0 ? (
              upcomingReturns.map((r, index) => {
                const isOverdue = r.daysRemaining < 0;
                const isEndingToday = r.daysRemaining === 0;
                const isEndingTomorrow = r.daysRemaining === 1;

                let badgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                let badgeText = `متبقي ${r.daysRemaining} أيام`;

                if (isOverdue) {
                  badgeColor = 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-500/10';
                  badgeText = `انتهت منذ ${Math.abs(r.daysRemaining)} أيام ⚠️`;
                } else if (isEndingToday) {
                  badgeColor = 'bg-red-500 text-white animate-pulse';
                  badgeText = 'ينتهي اليوم عاجل 🚨';
                } else if (isEndingTomorrow) {
                  badgeColor = 'bg-amber-500 text-slate-950 font-bold';
                  badgeText = 'تنتهي غداً ⏳';
                }

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/70 dark:bg-slate-800/30 dark:hover:bg-slate-800/60 rounded-xl border border-slate-150 dark:border-slate-800/40 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 shrink-0">
                        {r.rank.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-850 dark:text-white flex items-center gap-1.5">
                          <span>{r.rank}</span> / <span>{r.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          الوحدة: {r.unit} | تاريخ الانتهاء: <span className="font-mono">{r.endDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-left">
                      <span className={`text-[10px] px-3 py-1.5 rounded-lg font-bold block ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <span>لا توجد أي إجازات تنتهي قريباً (خلال ٧ أيام)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Charts Section: Case Types (Pie) & Top 5 Diagnoses (Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Doughnut Chart: Distribution of cases by type (Col Span 2) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2 flex flex-col justify-between text-right">
          <div>
            <h3 className="text-md font-bold text-slate-850 dark:text-white mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>توزيع الإجازات حسب نوع الحالة</span>
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4">
              تصنيف نسبي للغرض الطبي الرئيسي من الإجازات المسجلة.
            </p>
          </div>

          <div className="h-56 flex items-center justify-center relative">
            {hasPieData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData
                      .filter((d) => d.value > 0)
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      direction: 'rtl',
                      textAlign: 'right',
                      borderRadius: '12px',
                      backgroundColor: '#1e293b',
                      color: '#fff',
                      border: 'none',
                      fontSize: '11px',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs flex flex-col items-center gap-2">
                <AlertTriangle className="w-8 h-8 text-slate-300" />
                <span>لا توجد بيانات كافية لعرض الرسم البياني الدائري</span>
              </div>
            )}

            {/* Inner Total count */}
            {hasPieData && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="text-2xl font-black text-slate-800 dark:text-white font-sans">{totalLeaves}</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">إجمالي الحالات</span>
              </div>
            )}
          </div>

          {/* Chart Legends */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4 text-right">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 justify-end">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">
                  {d.value} <span className="text-[10px] font-normal text-slate-400">حالة</span>
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{d.name}</span>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart: Most Common Diagnoses (Col Span 3) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-3 flex flex-col justify-between text-right">
          <div>
            <h3 className="text-md font-bold text-slate-850 dark:text-white mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>أكثر 5 تشخيصات طبية تكراراً باللواء</span>
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-6">
              تصنيف الحالات بناءً على عدد مرات تكرار التشخيص الطبي لتحديد المؤثر الأكبر.
            </p>
          </div>

          <div className="h-60">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={130}
                    style={{ fontSize: '11px', fill: '#64748b', fontWeight: 600, textAnchor: 'start' }}
                    tickFormatter={(value) => (value.length > 20 ? `${value.substring(0, 18)}...` : value)}
                    orientation="right"
                  />
                  <Tooltip
                    contentStyle={{
                      direction: 'rtl',
                      textAlign: 'right',
                      borderRadius: '12px',
                      backgroundColor: '#1e293b',
                      color: '#fff',
                      border: 'none',
                      fontSize: '11px',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#6366f1"
                    radius={[4, 0, 0, 4]}
                    barSize={14}
                  >
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs flex-col gap-2">
                <AlertTriangle className="w-8 h-8 text-slate-300" />
                <span>لا توجد بيانات كافية لعرض الرسم الشريطي للتشخيصات</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Smart Services: Leave Date Calculator & Standard Medical Recovery Lookup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Service 1: Smart Leave Date Calculator */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-right flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-amber-500 shrink-0" />
              <h3 className="font-bold text-slate-900 dark:text-white text-md">حاسبة التواريخ الطبية الذكية</h3>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-4">
              أدخل تاريخ البداية وعدد أيام الإجازة بالأسفل لحساب تاريخ الانتهاء الدقيق فوراً وصيغته المعتمدة للشؤون الطبية.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block">تاريخ بداية الإجازة</label>
                <input
                  type="date"
                  value={calcStartDate}
                  onChange={(e) => setCalcStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block">عدد الأيام المطلوبة</label>
                <input
                  type="number"
                  min="1"
                  max="360"
                  value={calcDuration}
                  onChange={(e) => setCalcDuration(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                />
              </div>
            </div>
          </div>

          <div className="bg-amber-500/5 dark:bg-amber-500/5 p-4 rounded-xl border border-amber-500/20 space-y-2">
            <div className="flex justify-between text-xs items-center">
              <span className="text-slate-400">تاريخ الانتهاء المحسوب:</span>
              <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm bg-amber-500/10 px-2 py-0.5 rounded">
                {calculatedEndDate}
              </span>
            </div>
            <div className="border-t border-amber-500/10 pt-2 text-[11px] text-slate-600 dark:text-slate-300">
              <p className="font-bold">تاريخ القفل والعودة للمعسكر:</p>
              <p className="text-xs text-slate-700 dark:text-slate-200 font-bold mt-1">
                {formatArabicFullDate(calculatedEndDate) || 'أدخل مدخلات صالحة'}
              </p>
            </div>
          </div>
        </div>

        {/* Service 2: Standard Medical Recovery Period Lookup */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-right flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500 shrink-0" />
                <h3 className="font-bold text-slate-900 dark:text-white text-md">دليل فترات الاستشفاء القياسية ومعاييرها</h3>
              </div>
              <span className="text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded font-bold">
                توجيهات الشؤون الطبية
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-4">
              ابحث عن أي مرض أو تشخيص طبي للاستعلام الفوري عن المدة الموصى بها طبياً وتوجيهات الاستشفاء القياسية.
            </p>

            {/* Search inputs */}
            <div className="relative mb-3">
              <input
                type="text"
                value={guideSearch}
                onChange={(e) => setGuideSearch(e.target.value)}
                placeholder="ابحث بالمرض (مثل: كسر، رصاصة، حمى)..."
                className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right"
              />
              <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-3" />
            </div>
          </div>

          {/* Guidelines scrolling list */}
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {filteredGuide.length > 0 ? (
              filteredGuide.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/50 rounded-lg text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-800 dark:text-white">{item.disease}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-sans">{item.period}</span>
                  </div>
                  <p className="text-slate-400 dark:text-slate-500 leading-relaxed text-[10px]">{item.advice}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-[10px] text-slate-400">
                لم نجد نتائج مطابقة لبحثك.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Operational Unit Sick Rate Breakdown & Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Unit Sick Rate (Col Span 3) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-3 text-right">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">معدل غياب القوة الطبية حسب الكتائب والوحدات</h3>
            <span className="text-[10px] text-slate-400 font-bold font-sans">أعلى 4 وحدات غياباً</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-5">
            يوضح إجمالي الحالات الطبية النشطة حالياً بكل كتيبة لقياس الجاهزية القتالية الميدانية لكل جزء من اللواء.
          </p>

          <div className="space-y-4">
            {unitBreakdown.length > 0 ? (
              unitBreakdown.map((unit, idx) => {
                // Calculate percentage relative to nominal strength or total leaves
                const percent = Math.min(100, (unit.active / Math.max(1, activeLeavesCount)) * 100);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{unit.name}</span>
                      <span className="font-bold font-mono text-slate-600 dark:text-indigo-400">
                        {unit.active} حالة نشطة <span className="text-[10px] text-slate-400 font-normal">/ {unit.total} إجمالي</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          idx === 0 ? 'bg-indigo-500' : idx === 1 ? 'bg-amber-500' : idx === 2 ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${percent || 5}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                لا توجد سجلات كافية لحساب نسب وحدات اللواء.
              </div>
            )}
          </div>
        </div>

        {/* Security / System Tip & Information Card (Col Span 2) */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/10 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2 flex flex-col justify-between text-right">
          <div className="space-y-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl w-fit">
              <Info className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider">الأمان والخصوصية العسكرية المطلقة</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              إن هذا النظام يعمل بشكل محلي بالكامل ومستقل عن أي خوادم خارجية، ولا يتم إرسال أي أسماء أو رتب أو معلومات طبية عسكرية عبر الإنترنت حفاظاً على سرية معلومات منتسبي اللواء 43 عمالقة وجاهزيته القتالية.
            </p>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-4 text-[10px] text-slate-400 leading-relaxed font-sans">
            يرجى تصدير نسخة احتياطية من تبويب "أدوات النظام" بشكل دوري لتجنب تلف قاعدة البيانات المحلية بمتصفحك.
          </div>
        </div>
      </div>
    </div>
  );
}
