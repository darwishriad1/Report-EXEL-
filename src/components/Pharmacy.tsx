/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HeartPulse,
  Plus,
  Search,
  Printer,
  Calendar,
  X,
  Database,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  Store,
  MapPin,
  CheckCircle2,
  Trash2,
  FileSpreadsheet,
  Upload,
  Download,
  Check
} from 'lucide-react';
import { PharmacyItem, PharmacyLog } from '../types';

interface PharmacyProps {
  triggerToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

const SEED_PHARMACY_ITEMS: PharmacyItem[] = [
  {
    id: "med_1",
    name: "Ceftriaxone 1g Injection",
    arabicName: "سيفتركسون 1جم (مضاد حيوي حقن)",
    category: "مضادات حيوية",
    quantity: 140,
    minThreshold: 50,
    unit: "حقنة",
    location: "مستودع الخوخة الرئيسي",
    lastUpdated: "2026-07-04"
  },
  {
    id: "med_2",
    name: "Tactical Combat Tourniquet (CAT)",
    arabicName: "عاصبة شريانية تكتيكية (لوقف النزيف)",
    category: "مستلزمات جراحية",
    quantity: 15,
    minThreshold: 30,
    unit: "قطعة",
    location: "العيادة الميدانية بالمخا",
    lastUpdated: "2026-07-05"
  },
  {
    id: "med_3",
    name: "Normal Saline 500ml",
    arabicName: "محلول ملحي مغذي 500 مل",
    category: "محاليل وإماهة",
    quantity: 320,
    minThreshold: 100,
    unit: "قنينة",
    location: "مستودع الخوخة الرئيسي",
    lastUpdated: "2026-07-02"
  },
  {
    id: "med_4",
    name: "Tramadol 100mg Ampoules",
    arabicName: "ترامادول 100ملجم (مسكن آلام حاد)",
    category: "مسكنات وطوارئ",
    quantity: 45,
    minThreshold: 20,
    unit: "أمبول",
    location: "مستوصف عدن الطبي",
    lastUpdated: "2026-07-05"
  },
  {
    id: "med_5",
    name: "Co-artem (Artemether/Lumefantrine)",
    arabicName: "كو-أرتيم (علاج الملاريا ومضاد طفيلي)",
    category: "مضادات حيوية",
    quantity: 8,
    minThreshold: 25,
    unit: "علبة",
    location: "العيادة الميدانية بالمخا",
    lastUpdated: "2026-07-01"
  },
  {
    id: "med_6",
    name: "Sterile Gauze Bandages 10cm",
    arabicName: "شاش طبي معقم ومطهر 10 سم",
    category: "مستلزمات جراحية",
    quantity: 450,
    minThreshold: 150,
    unit: "رباط",
    location: "مستودع الخوخة الرئيسي",
    lastUpdated: "2026-07-04"
  }
];

const SEED_PHARMACY_LOGS: PharmacyLog[] = [
  {
    id: "log_1",
    itemName: "سيفتركسون 1جم (مضاد حيوي حقن)",
    action: "توريد",
    quantity: 100,
    recipient: "مخازن اللواء الرئيسية (عدن)",
    date: "2026-07-04 10:30:15",
    operator: "مساعد طبيب / عادل اليافعي"
  },
  {
    id: "log_2",
    itemName: "عاصبة شريانية تكتيكية (لوقف النزيف)",
    action: "صرف",
    quantity: 10,
    recipient: "مفرزة إسعاف الكتيبة الأولى (الجبهة)",
    date: "2026-07-05 08:20:00",
    operator: "الملازم طبيب / خالد الوالي"
  },
  {
    id: "log_3",
    itemName: "كو-أرتيم (علاج الملاريا ومضاد طفيلي)",
    action: "صرف",
    quantity: 5,
    recipient: "النقيب ياسر العولقي (عيادة اللواء)",
    date: "2026-07-05 09:15:30",
    operator: "مساعد طبيب / عادل اليافعي"
  }
];

export interface ReceivedMedication {
  id: string;
  name: string;
  arabicName: string;
  category: PharmacyItem['category'];
  quantity: number;
  unit: string;
  source: string;
  receivedDate: string;
  batchNumber: string;
  status: 'تم الفحص والإدخال' | 'قيد المعاينة والفحص' | 'مرفوض - تالف';
  receiverName: string;
  expiryDate?: string;
}

export interface InvoiceItem {
  itemId: string;
  arabicName: string;
  name: string;
  quantity: number;
  unit: string;
  category: PharmacyItem['category'];
}

export interface DisbursementInvoice {
  id: string;
  invoiceNumber: string;
  recipient: string;
  date: string;
  operator: string;
  items: InvoiceItem[];
  notes?: string;
}

const SEED_RECEIVED_MEDS: ReceivedMedication[] = [
  {
    id: "rec_1",
    name: "Ceftriaxone 1g Injection",
    arabicName: "سيفتركسون 1جم (حقن مضاد حيوي)",
    category: "مضادات حيوية",
    quantity: 100,
    unit: "حقنة",
    source: "الهلال الأحمر الإماراتي",
    receivedDate: "2026-07-04",
    batchNumber: "B-CEF992",
    status: "تم الفحص والإدخال",
    receiverName: "الملازم طبيب / خالد الوالي",
    expiryDate: "2028-12-01"
  },
  {
    id: "rec_2",
    name: "Tactical Combat Tourniquet (CAT)",
    arabicName: "عاصبة شريانية تكتيكية (لوقف النزيف)",
    category: "مستلزمات جراحية",
    quantity: 50,
    unit: "قطعة",
    source: "مركز الملك سلمان للإغاثة",
    receivedDate: "2026-07-05",
    batchNumber: "B-CAT401",
    status: "قيد المعاينة والفحص",
    receiverName: "مساعد طبيب / عادل اليافعي",
    expiryDate: "2031-06-30"
  },
  {
    id: "rec_3",
    name: "Normal Saline 500ml",
    arabicName: "محلول ملحي مغذي 500 مل",
    category: "محاليل وإماهة",
    quantity: 200,
    unit: "قنينة",
    source: "مستودعات الإمداد المركزي عدن",
    receivedDate: "2026-07-02",
    batchNumber: "B-SAL088",
    status: "تم الفحص والإدخال",
    receiverName: "الملازم طبيب / خالد الوالي",
    expiryDate: "2027-09-15"
  }
];

export default function Pharmacy({ triggerToast }: PharmacyProps) {
  // Inventory state
  const [items, setItems] = useState<PharmacyItem[]>(() => {
    const saved = localStorage.getItem('military_pharmacy_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed parsing pharmacy items", e);
      }
    }
    return SEED_PHARMACY_ITEMS;
  });

  // Received Medications State
  const [receivedMeds, setReceivedMeds] = useState<ReceivedMedication[]>(() => {
    const saved = localStorage.getItem('military_pharmacy_received');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed parsing received meds", e);
      }
    }
    return SEED_RECEIVED_MEDS;
  });

  // Custom Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'clear_all' | 'delete_item' | 'reject_shipment' | 'confirm_invoice';
    targetId?: string;
    targetName?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'clear_all'
  });

  // Disbursement Invoices State & Persistence
  const [invoices, setInvoices] = useState<DisbursementInvoice[]>(() => {
    const saved = localStorage.getItem('military_pharmacy_invoices');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed parsing pharmacy invoices", e);
      }
    }
    return [
      {
        id: "inv_1",
        invoiceNumber: "صرف-43-1001",
        recipient: "مفرزة الكتيبة الأولى جبهة الخوخة",
        date: "2026-07-05",
        operator: "مساعد طبيب / عادل اليافعي",
        items: [
          {
            itemId: "med_1",
            arabicName: "سيفتركسون 1جم (مضاد حيوي حقن)",
            name: "Ceftriaxone 1g Injection",
            quantity: 10,
            unit: "حقنة",
            category: "مضادات حيوية"
          },
          {
            itemId: "med_2",
            arabicName: "عاصبة شريانية تكتيكية (لوقف النزيف)",
            name: "Tactical Combat Tourniquet (CAT)",
            quantity: 5,
            unit: "قطعة",
            category: "مستلزمات جراحية"
          }
        ],
        notes: "صرف عاجل لدعم مفرزة الكتيبة الأولى بعد الاشتباكات الأخيرة"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('military_pharmacy_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Invoice creation draft states
  const [invoiceRecipient, setInvoiceRecipient] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invoiceOperator, setInvoiceOperator] = useState('مساعد طبيب / عادل اليافعي');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [draftItems, setDraftItems] = useState<{ itemId: string; quantity: number }[]>([]);
  const [selectedMedId, setSelectedMedId] = useState('');
  const [selectedMedQty, setSelectedMedQty] = useState<number>(1);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<DisbursementInvoice | null>(null);

  const finalizeDispenseInvoice = () => {
    if (!invoiceRecipient.trim() || draftItems.length === 0) return;

    // Double check stock
    for (const dItem of draftItems) {
      const invItem = items.find(i => i.id === dItem.itemId);
      if (!invItem) {
        triggerToast(`عذراً، الصنف المحدد لم يعد موجوداً في المستودع`, 'error');
        return;
      }
      if (invItem.quantity < dItem.quantity) {
        triggerToast(`عذراً، الكمية المتوفرة من [${invItem.arabicName}] هي (${invItem.quantity}) وهي أقل من الكمية المطلوبة بالفاتورة (${dItem.quantity})`, 'error');
        return;
      }
    }

    // 1. Decrement inventory
    setItems(prev => prev.map(invItem => {
      const draft = draftItems.find(d => d.itemId === invItem.id);
      if (draft) {
        return {
          ...invItem,
          quantity: invItem.quantity - draft.quantity,
          lastUpdated: invoiceDate
        };
      }
      return invItem;
    }));

    // 2. Create invoice items list
    const invoiceItemsList: InvoiceItem[] = draftItems.map(dItem => {
      const invItem = items.find(i => i.id === dItem.itemId)!;
      return {
        itemId: dItem.itemId,
        arabicName: invItem.arabicName,
        name: invItem.name,
        quantity: dItem.quantity,
        unit: invItem.unit,
        category: invItem.category
      };
    });

    const serialNum = `صرف-43-${1000 + invoices.length + 1}`;
    const newInvoice: DisbursementInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: serialNum,
      recipient: invoiceRecipient.trim(),
      date: invoiceDate,
      operator: invoiceOperator.trim() || 'مساعد طبيب / عادل اليافعي',
      items: invoiceItemsList,
      notes: invoiceNotes.trim() || undefined
    };

    // 3. Update invoices
    setInvoices(prev => [newInvoice, ...prev]);

    // 4. Log transactions
    const formattedTime = new Date().toLocaleTimeString('ar-YE', { hour12: false });
    const logDateTime = `${invoiceDate} ${formattedTime}`;

    const newLogs: PharmacyLog[] = invoiceItemsList.map(item => ({
      id: `log_${Math.random().toString(36).substring(2, 9)}`,
      itemName: item.arabicName,
      action: 'صرف',
      quantity: item.quantity,
      recipient: invoiceRecipient.trim(),
      date: logDateTime,
      operator: invoiceOperator.trim() || 'مساعد طبيب / عادل اليافعي'
    }));

    setLogs(prev => [...newLogs, ...prev]);

    // 5. Open this invoice in preview
    setSelectedInvoiceForView(newInvoice);

    // 6. Reset draft
    setInvoiceRecipient('');
    setInvoiceNotes('');
    setDraftItems([]);
    setSelectedMedId('');
    setSelectedMedQty(1);

    triggerToast(`تم بنجاح صرف الفاتورة (${serialNum}) وتحديث عهد المستودعات للكتيبة`, 'success');
  };

  // Handler for custom confirmation execution
  const handleConfirmAction = () => {
    const { actionType, targetId, targetName } = confirmConfig;
    if (actionType === 'clear_all') {
      setItems([]);
      setReceivedMeds([]);
      setLogs([]);
      setInvoices([]);
      localStorage.removeItem('military_pharmacy_items');
      localStorage.removeItem('military_pharmacy_received');
      localStorage.removeItem('military_pharmacy_logs');
      localStorage.removeItem('military_pharmacy_invoices');
      triggerToast("تم تصفير وحذف كافة البيانات الطبية بنجاح", "info");
    } else if (actionType === 'delete_item' && targetId) {
      setItems(prev => prev.filter(i => i.id !== targetId));
      triggerToast(`تم إخلاء الصنف [${targetName}] من عهدة اللواء الطبية`, 'info');
    } else if (actionType === 'reject_shipment' && targetId) {
      setReceivedMeds(prev => prev.map(m => m.id === targetId ? { ...m, status: 'مرفوض - تالف' } : m));
      triggerToast(`تم تسجيل الشحنة [${targetName}] كمرفوضة وتالفة لحماية الجنود`, 'info');
    } else if (actionType === 'confirm_invoice') {
      finalizeDispenseInvoice();
    }
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Persist received meds
  useEffect(() => {
    localStorage.setItem('military_pharmacy_received', JSON.stringify(receivedMeds));
  }, [receivedMeds]);

  // Tab State: 'inventory' or 'received' or 'dispensation'
  const [activeTab, setActiveTab] = useState<'inventory' | 'received' | 'dispensation'>('inventory');

  // Excel Import States
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [importText, setImportText] = useState('');
  const [importTarget, setImportTarget] = useState<'inventory' | 'received'>('inventory');
  const [importWarehouse, setImportWarehouse] = useState('مستودع الخوخة الرئيسي');
  const [isCustomWarehouse, setIsCustomWarehouse] = useState(false);
  const [customWarehouseText, setCustomWarehouseText] = useState('');
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [importError, setImportError] = useState('');
  const [detectedMapping, setDetectedMapping] = useState<{
    arabicName: { index: number; label: string; headerName: string; confidence: 'high' | 'medium' | 'fallback' };
    name: { index: number; label: string; headerName: string; confidence: 'high' | 'medium' | 'fallback' };
    category: { index: number; label: string; headerName: string; confidence: 'high' | 'medium' | 'fallback' };
    quantity: { index: number; label: string; headerName: string; confidence: 'high' | 'medium' | 'fallback' };
    unit: { index: number; label: string; headerName: string; confidence: 'high' | 'medium' | 'fallback' };
    locationOrSource: { index: number; label: string; headerName: string; confidence: 'high' | 'medium' | 'fallback' };
    minThreshold: { index: number; label: string; headerName: string; confidence: 'high' | 'medium' | 'fallback' };
    expiryDate: { index: number; label: string; headerName: string; confidence: 'high' | 'medium' | 'fallback' };
  } | null>(null);

  // Form states for creating a received item manually
  const [isAddingReceived, setIsAddingReceived] = useState(false);
  const [newReceivedData, setNewReceivedData] = useState({
    arabicName: '',
    name: '',
    category: 'مسكنات وطوارئ' as PharmacyItem['category'],
    quantity: 100,
    unit: 'علبة',
    source: '',
    batchNumber: '',
    expiryDate: '',
    receiverName: 'مساعد طبيب / عادل اليافعي'
  });

  // File Change for CSV upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportText(text);
      parseCSVData(text);
    };
    reader.readAsText(file, 'UTF-8'); // Read with UTF-8 explicitly for perfect Arabic support
  };

  // CSV/Excel copy-paste parser helper with dynamic column intelligence
  const parseCSVData = (text: string) => {
    try {
      // 1. Strip UTF-8 BOM if present (prevents first field corruption)
      let cleanText = text.replace(/^\uFEFF/, "").trim();
      if (!cleanText) {
        setImportError('الملف أو النص المدخل فارغ');
        return;
      }

      // Split into lines
      const lines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) {
        setImportError('الملف أو النص المدخل فارغ');
        return;
      }

      // 2. Dynamic Delimiter Detection
      const firstFewLines = lines.slice(0, Math.min(5, lines.length));
      let tabsCount = 0;
      let semicolonsCount = 0;
      let commasCount = 0;
      for (const line of firstFewLines) {
        tabsCount += (line.match(/\t/g) || []).length;
        semicolonsCount += (line.match(/;/g) || []).length;
        commasCount += (line.match(/,/g) || []).length;
      }

      let delimiter = '\t'; // Default to Tab for Excel copy-paste
      if (semicolonsCount > tabsCount && semicolonsCount > commasCount) {
        delimiter = ';';
      } else if (commasCount > tabsCount && commasCount > semicolonsCount) {
        delimiter = ',';
      }

      // 3. Robust Line Splitter (respecting double quotes)
      const splitCSVLine = (line: string, delim: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delim && !inQuotes) {
            result.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current);
        return result.map(val => val.replace(/^["']|["']$/g, '').trim());
      };

      const firstRowCells = splitCSVLine(lines[0], delimiter);
      
      // Keywords mapping for smart Arabic and English matching
      const mappingRules: { [key: string]: string[] } = {
        arabicName: [
          'arabic', 'name_ar', 'arabicname', 'الاسم بالعربي', 'اسم الدواء', 'المستحضر', 
          'اسم الصنف', 'دواء بالعربي', 'الاسم العربي', 'الاسم', 'العربي', 'أدوية', 'العلاج', 'الدواء'
        ],
        name: [
          'english', 'name_en', 'englishname', 'الاسم بالانجليزي', 'الاسم العلمي', 
          'الاسم الإنجليزي', 'إنجليزي', 'الانجليزي', 'generic', 'scientific', 'brand', 'name', 'eng'
        ],
        category: [
          'category', 'type', 'group', 'class', 'التصنيف', 'الفئة', 'النوع', 'تصنيف', 'قسم', 'القسم'
        ],
        quantity: [
          'quantity', 'qty', 'count', 'amount', 'stock', 'الكمية', 'العدد', 'المخزون', 'الرصيد', 'المجموع', 'العددية'
        ],
        unit: [
          'unit', 'measure', 'pkg', 'pack', 'الوحدة', 'عبوة', 'وحدة القياس', 'النوعية', 'شكل', 'طريقة'
        ],
        locationOrSource: [
          'location', 'source', 'warehouse', 'store', 'supplier', 'الموقع', 'المستودع', 
          'الجهة الموردة', 'المصدر', 'المورد', 'مكان التخزين', 'الجهة', 'مستودع'
        ],
        minThreshold: [
          'min', 'threshold', 'limit', 'critical', 'الحد الأدنى', 'حد الطلب', 'الحد الحرج', 'أدنى كمية', 'التنبيه'
        ],
        expiryDate: [
          'expiry', 'expire', 'exp', 'date', 'تاريخ الانتهاء', 'تاريخ الصلاحية', 'الصلاحية', 'الانتهاء', 'تاريخ'
        ]
      };

      // Heuristic: Does firstRow look like headers?
      let matchesHeaderKeywords = 0;
      for (const cell of firstRowCells) {
        const lowerCell = cell.toLowerCase().trim();
        for (const key of Object.keys(mappingRules)) {
          if (mappingRules[key].some(rule => lowerCell.includes(rule))) {
            matchesHeaderKeywords++;
            break;
          }
        }
      }

      const isHeaderRow = matchesHeaderKeywords >= 2 || (firstRowCells.length > 2 && matchesHeaderKeywords >= 1);
      const startIdx = isHeaderRow ? 1 : 0;
      const headers = isHeaderRow ? firstRowCells : firstRowCells.map((_, idx) => `العمود ${idx + 1}`);

      // Default/Fallback mapping initialization
      const mappingResult: any = {
        arabicName: { index: -1, label: 'الاسم بالعربي', headerName: 'غير محدد', confidence: 'fallback' },
        name: { index: -1, label: 'الاسم بالإنجليزي', headerName: 'غير محدد', confidence: 'fallback' },
        category: { index: -1, label: 'التصنيف الطبي', headerName: 'غير محدد', confidence: 'fallback' },
        quantity: { index: -1, label: 'الكمية الكلية', headerName: 'غير محدد', confidence: 'fallback' },
        unit: { index: -1, label: 'الوحدة / العبوة', headerName: 'غير محدد', confidence: 'fallback' },
        locationOrSource: { index: -1, label: 'المستودع / الجهة الموردة', headerName: 'غير محدد', confidence: 'fallback' },
        minThreshold: { index: -1, label: 'الحد الحرج', headerName: 'غير محدد', confidence: 'fallback' },
        expiryDate: { index: -1, label: 'تاريخ الانتهاء', headerName: 'غير محدد', confidence: 'fallback' }
      };

      // Match Phase 1: Direct Header Match (high confidence)
      const matchedIndices = new Set<number>();
      if (isHeaderRow) {
        firstRowCells.forEach((cell, idx) => {
          const lowerCell = cell.toLowerCase().trim();
          for (const key of Object.keys(mappingRules)) {
            if (mappingResult[key].index === -1 && mappingRules[key].some(rule => lowerCell === rule || lowerCell.includes(rule))) {
              mappingResult[key].index = idx;
              mappingResult[key].headerName = cell;
              mappingResult[key].confidence = 'high';
              matchedIndices.add(idx);
              break;
            }
          }
        });
      }

      // Match Phase 2: Content Analysis (medium confidence)
      // Check the values of first few records to guess columns
      const sampleRows: string[][] = [];
      for (let i = startIdx; i < Math.min(lines.length, startIdx + 10); i++) {
        sampleRows.push(splitCSVLine(lines[i], delimiter));
      }

      const numCols = firstRowCells.length;
      for (let j = 0; j < numCols; j++) {
        if (matchedIndices.has(j)) continue;

        const sampleVals = sampleRows.map(row => row[j] || '').filter(v => v.length > 0);
        if (sampleVals.length === 0) continue;

        let isNumeric = true;
        let isDate = true;
        let containsArabic = false;
        let containsEnglish = false;
        let matchesUnit = 0;
        let matchesCategory = 0;

        sampleVals.forEach(val => {
          if (isNaN(Number(val.replace(/[^\d.-]/g, '')))) {
            isNumeric = false;
          }
          if (!/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(val) && 
              !/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(val) && 
              !/^\d{1,2}[-/]\d{1,2}[-/]\d{2}$/.test(val)) {
            isDate = false;
          }
          if (/[\u0600-\u06FF]/.test(val)) {
            containsArabic = true;
          }
          if (/[a-zA-Z]/.test(val)) {
            containsEnglish = true;
          }
          if (['علبة', 'كرتون', 'حقنة', 'امبول', 'قنينة', 'شريط', 'حبة', 'قطعة', 'مل', 'جم', 'امبولات', 'عبوة', 'بخاخ', 'درزن'].some(unitWord => val.includes(unitWord))) {
            matchesUnit++;
          }
          if (['مضاد', 'مسكن', 'محلول', 'طوارئ', 'جراح', 'إماهة', 'مستلزمات', 'أدوية', 'علاج', 'أقراص', 'شراب', 'كبسولات'].some(catWord => val.includes(catWord))) {
            matchesCategory++;
          }
        });

        if (isDate && mappingResult.expiryDate.index === -1) {
          mappingResult.expiryDate.index = j;
          mappingResult.expiryDate.headerName = headers[j];
          mappingResult.expiryDate.confidence = 'medium';
          matchedIndices.add(j);
        } else if (isNumeric) {
          if (mappingResult.quantity.index === -1) {
            mappingResult.quantity.index = j;
            mappingResult.quantity.headerName = headers[j];
            mappingResult.quantity.confidence = 'medium';
            matchedIndices.add(j);
          } else if (mappingResult.minThreshold.index === -1) {
            mappingResult.minThreshold.index = j;
            mappingResult.minThreshold.headerName = headers[j];
            mappingResult.minThreshold.confidence = 'medium';
            matchedIndices.add(j);
          }
        } else if (matchesUnit > sampleVals.length * 0.3 && mappingResult.unit.index === -1) {
          mappingResult.unit.index = j;
          mappingResult.unit.headerName = headers[j];
          mappingResult.unit.confidence = 'medium';
          matchedIndices.add(j);
        } else if (matchesCategory > sampleVals.length * 0.3 && mappingResult.category.index === -1) {
          mappingResult.category.index = j;
          mappingResult.category.headerName = headers[j];
          mappingResult.category.confidence = 'medium';
          matchedIndices.add(j);
        } else if (containsArabic && !containsEnglish) {
          if (mappingResult.arabicName.index === -1) {
            mappingResult.arabicName.index = j;
            mappingResult.arabicName.headerName = headers[j];
            mappingResult.arabicName.confidence = 'medium';
            matchedIndices.add(j);
          } else if (mappingResult.locationOrSource.index === -1) {
            mappingResult.locationOrSource.index = j;
            mappingResult.locationOrSource.headerName = headers[j];
            mappingResult.locationOrSource.confidence = 'medium';
            matchedIndices.add(j);
          }
        } else if (containsEnglish) {
          if (mappingResult.name.index === -1) {
            mappingResult.name.index = j;
            mappingResult.name.headerName = headers[j];
            mappingResult.name.confidence = 'medium';
            matchedIndices.add(j);
          }
        }
      }

      // Match Phase 3: Ordered fallback assignments
      if (mappingResult.arabicName.index === -1 && numCols > 0) {
        mappingResult.arabicName.index = 0;
        mappingResult.arabicName.headerName = headers[0];
        mappingResult.arabicName.confidence = 'fallback';
      }
      if (mappingResult.name.index === -1 && numCols > 1) {
        mappingResult.name.index = 1;
        mappingResult.name.headerName = headers[1];
        mappingResult.name.confidence = 'fallback';
      }
      if (mappingResult.category.index === -1 && numCols > 2) {
        mappingResult.category.index = 2;
        mappingResult.category.headerName = headers[2];
        mappingResult.category.confidence = 'fallback';
      }
      if (mappingResult.quantity.index === -1) {
        for (let j = 0; j < numCols; j++) {
          if (j !== mappingResult.arabicName.index && j !== mappingResult.name.index && j !== mappingResult.category.index) {
            mappingResult.quantity.index = j;
            mappingResult.quantity.headerName = headers[j];
            mappingResult.quantity.confidence = 'fallback';
            break;
          }
        }
        if (mappingResult.quantity.index === -1 && numCols > 3) {
          mappingResult.quantity.index = 3;
          mappingResult.quantity.headerName = headers[3];
          mappingResult.quantity.confidence = 'fallback';
        }
      }
      if (mappingResult.unit.index === -1 && numCols > 4) {
        mappingResult.unit.index = 4;
        mappingResult.unit.headerName = headers[4];
        mappingResult.unit.confidence = 'fallback';
      }
      if (mappingResult.locationOrSource.index === -1 && numCols > 5) {
        mappingResult.locationOrSource.index = 5;
        mappingResult.locationOrSource.headerName = headers[5];
        mappingResult.locationOrSource.confidence = 'fallback';
      }

      setDetectedMapping(mappingResult);

      // Parse data rows
      const parsed: any[] = [];
      for (let i = startIdx; i < lines.length; i++) {
        const cols = splitCSVLine(lines[i], delimiter);
        if (cols.length === 0) continue;

        const getColVal = (mapped: any) => {
          if (mapped.index !== -1 && cols[mapped.index] !== undefined) {
            return cols[mapped.index].trim();
          }
          return '';
        };

        const arabicName = getColVal(mappingResult.arabicName);
        if (!arabicName) continue; // Skip empty rows

        const name = getColVal(mappingResult.name);
        const categoryRaw = getColVal(mappingResult.category);

        let category: PharmacyItem['category'] = 'مسكنات وطوارئ';
        const normCat = categoryRaw.toLowerCase();
        if (normCat.includes('مضاد') || normCat.includes('antibiotic') || normCat.includes('حيو')) {
          category = 'مضادات حيوية';
        } else if (normCat.includes('محلول') || normCat.includes('saline') || normCat.includes('إماهة') || normCat.includes('مغذي')) {
          category = 'محاليل وإماهة';
        } else if (normCat.includes('جراح') || normCat.includes('bandage') || normCat.includes('مستلزمات') || normCat.includes('شاش') || normCat.includes('مستلزم')) {
          category = 'مستلزمات جراحية';
        } else if (normCat.includes('مسكن') || normCat.includes('طوارئ') || normCat.includes('آلام') || normCat.includes('حرارة') || normCat.includes('ألم')) {
          category = 'مسكنات وطوارئ';
        }

        const quantityRaw = getColVal(mappingResult.quantity);
        const quantity = quantityRaw ? parseInt(quantityRaw.replace(/[^\d]/g, ''), 10) : 50;

        const unit = getColVal(mappingResult.unit) || 'علبة';
        const locationOrSource = getColVal(mappingResult.locationOrSource) || 'مستودع الخوخة الرئيسي';
        
        const minThresholdRaw = getColVal(mappingResult.minThreshold);
        const minThreshold = minThresholdRaw ? parseInt(minThresholdRaw.replace(/[^\d]/g, ''), 10) : Math.ceil(quantity * 0.15) || 10;

        const expiryDate = getColVal(mappingResult.expiryDate) || '2027-12-30';

        parsed.push({
          id: `row_${Date.now()}_${i}_${Math.random().toString(36).substring(2,5)}`,
          arabicName,
          name: name || 'Imported Spec',
          category,
          quantity: isNaN(quantity) ? 50 : quantity,
          unit,
          location: locationOrSource,
          minThreshold: isNaN(minThreshold) ? 10 : minThreshold,
          source: locationOrSource,
          expiryDate,
        });
      }

      if (parsed.length === 0) {
        setImportError('لم يتم العثور على أسطر صالحة للمطابقة. يرجى التأكد من التنسيق ولغة الملف.');
      } else {
        setImportedRows(parsed);
        setImportError('');
      }
    } catch (e: any) {
      setImportError(`فشل التحليل: ${e.message}`);
    }
  };


  // Submit Handler for Manually Adding Received Medication
  const handleAddReceivedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReceivedData.arabicName.trim() || !newReceivedData.source.trim() || newReceivedData.quantity <= 0) {
      triggerToast('الرجاء تعبئة البيانات الأساسية للشحنة المستلمة', 'error');
      return;
    }

    const newRec: ReceivedMedication = {
      id: `rec_${Date.now()}`,
      name: newReceivedData.name.trim(),
      arabicName: newReceivedData.arabicName.trim(),
      category: newReceivedData.category,
      quantity: Number(newReceivedData.quantity),
      unit: newReceivedData.unit.trim() || 'علبة',
      source: newReceivedData.source.trim(),
      receivedDate: new Date().toISOString().split('T')[0],
      batchNumber: newReceivedData.batchNumber.trim() || `B-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      status: 'قيد المعاينة والفحص',
      receiverName: newReceivedData.receiverName.trim() || 'مساعد طبيب / عادل اليافعي',
      expiryDate: newReceivedData.expiryDate || undefined
    };

    setReceivedMeds(prev => [newRec, ...prev]);
    setIsAddingReceived(false);

    // Reset Form
    setNewReceivedData({
      arabicName: '',
      name: '',
      category: 'مسكنات وطوارئ',
      quantity: 100,
      unit: 'علبة',
      source: '',
      batchNumber: '',
      expiryDate: '',
      receiverName: 'مساعد طبيب / عادل اليافعي'
    });

    triggerToast('تم تسجيل الشحنة المستلمة بنجاح، وهي قيد المعاينة الفنية حالياً', 'success');
  };

  // Move received medication to main inventory after approval
  const handleMoveReceivedToInventory = (rec: ReceivedMedication, location: string = 'مستودع الخوخة الرئيسي') => {
    // 1. Mark status as 'تم الفحص والإدخال'
    setReceivedMeds(prev => prev.map(m => m.id === rec.id ? { ...m, status: 'تم الفحص والإدخال' } : m));

    // 2. Check if item already exists in inventory (matching by arabicName or English name)
    const existingIdx = items.findIndex(i => 
      i.arabicName.trim() === rec.arabicName.trim() || 
      (rec.name && i.name.toLowerCase().trim() === rec.name.toLowerCase().trim())
    );

    if (existingIdx > -1) {
      // Update quantity of existing item
      setItems(prev => prev.map((item, idx) => {
        if (idx === existingIdx) {
          return {
            ...item,
            quantity: item.quantity + rec.quantity,
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
        return item;
      }));
    } else {
      // Create a brand new item in inventory
      const newItem: PharmacyItem = {
        id: `med_${Date.now()}`,
        name: rec.name || rec.arabicName,
        arabicName: rec.arabicName,
        category: rec.category,
        quantity: rec.quantity,
        minThreshold: Math.max(10, Math.floor(rec.quantity * 0.2)),
        unit: rec.unit,
        location: location,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      setItems(prev => [...prev, newItem]);
    }

    // 3. Add to pharmacy logs
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    
    const newLog: PharmacyLog = {
      id: `log_${Math.random().toString(36).substring(2, 9)}`,
      itemName: rec.arabicName,
      action: 'توريد',
      quantity: rec.quantity,
      recipient: `استيراد وفحص شحنة مستلمة من: ${rec.source}`,
      date: formattedDate,
      operator: rec.receiverName
    };
    setLogs(prev => [newLog, ...prev]);

    triggerToast(`تم بنجاح فحص الشحنة وإدراج عدد (${rec.quantity} ${rec.unit}) من [${rec.arabicName}] ضمن عهدة المستودع الميداني`, 'success');
  };

  // Reject received shipment
  const handleRejectReceived = (id: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: '🚫 رفض شحنة طبية مستلمة',
      message: `تحذير عاجل: هل تريد رفض الشحنة الطبية [${name}] وتمييزها كتالفة أو غير صالحة للاستخدام الميداني لحماية سلامة الجنود؟`,
      actionType: 'reject_shipment',
      targetId: id,
      targetName: name
    });
  };

  // Transaction Logs state
  const [logs, setLogs] = useState<PharmacyLog[]>(() => {
    const saved = localStorage.getItem('military_pharmacy_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed parsing pharmacy logs", e);
      }
    }
    return SEED_PHARMACY_LOGS;
  });

  // Persist both in localStorage
  useEffect(() => {
    localStorage.setItem('military_pharmacy_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('military_pharmacy_logs', JSON.stringify(logs));
  }, [logs]);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | PharmacyItem['category']>('all');
  const [selectedLocation, setSelectedLocation] = useState<'all' | string>('all');

  // Interactive transaction states
  const [transactionItem, setTransactionItem] = useState<PharmacyItem | null>(null);
  const [transactionType, setTransactionType] = useState<'صرف' | 'توريد'>('صرف');
  const [txQuantity, setTxQuantity] = useState(1);
  const [txRecipient, setTxRecipient] = useState('');
  const [txOperator, setTxOperator] = useState('مساعد طبيب / عادل اليافعي');

  // Form states for creating a new item
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemData, setNewItemData] = useState({
    name: '',
    arabicName: '',
    category: 'مسكنات وطوارئ' as PharmacyItem['category'],
    quantity: 50,
    minThreshold: 20,
    unit: 'علبة',
    location: 'مستودع الخوخة الرئيسي'
  });

  // Extract unique locations for filtering
  const uniqueLocations = useMemo(() => {
    const locs = items.map(item => item.location);
    return Array.from(new Set(locs));
  }, [items]);

  // Compute stock alerts / statistics
  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalUnits = items.reduce((acc, curr) => acc + curr.quantity, 0);
    const lowStockCount = items.filter(i => i.quantity <= i.minThreshold).length;
    const outOfStockCount = items.filter(i => i.quantity === 0).length;

    return { totalItems, totalUnits, lowStockCount, outOfStockCount };
  }, [items]);

  // Filtered medication list
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.arabicName.includes(searchQuery) ||
                            item.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesLocation = selectedLocation === 'all' || item.location === selectedLocation;

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [items, searchQuery, selectedCategory, selectedLocation]);

  // Form Submit Handler for New Item
  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.name.trim() || !newItemData.arabicName.trim() || newItemData.quantity < 0) {
      triggerToast('الرجاء كتابة اسم الصنف الطبي بشكل صحيح باللغتين', 'error');
      return;
    }

    const newItem: PharmacyItem = {
      id: `med_${Date.now()}`,
      name: newItemData.name.trim(),
      arabicName: newItemData.arabicName.trim(),
      category: newItemData.category,
      quantity: Number(newItemData.quantity),
      minThreshold: Number(newItemData.minThreshold),
      unit: newItemData.unit.trim() || 'علبة',
      location: newItemData.location,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    setItems(prev => [...prev, newItem]);
    setIsAddingItem(false);
    
    // Log initial stock load
    const newLog: PharmacyLog = {
      id: `log_${Math.random().toString(36).substring(2, 9)}`,
      itemName: newItem.arabicName,
      action: 'توريد',
      quantity: newItem.quantity,
      recipient: 'إنشاء صنف وإدخال عهدة ابتدائية',
      date: new Date().toLocaleString('ar-YE', { hour12: false }).replace(/\//g, '-'),
      operator: 'لوحة إدارة الصيدلية'
    };
    setLogs(prev => [newLog, ...prev]);

    // Reset Form
    setNewItemData({
      name: '',
      arabicName: '',
      category: 'مسكنات وطوارئ',
      quantity: 50,
      minThreshold: 20,
      unit: 'علبة',
      location: 'مستودع الخوخة الرئيسي'
    });
    triggerToast('تم تسجيل صنف طبي جديد في المخازن وإضافته لعهدة اللواء', 'success');
  };

  // Stock Adjustment Dispense / Restock Handler
  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionItem) return;

    const qty = Number(txQuantity);
    if (isNaN(qty) || qty <= 0) {
      triggerToast('الرجاء إدخال كمية صحيحة أكبر من الصفر', 'error');
      return;
    }

    if (transactionType === 'صرف' && transactionItem.quantity < qty) {
      triggerToast(`عذراً، الكمية المتوفرة حالياً (${transactionItem.quantity} ${transactionItem.unit}) أقل من الكمية المطلوبة صرفها (${qty})`, 'error');
      return;
    }

    const finalNewQuantity = transactionType === 'صرف' 
      ? transactionItem.quantity - qty 
      : transactionItem.quantity + qty;

    // Update items list
    setItems(prev => prev.map(i => {
      if (i.id === transactionItem.id) {
        return {
          ...i,
          quantity: finalNewQuantity,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return i;
    }));

    // Create a transaction log
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

    const newLog: PharmacyLog = {
      id: `log_${Math.random().toString(36).substring(2, 9)}`,
      itemName: transactionItem.arabicName,
      action: transactionType,
      quantity: qty,
      recipient: txRecipient.trim() || (transactionType === 'صرف' ? 'العيادة الطبية للواء' : 'مخزن الإمداد المركزي عدن'),
      date: formattedDate,
      operator: txOperator.trim() || 'المسؤول المناوب'
    };

    setLogs(prev => [newLog, ...prev]);
    setTransactionItem(null);
    setTxQuantity(1);
    setTxRecipient('');

    triggerToast(
      transactionType === 'صرف' 
        ? `تم بنجاح صرف عدد (${qty}) ${transactionItem.unit} من صنف [${transactionItem.arabicName}]`
        : `تم بنجاح توريد وإضافة عدد (${qty}) ${transactionItem.unit} لصنف [${transactionItem.arabicName}]`,
      'success'
    );
  };

  // Delete inventory item completely helper
  const handleDeleteItem = (id: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: '🗑️ حذف الصنف الطبي من العهدة',
      message: `تحذير عسكري: هل أنت متأكد تماماً من حذف الصنف الطبي [${name}] نهائياً من مستودعات العهدة واللوحات الطبية للواء؟`,
      actionType: 'delete_item',
      targetId: id,
      targetName: name
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner section */}
      <div className="bg-gradient-to-l from-emerald-950 to-teal-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-900 no-print">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1 text-right">
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              صيدلية المفرزة والمستودعات الطبية الميدانية
            </span>
            <h1 className="text-xl font-black tracking-tight text-white mt-1.5">نظام إدارة ومراقبة المخزون الدوائي الميداني للواء</h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              تتبع الإمدادات والمعدات الطارئة والأدوية وعواصب النزيف المتوفرة بمستودعات اللواء 43 عمالقة في جبهات الساحل الغربي والخوخة والمخا لضمان وفرة الإمداد الإسعافي للجنود.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => {
                setConfirmConfig({
                  isOpen: true,
                  title: '🚨 تصفير وحذف كافة البيانات الطبية',
                  message: 'تحذير عسكري حاسم: هل أنت متأكد تماماً من رغبتك في حذف وتصفير كافة بيانات المخازن الطبية، الشحنات المستلمة وسجلات الحركة بالكامل؟ لا يمكن استعادة البيانات بعد هذا الإجراء.',
                  actionType: 'clear_all'
                });
              }}
              className="px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 font-black text-xs rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4.5 h-4.5 text-rose-400" />
              <span>تصفير وحذف كافة البيانات</span>
            </button>

            <button
              onClick={() => setIsImportingExcel(true)}
              className="px-4 py-2.5 bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-black text-xs rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-400" />
              <span>استيراد من إكسل (Excel)</span>
            </button>

            <button
              onClick={() => setIsAddingItem(true)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>إضافة صنف طبي / عهدة جديدة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 no-print">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-850 shadow-sm text-right space-y-1">
          <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">أنواع المستحضرات المسجلة</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-850 dark:text-white font-mono">{stats.totalItems}</h3>
            <div className="p-1.5 bg-slate-50 dark:bg-slate-800 text-emerald-600 rounded-lg">
              <Store className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-850 shadow-sm text-right space-y-1">
          <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">إجمالي كمية المستودع (وحدة)</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-850 dark:text-white font-mono">{stats.totalUnits}</h3>
            <div className="p-1.5 bg-slate-50 dark:bg-slate-800 text-blue-500 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-850 shadow-sm text-right space-y-1">
          <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">مستحضرات حرجة (مخزون منخفض)</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{stats.lowStockCount}</h3>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-lg">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-850 shadow-sm text-right space-y-1">
          <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">أصناف نافدة تماماً</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{stats.outOfStockCount}</h3>
            <div className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-lg">
              <HeartPulse className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Main Inventory Table & Realtime Logs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Medicine Inventory Grid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden xl:col-span-2 flex flex-col no-print">
          {/* Card Header with Tabs */}
          <div className="border-b border-slate-150 dark:border-slate-850 bg-slate-50/70 dark:bg-slate-900/50 p-2.5 flex justify-between items-center flex-wrap gap-2">
            <div className="flex gap-1.5">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'inventory' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>العهدة والمخزون الحالي بمستودعات اللواء</span>
              </button>

              <button
                onClick={() => setActiveTab('received')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer relative flex items-center gap-1.5 ${
                  activeTab === 'received' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>الأدوية والمواد المستلمة (الوارد)</span>
                {receivedMeds.filter(m => m.status === 'قيد المعاينة والفحص').length > 0 && (
                  <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full animate-bounce">
                    {receivedMeds.filter(m => m.status === 'قيد المعاينة والفحص').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('dispensation')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer relative flex items-center gap-1.5 ${
                  activeTab === 'dispensation' 
                    ? 'bg-rose-700 text-white shadow-md' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-rose-300" />
                <span>صرف الأدوية (فاتورة صرف)</span>
              </button>
            </div>

            {activeTab === 'received' && (
              <button
                onClick={() => setIsAddingReceived(true)}
                className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px] rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>تسجيل شحنة مستلمة جديدة</span>
              </button>
            )}
          </div>

          {activeTab === 'inventory' ? (
            <>
              {/* Controls Bar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col md:flex-row gap-3 justify-between items-center text-right">
                {/* Search Box */}
                <div className="relative w-full md:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث بالاسم العربي أو الإنجليزي للمخزون..."
                    className="w-full pl-3 pr-8.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl text-xs font-sans text-right"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    <option value="all">كل التصنيفات الطبية</option>
                    <option value="مضادات حيوية">مضادات حيوية</option>
                    <option value="مسكنات وطوارئ">مسكنات وطوارئ</option>
                    <option value="محاليل وإماهة">محاليل وإماهة</option>
                    <option value="مستلزمات جراحية">مستلزمات جراحية</option>
                  </select>

                  {/* Location Filter */}
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    <option value="all">كل المستودعات والعيادات</option>
                    {uniqueLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-850 text-slate-400 font-bold">
                      <th className="p-3">اسم الصنف الدوائي والموقع</th>
                      <th className="p-3">المجموع الكلي</th>
                      <th className="p-3">حالة الوفرة والمخزون</th>
                      <th className="p-3 text-center">الإجراءات السريعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-slate-450 text-xs font-bold">
                          لا يوجد أي مستحضر طبي يطابق مرشحات البحث الحالية
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const isCritical = item.quantity <= item.minThreshold;
                        const isEmpty = item.quantity === 0;

                        let badgeColor = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/35';
                        let badgeLabel = 'مخزون آمن ومتوفر';

                        if (isCritical) {
                          badgeColor = 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/35 animate-pulse';
                          badgeLabel = 'مستحضر حرج وطارئ';
                        }
                        if (isEmpty) {
                          badgeColor = 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/35';
                          badgeLabel = 'نفد من الرفوف';
                        }

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors">
                            {/* Name & details */}
                            <td className="p-3">
                              <div className="font-extrabold text-slate-900 dark:text-white text-xs">{item.arabicName}</div>
                              <div className="text-[10px] text-slate-450 font-mono mt-0.5 flex items-center gap-1">
                                <span>{item.name}</span>
                                <span>•</span>
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">#{item.category}</span>
                              </div>
                              <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-1 font-sans">
                                <MapPin className="w-3 h-3 text-slate-350" />
                                <span>{item.location}</span>
                              </div>
                            </td>

                            {/* Quantity */}
                            <td className="p-3 whitespace-nowrap">
                              <span className={`text-sm font-black font-mono ${isEmpty ? 'text-rose-500' : isCritical ? 'text-amber-500' : 'text-slate-800 dark:text-slate-100'}`}>
                                {item.quantity}
                              </span>
                              <span className="text-[10px] text-slate-450 mr-1">{item.unit}</span>
                              {/* Low Threshold Indicator */}
                              <div className="text-[9px] text-slate-400 font-mono mt-0.5">الحد الحرج: {item.minThreshold} {item.unit}</div>
                            </td>

                            {/* Progress Bar & Status Pill */}
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black border ${badgeColor}`}>
                                {badgeLabel}
                              </span>
                              <div className="w-24 bg-slate-100 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden mt-2 border border-slate-200/50 dark:border-slate-850">
                                <div 
                                  className={`h-full rounded-full ${isEmpty ? 'bg-rose-500' : isCritical ? 'bg-amber-500' : 'bg-emerald-50'}`}
                                  style={{ width: `${Math.min(100, (item.quantity / (item.minThreshold * 3)) * 100)}%` }}
                                />
                              </div>
                            </td>

                            {/* Action buttons */}
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="flex gap-1.5 justify-center">
                                <button
                                  onClick={() => {
                                    setTransactionItem(item);
                                    setTransactionType('صرف');
                                  }}
                                  className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded text-[10px] flex items-center gap-1 cursor-pointer"
                                  title="صرف للكتائب"
                                >
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                  <span>صرف دواء</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setTransactionItem(item);
                                    setTransactionType('توريد');
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded text-[10px] flex items-center gap-1 cursor-pointer"
                                  title="توريد شحنة جديدة"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                  <span>توريد</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteItem(item.id, item.arabicName)}
                                  className="p-1 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 dark:bg-slate-800 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                                  title="حذف من النظام"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : activeTab === 'received_old_duplicate_hidden' ? (
            <div className="flex flex-col flex-1 hidden">
              {/* Mini Banner explaining received medications */}
              <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border-b border-emerald-500/10 text-right space-y-1">
                <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300">سجل الأدوية والمستلزمات الطبية المستلمة من الهيئات والجهات المانحة</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  يتم توثيق كافة الشحنات والمستلزمات المستلمة هنا لغرض الجرد والفحص الطبي للتأكد من سلامتها وتاريخ صلاحيتها، وبمجرد فحصها يمكن تحويلها مباشرة بضغطة زر إلى المخزون المعتمد في مستودعات اللواء.
                </p>
              </div>

              {/* Table of Received Medications */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-850 text-slate-400 font-bold">
                      <th className="p-3">الشحنة الطبية المستلمة</th>
                      <th className="p-3">الجهة الموردة</th>
                      <th className="p-3">الكمية وتاريخ الاستلام</th>
                      <th className="p-3">حالة الفحص والفرز</th>
                      <th className="p-3 text-center">الإجراءات والاعتماد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {receivedMeds.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-450 text-xs font-bold">
                          لا توجد شحنات مستلمة مسجلة حالياً بالصيدلية
                        </td>
                      </tr>
                    ) : (
                      receivedMeds.map((med) => {
                        let statusColor = '';
                        if (med.status === 'تم الفحص والإدخال') {
                          statusColor = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-150 dark:border-emerald-900/30';
                        } else if (med.status === 'قيد المعاينة والفحص') {
                          statusColor = 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-150 dark:border-amber-900/30 animate-pulse';
                        } else {
                          statusColor = 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-150 dark:border-rose-900/30';
                        }

                        return (
                          <tr key={med.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors">
                            <td className="p-3">
                              <div className="font-extrabold text-slate-900 dark:text-white text-xs">{med.arabicName}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {med.name} • <span className="text-indigo-600 dark:text-indigo-400 font-bold">#{med.category}</span>
                              </div>
                              <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-1 font-sans">
                                <span>الرقم التسلسلي (الدفعة): <b>{med.batchNumber}</b></span>
                                {med.expiryDate && (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-600 dark:text-amber-400">تاريخ الانتهاء: {med.expiryDate}</span>
                                  </>
                                )}
                              </div>
                            </td>

                            <td className="p-3">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{med.source}</span>
                            </td>

                            <td className="p-3 whitespace-nowrap">
                              <div className="font-black text-slate-800 dark:text-slate-100 text-xs">
                                {med.quantity} <span className="text-[10px] text-slate-450 font-normal">{med.unit}</span>
                              </div>
                              <div className="text-[9px] text-slate-400 mt-0.5 font-mono">{med.receivedDate}</div>
                            </td>

                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black border ${statusColor}`}>
                                {med.status}
                              </span>
                            </td>

                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="flex gap-1.5 justify-center">
                                {med.status === 'قيد المعاينة والفحص' ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        const loc = prompt('الرجاء تحديد مستودع الإدخال العسكري للعهدة:', 'مستودع الخوخة الرئيسي');
                                        if (loc !== null) {
                                          handleMoveReceivedToInventory(med, loc);
                                        }
                                      }}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded text-[10px] flex items-center gap-1 cursor-pointer"
                                      title="اعتماد وإدخال للمستودع"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>اعتماد وإدخال للعهدة</span>
                                    </button>

                                    <button
                                      onClick={() => handleRejectReceived(med.id, med.arabicName)}
                                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 font-extrabold rounded text-[10px] flex items-center gap-1 cursor-pointer"
                                      title="رفض بسبب التلف أو انتهاء الصلاحية"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>رفض الشحنة</span>
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>مكتمل ومؤرشف</span>
                                  </span>
                                )}

                                <button
                                  onClick={() => {
                                    if (confirm('تنبيه: هل تريد حذف سجل الاستلام هذا نهائياً من الأرشيف؟')) {
                                      setReceivedMeds(prev => prev.filter(m => m.id !== med.id));
                                      triggerToast('تم حذف قيد الاستلام من الأرشيف الميداني', 'info');
                                    }
                                  }}
                                  className="p-1 hover:bg-rose-100 hover:text-rose-600 text-slate-400 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                                  title="حذف من الأرشيف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'received' ? (
            <div className="flex flex-col flex-1">
              {/* Mini Banner explaining received medications */}
              <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border-b border-emerald-500/10 text-right space-y-1">
                <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300">سجل الأدوية والمستلزمات الطبية المستلمة من الهيئات والجهات المانحة</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  يتم توثيق كافة الشحنات والمستلزمات المستلمة هنا لغرض الجرد والفحص الطبي للتأكد من سلامتها وتاريخ صلاحيتها، وبمجرد فحصها يمكن تحويلها مباشرة بضغطة زر إلى المخزون المعتمد في مستودعات اللواء.
                </p>
              </div>

              {/* Table of Received Medications */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-850 text-slate-400 font-bold">
                      <th className="p-3">الشحنة الطبية المستلمة</th>
                      <th className="p-3">الجهة الموردة</th>
                      <th className="p-3">الكمية وتاريخ الاستلام</th>
                      <th className="p-3">حالة الفحص والفرز</th>
                      <th className="p-3 text-center">الإجراءات والاعتماد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {receivedMeds.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-450 text-xs font-bold">
                          لا توجد شحنات مستلمة مسجلة حالياً بالصيدلية
                        </td>
                      </tr>
                    ) : (
                      receivedMeds.map((med) => {
                        let statusColor = '';
                        if (med.status === 'تم الفحص والإدخال') {
                          statusColor = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-150 dark:border-emerald-900/30';
                        } else if (med.status === 'قيد المعاينة والفحص') {
                          statusColor = 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-150 dark:border-amber-900/30 animate-pulse';
                        } else {
                          statusColor = 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-150 dark:border-rose-900/30';
                        }

                        return (
                          <tr key={med.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors">
                            <td className="p-3">
                              <div className="font-extrabold text-slate-900 dark:text-white text-xs">{med.arabicName}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {med.name} • <span className="text-indigo-600 dark:text-indigo-400 font-bold">#{med.category}</span>
                              </div>
                              <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-1 font-sans">
                                <span>الرقم التسلسلي (الدفعة): <b>{med.batchNumber}</b></span>
                                {med.expiryDate && (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-600 dark:text-amber-400">تاريخ الانتهاء: {med.expiryDate}</span>
                                  </>
                                )}
                              </div>
                            </td>

                            <td className="p-3">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{med.source}</span>
                            </td>

                            <td className="p-3 font-mono">
                              <div className="font-bold text-slate-800 dark:text-white text-xs">{med.quantity} {med.unit}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{med.receivedDate}</div>
                            </td>

                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${statusColor}`}>
                                {med.status}
                              </span>
                            </td>

                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1.5">
                                {med.status === 'قيد المعاينة والفحص' ? (
                                  <>
                                    <button
                                      onClick={() => handleMoveReceivedToInventory(med)}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded text-[10px] flex items-center gap-1 cursor-pointer"
                                      title="اعتماد وإدخال للمستودع"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>اعتماد وإدخال للعهدة</span>
                                    </button>

                                    <button
                                      onClick={() => handleRejectReceived(med.id, med.arabicName)}
                                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 font-extrabold rounded text-[10px] flex items-center gap-1 cursor-pointer"
                                      title="رفض بسبب التلف أو انتهاء الصلاحية"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>رفض الشحنة</span>
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>مكتمل ومؤرشف</span>
                                  </span>
                                )}

                                <button
                                  onClick={() => {
                                    if (confirm('تنبيه: هل تريد حذف سجل الاستلام هذا نهائياً من الأرشيف؟')) {
                                      setReceivedMeds(prev => prev.filter(m => m.id !== med.id));
                                      triggerToast('تم حذف قيد الاستلام من الأرشيف الميداني', 'info');
                                    }
                                  }}
                                  className="p-1 hover:bg-rose-100 hover:text-rose-600 text-slate-400 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                                  title="حذف من الأرشيف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1 divide-y divide-slate-150 dark:divide-slate-850">
              {/* Mini Banner explaining dispensation */}
              <div className="p-4 bg-rose-500/5 dark:bg-rose-500/10 border-b border-rose-500/10 text-right space-y-1">
                <h4 className="text-xs font-black text-rose-800 dark:text-rose-300">نظام صرف الأدوية والمستلزمات الطبية الميدانية بفاتورة صرف معتمدة</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  يمكنك من خلال هذا القسم تعبئة وتأكيد فواتير صرف للأدوية والمستلزمات الطبية الموجهة للكتائب والوحدات الميدانية مع خصمها تلقائياً من مخزون المستودعات المركزي وتوثيقها في أرشيف فواتير الصرف المعتمدة.
                </p>
              </div>

              {/* Grid of Invoice Builder Form vs Invoice History */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
                {/* 1. Invoice Builder Form (Col 7) */}
                <div className="lg:col-span-7 bg-slate-50/30 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-150 dark:border-slate-850 space-y-4 text-right">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-150 dark:border-slate-800 justify-end">
                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">منشئ الفاتورة الطبية الميدانية</h4>
                    <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                  </div>

                  {/* General Invoice Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 block">جهة الصرف المستهدفة (الكتيبة / المفرزة) <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        value={invoiceRecipient}
                        onChange={(e) => setInvoiceRecipient(e.target.value)}
                        placeholder="مثال: مفرزة جبهة الخوخة الكتيبة الثانية"
                        className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                      />
                      {/* Suggestion tags */}
                      <div className="flex flex-wrap gap-1 mt-1 justify-start">
                        {['الكتيبة الأولى', 'الكتيبة الثانية', 'مفرزة الخوخة', 'العيادة الميدانية بالمخا', 'المستشفى الميداني'].map(sug => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setInvoiceRecipient(sug)}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[9px] font-bold text-slate-600 dark:text-slate-350 rounded transition-colors cursor-pointer"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 block">تاريخ الصرف والمستند <span className="text-rose-500">*</span></label>
                      <input
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold text-right"
                      />
                    </div>
                  </div>

                  {/* Add Medicines Form */}
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl space-y-3">
                    <h5 className="font-bold text-[10px] text-slate-600 dark:text-slate-350 text-right">إضافة أصناف طبية لجدول الفاتورة:</h5>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end text-right">
                      <div className="sm:col-span-7 space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 block">المستحضر الدوائي المتوفر</label>
                        <select
                          value={selectedMedId}
                          onChange={(e) => {
                            setSelectedMedId(e.target.value);
                            setSelectedMedQty(1);
                          }}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold cursor-pointer text-right"
                        >
                          <option value="">-- اختر دواء من المستودع --</option>
                          {items.filter(i => i.quantity > 0).map(item => (
                            <option key={item.id} value={item.id}>
                              {item.arabicName} ({item.unit}) - متوفر: {item.quantity} {item.unit}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 block">الكمية المصروفة</label>
                        <input
                          type="number"
                          min={1}
                          value={selectedMedQty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setSelectedMedQty(val);
                          }}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold font-mono text-center"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!selectedMedId) {
                              triggerToast('الرجاء اختيار مستحضر طبي أولاً', 'error');
                              return;
                            }
                            const med = items.find(i => i.id === selectedMedId);
                            if (!med) return;

                            // Calculate already drafted quantity
                            const alreadyDrafted = draftItems.find(d => d.itemId === selectedMedId)?.quantity || 0;
                            const totalQty = alreadyDrafted + selectedMedQty;

                            if (totalQty > med.quantity) {
                              triggerToast(`عذراً، الكمية الإجمالية المطلوبة بالفاتورة (${totalQty}) تتجاوز المتوفر في المستودع حالياً (${med.quantity})`, 'error');
                              return;
                            }

                            if (selectedMedQty <= 0) {
                              triggerToast('الرجاء إدخال كمية صحيحة أكبر من الصفر', 'error');
                              return;
                            }

                            setDraftItems(prev => {
                              const existingIdx = prev.findIndex(d => d.itemId === selectedMedId);
                              if (existingIdx > -1) {
                                const updated = [...prev];
                                updated[existingIdx].quantity += selectedMedQty;
                                return updated;
                              } else {
                                return [...prev, { itemId: selectedMedId, quantity: selectedMedQty }];
                              }
                            });

                            setSelectedMedQty(1);
                            triggerToast(`تمت إضافة [${med.arabicName}] إلى قائمة الفاتورة`, 'success');
                          }}
                          className="w-full p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>إضافة</span>
                        </button>
                      </div>
                    </div>

                    {selectedMedId && (
                      (() => {
                        const med = items.find(i => i.id === selectedMedId);
                        if (!med) return null;
                        const drafted = draftItems.find(d => d.itemId === selectedMedId)?.quantity || 0;
                        const leftInStock = med.quantity - drafted;
                        return (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-2 rounded">
                            <span>الكمية المتاحة كلياً: <b className="text-emerald-600 font-mono">{med.quantity}</b> {med.unit}</span>
                            {drafted > 0 && (
                              <span>مضاف للفاتورة حالياً: <b className="text-rose-600 font-mono">{drafted}</b> {med.unit} (متبقي بالمستودع: <b className="text-amber-600 font-mono">{leftInStock}</b>)</span>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {/* Active Draft Invoice Items */}
                  <div className="space-y-1 text-right">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 block">قائمة المستحضرات المضافة للفاتورة الحالية:</label>
                    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl overflow-hidden">
                      <table className="w-full text-right text-[11px]">
                        <thead>
                          <tr className="bg-slate-50/70 dark:bg-slate-950/20 border-b border-slate-150 dark:border-slate-850 font-extrabold text-slate-450">
                            <th className="p-2 text-right">المستحضر الطبي</th>
                            <th className="p-2 text-center">الكمية المطلوبة</th>
                            <th className="p-2 text-center">الوحدة</th>
                            <th className="p-2 text-center">الإجراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                          {draftItems.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-slate-500 font-bold">
                                الفاتورة فارغة حالياً. اختر الدواء والكمية في الأعلى ثم اضغط (إضافة).
                              </td>
                            </tr>
                          ) : (
                            draftItems.map((dItem) => {
                              const med = items.find(i => i.id === dItem.itemId);
                              if (!med) return null;
                              return (
                                <tr key={dItem.itemId} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 font-bold">
                                  <td className="p-2 text-right">
                                    <div className="text-slate-800 dark:text-white font-extrabold">{med.arabicName}</div>
                                    <div className="text-[9px] text-slate-400 font-mono">{med.name}</div>
                                  </td>
                                  <td className="p-2 text-center text-rose-600 font-mono font-black text-xs">
                                    {dItem.quantity}
                                  </td>
                                  <td className="p-2 text-center text-slate-500 dark:text-slate-400">
                                    {med.unit}
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDraftItems(prev => prev.filter(d => d.itemId !== dItem.itemId));
                                        triggerToast(`تمت إزالة [${med.arabicName}] من الفاتورة`, 'info');
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-all cursor-pointer"
                                      title="إزالة من الفاتورة"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Notes & Authority */}
                  <div className="space-y-1.5 text-right font-sans">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 block">ملاحظات عسكرية وتوجيهات الصرف</label>
                    <textarea
                      value={invoiceNotes}
                      onChange={(e) => setInvoiceNotes(e.target.value)}
                      placeholder="مثال: يصرف عاجلاً لدعم العيادة الطبية المتقدمة بجبهة الساحل الغربي..."
                      rows={2}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (draftItems.length > 0) {
                          if (confirm('تنبيه: هل أنت متأكد من إلغاء وتفريغ كافة محتويات الفاتورة الحالية؟')) {
                            setDraftItems([]);
                            setInvoiceRecipient('');
                            setInvoiceNotes('');
                            triggerToast('تم إلغاء وتفريغ مسودة الفاتورة', 'info');
                          }
                        }
                      }}
                      disabled={draftItems.length === 0}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-250 font-bold rounded-xl text-xs cursor-pointer transition-all"
                    >
                      تفريغ وإلغاء مسودة الفاتورة
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!invoiceRecipient.trim()) {
                          triggerToast('عذراً، يجب تحديد اسم الجهة المستلمة (الكتيبة/المفرزة) أولاً', 'error');
                          return;
                        }
                        if (draftItems.length === 0) {
                          triggerToast('عذراً، الفاتورة فارغة حالياً؛ الرجاء إضافة مستحضرات طبية أولاً', 'error');
                          return;
                        }

                        setConfirmConfig({
                          isOpen: true,
                          title: 'تأكيد وصرف الفاتورة الطبية المعتمدة',
                          message: `تنبيه عسكري: هل أنت متأكد من اتمام عملية صرف الأدوية والمستلزمات إلى (${invoiceRecipient})؟ سيتم تلقائياً خصم الكميات بالكامل من المخازن وترحيل الفاتورة للأرشيف.`,
                          actionType: 'confirm_invoice'
                        });
                      }}
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/10 hover:shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>تأكيد وصرف الفاتورة نهائياً</span>
                    </button>
                  </div>
                </div>

                {/* 2. Invoices History / Archive (Col 5) */}
                <div className="lg:col-span-5 bg-slate-50/30 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-150 dark:border-slate-850 space-y-4 text-right">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-150 dark:border-slate-800 flex-row-reverse">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">أرشيف الفواتير الصادرة ({invoices.length})</h4>
                      <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
                        <ClipboardList className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                    {invoices.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 font-bold text-xs">
                        لا توجد فواتير صرف صادرة ومؤرشفة حتى الآن
                      </div>
                    ) : (
                      invoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-xl space-y-2 text-right transition-all hover:border-slate-300 dark:hover:border-slate-700"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-black text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                              {inv.invoiceNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">
                              {inv.date}
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <div className="text-slate-850 dark:text-white font-extrabold text-[11px]">
                              {inv.recipient}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              المسؤول: {inv.operator}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-450 mt-1">
                              عدد الأصناف: <b className="text-slate-755 dark:text-slate-300 font-mono">{inv.items.length}</b> أصناف طبية
                            </div>
                          </div>

                          {inv.notes && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate bg-slate-50 dark:bg-slate-950 p-1.5 rounded font-bold">
                              {inv.notes}
                            </p>
                          )}

                          <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-850 justify-end">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceForView(inv)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-extrabold text-[10px] rounded flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <ClipboardList className="w-3.5 h-3.5 text-indigo-500" />
                              <span>تفاصيل وعرض الفاتورة</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`تنبيه عسكري: هل أنت متأكد من إلغاء وحذف الفاتورة رقم (${inv.invoiceNumber}) نهائياً من سجلات الأرشيف؟`)) {
                                  setInvoices(prev => prev.filter(i => i.id !== inv.id));
                                  triggerToast(`تم مسح وحذف الفاتورة (${inv.invoiceNumber}) بنجاح`, 'info');
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-all cursor-pointer"
                              title="حذف الفاتورة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Pharmacy Logs Column */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm p-4 flex flex-col space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-3 flex justify-between items-center text-right">
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-emerald-500" />
                <span>سجل حركة الصيدلية والمستودع الأخير</span>
              </h4>
              <p className="text-[10px] text-slate-400 leading-normal">تتبع آني لكافة عمليات الصرف والتوريد العسكرية المعتمدة بالكتائب.</p>
            </div>
            
            <button
              onClick={() => {
                if (confirm('تنبيه عسكري: هل تريد تصفير سجل معاملات الصرف واللوحات بالكامل لفتح دفتر جديد؟')) {
                  setLogs([]);
                  triggerToast('تم مسح وإعادة تصفير دفتر قيود الصيدلية', 'info');
                }
              }}
              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer text-[10px]"
              title="تصفير الدفتر المالي"
            >
              مسح
            </button>
          </div>

          {/* Logs List Container */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-[11px] font-bold">
                دفتر القيود فارغ حالياً. قم بإجراء أول عملية صرف أو توريد.
              </div>
            ) : (
              logs.map((log) => {
                const isDispense = log.action === 'صرف';
                return (
                  <div 
                    key={log.id} 
                    className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-850/80 text-right space-y-1.5 transition-all text-[11px] relative overflow-hidden"
                  >
                    {/* Color bar indicators */}
                    <div className={`absolute top-0 bottom-0 right-0 w-1 ${isDispense ? 'bg-rose-500' : 'bg-emerald-500'}`} />

                    <div className="flex justify-between items-start gap-1">
                      <span className="font-black text-slate-850 dark:text-white leading-relaxed">{log.itemName}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black shrink-0 ${isDispense ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600'}`}>
                        {isDispense ? 'صرف مستحضرات' : 'توريد شحنة'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                      <div>
                        <span className="font-bold text-slate-400">الكمية:</span>{' '}
                        <span className="font-black text-slate-700 dark:text-slate-300 font-mono">{log.quantity}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-400">الجهة/المستلم:</span>{' '}
                        <span className="font-black text-slate-700 dark:text-slate-300 truncate inline-block max-w-[90px]" title={log.recipient}>{log.recipient}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1.5 border-t border-slate-100/50 dark:border-slate-850/40">
                      <span className="font-mono">{log.date}</span>
                      <span className="font-medium text-indigo-500">{log.operator}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Item Addition Form Modal */}
      <AnimatePresence>
        {isAddingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-55 flex items-center justify-center p-4 overflow-y-auto no-print">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-right"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-extrabold text-xs text-slate-850 dark:text-white">تسجيل صنف طبي أو عهدة دوائية جديدة باللواء</h3>
                </div>
                <button
                  onClick={() => setIsAddingItem(false)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-650"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddItemSubmit} className="p-6 space-y-4 font-sans text-xs">
                {/* Arabic Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-650 dark:text-slate-300">الاسم التجاري والعلمي بالعربي <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newItemData.arabicName}
                    onChange={(e) => setNewItemData({...newItemData, arabicName: e.target.value})}
                    placeholder="مثال: باراسيتامول 500ملجم (مسكن ومخفض حرارة)"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                {/* English Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-650 dark:text-slate-300">الاسم العلمي بالإنجليزي (أو الرموز الطبية)</label>
                  <input
                    type="text"
                    value={newItemData.name}
                    onChange={(e) => setNewItemData({...newItemData, name: e.target.value})}
                    placeholder="Example: Paracetamol 500mg Tablets"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-left font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">التصنيف العلاجي</label>
                    <select
                      value={newItemData.category}
                      onChange={(e) => setNewItemData({...newItemData, category: e.target.value as any})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer font-bold"
                    >
                      <option value="مضادات حيوية">مضادات حيوية</option>
                      <option value="مسكنات وطوارئ">مسكنات وطوارئ</option>
                      <option value="محاليل وإماهة">محاليل وإماهة</option>
                      <option value="مستلزمات جراحية">مستلزمات جراحية</option>
                    </select>
                  </div>

                  {/* Unit */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">وحدة القياس / العبوة</label>
                    <input
                      type="text"
                      required
                      value={newItemData.unit}
                      onChange={(e) => setNewItemData({...newItemData, unit: e.target.value})}
                      placeholder="علبة، حقنة، قطعة، قنينة..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>

                  {/* Qty */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">الكمية الابتدائية بالعهدة</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newItemData.quantity}
                      onChange={(e) => setNewItemData({...newItemData, quantity: Number(e.target.value)})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
                    />
                  </div>

                  {/* Threshold */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">الحد الأدنى الحرج (التنبيه)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newItemData.minThreshold}
                      onChange={(e) => setNewItemData({...newItemData, minThreshold: Number(e.target.value)})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-650 dark:text-slate-300">مقر تخزين العهدة ومستودع الحفظ</label>
                  <select
                    value={newItemData.location}
                    onChange={(e) => setNewItemData({...newItemData, location: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer"
                  >
                    <option value="مستودع الخوخة الرئيسي">مستودع الخوخة الرئيسي (مستودع أ)</option>
                    <option value="العيادة الميدانية بالمخا">العيادة الميدانية بالمخا (قطاع ب)</option>
                    <option value="مستوصف عدن الطبي">مستوصف عدن الطبي (مقر الإسناد)</option>
                    <option value="مفرزة إسعاف الجبهة المتنقلة">مفرزة إسعاف الجبهة المتنقلة</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingItem(false)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-bold"
                  >
                    إلغاء التوريد
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black"
                  >
                    تسجيل عهدة المستحضر
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Dispense/Restock Action Modal */}
      <AnimatePresence>
        {transactionItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-55 flex items-center justify-center p-4 overflow-y-auto no-print">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col text-right"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-5 h-5 ${transactionType === 'صرف' ? 'text-rose-500' : 'text-emerald-500'}`} />
                  <h3 className="font-extrabold text-xs text-slate-850 dark:text-white">
                    {transactionType === 'صرف' ? 'عملية صرف مفرزة طبية / مريض عسكري' : 'عملية توريد وإدخال شحنة إضافية'}
                  </h3>
                </div>
                <button
                  onClick={() => setTransactionItem(null)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-650"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleTxSubmit} className="p-5 space-y-4 font-sans text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 text-right space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">الصنف الطبي المختار:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs block">{transactionItem.arabicName}</span>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-100/50 dark:border-slate-850/40">
                    <span>الموقع الحالي: <b className="text-slate-700 dark:text-slate-300">{transactionItem.location}</b></span>
                    <span>المخزون المتوفر: <b className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">{transactionItem.quantity} {transactionItem.unit}</b></span>
                  </div>
                </div>

                {/* Input quantity */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-650 dark:text-slate-300">
                    الكمية المراد {transactionType === 'صرف' ? 'صرفها' : 'توريدها'} ({transactionItem.unit}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={transactionType === 'صرف' ? transactionItem.quantity : undefined}
                    required
                    value={txQuantity}
                    onChange={(e) => setTxQuantity(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-center font-black text-sm"
                  />
                </div>

                {/* Recipient details */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-650 dark:text-slate-300">
                    {transactionType === 'صرف' ? 'اسم المستلم العسكري أو الوحدة العسكرية المستهدفة' : 'مصدر التوريد / المورد المعتمد'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={txRecipient}
                    onChange={(e) => setTxRecipient(e.target.value)}
                    placeholder={transactionType === 'صرف' ? 'مثال: الرائد محمد اليافعي / الكتيبة الثانية' : 'مثال: مخزن الإمداد الدوائي الإقليمي - عدن'}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                {/* Operator (Default fill) */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-650 dark:text-slate-300">المسؤول الطبي المنفذ للعملية</label>
                  <input
                    type="text"
                    required
                    value={txOperator}
                    onChange={(e) => setTxOperator(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-850 mt-1">
                  <button
                    type="button"
                    onClick={() => setTransactionItem(null)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 text-white rounded-lg font-black ${transactionType === 'صرف' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                  >
                    تأكيد عملية الـ{transactionType}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Excel Import Dialog Modal */}
      <AnimatePresence>
        {isImportingExcel && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-55 flex items-center justify-center p-4 overflow-y-auto no-print text-right">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500 animate-pulse" />
                  <h3 className="font-extrabold text-xs text-slate-850 dark:text-white">الاستيراد الذكي للبيانات الطبية من إكسل (Excel / CSV)</h3>
                </div>
                <button
                  onClick={() => {
                    setIsImportingExcel(false);
                    setImportedRows([]);
                    setImportText('');
                    setImportError('');
                    setDetectedMapping(null);
                  }}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto font-sans text-xs flex-1">
                <div className="p-4 bg-gradient-to-br from-indigo-50/50 to-emerald-50/20 dark:from-indigo-950/20 dark:to-emerald-950/10 border border-indigo-100 dark:border-indigo-950/45 rounded-xl space-y-2 text-right">
                  <h4 className="font-black text-indigo-900 dark:text-indigo-400 flex items-center gap-1.5">
                    <span>💡 الذكاء الاصطناعي في الاستيراد:</span>
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">دعم كامل للغة العربية 100%</span>
                  </h4>
                  <p className="text-[10px] text-slate-600 dark:text-slate-350 leading-relaxed">
                    النظام يدعم الآن <b>الاستيراد الذكي</b>؛ حيث يقوم بالتعرف التلقائي على ترتيب الأعمدة ونوع البيانات وتحليل المحتوى (عربي/إنجليزي/تواريخ/كميات) دون التقيّد بترتيب معيّن.
                    <br />
                    يمكنك <b>نسخ الخلايا من جدول إكسل (Excel) مباشرة ولصقها</b> في المربع أدناه، أو تحميل ملف <b>CSV</b> باللغة العربية (UTF-8) لتفادي أي مشاكل في ترميز الحروف.
                  </p>
                </div>

                {/* Import Destination Target */}
                <div className="space-y-1.5">
                  <label className="font-black text-slate-700 dark:text-slate-300">الوجهة المستهدفة لتنزيل البيانات المستوردة:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setImportTarget('inventory')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        importTarget === 'inventory'
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 font-extrabold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/50 text-slate-500'
                      }`}
                    >
                      <Store className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                      <span>استيراد كعهدة ومخزون معتمد فوراً</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportTarget('received')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        importTarget === 'received'
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 font-extrabold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/50 text-slate-500'
                      }`}
                    >
                      <ClipboardList className="w-4 h-4 mx-auto mb-1 text-indigo-500" />
                      <span>استيراد كشحنات مستلمة قيد الفحص والفرز</span>
                    </button>
                  </div>
                </div>

                {/* Target Warehouse Selection */}
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-850">
                  <label className="font-black text-slate-755 dark:text-slate-300 block">تحديد المستودع/المخزن المستهدف للاستيراد:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={isCustomWarehouse ? "custom" : importWarehouse}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "custom") {
                          setIsCustomWarehouse(true);
                        } else {
                          setIsCustomWarehouse(false);
                          setImportWarehouse(val);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold cursor-pointer w-full text-right"
                    >
                      <option value="مستودع الخوخة الرئيسي">مستودع الخوخة الرئيسي</option>
                      <option value="العيادة الميدانية بالمخا">العيادة الميدانية بالمخا</option>
                      <option value="مستوصف عدن الطبي">مستوصف عدن الطبي</option>
                      {uniqueLocations.filter(loc => loc && !["مستودع الخوخة الرئيسي", "العيادة الميدانية بالمخا", "مستوصف عدن الطبي"].includes(loc)).map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                      <option value="custom">✍️ مستودع آخر (كتابة اسم مخصص)...</option>
                    </select>

                    {isCustomWarehouse && (
                      <input
                        type="text"
                        value={customWarehouseText}
                        onChange={(e) => setCustomWarehouseText(e.target.value)}
                        placeholder="اكتب اسم المستودع الجديد هنا..."
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-emerald-500/50 rounded-lg text-xs font-bold w-full text-right"
                      />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-450 leading-normal">
                    سيتم تخصيص هذا المخزن كجهة تخزين/توريد معتمدة لجميع الأصناف الطبية التي يتم استيرادها.
                  </p>
                </div>

                {/* File Upload Trigger */}
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center space-y-2 hover:border-emerald-500/50 transition-colors">
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 text-emerald-500 mb-2" />
                    <span className="font-bold text-slate-650 dark:text-slate-300">اسحب ملف CSV أو ملف نصي وأفلته هنا</span>
                    <span className="text-[10px] text-slate-400 block mt-1">يتم معالجة ترميز اللغة العربية وتطهير الملفات تلقائياً</span>
                  </div>
                  <input
                    type="file"
                    accept=".csv, .txt"
                    onChange={handleFileChange}
                    className="mx-auto text-[10px] text-slate-450 file:bg-emerald-600 file:text-white file:border-0 file:px-3 file:py-1 file:rounded-lg file:cursor-pointer hover:file:bg-emerald-700 mt-2"
                  />
                </div>

                <div className="text-center font-bold text-slate-400 text-[11px]">- أو -</div>

                {/* Text Area Copy Paste */}
                <div className="space-y-1.5">
                  <label className="font-black text-slate-700 dark:text-slate-300">قم بنسخ البيانات من إكسل (Ctrl+C) ثم الصقها هنا مباشرة (Ctrl+V):</label>
                  <textarea
                    rows={4}
                    value={importText}
                    onChange={(e) => {
                      setImportText(e.target.value);
                      parseCSVData(e.target.value);
                    }}
                    placeholder="الاسم بالعربي&#9;الاسم العلمي&#9;التصنيف&#9;الكمية&#9;الوحدة&#9;الموقع&#10;حبوب بنادول مسكن&#9;Panadol 500mg&#9;مسكنات وطوارئ&#9;450&#9;علبة&#9;مستودع الخوخة الرئيسي"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl font-mono text-[10px] text-right"
                  />
                </div>

                {importError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/30 text-rose-600 rounded-lg font-bold text-[10px]">
                    خطأ: {importError}
                  </div>
                )}

                {/* Smart Mapping Detection Alert */}
                {detectedMapping && importedRows.length > 0 && (
                  <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px]">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>ذكاء المطابقة: تم تحليل هيكل الجدول وتطابق الأعمدة بنجاح!</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                      {Object.entries(detectedMapping).map(([key, value]: [string, any]) => {
                        if (value.index === -1) return null;
                        const confColor = value.confidence === 'high' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/50' 
                          : value.confidence === 'medium' 
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200/50' 
                          : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200/50';
                        const confLabel = value.confidence === 'high' 
                          ? 'مطابقة ترويسة' 
                          : value.confidence === 'medium' 
                          ? 'تخمين المحتوى' 
                          : 'افتراضي';
                        return (
                          <div key={key} className="p-2 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-lg flex flex-col justify-between">
                            <span className="font-bold text-slate-400 text-[9px]">{value.label}:</span>
                            <span className="font-black text-slate-700 dark:text-slate-200 mt-1 truncate" title={value.headerName}>{value.headerName}</span>
                            <span className={`inline-block text-[8px] font-extrabold px-1 py-0.5 rounded border mt-1.5 text-center ${confColor}`}>{confLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Preview of Parsed Rows */}
                {importedRows.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-755 dark:text-slate-200 text-xs">معاينة البيانات المستخرجة ({importedRows.length} صنف مستكشف):</span>
                      <button
                        type="button"
                        onClick={() => {
                          setImportedRows([]);
                          setImportText('');
                          setDetectedMapping(null);
                        }}
                        className="text-[10px] text-rose-500 hover:underline font-bold"
                      >
                        مسح ومعاودة البدء
                      </button>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      <table className="w-full text-right text-[10px]">
                        <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0">
                          <tr className="text-slate-400 font-bold">
                            <th className="p-2">الاسم بالعربي</th>
                            <th className="p-2">الاسم بالإنجليزي</th>
                            <th className="p-2">التصنيف</th>
                            <th className="p-2">الكمية/الوحدة</th>
                            <th className="p-2">الموقع/الجهة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                          {importedRows.map((row, idx) => {
                            const finalWarehouse = isCustomWarehouse ? customWarehouseText.trim() : importWarehouse;
                            const warehouseToDisplay = finalWarehouse || row.location || 'مستودع الخوخة الرئيسي';
                            return (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850/20">
                                <td className="p-2 font-bold text-slate-800 dark:text-slate-200">{row.arabicName}</td>
                                <td className="p-2 font-mono text-left">{row.name}</td>
                                <td className="p-2 text-indigo-600 dark:text-indigo-400 font-bold">{row.category}</td>
                                <td className="p-2 font-mono">{row.quantity} ({row.unit})</td>
                                <td className="p-2 truncate max-w-[120px] text-emerald-600 dark:text-emerald-400 font-bold" title={warehouseToDisplay}>{warehouseToDisplay}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-950/50">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportingExcel(false);
                    setImportedRows([]);
                    setImportText('');
                    setImportError('');
                    setDetectedMapping(null);
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold"
                >
                  إلغاء وإغلاق
                </button>
                <button
                  type="button"
                  disabled={importedRows.length === 0}
                  onClick={() => {
                    // Process actual import
                    const finalWarehouse = isCustomWarehouse ? customWarehouseText.trim() : importWarehouse;
                    const warehouseToSave = finalWarehouse || 'مستودع الخوخة الرئيسي';

                    if (importTarget === 'inventory') {
                      const newItems = importedRows.map((row, idx) => ({
                        id: `inv-imported-${Date.now()}-${idx}`,
                        name: row.name || 'Imported Spec',
                        arabicName: row.arabicName,
                        category: row.category as any,
                        quantity: row.quantity,
                        unit: row.unit,
                        minThreshold: row.minThreshold || Math.ceil(row.quantity * 0.15) || 10,
                        location: warehouseToSave
                      }));
                      setItems(prev => [...prev, ...newItems]);
                      triggerToast(`تم بنجاح استيراد وإضافة عدد (${newItems.length}) صنف طبي إلى [${warehouseToSave}] بمخزون العهدة المعتمد للواء`, 'success');
                    } else {
                      const newMeds = importedRows.map((row, idx) => ({
                        id: `rx-imported-${Date.now()}-${idx}`,
                        name: row.name || 'Imported Spec',
                        arabicName: row.arabicName,
                        category: row.category as any,
                        quantity: row.quantity,
                        unit: row.unit,
                        source: warehouseToSave,
                        batchNumber: `BAT-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
                        receivedDate: new Date().toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' }),
                        expiryDate: row.expiryDate || '2027-12-30',
                        status: 'قيد المعاينة والفحص' as const
                      }));
                      setReceivedMeds(prev => [...newMeds, ...prev]);
                      triggerToast(`تم بنجاح استيراد وتسجيل عدد (${newMeds.length}) شحنة مستلمة جديدة من [${warehouseToSave}]، وهي قيد المعاينة والفحص حالياً`, 'success');
                    }
                    setIsImportingExcel(false);
                    setImportedRows([]);
                    setImportText('');
                    setImportError('');
                    setDetectedMapping(null);
                  }}
                  className={`px-5 py-2 text-white font-black rounded-xl shadow-lg flex items-center gap-1.5 ${
                    importedRows.length === 0
                      ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-400'
                      : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد الاستيراد ودمج البيانات ({importedRows.length})</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Addition of Received Medication Modal */}
      <AnimatePresence>
        {isAddingReceived && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-55 flex items-center justify-center p-4 overflow-y-auto no-print text-right">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-extrabold text-xs text-slate-850 dark:text-white">تسجيل شحنة أدوية أو مستلزمات طبية مستلمة جديدة</h3>
                </div>
                <button
                  onClick={() => setIsAddingReceived(false)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddReceivedSubmit} className="p-6 space-y-4 font-sans text-xs">
                {/* Arabic Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-650 dark:text-slate-300">اسم المستحضر المستلم بالعربي <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newReceivedData.arabicName}
                    onChange={(e) => setNewReceivedData({...newReceivedData, arabicName: e.target.value})}
                    placeholder="مثال: فيتامينات متعددة للأطفال شرب"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                {/* English Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-650 dark:text-slate-300">الاسم بالإنجليزي / العلمي</label>
                  <input
                    type="text"
                    value={newReceivedData.name}
                    onChange={(e) => setNewReceivedData({...newReceivedData, name: e.target.value})}
                    placeholder="Example: Multivitamins Syrup 120ml"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-left font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">التصنيف الطبي</label>
                    <select
                      value={newReceivedData.category}
                      onChange={(e) => setNewReceivedData({...newReceivedData, category: e.target.value as any})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer font-bold"
                    >
                      <option value="مضادات حيوية">مضادات حيوية</option>
                      <option value="مسكنات وطوارئ">مسكنات وطوارئ</option>
                      <option value="محاليل وإماهة">محاليل وإماهة</option>
                      <option value="مستلزمات جراحية">مستلزمات جراحية</option>
                    </select>
                  </div>

                  {/* Unit */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">الوحدة / العبوة</label>
                    <input
                      type="text"
                      required
                      value={newReceivedData.unit}
                      onChange={(e) => setNewReceivedData({...newReceivedData, unit: e.target.value})}
                      placeholder="علبة، كرتون، قنينة، قطعة..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">الكمية المستلمة</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newReceivedData.quantity}
                      onChange={(e) => setNewReceivedData({...newReceivedData, quantity: Number(e.target.value)})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
                    />
                  </div>

                  {/* Batch Number */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">رقم التشغيلة / الدفعة (Batch)</label>
                    <input
                      type="text"
                      required
                      value={newReceivedData.batchNumber}
                      onChange={(e) => setNewReceivedData({...newReceivedData, batchNumber: e.target.value})}
                      placeholder="مثال: BAT-2026-X1"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Source */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">الجهة الموردة / المصدر <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={newReceivedData.source}
                      onChange={(e) => setNewReceivedData({...newReceivedData, source: e.target.value})}
                      placeholder="مركز الملك سلمان، الهلال الأحمر، منظمة الصحة..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 dark:text-slate-300">تاريخ انتهاء الصلاحية <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={newReceivedData.expiryDate}
                      onChange={(e) => setNewReceivedData({...newReceivedData, expiryDate: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-center"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingReceived(false)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-bold"
                  >
                    إلغاء التسجيل
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black"
                  >
                    تسجيل الشحنة المستلمة
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Dialog Modal */}
      <AnimatePresence>
        {confirmConfig.isOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-55 flex items-center justify-center p-4 no-print text-right">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border-2 border-rose-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center bg-rose-50 dark:bg-rose-950/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" />
                  <h3 className="font-extrabold text-xs text-rose-900 dark:text-rose-400">
                    {confirmConfig.title}
                  </h3>
                </div>
                <button
                  onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                  className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg text-rose-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 font-sans text-xs">
                <p className="text-slate-700 dark:text-slate-350 leading-relaxed font-bold text-[11px]">
                  {confirmConfig.message}
                </p>
                
                <div className="p-3 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2">
                  <span className="text-rose-500 font-extrabold text-sm">⚠️</span>
                  <p className="text-[10px] text-rose-700 dark:text-rose-400 leading-normal font-medium">
                    انتبه: هذا الإجراء حساس للغاية وله تبعات على دقة السجلات والعهد العسكرية الطبية للواء 43. يرجى المراجعة والتحقق قبل المتابعة.
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-2 bg-slate-50 dark:bg-slate-950/30">
                <button
                  type="button"
                  onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  تراجع وإلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black shadow-lg flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد المتابعة والإجراء</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedInvoiceForView && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-55 flex items-center justify-center p-4 text-right no-print overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 flex-row-reverse">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-xs text-slate-850 dark:text-white">
                    معاينة وطباعة مستند صرف أدوية رسمي
                  </h3>
                  <Printer className="w-5 h-5 text-indigo-500" />
                </div>
                <button
                  onClick={() => setSelectedInvoiceForView(null)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Area Wrapper */}
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div id="military-invoice-print-area" className="bg-white text-slate-900 p-8 rounded-xl border border-slate-300 shadow-inner text-right relative font-sans space-y-6">
                  {/* Watermark Logo */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                    <HeartPulse className="w-96 h-96 text-slate-900" />
                  </div>

                  {/* Top Heading Block */}
                  <div className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-4">
                    <div className="text-right text-[10px] space-y-0.5 text-slate-700">
                      <div>الجمهورية اليمنية</div>
                      <div>قوات العمالقة - اللواء 43 عمالقة</div>
                      <div className="font-extrabold">الشعبة الطبية - مستودع الصيدلية</div>
                    </div>
                    
                    <div className="text-center space-y-1">
                      <div className="text-sm font-black tracking-tight text-slate-950">فاتورة صرف أدوية عسكرية</div>
                      <div className="text-[10px] font-mono font-black bg-slate-100 px-2 py-0.5 rounded inline-block border border-slate-200 text-slate-800">
                        {selectedInvoiceForView.invoiceNumber}
                      </div>
                    </div>

                    <div className="text-left text-[10px] space-y-0.5 text-slate-700 font-mono">
                      <div>التاريخ: {selectedInvoiceForView.date}</div>
                      <div>رقم المرجع: {selectedInvoiceForView.id.replace('inv_', '')}</div>
                      <div>تصنيف المستند: سري / عاجل</div>
                    </div>
                  </div>

                  {/* Recipient Details & Metadata */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-800">
                    <div className="space-y-1 text-right">
                      <div>جهة الاستلام المعتمدة: <span className="text-indigo-700 font-black">{selectedInvoiceForView.recipient}</span></div>
                      <div>المسؤول عن الصرف: <span className="text-slate-600">{selectedInvoiceForView.operator}</span></div>
                    </div>
                    <div className="space-y-1 text-right sm:text-left">
                      <div>الحالة: <span className="text-emerald-700 font-black">مصروف ومعتمد</span></div>
                      <div>جهة الإصدار: اللواء 43 عمالقة - مكتب الخدمات الطبية</div>
                    </div>
                  </div>

                  {/* Invoice Items Table */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-black">
                          <th className="p-2.5 text-center w-12">#</th>
                          <th className="p-2.5 text-right">المستحضر الطبي (عربي / علمي)</th>
                          <th className="p-2.5 text-center w-24">الكمية المصروفة</th>
                          <th className="p-2.5 text-center w-20">الوحدة</th>
                          <th className="p-2.5 text-right w-32">التصنيف الطبي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-900 font-medium">
                        {selectedInvoiceForView.items.map((item, idx) => (
                          <tr key={item.itemId}>
                            <td className="p-2.5 text-center font-mono font-bold">{idx + 1}</td>
                            <td className="p-2.5 text-right">
                              <div className="font-extrabold">{item.arabicName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{item.name}</div>
                            </td>
                            <td className="p-2.5 text-center font-mono font-black text-rose-600 text-sm">{item.quantity}</td>
                            <td className="p-2.5 text-center text-slate-700">{item.unit}</td>
                            <td className="p-2.5 text-right text-slate-600">{item.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Notes Block */}
                  {selectedInvoiceForView.notes && (
                    <div className="p-3.5 bg-yellow-50/50 border border-yellow-200/60 rounded-xl space-y-1">
                      <h5 className="font-black text-[10px] text-yellow-800">ملاحظات وتوجيهات الصرف الطبية الميدانية:</h5>
                      <p className="text-xs text-slate-755 leading-relaxed font-bold">
                        {selectedInvoiceForView.notes}
                      </p>
                    </div>
                  )}

                  {/* Bottom Signatures Block */}
                  <div className="grid grid-cols-3 gap-4 pt-8 text-[11px] font-bold text-slate-800 text-center">
                    <div className="space-y-8">
                      <div>المستلم الميداني للكتيبة</div>
                      <div className="border-b border-slate-400 border-dashed w-3/4 mx-auto pt-4"></div>
                      <div className="text-[10px] text-slate-500">الاسم والتوقيع</div>
                    </div>
                    
                    <div className="space-y-8">
                      <div>ضابط مستودع الصيدلية</div>
                      <div className="text-slate-600 pt-3 text-[10px] font-mono">عادل اليافعي</div>
                      <div className="border-b border-slate-400 border-dashed w-3/4 mx-auto pt-1"></div>
                      <div className="text-[10px] text-slate-500">الختم والتوقيع</div>
                    </div>

                    <div className="space-y-8">
                      <div>مدير الشعبة الطبية للواء</div>
                      <div className="text-emerald-700 font-black text-[10px]">اللواء 43 عمالقة</div>
                      <div className="border-b border-slate-400 border-dashed w-3/4 mx-auto pt-1"></div>
                      <div className="text-[10px] text-slate-500">الاعتماد الرسمي</div>
                    </div>
                  </div>

                  {/* Official Circular Seal */}
                  <div className="pt-6 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                    <span>* نسخة الحفظ والعهد الميدانية باللواء 43 عمالقة *</span>
                    <span>تم الصدور الكترونياً في: {new Date().toLocaleString('ar-YE')}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 border-t border-slate-150 dark:border-slate-850 flex justify-end gap-2 bg-slate-50 dark:bg-slate-950/30">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForView(null)}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold cursor-pointer text-xs"
                >
                  إغلاق النافذة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const printContents = document.getElementById('military-invoice-print-area')?.innerHTML;
                    if (printContents) {
                      const printWindow = window.open('', '', 'height=600,width=800');
                      if (printWindow) {
                        printWindow.document.write('<html><head><title>فاتورة صرف أدوية عسكرية</title>');
                        printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">');
                        printWindow.document.write('</head><body class="p-8" style="direction: rtl;">');
                        printWindow.document.write('<div id="print-content">');
                        printWindow.document.write(printContents);
                        printWindow.document.write('</div></body></html>');
                        printWindow.document.close();
                        printWindow.focus();
                        setTimeout(() => {
                          printWindow.print();
                          printWindow.close();
                        }, 500);
                      }
                    }
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-lg flex items-center gap-1.5 cursor-pointer transition-all text-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الفاتورة الطبية</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
