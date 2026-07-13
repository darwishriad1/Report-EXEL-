/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  HeartPulse,
  UserCheck,
  X,
  Award,
  AlertCircle,
  FileCheck2,
  Users,
  ShieldAlert,
  Building,
  RotateCcw,
  Calendar,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { LeaveRecord, MedicalBoardDecision } from '../types';

interface MedicalBoardProps {
  records: LeaveRecord[];
  onUpdateRecord?: (record: LeaveRecord) => Promise<void>;
  triggerToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

const SEED_BOARD_DECISIONS: MedicalBoardDecision[] = [
  {
    id: "brd_1",
    soldierName: "ياسر سعيد العولقي",
    soldierRank: "نقيب",
    soldierUnit: "اللواء 43 عمالقة - قيادة اللواء",
    condition: "كسر مضاعف في الساق اليسرى مع تثبيت داخلي بمسامير صفائحية",
    fitnessLevel: "transfer_office",
    decisionDate: "2026-05-15",
    rulingNumber: "م-ط/2026/043",
    committeeNotes: "يوصى بنقل الضابط للعمل المكتبي والإداري في مقر القيادة وتجنب المهام الميدانية الشاقة لمدة 6 أشهر مع المتابعة الطبية.",
    signees: ["العقيد د. سليم اليافعي (رئيس اللجنة)", "المقدم د. صابر الذبياني (أخصائي الجراحة)", "الرائد مروان الصبيحي (مندوب قائد اللواء)"]
  },
  {
    id: "brd_2",
    soldierName: "صالح جابر أحمد المرقشي",
    soldierRank: "ملازم ثاني",
    soldierUnit: "اللواء 43 عمالقة - الكتيبة الثالثة",
    condition: "إصابة عمل بطلق ناري نافذ في الكتف الأيمن مع تهتك جزئي بالضفيرة العصبية",
    fitnessLevel: "fit_light",
    decisionDate: "2026-06-10",
    rulingNumber: "م-ط/2026/049",
    committeeNotes: "يُعفى من حمل السلاح والدروع الثقيلة ويوزع في الشؤون الإدارية أو مفرزة الاتصالات بالكتيبة.",
    signees: ["العقيد د. سليم اليافعي (رئيس اللجنة)", "المقدم د. صابر الذبياني (أخصائي الجراحة)", "الرائد مروان الصبيحي (مندوب قائد اللواء)"]
  },
  {
    id: "brd_3",
    soldierName: "عبدالرحمن معوضة المخلافي",
    soldierRank: "جندي",
    soldierUnit: "اللواء 43 عمالقة - الكتيبة الثانية",
    condition: "فقدان بصر كلي بالعين اليمنى وضعف شديد باليسرى جراء انفجار لغم أرضي",
    fitnessLevel: "unfit_permanent",
    decisionDate: "2026-06-20",
    rulingNumber: "م-ط/2026/055",
    committeeNotes: "تقرر اللجنة عدم لياقته الطبية والعسكرية للخدمة بشكل دائم، ويحال للتقاعد الطبي مع كامل المستحقات والتعويضات العسكرية المقررة قانوناً.",
    signees: ["العقيد د. سليم اليافعي (رئيس اللجنة)", "المقدم د. صابر الذبياني (أخصائي الجراحة)", "الرائد مروان الصبيحي (مندوب قائد اللواء)"]
  }
];

export default function MedicalBoard({ records, onUpdateRecord, triggerToast }: MedicalBoardProps) {
  // Load and store medical decisions with LocalStorage persistence
  const [decisions, setDecisions] = useState<MedicalBoardDecision[]>(() => {
    const saved = localStorage.getItem('military_board_decisions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse board decisions, seeding instead.", e);
      }
    }
    return SEED_BOARD_DECISIONS;
  });

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('military_board_decisions', JSON.stringify(decisions));
  }, [decisions]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [fitnessFilter, setFitnessFilter] = useState<'all' | MedicalBoardDecision['fitnessLevel']>('all');

  // New Decision state
  const [isAddingDecision, setIsAddingDecision] = useState(false);
  const [formData, setFormData] = useState({
    soldierName: '',
    soldierRank: 'جندي',
    soldierUnit: 'اللواء 43 عمالقة - الكتيبة الأولى',
    condition: '',
    fitnessLevel: 'fit_light' as MedicalBoardDecision['fitnessLevel'],
    committeeNotes: '',
    rulingNumber: '',
    signee1: 'العقيد د. سليم اليافعي (رئيس اللجنة)',
    signee2: 'المقدم د. صابر الذبياني (أخصائي الجراحة)',
    signee3: 'الرائد مروان الصبيحي (مندوب قائد اللواء)'
  });

  // Selected decision for official military certificate generation / viewing
  const [activeCertificate, setActiveCertificate] = useState<MedicalBoardDecision | null>(null);

  // Search suggestion state when selecting a soldier from existing leaves
  const [selectedLeaveId, setSelectedLeaveId] = useState('');
  const [soldierSearchInput, setSoldierSearchInput] = useState('');

  // Dropdown suggestions for existing soldiers in the system
  const suggestedSoldiers = useMemo(() => {
    if (!soldierSearchInput.trim()) return [];
    const query = soldierSearchInput.toLowerCase();
    return records.filter(r => 
      r.name.toLowerCase().includes(query) ||
      r.rank.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [records, soldierSearchInput]);

  // Pre-fill form when selecting an existing leave record
  const handleSelectSoldier = (record: LeaveRecord) => {
    setFormData(prev => ({
      ...prev,
      soldierName: record.name,
      soldierRank: record.rank,
      soldierUnit: record.unit || 'اللواء 43 عمالقة - الكتيبة الأولى',
      condition: record.diagnosis
    }));
    setSelectedLeaveId(record.id);
    setSoldierSearchInput('');
    triggerToast(`تم استيراد بيانات العسكري: ${record.name}`, 'info');
  };

  // Delete decision record
  const handleDeleteDecision = (id: string, soldierName: string) => {
    if (confirm(`تنبيه عسكري حاسم: هل أنت متأكد تماماً من رغبتك في حذف القرار الطبي الصادر للمنتسب "${soldierName}"؟ لا يمكن استعادة هذا القرار بعد حذفه.`)) {
      setDecisions(prev => prev.filter(item => item.id !== id));
      triggerToast('تم حذف قرار اللجنة الطبية بنجاح', 'success');
    }
  };

  // Helper to generate a new ruling number
  useEffect(() => {
    if (isAddingDecision && !formData.rulingNumber) {
      const year = new Date().getFullYear();
      const num = String(decisions.length + 101);
      setFormData(prev => ({
        ...prev,
        rulingNumber: `م-ط/${year}/${num}`
      }));
    }
  }, [isAddingDecision, decisions.length, formData.rulingNumber]);

  // Statistics
  const stats = useMemo(() => {
    const total = decisions.length;
    const fitLight = decisions.filter(d => d.fitnessLevel === 'fit_light').length;
    const unfitTemp = decisions.filter(d => d.fitnessLevel === 'unfit_temp').length;
    const unfitPermanent = decisions.filter(d => d.fitnessLevel === 'unfit_permanent').length;
    const transferOffice = decisions.filter(d => d.fitnessLevel === 'transfer_office').length;

    return { total, fitLight, unfitTemp, unfitPermanent, transferOffice };
  }, [decisions]);

  // Filtered decisions list
  const filteredDecisions = useMemo(() => {
    return decisions.filter(d => {
      const matchesSearch = d.soldierName.includes(searchQuery) || 
                            d.rulingNumber.includes(searchQuery) ||
                            d.condition.includes(searchQuery);
      const matchesFitness = fitnessFilter === 'all' || d.fitnessLevel === fitnessFilter;
      return matchesSearch && matchesFitness;
    });
  }, [decisions, searchQuery, fitnessFilter]);

  // Submit Handler for New Board Ruling
  const handleAddDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.soldierName.trim() || !formData.condition.trim() || !formData.rulingNumber.trim()) {
      triggerToast('الرجاء تعبئة جميع الحقول المطلوبة والمؤشرة باللون الأحمر', 'error');
      return;
    }

    const newDecision: MedicalBoardDecision = {
      id: `brd_rec_${Math.random().toString(36).substring(2, 9)}`,
      soldierName: formData.soldierName.trim(),
      soldierRank: formData.soldierRank,
      soldierUnit: formData.soldierUnit,
      condition: formData.condition.trim(),
      fitnessLevel: formData.fitnessLevel,
      decisionDate: new Date().toISOString().split('T')[0],
      rulingNumber: formData.rulingNumber.trim(),
      committeeNotes: formData.committeeNotes.trim() || 'لا توجد توصيات إضافية.',
      signees: [formData.signee1, formData.signee2, formData.signee3]
    };

    setDecisions(prev => [newDecision, ...prev]);

    // Update soldier's leave record history if found
    const targetRecord = records.find(r => r.id === selectedLeaveId) || records.find(r => r.name.trim() === formData.soldierName.trim());
    if (targetRecord && onUpdateRecord) {
      const fitnessText = 
        formData.fitnessLevel === 'fit_light' ? 'خدمة خفيفة بدون سلاح' :
        formData.fitnessLevel === 'unfit_temp' ? 'غير لائق للخدمة مؤقتاً' :
        formData.fitnessLevel === 'unfit_permanent' ? 'غير لائق للخدمة نهائياً (تقاعد طبي)' :
        formData.fitnessLevel === 'transfer_office' ? 'نقل لعمل مكتبي وإداري' : formData.fitnessLevel;

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

      const updatedRecord: LeaveRecord = {
        ...targetRecord,
        history: [
          ...(targetRecord.history || []),
          {
            date: dateStr,
            action: 'تعديل',
            details: `قرار اللجنة الطبية العسكرية رقم (${formData.rulingNumber}): تصنيف اللياقة [${fitnessText}]. التوصيات: ${formData.committeeNotes.trim() || 'لا توجد توصيات إضافية.'}`
          }
        ]
      };

      onUpdateRecord(updatedRecord)
        .then(() => {
          triggerToast(`تم تحديث الملف الطبي العسكري للجندي ${targetRecord.name} بقرار اللجنة`, 'success');
        })
        .catch(err => {
          console.error('Failed to update soldier history:', err);
        });
    }

    setIsAddingDecision(false);
    setSelectedLeaveId('');
    // Reset form
    setFormData({
      soldierName: '',
      soldierRank: 'جندي',
      soldierUnit: 'اللواء 43 عمالقة - الكتيبة الأولى',
      condition: '',
      fitnessLevel: 'fit_light',
      committeeNotes: '',
      rulingNumber: '',
      signee1: 'العقيد د. سليم اليافعي (رئيس اللجنة)',
      signee2: 'المقدم د. صابر الذبياني (أخصائي الجراحة)',
      signee3: 'الرائد مروان الصبيحي (مندوب قائد اللواء)'
    });
    triggerToast('تم تسجيل وإصدار قرار اللجنة الطبية بنجاح', 'success');
  };

  // Helper label translators
  const getFitnessBadge = (level: MedicalBoardDecision['fitnessLevel']) => {
    switch (level) {
      case 'fit_light':
        return {
          text: 'خدمة خفيفة بدون سلاح',
          classes: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30'
        };
      case 'transfer_office':
        return {
          text: 'إعادة توزيع للعمل الإداري المكتبي',
          classes: 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200/50 dark:border-sky-900/30'
        };
      case 'unfit_temp':
        return {
          text: 'غير لائق صحياً مؤقتاً بالخدمة',
          classes: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30'
        };
      case 'unfit_permanent':
        return {
          text: 'غير لائق صحياً نهائياً للخدمة العسكرية',
          classes: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30'
        };
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header Area */}
      <div className="bg-gradient-to-l from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800 no-print">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1 text-right">
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              اللجنة الطبية العسكرية العليا للواء
            </span>
            <h1 className="text-xl font-black tracking-tight text-white mt-1.5">أرشيف قرارات اللياقة العسكرية والاستبعاد الطبي</h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              بوابة إدارية وقضائية لتسجيل قرارات اللجان الطبية المشكلة لمنتسبي اللواء 43 عمالقة، وتحديد مستويات القدرة البدنية، أو الإعفاء الدائم، أو التوزيع الإداري المكتبي للضباط والأفراد.
            </p>
          </div>

          <button
            onClick={() => setIsAddingDecision(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>إصدار قرار لجنة طبية</span>
          </button>
        </div>
      </div>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 no-print">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-850 shadow-sm text-right space-y-1">
          <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">إجمالي القرارات الصادرة</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-850 dark:text-white font-mono">{stats.total}</h3>
            <div className="p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-850 shadow-sm text-right space-y-1">
          <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">إعادة توزيع (مكتبي)</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">{stats.transferOffice}</h3>
            <div className="p-1.5 bg-sky-50 dark:bg-sky-950/20 text-sky-500 rounded-lg">
              <Building className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-850 shadow-sm text-right space-y-1">
          <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">إعفاء خفيف (بدون سلاح)</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{stats.fitLight}</h3>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-850 shadow-sm text-right space-y-1">
          <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">غير لائق مؤقتاً</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{stats.unfitTemp}</h3>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-lg">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-850 shadow-sm text-right col-span-2 lg:col-span-1 space-y-1">
          <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">تقاعد واستبعاد طبي دائم</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{stats.unfitPermanent}</h3>
            <div className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table and Filter Control Row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden no-print">
        {/* Filters Top Bar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col md:flex-row justify-between items-center gap-4 text-right">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم العسكري، رقم القرار، أو التشخيص..."
              className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-right"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto whitespace-nowrap pb-1 md:pb-0">
            <span className="text-slate-400 text-xs font-bold shrink-0">تصفية حسب اللياقة:</span>
            {(['all', 'fit_light', 'transfer_office', 'unfit_temp', 'unfit_permanent'] as const).map(option => (
              <button
                key={option}
                onClick={() => setFitnessFilter(option)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                  fitnessFilter === option
                    ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                {option === 'all' && 'الكل'}
                {option === 'fit_light' && 'خدمة خفيفة'}
                {option === 'transfer_office' && 'عمل إداري'}
                {option === 'unfit_temp' && 'غير لائق مؤقتاً'}
                {option === 'unfit_permanent' && 'تسريح نهائي'}
              </button>
            ))}
          </div>
        </div>

        {/* Decisions Data Table */}
        <div className="overflow-x-auto">
          {filteredDecisions.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 w-fit mx-auto rounded-full">
                <FileCheck2 className="w-8 h-8 text-slate-350 dark:text-slate-650" />
              </div>
              <p className="text-xs text-slate-400 font-bold">لا توجد قرارات مطابقة لشروط البحث</p>
              <p className="text-[11px] text-slate-450">جرب كتابة الاسم بطريقة مختلفة أو تغيير الفلتر.</p>
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-850 text-slate-400 font-bold">
                  <th className="p-4">رقم القرار</th>
                  <th className="p-4">العسكري المستهدف</th>
                  <th className="p-4">الرتبة والوحدة</th>
                  <th className="p-4">التشخيص الطبي والمعطيات</th>
                  <th className="p-4">القرار والتنصيب الطبي</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredDecisions.map((d) => {
                  const badge = getFitnessBadge(d.fitnessLevel);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors">
                      <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {d.rulingNumber}
                      </td>
                      <td className="p-4">
                        <div className="font-extrabold text-slate-850 dark:text-white text-xs">{d.soldierName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{d.decisionDate}</div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-bold text-slate-700 dark:text-slate-300 ml-1.5">{d.soldierRank}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                          {d.soldierUnit.replace('اللواء 43 عمالقة - ', '')}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs truncate" title={d.condition}>
                        <div className="flex items-center gap-1.5">
                          <HeartPulse className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="text-slate-650 dark:text-slate-300 leading-normal">{d.condition}</span>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black border ${badge?.classes}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {badge?.text}
                        </span>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setActiveCertificate(d)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold rounded-lg transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer text-[10px]"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>توليد شهادة القرار</span>
                          </button>
                          <button
                            onClick={() => handleDeleteDecision(d.id, d.soldierName)}
                            title="حذف القرار"
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Rulings / Official Board Certificate Display Stage (For print only when selected, otherwise modal) */}
      <AnimatePresence>
        {activeCertificate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-55 flex items-center justify-center p-4 overflow-y-auto no-print">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right"
            >
              {/* Modal controls */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h3 className="font-extrabold text-xs text-slate-850 dark:text-white">معاينة القرار العسكري الرسمي وإعدادات الطباعة</h3>
                </div>
                <button
                  onClick={() => setActiveCertificate(null)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-650"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Area Wrapper */}
              <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20 font-sans">
                {/* Visual Representation of military document */}
                <div className="relative bg-white border-4 border-double border-slate-800 p-8 md:p-12 shadow-lg text-slate-950 max-w-2xl mx-auto rounded-sm overflow-hidden" id="official-military-decree">
                  {/* Subtle watermarked seal in background */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                    <ShieldAlert className="w-96 h-96" />
                  </div>

                  {/* Header row */}
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                    <div className="text-right space-y-1">
                      <h4 className="font-black text-xs">ألوية العمالقة الجنوبية</h4>
                      <h5 className="font-bold text-[11px]">اللواء 43 عمالقة - الشؤون الطبية</h5>
                      <h6 className="font-medium text-[10px] text-slate-500">اللجنة الطبية العسكرية العليا</h6>
                    </div>
                    
                    <div className="text-center shrink-0 px-4">
                      {/* Placeholder Emblem */}
                      <div className="w-16 h-16 border-2 border-slate-900 rounded-full flex items-center justify-center bg-slate-50 mx-auto">
                        <ShieldAlert className="w-8 h-8 text-slate-900" />
                      </div>
                      <span className="text-[9px] font-bold block mt-1 tracking-wider">سري للغاية</span>
                    </div>

                    <div className="text-left space-y-1 font-mono text-[10px]">
                      <p>الرقم: <span className="font-bold">{activeCertificate.rulingNumber}</span></p>
                      <p>التاريخ: <span className="font-bold">{activeCertificate.decisionDate}</span></p>
                      <p>المرفقات: <span className="font-bold">تقرير طبي معتمد</span></p>
                    </div>
                  </div>

                  {/* Document Title */}
                  <div className="text-center my-6">
                    <h2 className="text-lg font-black underline underline-offset-8 decoration-2 decoration-slate-800">
                      قرار طبي عسكري صادر عن اللجنة الطبية العليا
                    </h2>
                  </div>

                  {/* Document Content text */}
                  <div className="space-y-4 text-xs leading-relaxed text-justify mt-8">
                    <p>
                      بناءً على التوجيهات العسكرية العليا الصادرة من قيادة ألوية العمالقة، واجتناداً إلى اللائحة الطبية للخدمة العسكرية بجمهورية اليمن وقوانين التقاعد والجاهزية، اجتمعت اللجنة الطبية العسكرية المشكلة بقرار قيادة اللواء 43 عمالقة لتشخيص وتقييم حالة العسكري المذكور بياناته أدناه:
                    </p>

                    {/* Soldier metadata Table */}
                    <div className="bg-slate-50 border border-slate-900/35 rounded overflow-hidden my-4">
                      <table className="w-full text-right text-[11px]">
                        <tbody>
                          <tr className="border-b border-slate-300">
                            <td className="p-2.5 font-bold bg-slate-100 border-l border-slate-350 w-28">الاسم الرباعي:</td>
                            <td className="p-2.5 font-black">{activeCertificate.soldierName}</td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="p-2.5 font-bold bg-slate-100 border-l border-slate-350">الرتبة العسكرية:</td>
                            <td className="p-2.5 font-bold">{activeCertificate.soldierRank}</td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="p-2.5 font-bold bg-slate-100 border-l border-slate-350">الوحدة / الكتيبة:</td>
                            <td className="p-2.5 font-medium">{activeCertificate.soldierUnit}</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-bold bg-slate-100 border-l border-slate-350">الحالة الطبية:</td>
                            <td className="p-2.5 text-rose-800 font-bold">{activeCertificate.condition}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <h4 className="font-black text-xs text-slate-900 border-b border-slate-300 pb-1.5 mb-1.5">
                      مقررات اللجنة الطبية وتوصياتها:
                    </h4>

                    <div className="bg-slate-50/50 p-4 border-l-4 border-slate-900 rounded-r shadow-inner">
                      <p className="font-black text-xs text-indigo-950 mb-1">
                        القرار الصادر: {' '}
                        <span className="underline decoration-indigo-650 decoration-2">
                          {getFitnessBadge(activeCertificate.fitnessLevel)?.text}
                        </span>
                      </p>
                      <p className="mt-2 text-[11px] leading-relaxed text-slate-800 font-medium">
                        {activeCertificate.committeeNotes}
                      </p>
                    </div>

                    <p className="text-[10px] text-slate-500 mt-6 leading-relaxed italic">
                      * يلتزم جميع قادة الكتائب والفرق والجهات الإدارية ذات العلاقة باللواء بتنفيذ مقتضيات هذا القرار، ويعتبر العسكري مشمولاً بالحماية الطبية العسكرية وله الحق في نيل كامل الرعاية والتعويضات المالية والخدمية المقررة بقوانين القوات المسلحة.
                    </p>
                  </div>

                  {/* Signatures Grid */}
                  <div className="grid grid-cols-3 gap-3.5 mt-12 pt-6 border-t border-slate-300 text-center text-[10px]">
                    {activeCertificate.signees.map((signee, index) => {
                      const roles = ["رئيس اللجنة الطبية", "عضو اللجنة (أخصائي الجراحة)", "ممثل الشؤون القانونية للواء"];
                      return (
                        <div key={index} className="space-y-4">
                          <p className="font-bold text-slate-400">{roles[index]}</p>
                          <div className="h-8 flex items-center justify-center font-mono italic text-slate-300 text-[12px] select-none">
                            [توقيع وختم اللجنة]
                          </div>
                          <p className="font-black text-slate-850 underline decoration-slate-300">{signee}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom stamp watermark */}
                  <div className="absolute bottom-4 left-4 w-20 h-20 border border-slate-300 rounded-full flex items-center justify-center text-[8px] font-bold text-slate-350 select-none transform -rotate-12">
                    ختم مستوصف اللواء
                  </div>
                </div>
              </div>

              {/* Footer controls */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
                <button
                  onClick={() => setActiveCertificate(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  إغلاق النافذة
                </button>
                <button
                  onClick={handlePrintCertificate}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة وتصدير القرار (PDF)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Issuing Form Modal */}
      <AnimatePresence>
        {isAddingDecision && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-55 flex items-center justify-center p-4 overflow-y-auto no-print">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                  <h3 className="font-extrabold text-xs text-slate-850 dark:text-white">إصدار قرار رسمي للجنة الطبية العسكرية العليا</h3>
                </div>
                <button
                  onClick={() => setIsAddingDecision(false)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-650"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDecisionSubmit} className="flex-1 p-6 space-y-4 overflow-y-auto font-sans text-xs">
                {/* Search existing soldiers to load their medical info */}
                <div className="p-4 bg-amber-50/20 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/20 rounded-xl space-y-2">
                  <span className="font-bold text-amber-700 dark:text-amber-400 block">
                    مساعد الملء التلقائي (اختياري):
                  </span>
                  <p className="text-[11px] text-slate-500">
                    ابحث باسم جندي مسجل في الإجازات الطبية لتعبئة بياناته والتشخيص الطبي المعتمد تلقائياً:
                  </p>
                  
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      value={soldierSearchInput}
                      onChange={(e) => setSoldierSearchInput(e.target.value)}
                      placeholder="ابحث هنا لاستيراد بيانات الجندي..."
                      className="w-full pl-4 pr-9 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-[11px] focus:outline-none"
                    />

                    {suggestedSoldiers.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-20 overflow-hidden divide-y divide-slate-100 dark:divide-slate-850">
                        {suggestedSoldiers.map(soldier => (
                          <div
                            key={soldier.id}
                            onClick={() => handleSelectSoldier(soldier)}
                            className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer flex justify-between items-center text-[11px] transition-colors"
                          >
                            <div>
                              <span className="font-bold text-slate-800 dark:text-white ml-2">{soldier.name}</span>
                              <span className="text-slate-400 font-mono text-[9px]">[{soldier.rank}]</span>
                            </div>
                            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-100/30">استيراد</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ruling number */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">رقم القرار العسكري <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.rulingNumber}
                      onChange={(e) => setFormData({...formData, rulingNumber: e.target.value})}
                      placeholder="مثال: م-ط/2026/043"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>

                  {/* Soldier Name */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">اسم العسكري الرباعي <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.soldierName}
                      onChange={(e) => setFormData({...formData, soldierName: e.target.value})}
                      placeholder="أدخل الاسم الكامل للعسكري"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>

                  {/* Rank */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">الرتبة العسكرية</label>
                    <select
                      value={formData.soldierRank}
                      onChange={(e) => setFormData({...formData, soldierRank: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer"
                    >
                      {['جندي', 'عريف', 'رقيب', 'رقيب أول', 'ملازم ثان', 'ملازم أول', 'نقيب', 'رائد', 'مقدم', 'عقيد'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Unit */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">الوحدة أو الكتيبة باللواء</label>
                    <input
                      type="text"
                      value={formData.soldierUnit}
                      onChange={(e) => setFormData({...formData, soldierUnit: e.target.value})}
                      placeholder="مثال: الكتيبة الأولى - السريّة الثالثة"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>

                  {/* Fitness Level */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-slate-650 dark:text-slate-300">القرار ومستوى اللياقة البدنية والخدمية الصادر <span className="text-rose-500">*</span></label>
                    <select
                      value={formData.fitnessLevel}
                      onChange={(e) => setFormData({...formData, fitnessLevel: e.target.value as any})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold cursor-pointer"
                    >
                      <option value="fit_light">خدمة خفيفة بدون سلاح أو دروع (لائق جزئياً)</option>
                      <option value="transfer_office">إعادة توزيع وإعفاء ميداني للعمل الإداري المكتبي</option>
                      <option value="unfit_temp">غير لائق صحياً للخدمة العسكرية مؤقتاً (إجازة طويلة ومتابعة)</option>
                      <option value="unfit_permanent">غير لائق صحياً نهائياً للخدمة العسكرية (استبعاد وتقاعد طبي)</option>
                    </select>
                  </div>

                  {/* Condition Description */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-slate-650 dark:text-slate-300">التشخيص الطبي وتوصيف الحالة الطبية <span className="text-rose-500">*</span></label>
                    <textarea
                      required
                      value={formData.condition}
                      onChange={(e) => setFormData({...formData, condition: e.target.value})}
                      placeholder="اشرح معطيات ومضاعفات الإصابة أو المرض بناءً على التقارير المرفقة..."
                      className="w-full h-20 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    />
                  </div>

                  {/* Committee notes */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-slate-650 dark:text-slate-300">توصيات إضافية وقرارات تنظيمية ملحقة</label>
                    <textarea
                      value={formData.committeeNotes}
                      onChange={(e) => setFormData({...formData, committeeNotes: e.target.value})}
                      placeholder="يوصى بصرف الرعاية المالية، أو توفير العلاج الطبيعي، أو مراجعة اللجنة الطبية بعد 6 أشهر..."
                      className="w-full h-16 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    />
                  </div>

                  <h5 className="font-black text-[11px] text-slate-400 md:col-span-2 border-b border-slate-100 dark:border-slate-800 pb-1.5 mt-2">
                    أعضاء اللجنة الطبية الموقِّعين للقرار:
                  </h5>

                  {/* Signee 1 */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">رئيس اللجنة الطبية باللواء</label>
                    <input
                      type="text"
                      value={formData.signee1}
                      onChange={(e) => setFormData({...formData, signee1: e.target.value})}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-lg text-[11px]"
                    />
                  </div>

                  {/* Signee 2 */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">عضو اللجنة الطبية (الأخصائي)</label>
                    <input
                      type="text"
                      value={formData.signee2}
                      onChange={(e) => setFormData({...formData, signee2: e.target.value})}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-lg text-[11px]"
                    />
                  </div>

                  {/* Signee 3 */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-slate-500">ممثل الشؤون العسكرية والاتصالات باللواء</label>
                    <input
                      type="text"
                      value={formData.signee3}
                      onChange={(e) => setFormData({...formData, signee3: e.target.value})}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-lg text-[11px]"
                    />
                  </div>
                </div>

                {/* Footer buttons within modal */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl flex items-center justify-between gap-3 text-right">
                  <span className="text-[10px] text-slate-450 max-w-sm">
                    * سيتم إرفاق الرقم والتاريخ للقرار، وإضافته فوراً إلى أرشيف اللجنة المشفرة محلياً.
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingDecision(false)}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-bold"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-black"
                    >
                      حفظ وإصدار القرار
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
