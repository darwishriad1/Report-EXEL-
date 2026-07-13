/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
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
  UserPlus,
  Bell,
  Database,
  Settings,
  FileText,
  X,
  FileBarChart,
  Printer,
  Smartphone,
  Store,
  Award,
  Phone,
  PhoneCall,
  PhoneOff,
  MessageSquare,
  Compass,
  MapPin,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { LeaveRecord } from '../types';
import DeleteConfirmModal from './DeleteConfirmModal';
import AIBulkLeaves from './AIBulkLeaves';

interface DashboardProps {
  records: LeaveRecord[];
  onUpdate?: (record: LeaveRecord) => Promise<void>;
  onAdd?: (record: LeaveRecord) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  setCurrentPage?: (page: 'dashboard' | 'records' | 'analytics' | 'tools' | 'reports' | 'board' | 'pharmacy') => void;
  triggerToast?: (text: string, type: 'success' | 'error' | 'info') => void;
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

const FIRST_AID_GUIDE = [
  {
    title: 'إيقاف النزيف الناتج عن طلق ناري أو شظية',
    severity: 'حرجة جداً 🚨',
    steps: [
      'الضغط المباشر والمستمر على الجرح باستخدام ضمادة معقمة أو شاش نظيف.',
      'تطبيق عاصبة شريانية (Tourniquet) أعلى الجرح بـ 5-7 سم (فوق الركبة أو المرفق وليس على المفصل) إذا كان النزيف في الأطراف ولا يتوقف.',
      'تدوين وقت تركيب العاصبة (الرباط) بدقة على جبهة المصاب لمنع تلف الأنسجة لاحقاً.',
      'رفع الطرف المصاب أعلى من مستوى القلب إن أمكن.'
    ]
  },
  {
    title: 'ضربات الشمس والإجهاد الحراري الحاد بالقطاع الصحراوي',
    severity: 'طارئة ⚠️',
    steps: [
      'نقل الجندي فوراً إلى الظل ومكان بارد وجيد التهوية.',
      'تخفيف الملابس العسكرية وفك الدروع والأحزمة.',
      'رش الجسم بماء فاتر (وليس بارداً جداً لتجنب صدمة الأوعية الدموية) واستخدام المراوح لخفض الحرارة.',
      'إعطاء المصاب سوائل أو محاليل ترطيب بالفم ببطء شديد إذا كان بكامل وعيه.'
    ]
  },
  {
    title: 'تثبيت الكسور البليغة والخلع الميداني',
    severity: 'متوسطة الخطورة 📦',
    steps: [
      'عدم محاولة إعادة العظم المكسور أو المفصل المخلوع إلى مكانه الطبيعي ميدانياً.',
      'تثبيت الطرف المصاب باستخدام جبيرة مرتجلة (خشب، كرتون مقوى، أو برباط ضاغط متين).',
      'التأكد من أن الجبيرة تثبت المفصلين أعلى وأسفل الكسر لمنع الحركة تماماً.',
      'فحص النبض وحرارة الطرف المصاب أسفل الكسر بانتظام للتأكد من تدفق الدم.'
    ]
  },
  {
    title: 'التعامل مع لدغات الأفاعي السامة والعقارب بالخلاء',
    severity: 'حرجة ⚠️',
    steps: [
      'تهدئة المصاب تماماً لمنع تسارع ضربات القلب وانتشار السم بجسده.',
      'تثبيت الطرف المصاب وإبقاؤه في مستوى أدنى من القلب.',
      'غسل موضع اللدغة بالماء والصابون، وتجنب جرح أو شفط السم بالفم أو ربطه بعاصبة قوية.',
      'نقل المصاب فوراً إلى أقرب مفرزة طبية لحقنه بالمصل المضاد للسموم.'
    ]
  }
];

export default function Dashboard({ records, onUpdate, onAdd, onDelete, setCurrentPage, triggerToast }: DashboardProps) {
  // Today's date reference
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Medication Inventory stats for dashboard preview
  const pharmacyStats = useMemo(() => {
    try {
      const saved = localStorage.getItem('military_pharmacy_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const totalItems = parsed.length;
          const totalUnits = parsed.reduce((sum, item) => sum + (item.quantity || 0), 0);
          const lowStock = parsed.filter(item => (item.quantity || 0) <= (item.minThreshold || 0)).length;
          return { totalItems, totalUnits, lowStock };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return { totalItems: 6, totalUnits: 978, lowStock: 2 };
  }, []);

  // --- Version 2.0.0 Interactive States ---
  const [verificationQuery, setVerificationQuery] = useState('');
  const [selectedVerifiedRecordId, setSelectedVerifiedRecordId] = useState('');
  const [quickContactStatus, setQuickContactStatus] = useState<LeaveRecord['contactStatus'] | ''>('');
  const [quickContactNote, setQuickContactNote] = useState('');

  // Custom Delete Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<LeaveRecord | null>(null);

  const executeDelete = async () => {
    if (!onDelete || !recordToDelete) return;
    try {
      await onDelete(recordToDelete.id);
      if (triggerToast) triggerToast('تم حذف السجل بنجاح من سجلات السيطرة الكلية', 'success');
    } catch (err) {
      if (triggerToast) triggerToast('حدث خطأ أثناء محاولة حذف السجل العسكري', 'error');
    }
  };
  
  // --- New Professional Monitoring Portal States ---
  const [verifySubTab, setVerifySubTab] = useState<'info' | 'compliance' | 'geotrack' | 'fitness'>('info');
  const [isPhoneCalling, setIsPhoneCalling] = useState(false);
  const [phoneCallStep, setPhoneCallStep] = useState<0 | 1 | 2 | 3>(0); // 0=idle, 1=dialing, 2=speaking, 3=ended
  const [simCallResponseText, setSimCallResponseText] = useState('');
  const [customFitnessDecision, setCustomFitnessDecision] = useState<'fit' | 'light_duty' | 'unfit'>('fit');
  const [showFitnessReceipt, setShowFitnessReceipt] = useState(false);
  const [fitnessCommitteeNotes, setFitnessCommitteeNotes] = useState('تقرر عودة المذكور للخدمة العسكرية الكاملة فوراً لتماثله السريري التام للشفاء واستقرار حالته الصحية.');
  
  // Interactive Simulation states
  const [simDiagIndex, setSimDiagIndex] = useState(0);
  const [simProposedDays, setSimProposedDays] = useState(30);

  // Modal active state for launcher icons
  const [activeModalId, setActiveModalId] = useState<'verify' | 'simulator' | 'alarms' | 'calculator' | 'guide' | 'analytics' | 'add-record' | 'referrals' | 'reassignment' | 'campaign' | 'monthly-tracker' | 'ai-bulk' | null>(null);

  // --- Monthly Sick Leave Tracker States ---
  const [trackerYear, setTrackerYear] = useState<number>(() => new Date().getFullYear());
  const [trackerMonth, setTrackerMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [trackerLeaveType, setTrackerLeaveType] = useState<'all' | 'مريض' | 'مرافق' | 'مرض قريب' | 'حادث'>('all');

  // --- New Professional Tools States ---
  // Referral Portal
  const [referralSoldierId, setReferralSoldierId] = useState<string>('custom');
  const [referralCustomName, setReferralCustomName] = useState('');
  const [referralCustomRank, setReferralCustomRank] = useState('جندي');
  const [referralCustomUnit, setReferralCustomUnit] = useState('الكتيبة الأولى');
  const [referralHospital, setReferralHospital] = useState('مستشفى باصهيب العسكري - عدن');
  const [referralReason, setReferralReason] = useState('مراجعة أخصائي جراحة عظام وإجراء رنين مغناطيسي للركبة');
  const [referralNotes, setReferralNotes] = useState('');
  const [referralSearchQuery, setReferralSearchQuery] = useState('');
  const [recentReferrals, setRecentReferrals] = useState<{
    id: string;
    name: string;
    rank: string;
    unit: string;
    hospital: string;
    reason: string;
    date: string;
  }[]>(() => {
    const saved = localStorage.getItem('military_recent_referrals');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const initial = [
      {
        id: 'REF-43-1001',
        name: 'عماد عبد القوي صالح اليافعي',
        rank: 'مساعد أول',
        unit: 'الكتيبة الثانية',
        hospital: 'مستشفى باصهيب العسكري - عدن',
        reason: 'إجراء أشعة رنين مغناطيسي وتخطيط أعصاب طرفية للرجل اليسرى',
        date: '2026-07-04'
      },
      {
        id: 'REF-43-1002',
        name: 'سالم علي مسعد الحارثي',
        rank: 'رقيب ثان',
        unit: 'كتيبة الإمداد والتموين',
        hospital: 'مستشفى الجمهورية التعليمي - عدن',
        reason: 'متابعة أخصائي المسالك وجراحة الفتاق الجراحي المناظيري',
        date: '2026-07-06'
      }
    ];
    localStorage.setItem('military_recent_referrals', JSON.stringify(initial));
    return initial;
  });
  const [activeReferralPrint, setActiveReferralPrint] = useState<any>(null);

  // Reassignment Protocol
  const [reassignSoldierId, setReassignSoldierId] = useState<string>('');
  const [reassignDuty, setReassignDuty] = useState('حراسة داخلية ورقابة بوابات المقر العسكري');
  const [reassignDuration, setReassignDuration] = useState(30);
  const [reassignNotes, setReassignNotes] = useState('');
  const [recentReassignments, setRecentReassignments] = useState<{
    id: string;
    name: string;
    rank: string;
    unit: string;
    duty: string;
    duration: number;
    notes: string;
    date: string;
  }[]>(() => {
    const saved = localStorage.getItem('military_recent_reassignments');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const initial = [
      {
        id: 'RE-43-5001',
        name: 'وضاح صالح محسن الصبيحي',
        rank: 'رقيب أول',
        unit: 'الكتيبة الأولى',
        duty: 'أعمال إدارية وتنظيمية بالشعبة الطبية وصرف مخزون الأدوية',
        duration: 45,
        notes: 'بسبب نقاهة كسر الفخذ، يمنع من الخدمة الميدانية العنيفة والمسافات الطويلة.',
        date: '2026-07-03'
      }
    ];
    localStorage.setItem('military_recent_reassignments', JSON.stringify(initial));
    return initial;
  });
  const [activeReassignPrint, setActiveReassignPrint] = useState<any>(null);

  // Campaign Supply Forecasting
  const [campaignForceSize, setCampaignForceSize] = useState(150);
  const [campaignDays, setCampaignDays] = useState(10);
  const [campaignIntensity, setCampaignIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [campaignNotes, setCampaignNotes] = useState('حملة تمشيط وتأمين الصحراء الشرقية المتاخمة للساحل');
  const [showCampaignReport, setShowCampaignReport] = useState(false);

  // New Features: Tactical global search and rotating clinical operational ticker
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [tickerIndex, setTickerIndex] = useState(0);

  // High-craft custom dashboard features
  const [showDigitalCard, setShowDigitalCard] = useState(false);
  const [guideTab, setGuideTab] = useState<'periods' | 'first_aid'>('periods');
  
  // Custom states for medical extension and satellite direct recall simulator
  const [committeeExtDays, setCommitteeExtDays] = useState(15);
  const [committeeNotes, setCommitteeNotes] = useState('');
  const [showCommitteeReceipt, setShowCommitteeReceipt] = useState(false);
  const [radioSimulationStep, setRadioSimulationStep] = useState(0); // 0=idle, 1=scanning, 2=sending, 3=done
  const [firstAidSearch, setFirstAidSearch] = useState('');

  // Suggested search list for verification portal
  const suggestedRecords = useMemo(() => {
    if (!verificationQuery.trim()) return [];
    const query = verificationQuery.toLowerCase();
    return records.filter((r) => 
      r.name.includes(query) || 
      r.rank.includes(query) ||
      (r.unit && r.unit.includes(query)) ||
      r.id.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [records, verificationQuery]);

  const selectedVerifiedRecord = useMemo(() => {
    return records.find(r => r.id === selectedVerifiedRecordId) || null;
  }, [records, selectedVerifiedRecordId]);

  // Set initial contact status when a record is loaded
  useEffect(() => {
    if (selectedVerifiedRecord) {
      setQuickContactStatus(selectedVerifiedRecord.contactStatus || 'pending');
    } else {
      setQuickContactStatus('');
    }
  }, [selectedVerifiedRecordId, selectedVerifiedRecord?.contactStatus]);

  const handleQuickContactSave = async () => {
    if (!selectedVerifiedRecord || !onUpdate || !quickContactStatus) return;
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    
    const updatedRecord: LeaveRecord = {
      ...selectedVerifiedRecord,
      contactStatus: quickContactStatus as any,
      history: [
        ...(selectedVerifiedRecord.history || []),
        {
          date: dateStr,
          action: 'تعديل',
          details: `تحديث حالة التواصل والامتثال من لوحة التحكم السريعة إلى [${
            quickContactStatus === 'confirmed' ? 'تم تأكيد العودة للخدمة' :
            quickContactStatus === 'evading' ? 'متهرب عسكرياً' :
            quickContactStatus === 'request_extension' ? 'طلب تمديد رسمي' :
            quickContactStatus === 'no_answer' ? 'لم يرد على الهاتف' : 'قيد الانتظار والمتابعة'
          }]`
        }
      ],
      contactLogs: [
        ...(selectedVerifiedRecord.contactLogs || []),
        {
          date: dateStr.split(' ')[0],
          status: quickContactStatus,
          note: quickContactNote || 'تم التحديث الفوري عبر بوابة التحقق السريع والامتثال v2.0.0'
        }
      ]
    };

    try {
      await onUpdate(updatedRecord);
      setQuickContactNote('');
    } catch (err) {
      console.error('Failed to update contact log:', err);
    }
  };

  // Handler for Exceptional Military Medical Committee Extension
  const handleCommitteeExtension = async () => {
    if (!selectedVerifiedRecord || !onUpdate) return;
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    
    // Calculate new end date based on extending current end date by committeeExtDays
    let currentEnd = new Date(selectedVerifiedRecord.endDate);
    if (isNaN(currentEnd.getTime())) {
      currentEnd = new Date();
    }
    currentEnd.setDate(currentEnd.getDate() + committeeExtDays);
    const newEndDateStr = currentEnd.toISOString().split('T')[0];
    
    const updatedRecord: LeaveRecord = {
      ...selectedVerifiedRecord,
      endDate: newEndDateStr,
      contactStatus: 'request_extension',
      history: [
        ...(selectedVerifiedRecord.history || []),
        {
          date: dateStr,
          action: 'تمديد',
          details: `قرار اللجنة الطبية العسكرية العليا للواء 43 عمالقة بتمديد الإجازة المرضية بقوة ${committeeExtDays} يوماً. السبب والملاحظات: ${committeeNotes || 'دواعي طبية واستشفائية معتمدة'}. تاريخ الانتهاء الجديد: ${newEndDateStr}`
        }
      ]
    };
    
    try {
      await onUpdate(updatedRecord);
      setShowCommitteeReceipt(true);
      if (triggerToast) triggerToast(`تم اعتماد تمديد إجازة ${selectedVerifiedRecord.name} بنجاح`, 'success');
    } catch (err) {
      console.error(err);
      if (triggerToast) triggerToast('فشل تمديد الإجازة الطبية', 'error');
    }
  };

  // Handler for Direct Satellite Military Radio Recall Broadcast Notice
  const handleRadioRecallBroadcast = () => {
    if (!selectedVerifiedRecord) return;
    
    setRadioSimulationStep(1);
    
    // Step 1: Scanning military network (800ms)
    setTimeout(() => {
      setRadioSimulationStep(2);
      
      // Step 2: Preparing safe satellite dispatch (1200ms)
      setTimeout(() => {
        setRadioSimulationStep(3);
        
        // Finalize: update record contact status and save
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
        
        const updatedRecord: LeaveRecord = {
          ...selectedVerifiedRecord,
          contactStatus: 'confirmed',
          history: [
            ...(selectedVerifiedRecord.history || []),
            {
              date: dateStr,
              action: 'تعديل',
              details: `تم إرسال نداء استدعاء عسكري لاسلكي مشفر عبر القمر الصناعي (رقم البلاغ: G43-${Math.floor(1000 + Math.random() * 9000)}) للتأكيد والالتحاق الفوري بالكتيبة.`
            }
          ],
          contactLogs: [
            ...(selectedVerifiedRecord.contactLogs || []),
            {
              date: dateStr.split(' ')[0],
              status: 'confirmed',
              note: `بث لاسلكي عسكري ناجح: إشعار عودة مباشر عبر شبكة اللواء 43 العسكرية الرقمية الآمنة.`
            }
          ]
        };
        
        if (onUpdate) {
          onUpdate(updatedRecord).then(() => {
            if (triggerToast) triggerToast('تم بث وتأكيد بلاغ العودة اللاسلكي بنجاح', 'success');
          }).catch(err => {
            console.error(err);
          });
        }
      }, 1200);
    }, 800);
  };

  // --- New Handlers for Advanced Verification Portal ---
  const startSimulatedCall = (record: LeaveRecord) => {
    if (!record) return;
    setIsPhoneCalling(true);
    setPhoneCallStep(1); // Dialing
    let responseText = '';
    
    const status = record.contactStatus || 'pending';
    if (status === 'confirmed') {
      responseText = "أهلاً يا فندم! نعم، والحمد لله صحتي ممتازة واستكملت برنامج العلاج الطبيعي الموصوف بنجاح. سألتحق غداً صباحاً بالكتيبة ومستعد لتأدية أي مهام عسكرية ميدانية بكل فخر.";
    } else if (status === 'request_extension') {
      responseText = "مرحباً بكم يا فندم في الشعبة الطبية لللواء 43. الحقيقة أنني ما زلت أشعر بآلام مستمرة في موضع الكسر والركبة، ولم أستطع تحريكها بحرية تامة بعد. الطبيب يرى أنني أحتاج تمديد الإجازة الاستشفائية أسبوعين إضافيين للتعافي التام.";
    } else if (status === 'evading') {
      responseText = "«الهاتف المطلوب مغلق حالياً أو قد يكون خارج نطاق التغطية... الرجاء المحاولة لاحقاً» (ملاحظة عسكرية: تم رصد إغلاق الهاتف عمداً وتوثيقه كحالة تهرب عسكري ميداني).";
    } else if (status === 'no_answer') {
      responseText = "«جاري الاتصال بالفرد... يرن الآن... طوط... طوط... لم يتم الرد على الاتصال» (تم توثيق محاولة رصد الاتصال في السجل القياسي بنجاح).";
    } else {
      responseText = "أهلاً يا فندم، أنا ملتزم تماماً بالراحة الطبية والمنزلية والبروتوكول الموصوف لي من الأطباء، وبانتظار موعد اللجنة الطبية القادم لإجراء الفحص والتحقق من التئام الكسر التام.";
    }
    
    setSimCallResponseText(responseText);
    
    setTimeout(() => {
      if (status === 'evading' || status === 'no_answer') {
        setPhoneCallStep(3); // ended/failed
      } else {
        setPhoneCallStep(2); // speaking
      }
    }, 2000);
  };

  const handleCustomFitnessSubmit = async () => {
    if (!selectedVerifiedRecord || !onUpdate) return;
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    
    let decisionText = '';
    let statusText = selectedVerifiedRecord.contactStatus;
    
    if (customFitnessDecision === 'fit') {
      decisionText = 'إقرار اللياقة الطبية العسكرية الكاملة والعودة للكتيبة';
      statusText = 'confirmed';
    } else if (customFitnessDecision === 'light_duty') {
      decisionText = 'إقرار اللياقة البدنية الخفيفة لمهام إدارية ومكتبية فقط واستثناء مؤقت من المهام القتالية';
      statusText = 'confirmed';
    } else {
      decisionText = 'عدم اكتمال الشفاء السريري والاستمرار في التوصية بالراحة الطبية الاستشفائية المبررة';
      statusText = 'request_extension';
    }
    
    const updatedRecord: LeaveRecord = {
      ...selectedVerifiedRecord,
      contactStatus: statusText as any,
      history: [
        ...(selectedVerifiedRecord.history || []),
        {
          date: dateStr,
          action: 'تعديل',
          details: `تمت مراجعة الحالة الطبية عبر بوابة التحقق السريع من قبل الشؤون الطبية لللواء 43. القرار: ${decisionText}. الملاحظات: ${fitnessCommitteeNotes}`
        }
      ],
      contactLogs: [
        ...(selectedVerifiedRecord.contactLogs || []),
        {
          date: dateStr.split(' ')[0],
          status: statusText || 'pending',
          note: `المثول الطبي والتحقق السريع: ${decisionText}. الملاحظات: ${fitnessCommitteeNotes}`
        }
      ]
    };
    
    try {
      await onUpdate(updatedRecord);
      setShowFitnessReceipt(true);
      if (triggerToast) triggerToast('تم تسجيل وإصدار إقرار اللياقة الطبية بنجاح', 'success');
    } catch (err) {
      console.error(err);
      if (triggerToast) triggerToast('فشل حفظ إقرار اللياقة الطبية', 'error');
    }
  };

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

  // 3b. 48-Hour Urgent Expiration Alarms list (ends in 0, 1, or 2 days)
  const urgentExpirations = useMemo(() => {
    const today = new Date(todayStr);
    return records
      .filter((r) => {
        const end = new Date(r.endDate);
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 2;
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

  // --- Monthly Sick Leave Tracker Logic ---
  const parseYYYYMMDD = (str: string) => {
    const parts = str.split('-');
    if (parts.length !== 3) return new Date();
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  };

  const getDaysInMonthForRecord = (record: LeaveRecord, year: number, month: number) => {
    const recordStart = parseYYYYMMDD(record.startDate);
    const recordEnd = parseYYYYMMDD(record.endDate);

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0); // last day of month

    if (recordEnd < monthStart || recordStart > monthEnd) {
      return 0;
    }

    const overlapStart = recordStart < monthStart ? monthStart : recordStart;
    const overlapEnd = recordEnd > monthEnd ? monthEnd : recordEnd;

    const diffTime = overlapEnd.getTime() - overlapStart.getTime();
    const diffDays = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24))) + 1;
    return diffDays;
  };

  const monthlyOverlappingStats = useMemo(() => {
    const months = [
      { num: 1, name: 'يناير' },
      { num: 2, name: 'فبراير' },
      { num: 3, name: 'مارس' },
      { num: 4, name: 'أبريل' },
      { num: 5, name: 'مايو' },
      { num: 6, name: 'يونيو' },
      { num: 7, name: 'يوليو' },
      { num: 8, name: 'أغسطس' },
      { num: 9, name: 'سبتمبر' },
      { num: 10, name: 'أكتوبر' },
      { num: 11, name: 'نوفمبر' },
      { num: 12, name: 'ديسمبر' },
    ];

    return months.map((m) => {
      let totalOverlappingDays = 0;
      let activeRecordsCount = 0;

      records.forEach((r) => {
        if (trackerLeaveType === 'all' || r.type === trackerLeaveType) {
          const overlap = getDaysInMonthForRecord(r, trackerYear, m.num);
          if (overlap > 0) {
            totalOverlappingDays += overlap;
            activeRecordsCount++;
          }
        }
      });

      return {
        monthNum: m.num,
        monthName: m.name,
        totalDays: totalOverlappingDays,
        casesCount: activeRecordsCount,
      };
    });
  }, [records, trackerYear, trackerLeaveType]);

  const selectedMonthDetails = useMemo(() => {
    const matchingRecords = records
      .filter((r) => trackerLeaveType === 'all' || r.type === trackerLeaveType)
      .map((r) => {
        const overlapDays = getDaysInMonthForRecord(r, trackerYear, trackerMonth);
        
        const rStart = parseYYYYMMDD(r.startDate);
        const rEnd = parseYYYYMMDD(r.endDate);
        const totalLeaveDuration = Math.max(1, Math.round((rEnd.getTime() - rStart.getTime()) / (1000 * 60 * 60 * 24))) + 1;

        return {
          record: r,
          overlapDays,
          totalLeaveDuration,
        };
      })
      .filter((item) => item.overlapDays > 0);

    const totalSickDays = matchingRecords.reduce((sum, item) => sum + item.overlapDays, 0);
    const totalCases = matchingRecords.length;
    const avgSickDays = totalCases > 0 ? (totalSickDays / totalCases).toFixed(1) : '0';
    const maxSickDays = totalCases > 0 ? Math.max(...matchingRecords.map((item) => item.overlapDays)) : 0;

    return {
      matchingRecords,
      totalSickDays,
      totalCases,
      avgSickDays,
      maxSickDays,
    };
  }, [records, trackerYear, trackerMonth, trackerLeaveType]);

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

  const filteredFirstAid = useMemo(() => {
    if (!firstAidSearch.trim()) return FIRST_AID_GUIDE;
    return FIRST_AID_GUIDE.filter(
      (item) =>
        item.title.includes(firstAidSearch) ||
        item.severity.includes(firstAidSearch) ||
        item.steps.some(step => step.includes(firstAidSearch))
    );
  }, [firstAidSearch]);

  // Dynamic Real-time Clinical Operational Ticker calculation
  const tickerItems = useMemo(() => {
    const pendingContacts = records.filter(r => r.contactStatus === 'pending' || !r.contactStatus).length;
    return [
      `🛡️ معدل جاهزية القوة الطبية للواء: ${medicalReadinessRate}%`,
      `📋 إجمالي ملفات الإجازات المسجلة: ${records.length} ملفاً بالمنظومة`,
      `🚨 إنذارات عودة الخدمة خلال 48 ساعة القادمة: ${urgentExpirations.length} حالات نشطة`,
      `💊 الإجازات المرضية النشطة سريرياً اليوم: ${activeLeavesCount} إجازة نشطة`,
      `🔒 بروتوكول أمن البيانات الموضعية: مشفر ومحمي 100% عسكرياً`,
      `🤝 منتسبين بحاجة لمتابعة الاتصال والتأكيد المباشر: ${pendingContacts} أفراد`
    ];
  }, [medicalReadinessRate, records, urgentExpirations.length, activeLeavesCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerItems.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [tickerItems.length]);

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

  if (!activeModalId) {
    return (
      <div className="flex flex-col items-center justify-start min-h-0 pt-0 pb-6 w-full text-right px-1 sm:px-3 overflow-hidden animate-fadeIn">
        {/* Real-time Operational Ticker Belt */}
        <div className="w-full max-w-2xl mb-5 bg-slate-100/60 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850/50 rounded-xl px-4 py-2 flex items-center justify-between gap-3 overflow-hidden text-right shadow-sm">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 font-mono bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-500/10 uppercase tracking-wider">LIVE FEED</span>
          </div>
          
          <div className="flex-1 overflow-hidden relative h-5 flex items-center justify-end">
            <motion.p
              key={tickerIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 select-none text-right w-full"
            >
              {tickerItems[tickerIndex]}
            </motion.p>
          </div>
        </div>

        {/* Tactical Search Engine & Global Command Bar */}
        <div className="w-full max-w-2xl mb-6 sm:mb-8 relative z-50">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 ابحث فوراً عن أي فرد بالاسم، الرتبة أو الرقم العسكري..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              className="w-full px-5 py-3 sm:py-3.5 pr-12 bg-white dark:bg-slate-900 border-2 border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 shadow-sm transition-all text-right"
            />
            <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            
            {globalSearchQuery && (
              <button
                onClick={() => setGlobalSearchQuery('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Dropdown Results */}
          {globalSearchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 max-h-60 overflow-y-auto">
              {records.filter(r => 
                r.name.includes(globalSearchQuery) || 
                r.rank.includes(globalSearchQuery) ||
                (r.unit && r.unit.includes(globalSearchQuery)) ||
                r.id.toLowerCase().includes(globalSearchQuery)
              ).length > 0 ? (
                records.filter(r => 
                  r.name.includes(globalSearchQuery) || 
                  r.rank.includes(globalSearchQuery) ||
                  (r.unit && r.unit.includes(globalSearchQuery)) ||
                  r.id.toLowerCase().includes(globalSearchQuery)
                ).slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setVerificationQuery(r.name);
                      setSelectedVerifiedRecordId(r.id);
                      setActiveModalId('verify');
                      setGlobalSearchQuery('');
                    }}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850/40 cursor-pointer transition-colors text-right"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">#{r.id}</span>
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">{r.rank} / {r.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-0.5">{r.unit || 'بدون لواء مخصص'} • التشخيص: {r.diagnosis}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 font-bold">
                  لم يتم العثور على أي منتسب بهذا الاسم أو الرقم العسكري
                </div>
              )}
            </div>
          )}
        </div>

        {/* Responsive App Launcher Grid */}
        <div className="w-full max-w-2xl grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-y-6 gap-x-3 sm:gap-x-6 md:gap-x-8 justify-items-center">
          {/* Item 1: AI Bulk Leave Registration */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveModalId('ai-bulk');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-2 cursor-pointer w-full text-center group"
          >
            <div className="aspect-square w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-[24%] bg-gradient-to-tr from-violet-500 to-indigo-650 flex items-center justify-center shadow-md group-hover:shadow-violet-500/20 transition-all relative">
              <Sparkles className="w-7 h-7 sm:w-9 sm:h-9 text-white group-hover:scale-110 transition-transform duration-200" />
              <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-violet-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
            </div>
            <div className="flex flex-col items-center mt-1">
              <span className="text-[10px] sm:text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-tight">
                التسجيل الجماعي بالذكاء
              </span>
              <span className="text-[8px] sm:text-[9px] text-violet-500 font-extrabold mt-0.5 bg-violet-50 dark:bg-violet-950/20 px-1.5 py-0.5 rounded">معالج ذكي</span>
            </div>
          </motion.div>

          {/* Item 2: Simulator */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModalId('simulator')}
            className="flex flex-col items-center gap-2 cursor-pointer w-full text-center group"
          >
            <div className="aspect-square w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-[24%] bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-md group-hover:shadow-amber-500/20 transition-all">
              <Stethoscope className="w-7 h-7 sm:w-9 sm:h-9 text-white group-hover:scale-110 transition-transform duration-200" />
            </div>
            <div className="flex flex-col items-center mt-1">
              <span className="text-[10px] sm:text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-tight">
                مستشار القرارات
              </span>
              <span className="text-[8px] sm:text-[9px] text-amber-500 font-extrabold mt-0.5 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">محاكاة ذكية</span>
            </div>
          </motion.div>

          {/* Item 3: Alarms */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModalId('alarms')}
            className="flex flex-col items-center gap-2 cursor-pointer w-full text-center group"
          >
            <div className="aspect-square w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-[24%] bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center shadow-md group-hover:shadow-rose-500/20 transition-all relative">
              <Bell className="w-7 h-7 sm:w-9 sm:h-9 text-white group-hover:scale-110 transition-transform duration-200" />
              {urgentExpirations.length > 0 && (
                <div className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[9px] sm:text-[10px] font-black w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-bounce shadow">
                  {urgentExpirations.length}
                </div>
              )}
            </div>
            <div className="flex flex-col items-center mt-1">
              <span className="text-[10px] sm:text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-tight">
                تنبيهات عودة القوة
              </span>
              <span className={`text-[8px] sm:text-[9px] font-extrabold mt-0.5 px-1.5 py-0.5 rounded ${urgentExpirations.length > 0 ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 animate-pulse' : 'bg-slate-50 text-slate-500 dark:bg-slate-850'}`}>
                {urgentExpirations.length} تنبيهات
              </span>
            </div>
          </motion.div>

          {/* Item 4: Calculator */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModalId('calculator')}
            className="flex flex-col items-center gap-2 cursor-pointer w-full text-center group"
          >
            <div className="aspect-square w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-[24%] bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center shadow-md group-hover:shadow-orange-500/20 transition-all">
              <Calculator className="w-7 h-7 sm:w-9 sm:h-9 text-white group-hover:scale-110 transition-transform duration-200" />
            </div>
            <div className="flex flex-col items-center mt-1">
              <span className="text-[10px] sm:text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-tight">
                حاسبة التواريخ الطبية
              </span>
              <span className="text-[8px] sm:text-[9px] text-orange-500 font-extrabold mt-0.5 bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5 rounded">تقدير آلي للعودة</span>
            </div>
          </motion.div>

          {/* Item 5: Guide */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModalId('guide')}
            className="flex flex-col items-center gap-2 cursor-pointer w-full text-center group"
          >
            <div className="aspect-square w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-[24%] bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-purple-500/20 transition-all">
              <BookOpen className="w-7 h-7 sm:w-9 sm:h-9 text-white group-hover:scale-110 transition-transform duration-200" />
            </div>
            <div className="flex flex-col items-center mt-1">
              <span className="text-[10px] sm:text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-tight">
                دليل فترات الاستشفاء
              </span>
              <span className="text-[8px] sm:text-[9px] text-purple-500 font-extrabold mt-0.5 bg-purple-50 dark:bg-purple-950/20 px-1.5 py-0.5 rounded">البروتوكول الطبي</span>
            </div>
          </motion.div>

          {/* Item 6: Charts & Analytics */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModalId('analytics')}
            className="flex flex-col items-center gap-2 cursor-pointer w-full text-center group"
          >
            <div className="aspect-square w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-[24%] bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md group-hover:shadow-emerald-500/20 transition-all">
              <FileBarChart className="w-7 h-7 sm:w-9 sm:h-9 text-white group-hover:scale-110 transition-transform duration-200" />
            </div>
            <div className="flex flex-col items-center mt-1">
              <span className="text-[10px] sm:text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-tight">
                المؤشرات والإحصائيات
              </span>
              <span className="text-[8px] sm:text-[9px] text-emerald-500 font-extrabold mt-0.5 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">تحليل الرتب والوحدات</span>
            </div>
          </motion.div>

          {/* Item 7: Add Record */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModalId('add-record')}
            className="flex flex-col items-center gap-2 cursor-pointer w-full text-center group"
          >
            <div className="aspect-square w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-[24%] bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-sky-500/20 transition-all">
              <UserPlus className="w-7 h-7 sm:w-9 sm:h-9 text-white group-hover:scale-110 transition-transform duration-200" />
            </div>
            <div className="flex flex-col items-center mt-1">
              <span className="text-[10px] sm:text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-tight">
                إضافة إجازة جديدة
              </span>
              <span className="text-[8px] sm:text-[9px] text-sky-500 font-extrabold mt-0.5 bg-sky-50 dark:bg-sky-950/20 px-1.5 py-0.5 rounded">تسجيل مباشر</span>
            </div>
          </motion.div>

          {/* Item 8: Reports Center */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (setCurrentPage) {
                setCurrentPage('reports');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex flex-col items-center gap-2 cursor-pointer w-full text-center group"
          >
            <div className="aspect-square w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-[24%] bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center shadow-md group-hover:shadow-teal-500/20 transition-all">
              <FileText className="w-7 h-7 sm:w-9 sm:h-9 text-white group-hover:scale-110 transition-transform duration-200" />
            </div>
            <div className="flex flex-col items-center mt-1">
              <span className="text-[10px] sm:text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-tight">
                كشوفات وتقارير اللواء
              </span>
              <span className="text-[8px] sm:text-[9px] text-teal-500 font-extrabold mt-0.5 bg-teal-50 dark:bg-teal-950/20 px-1.5 py-0.5 rounded">ملفات جاهزة للتصدير</span>
            </div>
          </motion.div>

          {/* Item 9: Database & Tools */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (setCurrentPage) {
                setCurrentPage('tools');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex flex-col items-center gap-2 cursor-pointer w-full text-center group"
          >
            <div className="aspect-square w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-[24%] bg-gradient-to-tr from-slate-500 to-zinc-600 flex items-center justify-center shadow-md group-hover:shadow-slate-500/20 transition-all">
              <Database className="w-7 h-7 sm:w-9 sm:h-9 text-white group-hover:scale-110 transition-transform duration-200" />
            </div>
            <div className="flex flex-col items-center mt-1">
              <span className="text-[10px] sm:text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-tight">
                أدوات صيانة النظام
              </span>
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-extrabold mt-0.5 bg-slate-50 dark:bg-slate-850 px-1.5 py-0.5 rounded">حالة المنظومة</span>
            </div>
          </motion.div>

          {/* Item 10: Pharmacy & Medication Inventory */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (setCurrentPage) {
                setCurrentPage('pharmacy');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex flex-col items-center gap-2 cursor-pointer w-full text-center group"
          >
            <div className="aspect-square w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-[24%] bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center shadow-md group-hover:shadow-emerald-500/20 transition-all relative">
              <Store className="w-7 h-7 sm:w-9 sm:h-9 text-white group-hover:scale-110 transition-transform duration-200" />
              {pharmacyStats.lowStock > 0 && (
                <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 text-[9px] sm:text-[10px] font-black w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse shadow">
                  {pharmacyStats.lowStock}
                </div>
              )}
            </div>
            <div className="flex flex-col items-center mt-1">
              <span className="text-[10px] sm:text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-tight">
                الصيدلية والمخزون الدوائي
              </span>
              <span className="text-[8px] sm:text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-0.5 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
                {pharmacyStats.totalItems} أصناف مسجلة
              </span>
            </div>
          </motion.div>

          {/* Item 11: Medical Board */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (setCurrentPage) {
                setCurrentPage('board');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex flex-col items-center gap-2 cursor-pointer w-full text-center group"
          >
            <div className="aspect-square w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-[24%] bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-md group-hover:shadow-indigo-500/20 transition-all">
              <Award className="w-7 h-7 sm:w-9 sm:h-9 text-white group-hover:scale-110 transition-transform duration-200" />
            </div>
            <div className="flex flex-col items-center mt-1">
              <span className="text-[10px] sm:text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-tight">
                اللجنة الطبية والخدمة
              </span>
              <span className="text-[8px] sm:text-[9px] text-indigo-500 font-extrabold mt-0.5 bg-indigo-50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded">أرشيف القرارات</span>
            </div>
          </motion.div>
        </div>

        {/* Localized Bottom Tip */}
        <div className="mt-8 text-[10px] text-slate-400 dark:text-slate-500 text-center font-bold">
          نظام الشؤون الطبية العسكرية المحمي للواء 43 عمالقة • السرية التامة والأمان الموضعي
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 text-right">
      {/* 1. Welcome and General Banner */}
      {activeModalId === 'analytics' && (
        <>
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
        </>
      )}

      {/* 2.1 Operational Gateways & Launcher Hub (Visible only when activeModalId === null) */}
      {!activeModalId && (
        <div className="space-y-6 animate-fadeIn text-right">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mt-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 justify-end">
              <span>بوابات التحكم ولوحات الإجراءات الطبية الفورية (٣ × ٣)</span>
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              لوحة تحكم تفاعلية وسريعة لتشغيل مختلف الأنظمة والإجراءات الطبية مباشرة دون الحاجة للتنقل أو التمرير الطويل.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {/* Gateway 1: AI Bulk Leave Registration */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={() => {
                setActiveModalId('ai-bulk');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-violet-500/30 transition-all text-right flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-violet-500 via-indigo-500 to-purple-500 opacity-80" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black px-2 py-1 rounded-full bg-violet-500/10 text-violet-500">
                    معالج الذكاء الاصطناعي الذكي
                  </span>
                  <div className="p-2.5 bg-violet-50 dark:bg-violet-950/30 text-violet-500 rounded-xl group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5 text-violet-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">بوابة التسجيل الجماعي الذكي بالذكاء الاصطناعي</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    إدخال نصوص وتقارير متنوعة ليرتبها الذكاء الاصطناعي ويصنف الأسماء والإجازات تلقائياً تمهيداً لمراجعتها واعتمادها دفعة واحدة.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 mt-4 flex justify-between items-center text-[10px] text-violet-600 dark:text-violet-400 font-bold">
                <span>انقر لفتح المعالج</span>
                <span className="font-sans">←</span>
              </div>
            </motion.div>

            {/* Gateway 2: Medical Advisor & Simulator */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={() => {
                setActiveModalId('simulator');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all text-right flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-amber-500 to-indigo-500 opacity-80" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black px-2 py-1 rounded-full bg-amber-500/10 text-amber-500">
                    بروتوكول اللواء القياسي
                  </span>
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">مستشار ومحاكي القرارات الطبية</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    مطابقة وتدقيق توصيات الإجازات للبروتوكولات الطبية المعتمدة للواء 43، ومحاكاة جاهزية الأفراد للخدمة.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 mt-4 flex justify-between items-center text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                <span>انقر لفتح البوابة</span>
                <span className="font-sans">←</span>
              </div>
            </motion.div>

            {/* Gateway 3: Alarms & Force Strength */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={() => {
                setActiveModalId('alarms');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-rose-500/30 transition-all text-right flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-rose-500 via-amber-500 to-rose-500 opacity-80" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full ${
                    urgentExpirations.length > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {urgentExpirations.length > 0 ? `${urgentExpirations.length} إنذار انتهاء عاجل` : 'الجاهزية الطبية ممتازة'}
                  </span>
                  <div className={`p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-xl group-hover:scale-110 transition-transform ${
                    urgentExpirations.length > 0 ? 'animate-bounce' : ''
                  }`}>
                    <Bell className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">تنبيهات عودة القوة العاجلة</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    متابعة يومية للأفراد الذين شارفت فترات استشفاؤهم على الانتهاء لضمان التنسيق وعودتهم للكتائب بفعالية.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 mt-4 flex justify-between items-center text-[10px] text-rose-500 font-bold">
                <span>انقر لفتح البوابة</span>
                <span className="font-sans">←</span>
              </div>
            </motion.div>

            {/* Gateway 4: Smart Calculator */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={() => {
                setActiveModalId('calculator');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all text-right flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-orange-500 to-amber-500 opacity-80" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black px-2 py-1 rounded-full bg-orange-500/10 text-orange-500">
                    حاسبة تواريخ دقيقة
                  </span>
                  <div className="p-2.5 bg-orange-50 dark:bg-orange-950/30 text-orange-500 rounded-xl group-hover:scale-110 transition-transform">
                    <Calculator className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">حاسبة التواريخ الطبية الذكية</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    الحساب الفوري الذكي والآلي لتاريخ عودة القوة وإغلاق الملفات مع الصياغة العربية العسكرية الرسمية.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 mt-4 flex justify-between items-center text-[10px] text-orange-500 font-bold">
                <span>انقر لفتح البوابة</span>
                <span className="font-sans">←</span>
              </div>
            </motion.div>

            {/* Gateway 5: Recovery Guide */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={() => {
                setActiveModalId('guide');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all text-right flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-purple-500 to-indigo-500 opacity-80" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black px-2 py-1 rounded-full bg-purple-500/10 text-purple-500">
                    دليل بروتوكولات الشفاء
                  </span>
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-950/30 text-purple-500 rounded-xl group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">دليل معايير فترات الاستشفاء</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    دليل تفاعلي للبحث المدمج والتعرف الفوري على مدد التعافي وتوصيات الشؤون الطبية واللجان المتخصصة.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 mt-4 flex justify-between items-center text-[10px] text-purple-500 font-bold">
                <span>انقر لفتح البوابة</span>
                <span className="font-sans">←</span>
              </div>
            </motion.div>

            {/* Gateway 6: Charts & Analytics */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={() => {
                setActiveModalId('analytics');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all text-right flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-emerald-500 to-teal-500 opacity-80" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                    مخططات إحصائية حية
                  </span>
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">المؤشرات البيانية وغياب الكتائب</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    مؤشرات ورسوم بيانية مدمجة لقياس التوزع الطبي حسب الكتائب والسرايا وتحليل تصنيفات المرضى.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 mt-4 flex justify-between items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span>انقر لفتح البوابة</span>
                <span className="font-sans">←</span>
              </div>
            </motion.div>

            {/* Gateway 7: Fast Record Addition */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={() => {
                setActiveModalId('add-record');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all text-right flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-blue-500 to-indigo-500 opacity-80" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">
                    تسجيل سريع ومباشر
                  </span>
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                    <UserPlus className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">إضافة إجازة مرضية جديدة</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    تسجيل مباشر وسريع لحالة مرضية جديدة لمنتسبي اللواء مع احتساب تلقائي لتواريخ العودة وصياغة الملف.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 mt-4 flex justify-between items-center text-[10px] text-blue-500 font-bold">
                <span>انقر لفتح البوابة</span>
                <span className="font-sans">←</span>
              </div>
            </motion.div>

            {/* Gateway 8: Medical Reports Center */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={() => {
                if (setCurrentPage) {
                  setCurrentPage('reports');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all text-right flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-teal-500 to-emerald-500 opacity-80" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black px-2 py-1 rounded-full bg-teal-500/10 text-teal-500">
                    تحميل وتصدير الكشوفات
                  </span>
                  <div className="p-2.5 bg-teal-50 dark:bg-teal-950/30 text-teal-500 rounded-xl group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">مركز التقارير المعتمدة</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    إنشاء التقارير التفصيلية الموجهة للقيادة وتصدير بيانات منتسبي اللواء لملفات Excel وطباعتها.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 mt-4 flex justify-between items-center text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                <span>انقر لفتح البوابة</span>
                <span className="font-sans">←</span>
              </div>
            </motion.div>

            {/* Gateway 9: Database & Tools */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={() => {
                if (setCurrentPage) {
                  setCurrentPage('tools');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-slate-500/30 transition-all text-right flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-slate-500 to-indigo-950 opacity-80" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black px-2 py-1 rounded-full bg-slate-500/10 text-slate-500">
                    النسخ الاحتياطي والصيانة
                  </span>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-850 text-slate-500 rounded-xl group-hover:scale-110 transition-transform">
                    <Database className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">أدوات النظام وصيانة البيانات</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    نسخ السجلات والملفات الطبية احتياطياً واستيرادها أو استعادة ضبط النظام لضمان استقرار العمل الطبي للواء.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 mt-4 flex justify-between items-center text-[10px] text-slate-500 font-bold">
                <span>انقر لفتح البوابة</span>
                <span className="font-sans">←</span>
              </div>
            </motion.div>

            {/* Gateway 10: Pharmacy & Medical Inventory */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={() => {
                if (setCurrentPage) {
                  setCurrentPage('pharmacy');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all text-right flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-emerald-600 to-teal-500 opacity-80" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                    {pharmacyStats.totalItems} أصناف طبية
                  </span>
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                    <Store className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">صيدلية اللواء والمخزون الطبي الميداني</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    مراقبة وتتبع المخزون الدوائي الميداني وعواصب النزيف، وإجراء عمليات الصرف للكتائب وتوريد الشحنات الطارئة للجبهات.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 mt-4 flex justify-between items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span>انقر لفتح البوابة</span>
                <span className="font-sans">←</span>
              </div>
            </motion.div>

            {/* Gateway 11: Medical Board */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={() => {
                if (setCurrentPage) {
                  setCurrentPage('board');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all text-right flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-indigo-500 to-violet-500 opacity-80" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-500">
                    اللجنة الطبية العليا للوجهاء
                  </span>
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl group-hover:scale-110 transition-transform">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">قرارات اللياقة والخدمة العسكرية</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    توثيق محاضر وقرارات اللجنة الطبية لتقدير اللياقة، وعزل الحالات المستديمة وتوزيع المهام الإدارية البديلة للمصابين.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 mt-4 flex justify-between items-center text-[10px] text-indigo-500 font-bold">
                <span>انقر لفتح البوابة</span>
                <span className="font-sans">←</span>
              </div>
            </motion.div>

            {/* Gateway 12: Hospital Referrals Portal */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={() => {
                setActiveModalId('referrals');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all text-right flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-blue-600 via-indigo-600 to-sky-500 opacity-80" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">
                    خطابات إحالة رسمية مصدقة
                  </span>
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">متابع وإحالات المستشفيات العسكرية</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    إصدار خطابات إحالة رسمية للمستشفيات التخصصية، ومتابعة الفحوصات الخارجية والتقارير الطبية المصدقة.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 mt-4 flex justify-between items-center text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                <span>انقر لفتح البوابة</span>
                <span className="font-sans">←</span>
              </div>
            </motion.div>

            {/* Gateway 13: Light-Duty Assignment Protocol */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={() => {
                setActiveModalId('reassignment');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all text-right flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-amber-500 via-orange-500 to-yellow-500 opacity-80" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black px-2 py-1 rounded-full bg-amber-500/10 text-amber-500">
                    توصيات التكيف والجاهزية
                  </span>
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">بروتوكول التكليف بالمهام البديلة</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    محاكاة مستويات العجز المؤقت، وتعيين الجرحى والمصابين المتعافين جزئياً في مهام حراسة وإدارة خفيفة ملائمة.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 mt-4 flex justify-between items-center text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                <span>انقر لفتح البوابة</span>
                <span className="font-sans">←</span>
              </div>
            </motion.div>

            {/* Gateway 14: Campaign Supply Forecasting */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={() => {
                setActiveModalId('campaign');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all text-right flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-emerald-500 via-teal-500 to-indigo-600 opacity-80" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                    اللوجستيات الطبية للجبهة
                  </span>
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">مخطط التموين اللوجستي والعمليات</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    حساب وتوقع الاستهلاك الدوائي والمستلزمات الطبية في المهام العسكرية الميدانية بناء على قوام القوة وشدة الاشتباك.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 mt-4 flex justify-between items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span>انقر لفتح البوابة</span>
                <span className="font-sans">←</span>
              </div>
            </motion.div>

            {/* Gateway 15: Monthly Sick Leave Days Tracker */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={() => {
                setActiveModalId('monthly-tracker');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-pink-500/30 transition-all text-right flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-pink-500 via-rose-500 to-indigo-500 opacity-80" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black px-2 py-1 rounded-full bg-pink-500/10 text-pink-500">
                    متابعة الإحصائيات الشهرية
                  </span>
                  <div className="p-2.5 bg-pink-50 dark:bg-pink-950/30 text-pink-500 rounded-xl group-hover:scale-110 transition-transform">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">متابع الإجازات المرضية الشهرية</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    عرض إجمالي أيام الإجازات المرضية المرفوعة في أي شهر محدد، مع اختيار وتصفح الإحصائيات التفصيلية لكل شهر.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 mt-4 flex justify-between items-center text-[10px] text-pink-600 dark:text-pink-400 font-bold">
                <span>انقر لفتح البوابة</span>
                <span className="font-sans">←</span>
              </div>
            </motion.div>


          </motion.div>

          {/* Security / System Tip & Information Card */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-900/40 dark:to-slate-900/10 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm text-right flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-white">الأمان والخصوصية العسكرية المطلقة للواء 43 عمالقة</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  يعمل هذا النظام بشكل محلي بالكامل ومستقل عن أي خوادم سحابية خارجية لحماية خصوصية وسرية المعلومات الطبية العسكرية وبيانات الأفراد والجاهزية القتالية.
                </p>
              </div>
            </div>
            <span className="text-[9px] text-slate-405 shrink-0 bg-slate-200/50 dark:bg-slate-800/50 px-2 py-1 rounded font-mono">
              يرجى تصدير نسخة احتياطية من البيانات دورياً للحفاظ على سلامة الأرشيف الرقمي.
            </span>
          </div>
        </div>
      )}

          {/* Panel A: Interactive Quick ID/Name Medical Verification Portal */}
          {activeModalId === 'verify' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-5 md:p-6 shadow-md text-right flex flex-col justify-between relative overflow-hidden max-w-4xl mx-auto w-full">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-indigo-500 to-purple-500" />
          
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-xl">
                  <UserCheck className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">
                    بوابة التحقق الفوري والمتابعة السريعة للأفراد (v3.0.0)
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                    النظام القياسي الموحد لتعقب الامتثال الطبي والاستشفاء الميداني لمنتسبي اللواء 43 عمالقة.
                  </p>
                </div>
              </div>
              
              {selectedVerifiedRecord && (
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/25 animate-pulse">
                  رصد عملياتي مباشر
                </span>
              )}
            </div>

            {/* Search Input and Suggestions */}
            <div className="relative mb-5">
              <input
                type="text"
                placeholder="اكتب اسم الجندي، رتبته، أو الرقم العسكري للاستعلام الفوري..."
                value={verificationQuery}
                onChange={(e) => {
                  setVerificationQuery(e.target.value);
                  if (!e.target.value) {
                    setSelectedVerifiedRecordId('');
                    setVerifySubTab('info');
                  }
                }}
                className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-right placeholder-slate-400 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute top-3.5 right-3" />

              {/* Suggestions Dropdown */}
              {suggestedRecords.length > 0 && !selectedVerifiedRecordId && (
                <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {suggestedRecords.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedVerifiedRecordId(r.id);
                        setVerificationQuery(r.name);
                        setVerifySubTab('info');
                      }}
                      className="w-full text-right px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 flex justify-between items-center transition-colors font-bold"
                    >
                      <span className="text-slate-850 dark:text-slate-200">{r.rank} / {r.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.2 rounded font-sans">{r.unit}</span>
                        <span className="text-[9px] text-slate-400 font-mono">#{r.id.substring(4, 9)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Info & Action Card */}
            {selectedVerifiedRecord ? (
              <div className="space-y-4">
                {/* Internal sub-tabs navigation */}
                <div className="flex border-b border-slate-150 dark:border-slate-850 pb-px text-right justify-start gap-1 overflow-x-auto select-none">
                  {[
                    { id: 'info', label: 'الملف والمتابعة 📋' },
                    { id: 'compliance', label: 'الالتزام والشفاء 📊' },
                    { id: 'geotrack', label: 'التموضع والرادار 📡' },
                    { id: 'fitness', label: 'إقرار اللياقة والالتحاق 📜' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setVerifySubTab(tab.id as any)}
                      className={`px-3.5 py-2 text-[11px] font-black transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                        verifySubTab === tab.id
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-black'
                          : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sub Tab Content 1: Main Info & Actions */}
                {verifySubTab === 'info' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-3.5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <h4 className="font-black text-xs text-slate-900 dark:text-white">
                            {selectedVerifiedRecord.rank} / {selectedVerifiedRecord.name}
                          </h4>
                          <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                            الرقم العسكري: Mil-43-{selectedVerifiedRecord.id.substring(4, 9).toUpperCase()} | الكتيبة: {selectedVerifiedRecord.unit || 'اللواء 43 عمالقة'}
                          </span>
                        </div>

                        {/* Status Badge */}
                        {(() => {
                          const today = new Date(todayStr);
                          const start = new Date(selectedVerifiedRecord.startDate);
                          const end = new Date(selectedVerifiedRecord.endDate);
                          let badgeColor = '';
                          let label = '';
                          let daysText = '';

                          if (today < start) {
                            badgeColor = 'bg-indigo-500 text-white';
                            label = 'إجازة مستقبلية';
                            const diff = Math.ceil((start.getTime() - today.getTime()) / (1000*60*60*24));
                            daysText = `تبدأ خلال ${diff} يوم`;
                          } else if (today > end) {
                            badgeColor = 'bg-rose-500 text-white animate-pulse';
                            label = 'منتهية - يجب العودة';
                            const diff = Math.ceil((today.getTime() - end.getTime()) / (1000*60*60*24));
                            daysText = `متأخر منذ ${diff} يوم ⚠️`;
                          } else {
                            badgeColor = 'bg-emerald-500 text-white';
                            label = 'نشطة حالياً';
                            const diff = Math.ceil((end.getTime() - today.getTime()) / (1000*60*60*24));
                            daysText = `ينتهي الاستشفاء بعد ${diff} يوم`;
                          }

                          return (
                            <div className="text-right sm:text-left shrink-0">
                              <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${badgeColor}`}>
                                {label}
                              </span>
                              <span className="text-[9px] text-slate-400 block mt-1 font-mono">
                                {daysText}
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <div>
                          <span className="text-slate-400 block font-bold mb-0.5">التشخيص الطبي الحالي:</span>
                          <span className="font-black text-slate-800 dark:text-slate-200">{selectedVerifiedRecord.diagnosis}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold mb-0.5">الجهة الطبية المانحة:</span>
                          <span className="font-black text-slate-800 dark:text-slate-200">{selectedVerifiedRecord.issuer}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[11px]">
                        <div>
                          <span className="text-slate-400 block font-bold mb-0.5">تاريخ بدء الاستشفاء:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{selectedVerifiedRecord.startDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold mb-0.5">تاريخ عودة واستئناف الخدمة:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{selectedVerifiedRecord.endDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Call and Broadcast Widgets Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Audio voice call launcher card */}
                      <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-500/10 rounded-2xl flex flex-col justify-between space-y-2">
                        <div className="flex items-center gap-2 justify-start">
                          <span className="text-lg">📞</span>
                          <div>
                            <span className="text-[10px] font-black text-indigo-500 block">الاتصال الميداني المباشر</span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block leading-none">إجراء محادثة صوتية مشفرة</span>
                          </div>
                        </div>
                        <button
                          onClick={() => startSimulatedCall(selectedVerifiedRecord)}
                          className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-[10px] rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>📞 بدء المكالمة الميدانية الصوتية</span>
                        </button>
                      </div>

                      {/* Satellite Recall dispatch */}
                      <div className="p-3 bg-cyan-50/40 dark:bg-cyan-950/10 border border-cyan-500/10 rounded-2xl flex flex-col justify-between space-y-2">
                        <div className="flex items-center gap-2 justify-start">
                          <span className="text-lg">📡</span>
                          <div>
                            <span className="text-[10px] font-black text-cyan-500 block">البث البرقي عبر الأقمار</span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block leading-none">إصدار بلاغ استدعاء فوري</span>
                          </div>
                        </div>
                        <button
                          onClick={handleRadioRecallBroadcast}
                          disabled={radioSimulationStep > 0}
                          className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 disabled:opacity-50 text-white font-black text-[10px] rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <span>📡 بث نداء عسكري لاسلكي عاجل</span>
                        </button>
                      </div>
                    </div>

                    {/* Instant Contact Status Editor */}
                    <div className="pt-3 border-t border-slate-150 dark:border-slate-800 space-y-2.5">
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 block">
                        تحديث حالة التواصل والمتابعة يدوياً:
                      </span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <select
                            value={quickContactStatus}
                            onChange={(e) => setQuickContactStatus(e.target.value as any)}
                            className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-[10px] text-slate-750 dark:text-slate-300 font-bold focus:outline-none"
                          >
                            <option value="pending">قيد المتابعة والانتظار</option>
                            <option value="confirmed">تم تأكيد العودة والالتحاق</option>
                            <option value="no_answer">لا يرد على الاتصال هاتفياً</option>
                            <option value="request_extension">طلب تمديد رسمي مع التقرير</option>
                            <option value="evading">متهرب عسكرياً ومقفل هاتفياً</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <input
                            type="text"
                            placeholder="أدخل ملاحظة المتابعة السريعة..."
                            value={quickContactNote}
                            onChange={(e) => setQuickContactNote(e.target.value)}
                            className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-[10px] text-slate-700 dark:text-slate-300 focus:outline-none text-right placeholder-slate-400 font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleQuickContactSave}
                          disabled={!onUpdate || !quickContactStatus}
                          className="flex-1 py-2 bg-slate-800 hover:bg-slate-950 disabled:opacity-50 text-white font-black text-[10px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>حفظ التحديث وتوثيق السجل فوراً</span>
                        </button>
                        
                        <button
                          onClick={() => setShowDigitalCard(true)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-black text-[10px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                        >
                          <span>🪪 إصدار بطاقة ميدانية رقمية</span>
                        </button>
                      </div>

                      {/* Exceptional Military Medical Committee Decisions Panel */}
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-850 space-y-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-150 dark:border-slate-800 text-right">
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-extrabold text-[11px]">
                          <span>🩺</span>
                          <span>قرارات اللجنة الطبية العسكرية الاستثنائية للواء 43</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 block">مدة التمديد الاستثنائي</label>
                            <select
                              value={committeeExtDays}
                              onChange={(e) => setCommitteeExtDays(Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                            >
                              <option value="7">تمديد ٧ أيام (أسبوع)</option>
                              <option value="15">تمديد ١٥ يوماً (نصف شهر)</option>
                              <option value="30">تمديد ٣٠ يوماً (شهر كامل)</option>
                              <option value="45">تمديد ٤٥ يوماً (أقسام عظام)</option>
                              <option value="60">تمديد ٦٠ يوماً (لجنة مركزية)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 block">توضيح الدواعي الطبية للطلب</label>
                            <input
                              type="text"
                              placeholder="مثال: استكمال برنامج العلاج الطبيعي للكسر..."
                              value={committeeNotes}
                              onChange={(e) => setCommitteeNotes(e.target.value)}
                              className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-[10px] text-slate-700 dark:text-slate-300 focus:outline-none text-right"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleCommitteeExtension}
                          disabled={!onUpdate}
                          className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-[10px] rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>📜</span>
                          <span>إقرار التمديد الطبي وإصدار مستند القرار الرسمي</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab Content 2: Compliance Metrics & Progress */}
                {verifySubTab === 'compliance' && (
                  <div className="space-y-4 animate-fadeIn text-right">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Metric Card A: Compliance Score */}
                      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-3 flex flex-col justify-between">
                        <span className="text-[10px] font-black text-slate-400 block uppercase">تقييم نسبة الالتزام والامتثال</span>
                        
                        <div className="flex items-center justify-between">
                          {/* Compliance state gauge */}
                          {(() => {
                            const status = selectedVerifiedRecord.contactStatus || 'pending';
                            let score = 60;
                            let rating = 'مستقر ومقبول';
                            let ratingColor = 'text-amber-500 bg-amber-500/10 border-amber-500/25';
                            
                            if (status === 'confirmed') {
                              score = 100;
                              rating = 'مثالي ومنضبط';
                              ratingColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25';
                            } else if (status === 'request_extension') {
                              score = 85;
                              rating = 'تحت الإشراء واللجنة';
                              ratingColor = 'text-indigo-500 bg-indigo-500/10 border-indigo-500/25';
                            } else if (status === 'no_answer') {
                              score = 35;
                              rating = 'حالة حرجة / لم يرد';
                              ratingColor = 'text-orange-500 bg-orange-500/10 border-orange-500/25';
                            } else if (status === 'evading') {
                              score = 10;
                              rating = 'متهرب ومخالف';
                              ratingColor = 'text-rose-500 bg-rose-500/10 border-rose-500/25 animate-pulse';
                            }

                            return (
                              <>
                                <div className="space-y-1">
                                  <span className="text-2xl font-black text-slate-800 dark:text-white font-mono">{score}%</span>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border block text-center ${ratingColor}`}>{rating}</span>
                                </div>
                                <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                                  <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-slate-800" fill="transparent" />
                                    <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" className={score === 100 ? 'text-emerald-500' : score >= 80 ? 'text-indigo-500' : score >= 50 ? 'text-amber-500' : 'text-rose-500'} fill="transparent" strokeDasharray={150.7} strokeDashoffset={150.7 - (150.7 * score) / 100} />
                                  </svg>
                                  <span className="absolute text-[10px] font-bold font-mono">G43</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-bold pt-1 border-t border-slate-50 dark:border-slate-850">
                          يتم حساب درجة الامتثال العسكري بناءً على سرعة الاستجابة لنداء الاتصالات والامتثال لبروتوكول الفحص الدوري للشعبة الطبية.
                        </p>
                      </div>

                      {/* Metric Card B: Leave consumption Ratio */}
                      {(() => {
                        const start = new Date(selectedVerifiedRecord.startDate);
                        const end = new Date(selectedVerifiedRecord.endDate);
                        const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000*60*60*24)));
                        const today = new Date(todayStr);
                        const elapsedDays = Math.max(0, Math.min(totalDays, Math.ceil((today.getTime() - start.getTime()) / (1000*60*60*24))));
                        const pct = Math.round((elapsedDays / totalDays) * 100);

                        return (
                          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-3 flex flex-col justify-between">
                            <span className="text-[10px] font-black text-slate-400 block uppercase">استهلاك الإجازة المرضية وتماثل الأنسجة</span>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-500">تم {pct}% من الراحة المحددة</span>
                                <span className="text-xs font-black text-slate-800 dark:text-white font-mono">{elapsedDays} / {totalDays} يوم</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden relative">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>

                            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-bold pt-1 border-t border-slate-50 dark:border-slate-850">
                              توصي الإدارة الطبية بالتقيد بجدول الاستراحة المحدد، ومراعاة عدم إجهاض فترة الاستشفاء لضمان الالتحام السليم للأطراف المصابة.
                            </p>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Timeline Log of Previous Contacts */}
                    <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-150 dark:border-slate-850/80 p-4 space-y-3">
                      <span className="text-[10px] font-black text-indigo-500 block">خط التواصل التاريخي وسجل رصد الفرد:</span>
                      
                      <div className="max-h-44 overflow-y-auto pr-1 space-y-2 divide-y divide-slate-100 dark:divide-slate-850">
                        {selectedVerifiedRecord.contactLogs && selectedVerifiedRecord.contactLogs.length > 0 ? (
                          selectedVerifiedRecord.contactLogs.map((log, i) => (
                            <div key={i} className="pt-2 text-[10px] flex justify-between items-start gap-3">
                              <div className="space-y-1">
                                <span className="font-extrabold text-slate-700 dark:text-slate-200 block">{log.note}</span>
                                <span className="text-[9px] text-slate-400 block font-mono">{log.date}</span>
                              </div>
                              <span className={`text-[8px] px-2 py-0.5 rounded font-black shrink-0 ${
                                log.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15' :
                                log.status === 'request_extension' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/15' :
                                log.status === 'evading' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/15 animate-pulse' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}>
                                {log.status === 'confirmed' ? 'تم الرد والالتحاق' :
                                 log.status === 'request_extension' ? 'تم طلب تمديد' :
                                 log.status === 'evading' ? 'مخالف متهرب' :
                                 log.status === 'no_answer' ? 'لم يرد على الاتصال' : 'قيد المتابعة'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-slate-400 py-6 text-[10px] font-bold">
                            لا توجد أي سجلات اتصالات مؤرشفة لهذا المنتسب حالياً.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab Content 3: Satellite Geolocation Radar Visualization */}
                {verifySubTab === 'geotrack' && (
                  <div className="space-y-4 animate-fadeIn text-right">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Radar screen element */}
                      <div className="p-4 bg-slate-950 dark:bg-black border border-slate-800 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden h-52">
                        {/* CSS Radar sweep animation */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.06)_1%,transparent_60%)] pointer-events-none" />
                        <div className="absolute w-44 h-44 rounded-full border border-cyan-500/20 flex items-center justify-center">
                          <div className="absolute w-32 h-32 rounded-full border border-cyan-500/15 flex items-center justify-center">
                            <div className="absolute w-16 h-16 rounded-full border border-cyan-500/10" />
                          </div>
                        </div>
                        
                        {/* Radar sweep light overlay */}
                        <div className="absolute w-24 h-24 border-r-2 border-t-2 border-cyan-500/35 rounded-full animate-spin pointer-events-none" style={{ transformOrigin: 'center', animationDuration: '4s' }} />

                        {/* Blip locator mark */}
                        <div className="absolute top-1/3 left-1/4 w-3.5 h-3.5 flex items-center justify-center">
                          <span className="absolute w-full h-full bg-cyan-500 rounded-full animate-ping opacity-75" />
                          <span className="w-2 h-2 bg-cyan-400 rounded-full border border-white" />
                        </div>

                        <span className="text-[8px] font-mono text-cyan-500 absolute bottom-3 right-3 select-none">SCAN: ACTIVE SECURE LINK</span>
                        <Compass className="w-10 h-10 text-cyan-500/40 animate-pulse" />
                        <span className="text-[10px] font-mono text-cyan-400 mt-2 tracking-widest animate-pulse font-bold">SATELLITE BEACON SYNCING...</span>
                      </div>

                      {/* Technical specifications panel */}
                      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col justify-between">
                        <span className="text-[10px] font-black text-slate-400 block uppercase">مواصفات التموضع الجغرافي والاتصال</span>
                        
                        <div className="space-y-2 text-[10px] pt-1">
                          <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-850 pb-1.5">
                            <span className="font-bold text-slate-400">إحداثيات الرصد:</span>
                            <span className="font-mono text-slate-800 dark:text-slate-200">13.{selectedVerifiedRecord.id.charCodeAt(0)}54° N, 43.{selectedVerifiedRecord.id.charCodeAt(1)}41° E</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-850 pb-1.5">
                            <span className="font-bold text-slate-400">منطقة البث:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">الساحل الغربي - قطاع {selectedVerifiedRecord.unit || 'محيط اللواء'}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-850 pb-1.5">
                            <span className="font-bold text-slate-400">حالة النطاق الطبي:</span>
                            <span className="font-extrabold text-emerald-500">🟢 متطابق مع التقرير والالتزام</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-850 pb-1.5">
                            <span className="font-bold text-slate-400">جودة الإشارة اللاسلكية:</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">89% (قوي ومستقر - AMANSAT-4)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-400">الهوائي والاتصالات:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">الشبكة الرقمية العسكرية الآمنة v3</span>
                          </div>
                        </div>

                        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl text-[9px] text-slate-500 leading-relaxed font-bold">
                          ⚠️ <strong>تنبيه الرقابة الأمنية:</strong> الرصد الجغرافي محاكاة قائمة على موقع معسكرات اللواء 43 عمالقة وشبكة التغطية الوطنية. يلتزم الفرد بعدم مغادرة النطاق دون تصريح.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab Content 4: Fitness Assessment / Resumption Duty Clearance */}
                {verifySubTab === 'fitness' && (
                  <div className="space-y-4 animate-fadeIn text-right">
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-4">
                      <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs">
                        <ShieldCheck className="w-4 h-4" />
                        <span>تقييم الأهلية والتحقق من الجاهزية الطبية للالتحاق الفوري بالجبهات</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 block">تصنيف اللياقة الطبية للمثول:</label>
                          <select
                            value={customFitnessDecision}
                            onChange={(e) => setCustomFitnessDecision(e.target.value as any)}
                            className="w-full px-2.5 py-2 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                          >
                            <option value="fit">🟢 لائق عسكرياً وبدنياً للخدمة الميدانية الكاملة</option>
                            <option value="light_duty">🟡 لائق لخدمة مكتبية خفيفة / حراسة عادية ومحدودة</option>
                            <option value="unfit">🔴 غير لائق حالياً ويقترح تمديد الإجازة الاستشفائية</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 block">توجيهات اللجنة الطبية المرافقة:</label>
                          <input
                            type="text"
                            value={fitnessCommitteeNotes}
                            onChange={(e) => setFitnessCommitteeNotes(e.target.value)}
                            placeholder="مثال: يلتزم المذكور بالفحص الطبي الدوري كل شهر للتأكد..."
                            className="w-full px-2.5 py-2 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-[10px] text-slate-700 dark:text-slate-300 focus:outline-none text-right placeholder-slate-400"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleCustomFitnessSubmit}
                        disabled={!onUpdate}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-[11px] rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Award className="w-4 h-4" />
                        <span>إصدار شهادة اللياقة الطبية العسكرية ووثيقة إذن العودة</span>
                      </button>
                    </div>

                    {/* Fitness Clearance Receipt print preview overlay */}
                    {showFitnessReceipt && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 text-right overflow-y-auto"
                      >
                        <motion.div
                          initial={{ scale: 0.95, y: 15 }}
                          animate={{ scale: 1, y: 0 }}
                          className="bg-white text-slate-900 border-2 border-slate-300 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative my-8"
                        >
                          {/* Yemeni flag top border */}
                          <div className="absolute top-0 left-0 right-0 h-1.5 flex">
                            <div className="w-1/3 h-full bg-red-600" />
                            <div className="w-1/3 h-full bg-white" />
                            <div className="w-1/3 h-full bg-black" />
                          </div>

                          {/* Document Header */}
                          <div className="text-center space-y-1 mb-5 border-b border-slate-200 pb-4 mt-2">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">الجمهورية اليمنية - وزارة الدفاع</h4>
                            <h3 className="text-xs font-black text-slate-800">ألوية العمالقة - اللواء 43 عمالقة</h3>
                            <h2 className="text-sm font-black text-indigo-700">شهادة اللياقة الطبية العسكرية واستئناف الواجب الميداني</h2>
                            <div className="text-[9px] text-slate-400 font-mono mt-1">رمز التحقق الطبي: CERT-FIT-{Math.floor(100000 + Math.random() * 900000)}</div>
                          </div>

                          {/* Official Text of Clearance */}
                          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 font-sans text-xs leading-relaxed text-slate-800">
                            <p>
                              تشهد الإدارة الطبية والشؤون العلاجية للواء 43 عمالقة بالقطاع الميداني، بأنه بعد مثول ومراجعة حالة الفرد الموضح بياناته تالياً:
                            </p>

                            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                              <div>الاسم واللقب: <strong className="text-slate-900">{selectedVerifiedRecord.name}</strong></div>
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div>الرتبة العسكرية: <strong className="text-slate-900">{selectedVerifiedRecord.rank}</strong></div>
                                <div>رقم الهوية: <strong className="text-slate-900">Mil-43-{selectedVerifiedRecord.id.substring(4, 9).toUpperCase()}</strong></div>
                              </div>
                              <div>الكتيبة/الوحدة: <strong className="text-slate-900">{selectedVerifiedRecord.unit || 'اللواء 43 عمالقة'}</strong></div>
                              <div>التشخيص الطبي المنقضي: <strong className="text-indigo-600">{selectedVerifiedRecord.diagnosis}</strong></div>
                            </div>

                            <p>
                              وبعد التحقق السريري والفحص اللازم، تقر اللجنة الطبية بالقرار العملياتي التالي:
                            </p>

                            <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-center">
                              <span className="text-[10px] text-emerald-600 block">حالة اللياقة العسكرية المعتمدة:</span>
                              <span className="text-sm font-black text-emerald-700">
                                {customFitnessDecision === 'fit' ? 'لائق طبياً وبدنياً للخدمة الميدانية الكاملة' :
                                 customFitnessDecision === 'light_duty' ? 'لائق للخدمات الخفيفة والمهام الإدارية والمكتبية فقط' :
                                 'غير لائق طبياً مؤقتاً ويستلزم مواصلة برنامج الاستشفاء'}
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-500 italic">
                              <strong>توجيهات اللجنة الاستشفائية:</strong> {fitnessCommitteeNotes}
                            </div>
                          </div>

                          {/* Signatures & Stamps */}
                          <div className="mt-5 pt-3 flex justify-between items-center text-[10px] border-t border-slate-100">
                            {/* Approved Stamp */}
                            <div className="border-2 border-dashed border-emerald-500 rounded-xl p-2 transform -rotate-2 bg-emerald-50/5 flex flex-col items-center">
                              <span className="text-[8px] text-emerald-600 font-black">الشؤون الطبية الميدانية</span>
                              <span className="text-[9px] text-emerald-700 font-bold">صُدِّق واعتُمِد طبياً</span>
                              <span className="text-[6px] font-mono text-emerald-500">{new Date().toLocaleDateString('ar-YE')}</span>
                            </div>

                            <div className="text-left space-y-1 font-sans">
                              <div className="font-bold text-slate-850">رئيس الشعبة الطبية للواء 43:</div>
                              <div className="font-extrabold text-slate-900 text-[11px]">العقيد طبيب / ناصر الحميري</div>
                              <div className="text-[8px] text-slate-400">إدارة الجاهزية والامتثال - عدن</div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="mt-6 flex gap-2 print:hidden">
                            <button
                              onClick={() => {
                                window.print();
                                if (triggerToast) triggerToast('بدء طباعة شهادة اللياقة الطبية واستئناف المهام', 'success');
                              }}
                              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-950 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>طباعة الشهادة الرسمية</span>
                            </button>
                            <button
                              onClick={() => {
                                setShowFitnessReceipt(false);
                              }}
                              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer font-sans"
                            >
                              إغلاق
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Satellite Tactical Direct Broadcast Notice Simulator overlay */}
                {radioSimulationStep > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 text-center font-mono"
                  >
                    <motion.div
                      initial={{ scale: 0.95, y: 15 }}
                      animate={{ scale: 1, y: 0 }}
                      className="bg-slate-900 border-2 border-cyan-500/30 rounded-3xl p-6 max-w-md w-full shadow-[0_0_25px_rgba(6,182,212,0.15)] relative overflow-hidden"
                    >
                      {/* Futuristic scanlines effect */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(6,182,212,0.03)_50%)] bg-[length:100%_4px] pointer-events-none" />

                      {/* Header radar scope */}
                      <div className="flex flex-col items-center justify-center mb-6 space-y-2 relative">
                        {radioSimulationStep === 1 && (
                          <div className="w-16 h-16 rounded-full border border-cyan-500/40 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-cyan-500/10 rounded-full animate-ping" />
                            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
                          </div>
                        )}
                        {radioSimulationStep === 2 && (
                          <div className="w-16 h-16 rounded-full border-2 border-indigo-500/40 flex items-center justify-center relative overflow-hidden bg-indigo-950/20">
                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-indigo-400 animate-spin" />
                          </div>
                        )}
                        {radioSimulationStep === 3 && (
                          <div className="w-16 h-16 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-emerald-950/30">
                            <span className="text-2xl">✅</span>
                          </div>
                        )}

                        <div className="text-center">
                          <h3 className="text-cyan-400 text-xs font-black tracking-widest uppercase">G43 MILITARY SATELLITE BROADCAST SYSTEM</h3>
                          <h4 className="text-[10px] text-slate-500">اللواء 43 عمالقة - نظام الاتصال الميداني الموحد</h4>
                        </div>
                      </div>

                      {/* Interactive dynamic logs */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right space-y-2.5 text-[11px] text-cyan-300">
                        {radioSimulationStep === 1 && (
                          <div className="space-y-1 font-mono leading-relaxed">
                            <p className="text-slate-400 animate-pulse">&gt; scanning military satellite transponders...</p>
                            <p className="text-slate-400">&gt; lock established on B-MANDAB SATELLITE SECTOR 4</p>
                            <p className="text-slate-400">&gt; secure encryption protocol initialized (AES-256-MIL)...</p>
                          </div>
                        )}

                        {radioSimulationStep === 2 && (
                          <div className="space-y-1 font-mono leading-relaxed">
                            <p className="text-slate-500">&gt; lock established on SATELLITE SECTOR 4</p>
                            <p className="text-amber-400">&gt; generating secure recall dispatch telegram...</p>
                            <p className="text-indigo-400 font-bold">&gt; RECIPIENT: {selectedVerifiedRecord.rank} / {selectedVerifiedRecord.name}</p>
                            <p className="text-indigo-400 font-bold">&gt; UNIT: {selectedVerifiedRecord.unit || 'الكتيبة الأولى - اللواء 43'}</p>
                            <p className="text-cyan-400 animate-pulse">&gt; broadcasting telemetry packages on FREQ: 154.250 MHz...</p>
                          </div>
                        )}

                        {radioSimulationStep === 3 && (
                          <div className="space-y-1.5 font-sans leading-relaxed text-slate-200">
                            <div className="text-center font-bold text-[12px] text-emerald-400 mb-2 border-b border-emerald-500/20 pb-1.5">📡 تم البث وتلقي الاستلام بنجاح!</div>
                            <p className="text-[11px]">
                              تم إرسال البلاغ العسكري المشفر <strong className="text-cyan-400">G43-{Math.floor(1000 + Math.random()*9000)}</strong> إلى الفرد لتأكيد العودة واستئناف مهام الخدمة والالتحاق بالمعسكر فوراً.
                            </p>
                            <p className="text-[10px] text-slate-500">
                              تم تسجيل هذا الإجراء تلقائياً في السجل التاريخي للفرد لضمان الانضباط العسكري التام والمتابعة الميدانية الصارمة.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Bottom close button */}
                      <div className="mt-6">
                        {radioSimulationStep === 3 ? (
                          <button
                            onClick={() => setRadioSimulationStep(0)}
                            className="w-full py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer font-sans"
                          >
                            إتمام وإنهاء عملية البث
                          </button>
                        ) : (
                          <div className="text-slate-500 text-[10px] animate-pulse flex items-center justify-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                            <span className="font-sans">الرجاء عدم إغلاق الواجهة حتى اكتمال البث اللاسلكي...</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* 3. High-Craft Digital Military Medical Card Generator Modal Overlay */}
                {showDigitalCard && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 text-right"
                  >
                    <motion.div
                      initial={{ scale: 0.95, y: 15 }}
                      animate={{ scale: 1, y: 0 }}
                      className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
                    >
                      {/* Yemeni flag top border */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 flex flex-row">
                        <div className="w-1/3 h-full bg-red-600" />
                        <div className="w-1/3 h-full bg-white" />
                        <div className="w-1/3 h-full bg-black" />
                      </div>

                      {/* Card Header */}
                      <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 mt-2">
                        <button
                          onClick={() => setShowDigitalCard(false)}
                          className="p-1 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="text-right">
                          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500">القوات المسلحة اليمنية - ألوية العمالقة</h4>
                          <h3 className="text-xs font-black text-slate-800 dark:text-white">اللواء 43 عمالقة - الإدارة الطبية الميدانية</h3>
                        </div>
                      </div>

                      {/* Actual ID Card layout */}
                      <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/40 dark:to-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-2xl relative shadow-inner overflow-hidden">
                        {/* Diagonal watermark text */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none transform -rotate-12">
                          <span className="text-4xl font-black text-slate-900">اللواء 43 عمالقة</span>
                        </div>

                        <div className="flex gap-4 relative z-10">
                          {/* Member rank avatar */}
                          <div className="w-24 h-24 rounded-xl bg-slate-200 dark:bg-slate-850 border border-slate-300 dark:border-slate-750 flex flex-col items-center justify-center relative overflow-hidden shrink-0">
                            <Activity className="w-10 h-10 text-slate-400 dark:text-slate-600 animate-pulse" />
                            <div className="absolute bottom-0 left-0 right-0 bg-slate-850/90 dark:bg-slate-950/95 text-slate-200 text-[8px] font-black text-center py-1">
                              {selectedVerifiedRecord.rank}
                            </div>
                          </div>

                          {/* Details list */}
                          <div className="flex-1 space-y-1.5 text-right">
                            <div>
                              <span className="text-[8px] text-slate-400 dark:text-slate-500 block">الاسم الثلاثي:</span>
                              <span className="text-xs font-black text-slate-850 dark:text-white block">{selectedVerifiedRecord.name}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[8px] text-slate-400 dark:text-slate-500 block">الرقم العسكري:</span>
                                <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 block">Mil-43-{selectedVerifiedRecord.id.substring(4, 9).toUpperCase()}</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-400 dark:text-slate-500 block">الوحدة/اللواء:</span>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">{selectedVerifiedRecord.unit || 'اللواء 43 عمالقة'}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-400 dark:text-slate-500 block">التشخيص الحالي:</span>
                              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block">{selectedVerifiedRecord.diagnosis}</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer details of Leave duration */}
                        <div className="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-right relative z-10">
                          <div>
                            <span className="text-[8px] text-slate-400 dark:text-slate-500 block">تاريخ بدء الإجازة:</span>
                            <span className="text-[10px] font-mono font-bold text-slate-750 dark:text-slate-300">{selectedVerifiedRecord.startDate}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-400 dark:text-slate-500 block">تاريخ العودة للكتيبة:</span>
                            <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400">{selectedVerifiedRecord.endDate}</span>
                          </div>
                        </div>

                        {/* Barcode and Stamp */}
                        <div className="mt-4 pt-3 border-t border-slate-200/65 dark:border-slate-800/65 flex items-center justify-between gap-2 relative z-10">
                          {/* Approved Stamp effect */}
                          <div className="border-2 border-emerald-500/40 rounded-lg p-1.5 transform rotate-3 flex flex-col items-center justify-center bg-white/30 dark:bg-slate-900/30 select-none">
                            <span className="text-[7px] text-emerald-600 dark:text-emerald-400 font-black">الشؤون الطبية العسكرية</span>
                            <span className="text-[9px] text-emerald-700 dark:text-emerald-300 font-bold">صُدّق إلكترونياً</span>
                            <span className="text-[6px] text-slate-450">اللواء 43 عمالقة</span>
                          </div>

                          {/* CSS Barcode */}
                          <div className="flex flex-col items-center">
                            <div className="flex h-7 items-stretch gap-[1.5px] bg-white p-1 rounded border border-slate-200">
                              <div className="w-[1px] bg-black" />
                              <div className="w-[3px] bg-black" />
                              <div className="w-[1px] bg-black" />
                              <div className="w-[2px] bg-black" />
                              <div className="w-[1px] bg-black" />
                              <div className="w-[3px] bg-black" />
                              <div className="w-[2px] bg-black" />
                              <div className="w-[1px] bg-black" />
                              <div className="w-[3px] bg-black" />
                              <div className="w-[1px] bg-black" />
                              <div className="w-[2px] bg-black" />
                              <div className="w-[1px] bg-black" />
                              <div className="w-[3px] bg-black" />
                              <div className="w-[1px] bg-black" />
                              <div className="w-[2px] bg-black" />
                            </div>
                            <span className="text-[7px] font-mono text-slate-500 mt-1 uppercase font-bold">Mil-43-{selectedVerifiedRecord.id.substring(4, 9)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Buttons */}
                      <div className="mt-5 flex gap-2">
                        <button
                          onClick={() => {
                            window.print();
                            if (triggerToast) triggerToast('بدء أمر طباعة بطاقة الفرد الطبية', 'success');
                          }}
                          className="flex-1 py-2 bg-slate-800 hover:bg-slate-950 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>طباعة الهوية الطبية</span>
                        </button>
                        <button
                          onClick={() => setShowDigitalCard(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          إغلاق
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 bg-slate-50/40 dark:bg-slate-950/10 rounded-xl border border-dashed border-slate-200 dark:border-slate-850 text-center">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs text-slate-400 font-bold">يرجى البحث واختيار أحد منتسبي اللواء للاستعلام السريع والمتابعة</p>
              </div>
            )}
          </div>

          {/* Interactive Dialing Voice Call Simulator Overlay */}
          {isPhoneCalling && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 text-center font-sans"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-slate-900 border-2 border-indigo-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
              >
                {/* Visual scanline style */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(99,102,241,0.02)_50%)] bg-[length:100%_4px] pointer-events-none" />

                <div className="flex flex-col items-center space-y-4 pt-4">
                  {/* Avatar ring animations */}
                  <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-indigo-950/40 border border-indigo-500/20">
                    {phoneCallStep === 1 && (
                      <>
                        <span className="absolute inset-0 rounded-full border border-indigo-500/40 animate-ping" />
                        <span className="absolute inset-2 rounded-full border border-indigo-500/20 animate-ping" style={{ animationDelay: '0.4s' }} />
                      </>
                    )}
                    {phoneCallStep === 2 && (
                      <span className="absolute inset-0 rounded-full border-2 border-emerald-500/50 animate-pulse" />
                    )}
                    <Phone className={`w-10 h-10 ${phoneCallStep === 2 ? 'text-emerald-400 animate-bounce' : 'text-indigo-400 animate-pulse'}`} />
                  </div>

                  <div className="text-center space-y-1">
                    <span className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase block">G43 TACTICAL VOICE TRANSMISSION</span>
                    <h3 className="text-sm font-black text-white">{selectedVerifiedRecord?.rank} / {selectedVerifiedRecord?.name}</h3>
                    <span className="text-[10px] text-slate-500 block font-mono">Mil-43-{selectedVerifiedRecord?.id.substring(4, 9).toUpperCase()}</span>
                  </div>

                  {/* Interactive Dial status box */}
                  <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-850/80 text-right text-xs leading-relaxed">
                    {phoneCallStep === 1 && (
                      <div className="text-center text-indigo-300 font-mono space-y-1 animate-pulse">
                        <p>&gt; جاري تأمين الاتصال الميداني المشفر...</p>
                        <p>&gt; جاري توجيه التردد والنداء هاتفياً...</p>
                      </div>
                    )}

                    {phoneCallStep === 2 && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center border-b border-indigo-500/20 pb-1.5 mb-1.5 text-slate-400 text-[10px]">
                          <span>الحالة: متصل وآمن 🔒</span>
                          <span className="font-mono text-emerald-400">00:15</span>
                        </div>
                        <p className="text-emerald-300 font-bold font-sans">
                          {simCallResponseText}
                        </p>
                      </div>
                    )}

                    {phoneCallStep === 3 && (
                      <div className="space-y-2 text-center">
                        <p className="text-rose-400 font-bold">⚠️ تعذر تأكيد الاتصال الصوتي</p>
                        <p className="text-[10px] text-slate-500">
                          {selectedVerifiedRecord?.contactStatus === 'evading'
                            ? 'جهاز الفرد مغلق بالكامل أو خارج التغطية. تم رصد الإشارة وتمرير بلاغ التهرب.'
                            : 'لا يوجد رد من الفرد بعد تكرار الرنين. تم تدوين محاولة الاتصال.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Operational Quick Call Actions */}
                  {phoneCallStep === 2 && (
                    <div className="w-full grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={async () => {
                          if (!selectedVerifiedRecord || !onUpdate) return;
                          const now = new Date();
                          const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
                          const updated = {
                            ...selectedVerifiedRecord,
                            contactStatus: 'confirmed' as const,
                            history: [
                              ...(selectedVerifiedRecord.history || []),
                              { date: dateStr, action: 'تعديل' as const, details: 'تم التحقق الهاتفي المباشر: أكد الفرد تماثله للشفاء وجهوزيته للعودة الفورية.' }
                            ]
                          };
                          await onUpdate(updated);
                          setIsPhoneCalling(false);
                          if (triggerToast) triggerToast('تم تأكيد عودة الفرد الميدانية في السجل', 'success');
                        }}
                        className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg cursor-pointer transition-colors"
                      >
                        إقرار العودة
                      </button>

                      <button
                        onClick={async () => {
                          if (!selectedVerifiedRecord || !onUpdate) return;
                          const now = new Date();
                          const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
                          const updated = {
                            ...selectedVerifiedRecord,
                            contactStatus: 'request_extension' as const,
                            history: [
                              ...(selectedVerifiedRecord.history || []),
                              { date: dateStr, action: 'تعديل' as const, details: 'التحقق الهاتفي: طلب الفرد تمديداً طبياً لعدم اكتمال شفائه ووجود موانع حركية.' }
                            ]
                          };
                          await onUpdate(updated);
                          setIsPhoneCalling(false);
                          setVerifySubTab('info');
                          if (triggerToast) triggerToast('تم تحويل الفرد لطلب تمديد اللجنة الطبية', 'info');
                        }}
                        className="py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] rounded-lg cursor-pointer transition-colors"
                      >
                        طلب تمديد رسمي
                      </button>
                    </div>
                  )}

                  {/* Hang up / Close dialer button */}
                  <button
                    onClick={() => setIsPhoneCalling(false)}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>إنهاء المكالمة والعودة للبوابة</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

        </div>
      )}

      {/* Panel B: Supreme Military Medical Advisory & Decision Simulator */}
      {activeModalId === 'simulator' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-5 md:p-6 shadow-md text-right flex flex-col justify-between relative overflow-hidden max-w-4xl mx-auto w-full">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-amber-500 to-indigo-500" />
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-xl">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  المستشار الطبي العسكري التفاعلي لاتخاذ القرار (v2.0.0)
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                  محاكاة فترات الاستشفاء وفق الأدلة القياسية للواء لتأكد من امتثال الإجازات وتعيين القيود الميدانية.
                </p>
              </div>
            </div>

            <div className="space-y-4 my-4">
              {/* Select Diagnosis category */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block">التشخيص الطبي المقترح للمحاكاة</label>
                <select
                  value={simDiagIndex}
                  onChange={(e) => setSimDiagIndex(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  {RECOVERY_GUIDE.map((item, idx) => (
                    <option key={idx} value={idx}>{item.disease} ({item.period})</option>
                  ))}
                </select>
              </div>

              {/* Slider for days */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] font-bold text-slate-400 block">المدة المطلوبة للإجازة الطبية</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded font-mono text-xs border border-amber-500/10">
                    {simProposedDays} يوماً
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="150"
                  value={simProposedDays}
                  onChange={(e) => setSimProposedDays(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Live Triage Card */}
              {(() => {
                const guide = RECOVERY_GUIDE[simDiagIndex];
                // Parse standard period min/max
                const match = guide.period.replace('أيام', '').replace('يوماً', '').trim().split('-');
                const minDays = parseInt(match[0], 10);
                const maxDays = parseInt(match[1] || match[0], 10);

                let ratingColor = '';
                let ratingBg = '';
                let ratingText = '';
                let decisionAdvice = '';
                let restrictionText = '';

                if (simProposedDays < minDays) {
                  ratingColor = 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/35';
                  ratingBg = 'bg-indigo-50/40 dark:bg-indigo-950/20';
                  ratingText = 'إجازة سريعة (أقل من الحد القياسي)';
                  decisionAdvice = 'تعتبر الإجازة الممنوحة أقل من التوصية المعتادة، يوصى بالتحقق من اكتمال الشفاء السريري للجندي قبل إعادة دمجه بالكامل.';
                  restrictionText = 'دمج كامل في المهام العسكرية مع استثناء المهام القتالية العنيفة للأسبوع الأول.';
                } else if (simProposedDays >= minDays && simProposedDays <= maxDays) {
                  ratingColor = 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/35';
                  ratingBg = 'bg-emerald-50/40 dark:bg-emerald-950/20';
                  ratingText = 'مطابق للامتثال القياسي للواء ✅';
                  decisionAdvice = 'الإجازة معتمدة ومتوافقة تماماً مع بروتوكولات الشؤون الطبية للواء 43. تُقر مباشرة وتُوثق في الأرشيف الطبي.';
                  restrictionText = 'إعفاء من الأنشطة الشاقة (كحمل السلاح الثقيل والمشاريع التدريبية الطويلة) لمدة ١٠ أيام عقب العودة.';
                } else {
                  const excess = simProposedDays - maxDays;
                  if (excess <= 10) {
                    ratingColor = 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/35';
                    ratingBg = 'bg-amber-50/40 dark:bg-amber-950/20';
                    ratingText = `يتجاوز قليلاً التوصية القياسية (+${excess} أيام) ⚠️`;
                    decisionAdvice = 'الإجازة تزيد قليلاً عن المعتاد لهذا المرض. تتطلب توقيع طبيب الوحدة مع تقديم ما يثبت المضاعفات الطبية.';
                    restrictionText = 'إعفاء تام من المشاريع الميدانية مع مهام حراسة داخلية خفيفة لمدة ١٥ يوماً من تاريخ العودة.';
                  } else {
                    ratingColor = 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/35';
                    ratingBg = 'bg-rose-50/40 dark:bg-rose-950/20';
                    ratingText = `تجاوز حرج للحد المسموح القياسي (+${excess} أيام) 🚨`;
                    decisionAdvice = 'الإجازة تتجاوز بشكل كبير الحد الأقصى للاستشفاء! تتطلب إحالة فورية للجنة الطبية العليا بالقطاع للمصادقة الاستثنائية.';
                    restrictionText = 'ممنوع من التدريب الميداني والخدمة الخارجية الشاقة لمدة ٣٠ يوماً على الأقل، ويُكلف بمهام إدارية خفيفة فقط.';
                  }
                }

                return (
                  <div className={`p-4 rounded-xl border ${ratingBg} ${ratingColor} space-y-2.5 transition-all duration-300`}>
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="text-[10px] font-bold text-slate-400">تقييم امتثال القرار الطبي:</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded border border-current">
                        {ratingText}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500">التوجيه الطبي والقرار العسكري الموصى به:</p>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-bold leading-relaxed">{decisionAdvice}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/40 dark:border-slate-800/40 space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>المهام والقيود الميدانية المقترحة بعد الالتحاق:</span>
                      </p>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-bold leading-relaxed">{restrictionText}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Yemeni Desert Heat, Dust & Climate Safety Advisor Widget */}
            <div className="mt-5 p-4 bg-gradient-to-l from-orange-50 to-amber-50/40 dark:from-amber-950/20 dark:to-orange-950/15 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl text-right">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔥</span>
                  <h4 className="text-xs font-black text-amber-900 dark:text-amber-400">مستشار الإجهاد الحراري والظروف المناخية الميدانية للواء 43</h4>
                </div>
                <span className="text-[9px] font-black bg-orange-600/15 text-orange-700 dark:text-orange-400 border border-orange-600/35 px-2 py-0.5 rounded">
                  الساحل الغربي - باب المندب
                </span>
              </div>
              <p className="text-[10px] text-amber-850/80 dark:text-slate-400 leading-relaxed mb-3">
                يقوم النظام بالتحليل المناخي التلقائي لقطاع انتشار اللواء 43 عمالقة اليوم لتقديم توصيات وقائية للقادة الميدانيين لحماية الأفراد من ضربات الشمس والإجهاد الحراري الحاد.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-white/70 dark:bg-slate-900/70 border border-amber-100 dark:border-slate-800 rounded-xl">
                  <span className="text-[9px] text-slate-450 dark:text-slate-500 block">درجة الحرارة الفعلية والمحسوسة:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 font-mono text-xs">41° م / المحسوسة 52° م</span>
                </div>
                <div className="p-2.5 bg-white/70 dark:bg-slate-900/70 border border-amber-100 dark:border-slate-800 rounded-xl">
                  <span className="text-[9px] text-slate-450 dark:text-slate-500 block">مستوى الخطورة الإكلينيكية:</span>
                  <span className="font-black text-red-600 dark:text-red-400 font-sans">حرج للغاية (الراية الحمراء) 🚩</span>
                </div>
                <div className="p-2.5 bg-white/70 dark:bg-slate-900/70 border border-amber-100 dark:border-slate-800 rounded-xl">
                  <span className="text-[9px] text-slate-450 dark:text-slate-500 block">بروتوكول الترطيب الإلزامي:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">1.5 لتر ماء/ملح ترطيب لكل ساعتين</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-amber-200/40 dark:border-slate-850 text-[10px] text-amber-900/95 dark:text-slate-400 space-y-1">
                <div className="font-bold text-amber-800 dark:text-amber-300">⚠️ تعليمات حفظ الجاهزية الميدانية الصادرة عن الشؤون الطبية لللواء:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-400 font-medium leading-relaxed">
                  <li>تجنب التعرض المباشر لأشعة الشمس الحارقة لجميع فصائل الحراسة الخارجية بين الساعة 11:30 ص حتى 3:30 م.</li>
                  <li>تقليل حصص التدريب والمشاريع التكتيكية الشاقة المفتوحة نهاراً والاستعاضة عنها بالمحاضرات المغلقة أو التدريب الليلي.</li>
                  <li>توجيه سيارات الإسعاف الميدانية بالدوران الدوري على نقاط الحراسة وتوزيع عبوات المغذيات والماء البارد.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Additional Services Row: Readiness Configuration & Duty Return Early Alerts */}
      {activeModalId === 'alarms' && (
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
      )}

      {/* 4. Charts Section: Case Types (Pie) & Top 5 Diagnoses (Bar) */}
      {activeModalId === 'analytics' && (
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
      )}

      {/* 5. Smart Services: Leave Date Calculator & Standard Medical Recovery Lookup */}
      {/* Service 1: Smart Leave Date Calculator */}
      {activeModalId === 'calculator' && (
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md text-right flex flex-col justify-between max-w-2xl mx-auto w-full">
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
      )}

      {/* Service 2: Standard Medical Recovery Period Lookup */}
      {activeModalId === 'guide' && (
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md text-right flex flex-col justify-between max-w-2xl mx-auto w-full">
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500 shrink-0" />
                <h3 className="font-bold text-slate-900 dark:text-white text-md">المرجع الطبي الميداني للواء 43</h3>
              </div>
              <span className="text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded font-bold">
                توجيهات الشؤون الطبية
              </span>
            </div>
            
            {/* Guide Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-950/40 p-1 rounded-xl mb-3 border border-slate-200 dark:border-slate-850">
              <button
                onClick={() => setGuideTab('periods')}
                className={`flex-1 py-1.5 text-center text-xs font-black rounded-lg transition-all ${
                  guideTab === 'periods'
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-450 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
              >
                📋 بروتوكول مدد التعافي القياسي
              </button>
              <button
                onClick={() => setGuideTab('first_aid')}
                className={`flex-1 py-1.5 text-center text-xs font-black rounded-lg transition-all ${
                  guideTab === 'first_aid'
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-450 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
              >
                🚑 دليل الإسعافات الميدانية الفورية
              </button>
            </div>

            {guideTab === 'periods' ? (
              <>
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

                {/* Guidelines scrolling list */}
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
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
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-4">
                  دليل الإسعاف الأولي الميداني السريع للتعامل الفوري مع الإصابات الحرجة والحالات الطارئة بميدان القتال والقطاعات الصحراوية.
                </p>

                {/* Search input for first aid */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={firstAidSearch}
                    onChange={(e) => setFirstAidSearch(e.target.value)}
                    placeholder="ابحث في دليل الإسعافات (مثل: نزيف، طلق، شمس)..."
                    className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-3" />
                </div>

                {/* First Aid scrolling list */}
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1 text-right">
                  {filteredFirstAid.length > 0 ? (
                    filteredFirstAid.map((item, idx) => (
                      <div key={idx} className="p-3 bg-emerald-50/45 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/35 rounded-xl space-y-2">
                        <div className="flex items-center justify-between font-black text-xs text-emerald-800 dark:text-emerald-400 border-b border-emerald-100/40 dark:border-emerald-900/10 pb-1.5">
                          <span>{item.title}</span>
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-sans">{item.severity}</span>
                        </div>
                        <ul className="space-y-1.5 text-[10px] text-slate-750 dark:text-slate-300 leading-relaxed list-decimal list-inside pr-1">
                          {item.steps.map((step, sIdx) => (
                            <li key={sIdx} className="font-medium">{step}</li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-[10px] text-slate-400">
                      لم نجد بروتوكول إسعافات مطابق لبحثك.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 6. Operational Unit Sick Rate Breakdown & Tips */}
      {activeModalId === 'analytics' && (
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
      )}

      {/* 12. Military Hospital Referrals Portal */}
      {activeModalId === 'referrals' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 max-w-4xl mx-auto text-right"
        >
          {activeReferralPrint ? (
            /* Printable Referral Slip Preview */
            <div className="bg-white text-slate-900 p-8 rounded-2xl border-2 border-slate-300 shadow-lg relative max-w-2xl mx-auto font-sans print:border-0 print:shadow-none print:p-0">
              {/* Header and Logo simulation */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                <div className="text-left space-y-1 text-xs">
                  <p className="font-bold">الرقم: {activeReferralPrint.id}</p>
                  <p className="font-bold">التاريخ: {activeReferralPrint.date}</p>
                  <p className="font-bold">الدرجة: عاجل جداً</p>
                </div>
                <div className="text-center space-y-1">
                  <h2 className="text-base font-black">الجمهورية اليمنية</h2>
                  <h3 className="text-sm font-bold">قوات العمالقة الجنوبية - اللواء 43 عمالقة</h3>
                  <h4 className="text-xs font-bold text-slate-700">شعبة الشؤون الطبية والطبابة الميدانية</h4>
                </div>
              </div>

              <div className="text-center my-6">
                <h1 className="text-lg font-black border-2 border-slate-900 px-6 py-2 inline-block rounded bg-slate-50 uppercase tracking-widest">
                  خطاب إحالة طبية رسمية
                </h1>
              </div>

              <div className="space-y-4 text-xs leading-relaxed mb-8">
                <p className="font-bold text-sm">إلى إدارة مستشفى: <span className="underline font-extrabold">{activeReferralPrint.hospital}</span> المحترمين</p>
                <p className="text-justify">
                  تحية طيبة وبعد،، يرجى من سيادتكم استقبال ومعاينة الفرد الموضح بياناته أدناه وتقديم الخدمات الطبية التخصصية اللازمة لحالته الطبية وصرف العلاج المقرر وإفادتنا بتقرير طبي مفصل بحالته:
                </p>

                {/* Soldier info table */}
                <div className="border border-slate-400 rounded-lg overflow-hidden my-4">
                  <table className="w-full text-xs text-right border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-300">
                        <td className="bg-slate-50 p-2.5 font-bold border-l border-slate-300 w-1/4">الاسم الكامل:</td>
                        <td className="p-2.5 font-extrabold">{activeReferralPrint.name}</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="bg-slate-50 p-2.5 font-bold border-l border-slate-300">الرتبة العسكرية:</td>
                        <td className="p-2.5 font-bold">{activeReferralPrint.rank}</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="bg-slate-50 p-2.5 font-bold border-l border-slate-300">الكتيبة / القوة:</td>
                        <td className="p-2.5 font-bold">{activeReferralPrint.unit}</td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 p-2.5 font-bold border-l border-slate-300">دواعي الإحالة الطبية:</td>
                        <td className="p-2.5 font-extrabold text-blue-800">{activeReferralPrint.reason}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 p-3 rounded border border-slate-200 mt-4">
                  <span className="font-bold text-slate-800 block mb-1">📋 توجيهات الشؤون الطبية باللواء:</span>
                  <p className="text-slate-600 text-[11px]">
                    يتم نقل المريض بوسائل النقل التابعة للكتيبة وتحت إشراف مساعد طبيب مرخص. يلتزم الفرد بتسليم التقرير الطبي المعتمد فور عودته لقسم الشؤون الطبية باللواء 43 لتسجيل الحالة وقفل الإحالة.
                  </p>
                </div>
              </div>

              {/* Signatures & Stamps */}
              <div className="grid grid-cols-2 gap-6 mt-12 text-xs border-t border-slate-300 pt-6">
                <div className="text-center space-y-12">
                  <p className="font-bold">توقيع رئيس الشعبة الطبية للواء 43</p>
                  <div>
                    <p className="font-extrabold underline">الملازم أول طبيب / وضاح اليافعي</p>
                    <p className="text-[10px] text-slate-500">مكتب الطبابة الميدانية</p>
                  </div>
                </div>
                <div className="text-center space-y-4 flex flex-col items-center justify-between">
                  <p className="font-bold">الختم والترميز العسكري</p>
                  <div className="border p-2 rounded bg-slate-50 font-mono text-[9px] flex flex-col items-center gap-1 border-slate-300">
                    <span className="font-bold tracking-widest text-slate-600">★ L43-MED-REF-{activeReferralPrint.id} ★</span>
                    <div className="w-32 h-6 bg-slate-400 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #111, #111 2px, #fff 2px, #fff 6px)' }} />
                    <span className="text-[8px] text-emerald-600 font-bold">مصدق ومحمي محلياً</span>
                  </div>
                </div>
              </div>

              {/* Print and Actions */}
              <div className="mt-8 flex justify-end gap-3 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الخطاب الورقي</span>
                </button>
                <button
                  onClick={() => setActiveReferralPrint(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  إغلاق المعاينة
                </button>
              </div>
            </div>
          ) : (
            /* Referral Creation Interface */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Column */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2 space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-black text-slate-900 dark:text-white text-base">إصدار إحالة طبية خارجية جديدة</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">توليد خطاب رسمي موجه للمستشفيات العسكرية لتوفير الرعاية الطبية للأفراد.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Soldier selection */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">تحديد الفرد المحال</label>
                    <select
                      value={referralSoldierId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReferralSoldierId(val);
                        if (val !== 'custom') {
                          const r = records.find(item => item.id === val);
                          if (r) {
                            setReferralCustomName(r.name);
                            setReferralCustomRank(r.rank);
                            setReferralCustomUnit(r.unit || 'الكتيبة الأولى');
                            if (r.diagnosis) {
                              setReferralReason(`متابعة وعلاج: ${r.diagnosis}`);
                            }
                          }
                        } else {
                          setReferralCustomName('');
                          setReferralCustomRank('جندي');
                          setReferralCustomUnit('الكتيبة الأولى');
                        }
                      }}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    >
                      <option value="custom">✍️ إدخال بيانات فرد يدوي غير مسجل إجازة</option>
                      {records.map(r => (
                        <option key={r.id} value={r.id}>{r.rank} / {r.name} ({r.unit || 'بدون كتيبة'})</option>
                      ))}
                    </select>
                  </div>

                  {referralSoldierId === 'custom' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">الاسم الكامل للفرد</label>
                        <input
                          type="text"
                          value={referralCustomName}
                          onChange={(e) => setReferralCustomName(e.target.value)}
                          placeholder="الاسم الرباعي للفرد"
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-right"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">الرتبة العسكرية</label>
                        <select
                          value={referralCustomRank}
                          onChange={(e) => setReferralCustomRank(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 text-right"
                        >
                          {['جندي', 'عريف', 'رقيب', 'رقيب أول', 'ملازم', 'ملازم أول', 'نقيب', 'رائد', 'مقدم', 'عقيد', 'عميد'].map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">الكتيبة / الوحدة</label>
                        <select
                          value={referralCustomUnit}
                          onChange={(e) => setReferralCustomUnit(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 text-right"
                        >
                          {['الكتيبة الأولى', 'الكتيبة الثانية', 'الكتيبة الثالثة', 'الكتيبة الرابعة', 'مقر القيادة للواء', 'سرية الإشارة والاتصالات', 'الاستطلاع والاستخبارات', 'كتيبة الإمداد والتموين', 'الطبابة والخدمات الطبية'].map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Hospital Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">المستشفى المستقبل للحالة</label>
                    <select
                      value={referralHospital}
                      onChange={(e) => setReferralHospital(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 text-right"
                    >
                      <option value="مستشفى باصهيب العسكري - عدن">مستشفى باصهيب العسكري - عدن</option>
                      <option value="مستشفى عبود العسكري - عدن">مستشفى عبود العسكري - عدن</option>
                      <option value="المستشفى العسكري بمأرب العام">المستشفى العسكري بمأرب العام</option>
                      <option value="مستشفى الساحل الغربي الميداني - المخا">مستشفى الساحل الغربي الميداني - المخا</option>
                      <option value="مستشفى الجمهورية التعليمي - عدن">مستشفى الجمهورية التعليمي - عدن</option>
                      <option value="المستشفى الميداني لقوات العمالقة - باب المندب">المستشفى الميداني لقوات العمالقة - باب المندب</option>
                    </select>
                  </div>

                  {/* Referral Reason */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">دواعي الإحالة الطبية التفصيلية</label>
                    <input
                      type="text"
                      value={referralReason}
                      onChange={(e) => setReferralReason(e.target.value)}
                      placeholder="مثال: إجراء أشعة رنين مغناطيسي للعمود الفقري ومراجعة الاستشاري المختص"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 text-right"
                    />
                  </div>

                  {/* Additional Clinical Notes */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">ملاحظات طبية أو قيود الإخلاء</label>
                    <textarea
                      value={referralNotes}
                      onChange={(e) => setReferralNotes(e.target.value)}
                      placeholder="مثال: الفرد يعاني من ألم مستمر ويحتاج مرافقة طبية مساعدة بالسيارة أو الإخلاء."
                      rows={2}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 text-right"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      const nameToUse = referralSoldierId === 'custom' ? referralCustomName : records.find(item => item.id === referralSoldierId)?.name;
                      if (!nameToUse || !nameToUse.trim()) {
                        if (triggerToast) triggerToast('يرجى تحديد اسم الفرد أولاً', 'error');
                        return;
                      }
                      if (!referralReason.trim()) {
                        if (triggerToast) triggerToast('يرجى إدخال دواعي الإحالة الطبية', 'error');
                        return;
                      }

                      const newRef = {
                        id: `REF-43-${Math.floor(1000 + Math.random() * 9000)}`,
                        name: nameToUse.trim(),
                        rank: referralSoldierId === 'custom' ? referralCustomRank : records.find(item => item.id === referralSoldierId)?.rank || 'جندي',
                        unit: referralSoldierId === 'custom' ? referralCustomUnit : records.find(item => item.id === referralSoldierId)?.unit || 'الكتيبة الأولى',
                        hospital: referralHospital,
                        reason: referralReason.trim(),
                        date: new Date().toISOString().split('T')[0]
                      };

                      const updatedList = [newRef, ...recentReferrals];
                      setRecentReferrals(updatedList);
                      localStorage.setItem('military_recent_referrals', JSON.stringify(updatedList));

                      if (triggerToast) triggerToast('تم تسجيل وإصدار الإحالة الطبية بنجاح', 'success');
                      setActiveReferralPrint(newRef);
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>حفظ وتسجيل خطاب الإحالة</span>
                  </button>
                </div>
              </div>

              {/* History Column */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs border-b border-slate-100 dark:border-slate-800 pb-2">📂 سجل الإحالات الأخيرة المعتمدة</h4>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {recentReferrals.map((ref) => (
                    <div key={ref.id} className="p-3 rounded-xl border border-slate-150 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-950/20 hover:border-blue-500/35 transition-all text-right space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-blue-600 font-mono">{ref.id}</span>
                        <span className="text-slate-400 font-mono">{ref.date}</span>
                      </div>
                      <p className="font-extrabold text-xs text-slate-800 dark:text-slate-100">{ref.rank} / {ref.name}</p>
                      <div className="text-[10px] text-slate-500 space-y-1">
                        <p>🏥 المستشفى: <span className="font-bold text-slate-700 dark:text-slate-300">{ref.hospital}</span></p>
                        <p className="truncate">📋 السبب: {ref.reason}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            const updatedList = recentReferrals.filter(item => item.id !== ref.id);
                            setRecentReferrals(updatedList);
                            localStorage.setItem('military_recent_referrals', JSON.stringify(updatedList));
                            if (triggerToast) triggerToast('تم حذف سجل الإحالة', 'info');
                          }}
                          className="px-2 py-1 hover:bg-rose-50 text-rose-500 rounded text-[10px] font-bold"
                        >
                          حذف السجل
                        </button>
                        <button
                          onClick={() => setActiveReferralPrint(ref)}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-bold flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          <span>معاينة وطباعة</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 13. Reassignment & Light-Duty Protocol */}
      {activeModalId === 'reassignment' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 max-w-4xl mx-auto text-right"
        >
          {activeReassignPrint ? (
            /* Printable Order Slip Preview */
            <div className="bg-white text-slate-900 p-8 rounded-2xl border-4 border-double border-slate-800 shadow-lg relative max-w-2xl mx-auto font-sans print:border-0 print:shadow-none print:p-0">
              {/* Header and Logo simulation */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                <div className="text-left space-y-1 text-[11px]">
                  <p className="font-bold">أمر إداري رقم: {activeReassignPrint.id}</p>
                  <p className="font-bold font-sans">التاريخ المصدق: {activeReassignPrint.date}</p>
                  <p className="font-bold">الصلاحية: مفعول فوري</p>
                </div>
                <div className="text-center space-y-1">
                  <h2 className="text-sm font-black">الجمهورية اليمنية</h2>
                  <h3 className="text-xs font-bold">قيادة قوات العمالقة الجنوبية - اللواء 43 عمالقة</h3>
                  <h4 className="text-[11px] font-bold text-slate-700">شعبة العمليات والتكليف الصحي الإداري</h4>
                </div>
              </div>

              <div className="text-center my-6">
                <h1 className="text-base font-black border border-slate-900 px-6 py-2.5 bg-slate-50 uppercase tracking-wider rounded">
                  قرار إداري وصحي بتكليف بمهمة عسكرية بديلة خفيفة
                </h1>
              </div>

              <div className="space-y-4 text-xs leading-relaxed mb-8">
                <p className="text-justify font-bold leading-relaxed text-slate-850">
                  بناءً على التقرير الطبي وتوصية رئيس لجنة الشؤون الطبية باللواء 43 عمالقة، وبموجب متطلبات المحافظة على الجاهزية الطبية وتوفير العناية الكافية لمنتسبي اللواء لضمان الاستشفاء التام للجرحى والمصابين، يُقرر تكليف الفرد الموضح بياناته بالمهام الخفيفة البديلة المؤقتة وفق الصياغة التالية:
                </p>

                {/* Soldier info block */}
                <div className="border border-slate-400 rounded-lg overflow-hidden my-4 text-xs">
                  <table className="w-full text-right border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-300">
                        <td className="bg-slate-50 p-2.5 font-bold border-l border-slate-300 w-1/3">الاسم الكامل للفرد:</td>
                        <td className="p-2.5 font-extrabold">{activeReassignPrint.name}</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="bg-slate-50 p-2.5 font-bold border-l border-slate-300">الرتبة والكتيبة الحالية:</td>
                        <td className="p-2.5 font-bold">{activeReassignPrint.rank} / {activeReassignPrint.unit}</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="bg-slate-50 p-2.5 font-bold border-l border-slate-300">المهمة الخفيفة البديلة المكلف بها:</td>
                        <td className="p-2.5 font-extrabold text-amber-800">{activeReassignPrint.duty}</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="bg-slate-50 p-2.5 font-bold border-l border-slate-300">فترة التكليف الصحي المؤقت:</td>
                        <td className="p-2.5 font-bold">{activeReassignPrint.duration} يوماً (تبدأ من تاريخ القرار)</td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 p-2.5 font-bold border-l border-slate-300">قيود الحركة المانعة:</td>
                        <td className="p-2.5 font-bold text-slate-700">{activeReassignPrint.notes || 'يُعفى الفرد بالكامل من التدريب العنيف والتحركات والوقوف المستمر، ويوزع بمهام لا تتطلب مجهود عضلاني شاق.'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="font-bold text-slate-800">توجيه عام لقادة الكتائب والسرايا:</p>
                <p className="text-[11px] text-justify text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
                  على قائد كتيبة الفرد المكلف تسهيل وتذليل عقبات التكليف والالتزام الصارم بالتوصية الطبية والامتناع القطعي عن إرسال الفرد لمهام قتالية ميدانية حادة أو نقاط تفتيش متقدمة لحين انتهاء فترة التكليف الطبي وصدور كشف اللياقة الفعلي.
                </p>
              </div>

              {/* Signatures & Stamps */}
              <div className="grid grid-cols-2 gap-6 mt-12 text-xs border-t border-slate-300 pt-6">
                <div className="text-center space-y-12">
                  <p className="font-bold">رئيس شعبة الشؤون الطبية للواء 43</p>
                  <div>
                    <p className="font-extrabold underline">الملازم أول طبيب / وضاح اليافعي</p>
                    <p className="text-[10px] text-slate-500">مكتب التكليف الطبي والمتابعة</p>
                  </div>
                </div>
                <div className="text-center space-y-12">
                  <p className="font-bold">مصدق ومعتمد: قائد اللواء 43 عمالقة</p>
                  <div>
                    <p className="font-extrabold underline">العميد قيادة / اللواء 43 عمالقة</p>
                    <p className="text-[10px] text-slate-500">الشعبة العسكرية للتنظيم والرقابة</p>
                  </div>
                </div>
              </div>

              {/* Print and Actions */}
              <div className="mt-8 flex justify-end gap-3 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة القرار الإداري</span>
                </button>
                <button
                  onClick={() => setActiveReassignPrint(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  إغلاق المعاينة
                </button>
              </div>
            </div>
          ) : (
            /* Reassignment Creation Interface */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm lg:col-span-2 space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-black text-slate-900 dark:text-white text-base">تكليف بمهمة عسكرية خفيفة بديلة</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">توليد وصياغة أمر إداري لتخفيف طبيعة الخدمة للأفراد المصابين في فترة النقاهة.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Soldier selection */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">اختر الفرد المصاب (من قوائم الإجازات المسجلة)</label>
                    <select
                      value={reassignSoldierId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReassignSoldierId(val);
                        const record = records.find(r => r.id === val);
                        if (record) {
                          setReassignNotes(`موصى به بسبب تشخيصه بـ (${record.diagnosis}). يمنع منعاً باتاً من رفع الأثقال والوقوف المستمر والركض لمسافات طويلة.`);
                        }
                      }}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    >
                      <option value="">-- يرجى اختيار الفرد المستحق من السجلات --</option>
                      {records.map(r => (
                        <option key={r.id} value={r.id}>{r.rank} / {r.name} ({r.diagnosis})</option>
                      ))}
                    </select>
                  </div>

                  {/* Proposed Duty */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">الخدمة الخفيفة البديلة المقترحة</label>
                    <select
                      value={reassignDuty}
                      onChange={(e) => setReassignDuty(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 text-right"
                    >
                      <option value="حراسة البوابات الداخلية للمقر الإداري والشعبي لللواء">🛡️ حراسة البوابات الداخلية للمقر الإداري والشعبي لللواء</option>
                      <option value="أعمال كتابية ورقابة إدارية وأرشفة بقسم شعبة الشؤون الطبية">📋 أعمال كتابية وأرشفة بقسم شعبة الشؤون الطبية</option>
                      <option value="مساعد أمين مخازن تموين الأدوية والتموين الغذائي للكتائب">📦 مساعد أمين مخازن تموين الأدوية والتموين الغذائي للكتائب</option>
                      <option value="تأمين وإدارة عمليات الإشارة وغرفة العمليات اللاسلكية">📡 تأمين وإدارة عمليات الإشارة وغرفة العمليات اللاسلكية</option>
                      <option value="مشرف جودة النظافة والتعقيم في العيادات والمستشفى الميداني">🧼 مشرف جودة التعقيم في العيادات والمستشفى الميداني</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">فترة التكليف الإداري (بالأيام)</label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={reassignDuration}
                      onChange={(e) => setReassignDuration(Math.max(5, Number(e.target.value)))}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-850 text-right"
                    />
                  </div>

                  {/* Restriction notes */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">قيود وتوجيهات الحركة</label>
                    <textarea
                      value={reassignNotes}
                      onChange={(e) => setReassignNotes(e.target.value)}
                      placeholder="توجيهات وقيود ملزمة لقادة الفصيل لسلامة الفرد..."
                      rows={2}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 text-right"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      if (!reassignSoldierId) {
                        if (triggerToast) triggerToast('يرجى اختيار فرد مصاب من القائمة أولاً', 'error');
                        return;
                      }

                      const selectedRec = records.find(r => r.id === reassignSoldierId);
                      if (!selectedRec) return;

                      const newReassign = {
                        id: `RE-43-${Math.floor(5000 + Math.random() * 4000)}`,
                        name: selectedRec.name,
                        rank: selectedRec.rank,
                        unit: selectedRec.unit || 'الكتيبة الأولى',
                        duty: reassignDuty,
                        duration: reassignDuration,
                        notes: reassignNotes.trim(),
                        date: new Date().toISOString().split('T')[0]
                      };

                      const updatedList = [newReassign, ...recentReassignments];
                      setRecentReassignments(updatedList);
                      localStorage.setItem('military_recent_reassignments', JSON.stringify(updatedList));

                      if (triggerToast) triggerToast('تم إصدار وتسجيل قرار التكليف الإداري بنجاح', 'success');
                      setActiveReassignPrint(newReassign);
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>حفظ وتوليد أمر التكليف العسكري</span>
                  </button>
                </div>
              </div>

              {/* History list */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs border-b border-slate-100 dark:border-slate-800 pb-2">📂 سجل قرارات التكليف البديل النشطة</h4>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {recentReassignments.map((re) => (
                    <div key={re.id} className="p-3 rounded-xl border border-slate-150 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-950/20 hover:border-amber-500/35 transition-all text-right space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-amber-600 font-mono">{re.id}</span>
                        <span className="text-slate-400 font-mono">{re.date}</span>
                      </div>
                      <p className="font-extrabold text-xs text-slate-800 dark:text-slate-100">{re.rank} / {re.name}</p>
                      <div className="text-[10px] text-slate-500 space-y-1">
                        <p className="truncate">🎯 المهمة البديلة: {re.duty}</p>
                        <p>⏱️ المدة: <span className="font-bold text-slate-700 dark:text-slate-300">{re.duration} يوماً</span></p>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            const updatedList = recentReassignments.filter(item => item.id !== re.id);
                            setRecentReassignments(updatedList);
                            localStorage.setItem('military_recent_reassignments', JSON.stringify(updatedList));
                            if (triggerToast) triggerToast('تم حذف قرار التكليف من الأرشيف', 'info');
                          }}
                          className="px-2 py-1 hover:bg-rose-50 text-rose-500 rounded text-[10px] font-bold"
                        >
                          حذف
                        </button>
                        <button
                          onClick={() => setActiveReassignPrint(re)}
                          className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-[10px] font-bold flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          <span>طباعة</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 14. Medical Campaign Supply Forecasting & Combat Logistics Planner */}
      {activeModalId === 'campaign' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 max-w-4xl mx-auto text-right"
        >
          {showCampaignReport ? (
            /* Printable Campaign Logistics Slip Preview */
            <div className="bg-white text-slate-900 p-8 rounded-2xl border-2 border-slate-800 shadow-lg relative max-w-2xl mx-auto font-sans print:border-0 print:shadow-none print:p-0">
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                <div className="text-left space-y-1 text-xs">
                  <p className="font-bold">كود المخطط: CPL-{campaignForceSize}-{campaignDays}</p>
                  <p className="font-bold">التاريخ: {new Date().toISOString().split('T')[0]}</p>
                  <p className="font-bold">مستوى الخطورة: {campaignIntensity === 'high' ? 'قصف واشتباك مكثف' : campaignIntensity === 'medium' ? 'مهمة تمشيط وتأمين' : 'تدريب وعمل روتيني'}</p>
                </div>
                <div className="text-center space-y-1">
                  <h2 className="text-sm font-black">الجمهورية اليمنية</h2>
                  <h3 className="text-xs font-bold">قيادة قوات العمالقة الجنوبية - اللواء 43 عمالقة</h3>
                  <h4 className="text-[11px] font-bold text-slate-700">مصلحة التموين اللوجستي والامداد الميداني</h4>
                </div>
              </div>

              <div className="text-center my-6">
                <h1 className="text-base font-black border border-slate-900 px-6 py-2.5 bg-slate-50 uppercase tracking-widest inline-block rounded">
                  كشف وبيان الاحتياج الدوائي التقديري المعتمد للحملة
                </h1>
              </div>

              <div className="space-y-4 text-xs leading-relaxed mb-8">
                <p className="text-justify font-bold text-slate-850">
                  بناءً على معايير اللوجستيات العسكرية والصحية المعتمدة للعمليات الميدانية والجهوزية الطبية لقوات العمالقة الجنوبية باللواء 43، تم احتساب الاحتياج التقديري الدقيق لقوة قوامها <span className="underline font-black">{campaignForceSize} فرد</span> في مهمة مستمرة مدتها <span className="underline font-black">{campaignDays} يوماً</span> بمستوى حركية واشتباك <span className="font-black text-rose-700">{campaignIntensity === 'high' ? 'عالي (هجوم مباشر)' : campaignIntensity === 'medium' ? 'متوسط (مناوشات وتأمين)' : 'هادئ (دفاع وتأمين بوابات)'}</span>:
                </p>

                {/* Logistics results table */}
                <div className="border border-slate-450 rounded-lg overflow-hidden my-4">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-400">
                        <th className="p-2.5 font-bold border-l border-slate-300 w-2/5">الصنف اللوجستي</th>
                        <th className="p-2.5 font-bold border-l border-slate-300 text-center">الكمية المطلوبة</th>
                        <th className="p-2.5 font-bold border-l border-slate-300 text-center">الوحدة الدوائية</th>
                        <th className="p-2.5 font-bold text-center">دواعي الاستخدام الميداني</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-300">
                        <td className="p-2.5 font-bold border-l border-slate-300">عواصب نزيف شريانية تكتيكية (TCT/CAT)</td>
                        <td className="p-2.5 font-black text-center border-l border-slate-300 font-sans">
                          {Math.ceil(campaignForceSize * (campaignIntensity === 'high' ? 0.35 : campaignIntensity === 'medium' ? 0.15 : 0.05))}
                        </td>
                        <td className="p-2.5 text-center border-l border-slate-300 font-sans">عاصبة تكتيكية</td>
                        <td className="p-2.5">وقف فوري لنزيف الشرايين بالأطراف أثناء الاشتباك.</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="p-2.5 font-bold border-l border-slate-300">ضمادات ضاغطة ميدانية معقمة</td>
                        <td className="p-2.5 font-black text-center border-l border-slate-300 font-sans">
                          {Math.ceil(campaignForceSize * campaignDays * (campaignIntensity === 'high' ? 0.12 : campaignIntensity === 'medium' ? 0.05 : 0.01))}
                        </td>
                        <td className="p-2.5 text-center border-l border-slate-300 font-sans">ضمادة ضاغطة</td>
                        <td className="p-2.5">الضماد والضغط المباشر على الحروق والجروح المفتوحة.</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="p-2.5 font-bold border-l border-slate-300">شاش وقف النزيف السريع (QuikClot)</td>
                        <td className="p-2.5 font-black text-center border-l border-slate-300 font-sans">
                          {Math.ceil(campaignForceSize * (campaignIntensity === 'high' ? 0.2 : campaignIntensity === 'medium' ? 0.08 : 0.02))}
                        </td>
                        <td className="p-2.5 text-center border-l border-slate-300 font-sans">شريط شاش</td>
                        <td className="p-2.5">المساعدة المباشرة على تخثر وحشو الجروح العميقة بالجسد.</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="p-2.5 font-bold border-l border-slate-300">حقن مضاد حيوي (Ceftriaxone 1g)</td>
                        <td className="p-2.5 font-black text-center border-l border-slate-300 font-sans">
                          {Math.ceil(campaignForceSize * (campaignIntensity === 'high' ? 0.15 : campaignIntensity === 'medium' ? 0.06 : 0.01) * campaignDays)}
                        </td>
                        <td className="p-2.5 text-center border-l border-slate-300 font-sans">حقنة</td>
                        <td className="p-2.5">منع الالتهاب وتجرثم جروح الشظايا والإصابات العميقة.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold border-l border-slate-300">محلول ملحي وريدي (Normal Saline 500ml)</td>
                        <td className="p-2.5 font-black text-center border-l border-slate-300 font-sans">
                          {Math.ceil(campaignForceSize * (campaignIntensity === 'high' ? 0.25 : campaignIntensity === 'medium' ? 0.1 : 0.02))}
                        </td>
                        <td className="p-2.5 text-center border-l border-slate-300 font-sans">قنينة</td>
                        <td className="p-2.5">تعويض سوائل الدم ومنع الصدمة الوعائية للمصابين.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-100 p-3 rounded text-[11px] text-slate-700 border border-slate-200">
                  <span className="font-bold block mb-0.5">⚠️ توصية الضباط المشرفين بالشعبة اللوجستية:</span>
                  <p>تعتبر هذه الأرقام كمية الأمان التمويني الأولية للكتيبة. يوصى بتمثيل مساعد طبيب ميداني لكل سرية يرافقه حقيبة طبية متكاملة مصدقة الختم ومعدة للاستخدام العاجل بالجبهة.</p>
                </div>
              </div>

              {/* Signatures & Stamps */}
              <div className="grid grid-cols-2 gap-6 mt-12 text-xs border-t border-slate-300 pt-6">
                <div className="text-center space-y-12">
                  <p className="font-bold">الملازم الصيدلي / مدير مصلحة التموين</p>
                  <div>
                    <p className="font-extrabold underline">الملازم طبيب / خالد الوالي</p>
                    <p className="text-[10px] text-slate-500">مكتب الامداد الدوائي - اللواء 43</p>
                  </div>
                </div>
                <div className="text-center space-y-4 flex flex-col items-center justify-between">
                  <p className="font-bold">المصادقة العسكرية والتدقيق</p>
                  <div className="border p-2 rounded bg-slate-50 font-mono text-[9px] flex flex-col items-center gap-1 border-slate-300">
                    <span className="font-bold tracking-wider text-slate-600">★ L43-LOG-PLANNER ★</span>
                    <span className="text-[8px] text-emerald-600 font-bold">بوابة اللوجستيات المعتمدة</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex justify-end gap-3 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة بيان الاحتياج الطبي</span>
                </button>
                <button
                  onClick={() => setShowCampaignReport(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  العودة للمحاكي التفاعلي
                </button>
              </div>
            </div>
          ) : (
            /* Interactive Simulation UI */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
              {/* Simulator Parameters Input Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 lg:col-span-1">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-black text-slate-900 dark:text-white text-base">محاكي تموين العمليات الحربية</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">توقع الاحتياج من عواصب النزيف والضمادات والمسكنات التكتيكية في الجبهة.</p>
                </div>

                {/* Force Size Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{campaignForceSize} فرد</span>
                    <label className="font-bold text-slate-600 dark:text-slate-300">قوام القوة المشاركة</label>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={campaignForceSize}
                    onChange={(e) => setCampaignForceSize(Number(e.target.value))}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>10 فرد (فصيل)</span>
                    <span>1000 فرد (لواء كامل)</span>
                  </div>
                </div>

                {/* Duration Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{campaignDays} أيام</span>
                    <label className="font-bold text-slate-600 dark:text-slate-300">مدة المهمة القتالية المجدولة</label>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="90"
                    value={campaignDays}
                    onChange={(e) => setCampaignDays(Number(e.target.value))}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>يوم واحد</span>
                    <span>90 يوماً</span>
                  </div>
                </div>

                {/* Combat Intensity Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">الجهوزية ومستوى خطر الجبهة</label>
                  <select
                    value={campaignIntensity}
                    onChange={(e) => setCampaignIntensity(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-right"
                  >
                    <option value="low">🕊️ منخفض (تدريب، دوريات دفاعية خلف الجبهة)</option>
                    <option value="medium">⚔️ متوسط (مناوشات متبادلة، حملة تأمين تمشيطية)</option>
                    <option value="high">🔥 عالي جداً (هجوم واشتباك والتحام مباشر مع الجبهات)</option>
                  </select>
                </div>

                {/* Campaign Notes */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">اسم أو تلميح الحملة العسكرية</label>
                  <input
                    type="text"
                    value={campaignNotes}
                    onChange={(e) => setCampaignNotes(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-right"
                  />
                </div>
              </div>

              {/* Simulation Output and Pharmacy stock cross-match */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2 space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="font-black text-slate-900 dark:text-white text-base">📋 مقارنة التوقع الطبي بمخزون صيدلية اللواء الحالية</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">يتحقق النظام تلقائياً من مخزون الصيدلية الميدانية الفعلي ويبلغ عن أي عجز فوري لتداركه.</p>
                </div>

                {/* Interactive list of supplies calculated */}
                <div className="space-y-4">
                  {[
                    {
                      name: "عاصبة شريانية تكتيكية (لوقف النزيف)",
                      arabicName: "عاصبة شريانية تكتيكية (لوقف النزيف)",
                      required: Math.ceil(campaignForceSize * (campaignIntensity === 'high' ? 0.35 : campaignIntensity === 'medium' ? 0.15 : 0.05)),
                      defaultStock: 65,
                      unit: "عاصبة"
                    },
                    {
                      name: "Normal Saline 500ml",
                      arabicName: "محلول ملحي مغذي 500 مل",
                      required: Math.ceil(campaignForceSize * (campaignIntensity === 'high' ? 0.25 : campaignIntensity === 'medium' ? 0.1 : 0.02)),
                      defaultStock: 120,
                      unit: "قنينة"
                    },
                    {
                      name: "سيفتركسون 1جم (حقن مضاد حيوي)",
                      arabicName: "سيفتركسون 1جم (حقن مضاد حيوي)",
                      required: Math.ceil(campaignForceSize * (campaignIntensity === 'high' ? 0.15 : campaignIntensity === 'medium' ? 0.06 : 0.01) * campaignDays),
                      defaultStock: 90,
                      unit: "حقنة"
                    }
                  ].map((supply, sIdx) => {
                    // Try to get dynamic stock from pharmacy
                    const savedPharmacyItemsStr = localStorage.getItem('military_pharmacy_items');
                    let actualStock = supply.defaultStock;
                    if (savedPharmacyItemsStr) {
                      try {
                        const parsed = JSON.parse(savedPharmacyItemsStr);
                        const found = parsed.find((p: any) => 
                          p.arabicName.includes(supply.arabicName) || 
                          p.name.toLowerCase().includes(supply.name.toLowerCase()) ||
                          supply.name.toLowerCase().includes(p.name.toLowerCase())
                        );
                        if (found) actualStock = found.quantity;
                      } catch(e) {}
                    }

                    const hasDeficit = actualStock < supply.required;
                    const deficitQty = supply.required - actualStock;
                    const stockPercent = Math.min(100, (actualStock / supply.required) * 100);

                    return (
                      <div key={sIdx} className="p-4 rounded-xl border border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-right space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-slate-800 dark:text-slate-100">{supply.arabicName}</span>
                          <span className="font-bold text-slate-500 font-mono">الاحتياج: {supply.required} {supply.unit}</span>
                        </div>

                        {/* Stock status bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              hasDeficit ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${stockPercent}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[11px]">
                          <div>
                            {hasDeficit ? (
                              <span className="text-rose-600 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 animate-pulse shrink-0" />
                                <span>عجز بالمستودع: -{deficitQty} {supply.unit}</span>
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>المخزون كافٍ ومؤمن</span>
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-slate-500 font-sans">
                            المخزون الفعلي بالصيدلية: {actualStock} {supply.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      if (triggerToast) triggerToast('تمت محاكاة وحساب كميات الحملة الطبية الميدانية بنجاح', 'success');
                      setShowCampaignReport(true);
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    <span>توليد ومعاينة طلب بيان التعبئة الرسمي</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Monthly Sick Leave Days Tracker Modal */}
      {activeModalId === 'monthly-tracker' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 md:p-8 shadow-md text-right max-w-5xl mx-auto w-full relative"
        >
          {/* Subtle top-glow accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-pink-500 via-rose-500 to-indigo-500" />

          {/* Modal Header */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <button
              onClick={() => {
                setActiveModalId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-all text-left"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 justify-end">
              <div className="text-right">
                <h3 className="text-base font-black text-slate-900 dark:text-white">التقرير والمتابع الشهري للإجازات والعمل</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  بيان وتتبع إجمالي أيام الإجازات بجميع أنواعها المرفوعة والممنوحة لكل فرد في اللواء 43 عمالقة شهرياً
                </p>
              </div>
              <div className="p-2.5 bg-pink-50 dark:bg-pink-950/40 text-pink-500 rounded-xl">
                <CalendarDays className="w-5 h-5 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Year and Overview Year-Trend BarChart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* Year Selector & Quick Stats */}
            <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">اختر العام الميلادي للتتبع:</label>
                <div className="flex gap-2 mb-3 justify-end">
                  {[2024, 2025, 2026, 2027].map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setTrackerYear(yr)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        trackerYear === yr
                          ? 'bg-pink-500 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 mt-3 text-right">نوع الإجازة للتتبع والتقرير:</label>
                <div className="flex flex-wrap gap-1.5 mb-4 justify-end">
                  {[
                    { id: 'all', label: 'الكل (جميع الإجازات)' },
                    { id: 'مريض', label: 'مرضية' },
                    { id: 'مرافق', label: 'مرافق' },
                    { id: 'مرض قريب', label: 'مرض قريب' },
                    { id: 'حادث', label: 'حادث' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTrackerLeaveType(t.id as any)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        trackerLeaveType === t.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="text-right space-y-2 mt-4 text-slate-700 dark:text-slate-300">
                  <h4 className="text-xs font-black text-slate-850 dark:text-slate-200 border-b pb-2 mb-2 dark:border-slate-800">إحصائيات العام {trackerYear} بالكامل</h4>
                  <p className="text-xs text-slate-500 flex justify-between flex-row-reverse">
                    <span>إجمالي أيام الإجازات:</span>
                    <strong className="font-mono text-pink-500">
                      {monthlyOverlappingStats.reduce((sum, m) => sum + m.totalDays, 0)} يوم
                    </strong>
                  </p>
                  <p className="text-xs text-slate-500 flex justify-between flex-row-reverse">
                    <span>إجمالي الحالات المسجلة:</span>
                    <strong className="font-mono text-indigo-500">
                      {monthlyOverlappingStats.reduce((sum, m) => sum + m.casesCount, 0)} حالة
                    </strong>
                  </p>
                  <p className="text-xs text-slate-500 flex justify-between flex-row-reverse">
                    <span>أعلى الشهور إجازات:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {(() => {
                        const maxM = [...monthlyOverlappingStats].sort((a,b) => b.totalDays - a.totalDays)[0];
                        return maxM && maxM.totalDays > 0 ? `${maxM.monthName} (${maxM.totalDays} يوم)` : 'لا يوجد';
                      })()}
                    </strong>
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 text-[10px] text-slate-400">
                💡 يحتسب هذا المحلل الأيام الفعلية الواقعة ضمن الشهر المحدد، بما في ذلك فترات الإجازات المتداخلة التي بدأت في شهر سابق واستمرت فيه.
              </div>
            </div>

            {/* Recharts BarChart showing 12 months trend */}
            <div className="lg:col-span-8 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 text-right mb-4">
                مخطط التوزيع السنوي لإجمالي أيام الإجازات المرضية لعام {trackerYear}
              </h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyOverlappingStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis
                      dataKey="monthName"
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-800 shadow-xl text-right text-[11px] leading-relaxed">
                              <p className="font-bold border-b border-slate-800 pb-1 mb-1 text-pink-400">{data.monthName}</p>
                              <p>أيام الإجازات: <span className="font-mono font-bold text-amber-400">{data.totalDays} يوم</span></p>
                              <p>عدد الحالات: <span className="font-mono font-bold text-indigo-400">{data.casesCount} حالة</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="totalDays"
                      radius={[4, 4, 0, 0]}
                    >
                      {monthlyOverlappingStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.monthNum === trackerMonth ? '#ec4899' : '#6366f1'}
                          className="cursor-pointer"
                          onClick={() => setTrackerMonth(entry.monthNum)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                انقر على أي شريط عمودي في المخطط لتحديد هذا الشهر وعرض بياناته التفصيلية بالأسفل
              </p>
            </div>
          </div>

          {/* Month Selector Cards Row */}
          <div className="mb-8">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 text-right mb-3">اختر الشهر للتصفح الفوري وعرض البيان التفصيلي:</h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {monthlyOverlappingStats.map((m) => (
                <button
                  key={m.monthNum}
                  onClick={() => setTrackerMonth(m.monthNum)}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between relative overflow-hidden ${
                    trackerMonth === m.monthNum
                      ? 'bg-pink-500/10 border-pink-500/40 text-pink-700 dark:text-pink-400 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[9px] font-mono opacity-50">#{String(m.monthNum).padStart(2, '0')}</span>
                    {m.totalDays > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 font-bold">
                        نشط
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-right">
                    <p className="text-xs font-black">{m.monthName}</p>
                    <p className="text-[11px] font-mono font-bold mt-1 text-slate-500 dark:text-slate-400">
                      {m.totalDays} <span className="text-[9px]">يوم</span>
                    </p>
                  </div>
                  {trackerMonth === m.monthNum && (
                    <div className="absolute right-0 bottom-0 top-0 w-1 bg-pink-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Stats of Selected Month */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mb-8 text-right">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      const leaveTypeLabel = trackerLeaveType === 'all' ? 'جميع أنواع الإجازات' : 
                                             trackerLeaveType === 'مريض' ? 'الإجازات المرضية' : 
                                             trackerLeaveType === 'مرافق' ? 'إجازات المرافقين' : 
                                             trackerLeaveType === 'مرض قريب' ? 'إجازات مرض القريب' : 'إجازات الحوادث';
                      const doc = printWindow.document;
                      doc.write(`
                        <html>
                        <head>
                          <title>تقرير ${leaveTypeLabel} لشهر ${trackerMonth}/${trackerYear}</title>
                          <style>
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; padding: 40px; color: #1e293b; }
                            h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; font-size: 20px; }
                            .meta { font-size: 12px; color: #64748b; margin-bottom: 30px; }
                            .stats { display: grid; grid-template-cols: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
                            .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; }
                            .stat-val { font-size: 24px; font-weight: bold; color: #ec4899; margin-top: 5px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; }
                            th { background-color: #f1f5f9; font-weight: bold; }
                            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
                          </style>
                        </head>
                        <body>
                          <h1>بيان كشف ${leaveTypeLabel} المرفوعة والممنوحة - اللواء 43 عمالقة</h1>
                          <p class="meta">الفترة المحددة: شهر ${trackerMonth} / عام ${trackerYear} | تاريخ إصدار التقرير: ${new Date().toLocaleDateString('ar-YE')}</p>
                          
                          <div class="stats">
                            <div class="stat-card"><div>إجمالي أيام الإجازات</div><div class="stat-val">${selectedMonthDetails.totalSickDays} يوماً</div></div>
                            <div class="stat-card"><div>إجمالي الحالات النشطة</div><div class="stat-val">${selectedMonthDetails.totalCases} حالات</div></div>
                            <div class="stat-card"><div>معدل الأيام / الحالة</div><div class="stat-val">${selectedMonthDetails.avgSickDays} يوم</div></div>
                            <div class="stat-card"><div>أطول فترة إجازة فردية</div><div class="stat-val">${selectedMonthDetails.maxSickDays} يوم</div></div>
                          </div>

                          <table>
                            <thead>
                              <tr>
                                <th>اسم الفرد / الرتبة</th>
                                <th>الكتيبة / الوحدة</th>
                                <th>التشخيص / سبب الإجازة</th>
                                <th>فترة الإجازة الكلية</th>
                                <th>عدد أيامها هذا الشهر</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${
                                selectedMonthDetails.matchingRecords.length > 0
                                  ? selectedMonthDetails.matchingRecords.map(item => `
                                      <tr>
                                        <td>${item.record.rank} / ${item.record.name}</td>
                                        <td>${item.record.unit || 'الكتيبة الأولى'}</td>
                                        <td>${item.record.type === 'مريض' ? `مرضية (${item.record.diagnosis})` : item.record.type === 'مرافق' ? `مرافق (${item.record.diagnosis})` : item.record.type === 'مرض قريب' ? `مرض قريب (${item.record.diagnosis})` : `حادث (${item.record.diagnosis})`}</td>
                                        <td>من ${item.record.startDate} إلى ${item.record.endDate}</td>
                                        <td>${item.overlapDays} يوماً</td>
                                      </tr>
                                    `).join('')
                                  : `<tr><td colspan="5" style="text-align:center;">لا توجد أي إجازات مسجلة في هذا الشهر لتصنيف: ${leaveTypeLabel}.</td></tr>`
                              }
                            </tbody>
                          </table>

                          <div class="footer">شعبة شؤون الأفراد والطبية - قيادة اللواء 43 عمالقة - نظام الأرشيف الذكي للإجازات والعمل</div>
                        </body>
                        </html>
                      `);
                      doc.close();
                      printWindow.print();
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-755 dark:text-slate-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الكشف للشهادة والعمل</span>
                </button>
                <button
                  onClick={() => {
                    const headers = ['اسم الفرد', 'الرتبة', 'الكتيبة', 'التشخيص', 'تاريخ البدء', 'تاريخ الانتهاء', 'أيام هذا الشهر'];
                    const rows = selectedMonthDetails.matchingRecords.map(item => [
                      item.record.name,
                      item.record.rank,
                      item.record.unit || 'الكتيبة الأولى',
                      item.record.diagnosis,
                      item.record.startDate,
                      item.record.endDate,
                      item.overlapDays
                    ]);
                    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
                      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `تقرير_إجازات_${trackerMonth}_${trackerYear}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-755 dark:text-slate-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>تصدير CSV</span>
                </button>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  كشف وبيان الإجازات المرفوعة لشهر {monthlyOverlappingStats.find(m => m.monthNum === trackerMonth)?.monthName} / عام {trackerYear}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">يحتوي هذا الكشف على تفصيل الحالات الطبية وأيام الإجازات المستحقة لها في هذا الشهر</p>
              </div>
            </div>

            {/* 4 Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-pink-500/5 to-transparent border border-pink-500/10 rounded-2xl">
                <span className="text-[10px] text-slate-400 block">إجمالي أيام الإجازات الممنوحة</span>
                <span className="text-xl font-mono font-black text-pink-600 dark:text-pink-400 block mt-1">
                  {selectedMonthDetails.totalSickDays} <span className="text-xs">يوم إجازة</span>
                </span>
                <span className="text-[9px] text-slate-404 block mt-1">نشط ومستحق خلال الشهر</span>
              </div>

              <div className="p-4 bg-gradient-to-br from-indigo-500/5 to-transparent border border-indigo-500/10 rounded-2xl">
                <span className="text-[10px] text-slate-404 block">إجمالي الحالات النشطة</span>
                <span className="text-xl font-mono font-black text-indigo-600 dark:text-indigo-400 block mt-1">
                  {selectedMonthDetails.totalCases} <span className="text-xs">حالات</span>
                </span>
                <span className="text-[9px] text-slate-404 block mt-1">أفراد استلموا إجازات</span>
              </div>

              <div className="p-4 bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/10 rounded-2xl">
                <span className="text-[10px] text-slate-404 block">معدل أيام الإجازة / الحالة</span>
                <span className="text-xl font-mono font-black text-amber-600 dark:text-amber-400 block mt-1">
                  {selectedMonthDetails.avgSickDays} <span className="text-xs">يوم / حالة</span>
                </span>
                <span className="text-[9px] text-slate-404 block mt-1">متوسط المدة لكل فرد</span>
              </div>

              <div className="p-4 bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10 rounded-2xl">
                <span className="text-[10px] text-slate-404 block">أطول فترة نقاهة فردية</span>
                <span className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                  {selectedMonthDetails.maxSickDays} <span className="text-xs">يوم</span>
                </span>
                <span className="text-[9px] text-slate-404 block mt-1">أقصى مدة استشفاء لفرد</span>
              </div>
            </div>

            {/* Table of Details */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/20">
              {selectedMonthDetails.matchingRecords.length === 0 ? (
                <div className="p-12 text-center text-slate-404 dark:text-slate-500">
                  <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-sm font-bold">لا توجد إجازات مسجلة أو نشطة في هذا الشهر</p>
                  <p className="text-xs mt-1">لم يتم رفع أي أيام إجازة تقع ضمن شهر {monthlyOverlappingStats.find(m => m.monthNum === trackerMonth)?.monthName} لعام {trackerYear}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        <th className="p-3 font-black text-right">رتبة واسم الفرد</th>
                        <th className="p-3 font-black text-right">الكتيبة / الوحدة</th>
                        <th className="p-3 font-black text-right">التشخيص الطبي</th>
                        <th className="p-3 font-black text-center">فترة الإجازة الكاملة</th>
                        <th className="p-3 font-black text-center w-48">الأيام خلال هذا الشهر</th>
                        <th className="p-3 font-black text-center">الحالة</th>
                        <th className="p-3 font-black text-center no-print w-16">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {selectedMonthDetails.matchingRecords.map(({ record, overlapDays, totalLeaveDuration }) => {
                        // Calculate percentage of the month (approx 30 days) that this leave covers
                        const daysInMonth = new Date(trackerYear, trackerMonth, 0).getDate();
                        const monthPercentage = Math.round((overlapDays / daysInMonth) * 100);

                        return (
                          <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-850 dark:text-slate-200 transition-colors">
                            <td className="p-3">
                              <div className="font-bold">{record.name}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{record.rank}</div>
                            </td>
                            <td className="p-3 font-medium text-slate-600 dark:text-slate-400">{record.unit || 'الكتيبة الأولى'}</td>
                            <td className="p-3">
                              <span className="inline-block px-2 py-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg text-[11px] font-medium border border-rose-100 dark:border-rose-900/30">
                                {record.diagnosis}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="font-mono text-slate-600 dark:text-slate-400">{record.startDate}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">إلى {record.endDate} ({totalLeaveDuration} يوم)</div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-mono font-bold text-pink-600 dark:text-pink-400 text-xs">
                                  {overlapDays} <span className="text-[10px] text-slate-400 font-sans">يوماً</span>
                                </span>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-pink-500 h-full rounded-full" 
                                    style={{ width: `${Math.min(100, monthPercentage)}%` }}
                                  />
                                </div>
                                <span className="text-[9px] text-slate-400">{monthPercentage}% من أيام الشهر</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black ${
                                record.contactStatus === 'confirmed'
                                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                  : record.contactStatus === 'request_extension'
                                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                  : record.contactStatus === 'pending'
                                  ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              }`}>
                                {record.contactStatus === 'confirmed'
                                  ? 'حاضر/مؤكد'
                                  : record.contactStatus === 'request_extension'
                                  ? 'طلب تمديد'
                                  : record.contactStatus === 'pending'
                                  ? 'قيد الانتظار'
                                  : 'متهرب/لا يرد'}
                              </span>
                            </td>
                            <td className="p-3 text-center no-print">
                              {onDelete && (
                                <button
                                  onClick={() => {
                                    setRecordToDelete(record);
                                    setDeleteModalOpen(true);
                                  }}
                                  title="حذف الإجازة نهائياً"
                                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Add Leave Record Panel */}
      {activeModalId === 'add-record' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 md:p-8 shadow-md text-right max-w-3xl mx-auto w-full relative"
        >
          {/* Subtle top-glow accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-blue-500 to-indigo-500" />
          
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <button
              onClick={() => {
                setActiveModalId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-all text-left"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 justify-end">
              <div className="text-right">
                <h3 className="text-base font-black text-slate-900 dark:text-white">تسجيل إجازة مرضية جديدة فوراً</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">تسجيل مباشر وسريع في قاعدة بيانات الشؤون الطبية المحلية للواء 43</p>
              </div>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-xl">
                <UserPlus className="w-5 h-5" />
              </div>
            </div>
          </div>

          <QuickAddForm onAddRecord={async (record) => {
            if (onAdd) {
              await onAdd(record);
              setActiveModalId(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }} todayStr={todayStr} />
        </motion.div>
      )}

      {/* AI Bulk Import Panel */}
      {activeModalId === 'ai-bulk' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 md:p-8 shadow-md text-right max-w-7xl mx-auto w-full relative"
        >
          {/* Subtle top-glow accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-violet-500 to-indigo-500" />
          
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <button
              onClick={() => {
                setActiveModalId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-all text-left cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 justify-end">
              <div className="text-right">
                <h3 className="text-base font-black text-slate-900 dark:text-white">التسجيل الجماعي الذكي بالذكاء الاصطناعي</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">معالجة فورية وتلقائية للتقارير والكشوفات الطبية المتنوعة للواء 43</p>
              </div>
              <div className="p-2.5 bg-violet-50 dark:bg-violet-950/40 text-violet-500 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          <AIBulkLeaves
            onAddRecords={async (records) => {
              if (onAdd) {
                for (const rec of records) {
                  await onAdd(rec);
                }
                setActiveModalId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            onClose={() => {
              setActiveModalId(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            triggerToast={triggerToast}
          />
        </motion.div>
      )}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setRecordToDelete(null);
        }}
        onConfirm={executeDelete}
        recordName={recordToDelete ? `${recordToDelete.rank} / ${recordToDelete.name}` : ''}
        recordUnit={recordToDelete?.unit || 'اللواء 43 عمالقة'}
        recordType={recordToDelete ? recordToDelete.type : ''}
      />
    </div>
  );
}

function QuickAddForm({ onAddRecord, todayStr }: { onAddRecord: (record: LeaveRecord) => Promise<void>; todayStr: string }) {
  const [name, setName] = useState('');
  const [rank, setRank] = useState('جندي');
  const [unit, setUnit] = useState('الكتيبة الأولى');
  const [type, setType] = useState<'مريض' | 'مرافق' | 'مرض قريب' | 'حادث'>('مريض');
  const [diagnosis, setDiagnosis] = useState('');
  const [issuer, setIssuer] = useState('المستشفى العسكري - عدن');
  const [startDate, setStartDate] = useState(todayStr);
  const [duration, setDuration] = useState(15);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculatedEndDate = useMemo(() => {
    if (!startDate || isNaN(duration) || duration <= 0) return '';
    try {
      const d = new Date(startDate);
      d.setDate(d.getDate() + Math.max(1, duration) - 1);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }, [startDate, duration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!diagnosis.trim()) return;

    setIsSubmitting(true);
    const newRecord: LeaveRecord = {
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      rank,
      unit,
      type,
      diagnosis: diagnosis.trim(),
      issuer: issuer.trim(),
      startDate,
      endDate: calculatedEndDate,
      notes: notes.trim(),
      contactStatus: 'pending',
      contactLogs: [],
      history: [
        {
          date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          action: 'إنشاء',
          details: `تم إنشاء السجل الطبي الأولي عبر البوابة السريعة بلوحة التحكم بقوة ${duration} أيام إجازة.`
        }
      ]
    };

    try {
      await onAddRecord(newRecord);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-right font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Name input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">الاسم الكامل للفرد (رباعي)</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: أحمد علي محمد ناصر"
            className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
          />
        </div>

        {/* Rank selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">الرتبة العسكرية</label>
          <select
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
          >
            {['جندي', 'عريف', 'رقيب', 'رقيب أول', 'ملازم', 'ملازم أول', 'نقيب', 'رائد', 'مقدم', 'عقيد', 'عميد'].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Unit selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">الكتيبة / القوة التابع لها</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
          >
            {['الكتيبة الأولى', 'الكتيبة الثانية', 'الكتيبة الثالثة', 'الكتيبة الرابعة', 'مقر القيادة للواء', 'سرية الإشارة والاتصالات', 'الاستطلاع والاستخبارات', 'الدفاع الجوي', 'الطبابة والخدمات الطبية'].map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* Leave type selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">تصنيف الإجازة المرضية</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
          >
            <option value="مريض">مرضية (مريض)</option>
            <option value="مرافق">مرافقة مريض</option>
            <option value="مرض قريب">ظروف صحية عائلية</option>
            <option value="حادث">إصابة حادث / ميدانية</option>
          </select>
        </div>

        {/* Diagnosis input */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">التشخيص الطبي الدقيق</label>
          <input
            type="text"
            required
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="مثال: كسر مغلق في قصبة الساق اليسرى يستلزم الجبس"
            className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
          />
        </div>

        {/* Issuer input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">الجهة المصدرة للتقرير الطبي</label>
          <input
            type="text"
            required
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="المستشفى أو المركز الطبي المشرف"
            className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
          />
        </div>

        {/* Start Date */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">تاريخ بدء الإجازة</label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right font-mono"
          />
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">مدة الإجازة الموصى بها (بالأيام)</label>
          <input
            type="number"
            min="1"
            max="180"
            required
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
            className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right font-mono"
          />
        </div>

        {/* End Date (Calculated) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-indigo-500">تاريخ الانتهاء المجدول (تلقائي)</label>
          <div className="w-full text-xs px-4 py-3 rounded-xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
            {calculatedEndDate || 'حدد تاريخ البدء والمدة'}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">ملاحظات أو قيود الخدمة الطبية الإضافية</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: يمنع من الخدمة الميدانية العنيفة والوقوف الطويل لمدة شهرين بعد تماثله للشفاء."
            rows={3}
            className="w-full text-xs p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
          />
        </div>
      </div>

      <div className="pt-3 border-t border-slate-150 dark:border-slate-800 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black text-xs rounded-xl shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'جاري تسجيل الإجازة...' : 'حفظ وتسجيل الإجازة المرضية العسكرية'}
        </button>
      </div>
    </form>
  );
}
