/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HistoryEntry {
  date: string; // YYYY-MM-DD HH:mm:ss
  action: 'تعديل' | 'تمديد' | 'إنشاء';
  details: string;
  previousData?: any;
}

export interface LeaveRecord {
  id: string;
  name: string;
  rank: string;
  unit: string; // Default "اللواء 43 عمالقة" or customizable
  type: 'مريض' | 'مرافق' | 'مرض قريب' | 'حادث';
  diagnosis: string;
  issuer: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  notes: string;
  history?: HistoryEntry[];
  contactStatus?: 'pending' | 'confirmed' | 'request_extension' | 'no_answer' | 'evading';
  contactLogs?: { date: string; status: string; note: string }[];
}

export interface DiagnosisStats {
  id?: string;
  diagnosis: string;
  count: number;
  avgDuration: number;
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

// --- New Types for Advanced Military Dashboard ---
export interface MedicalBoardDecision {
  id: string;
  soldierName: string;
  soldierRank: string;
  soldierUnit: string;
  condition: string;
  fitnessLevel: 'fit_light' | 'unfit_temp' | 'unfit_permanent' | 'transfer_office';
  decisionDate: string;
  rulingNumber: string;
  committeeNotes: string;
  signees: string[]; // e.g. ["رئيس اللجنة الطبية", "أخصائي الجراحة العامة", "ممثل قيادة اللواء"]
}

export interface PharmacyItem {
  id: string;
  name: string;
  arabicName: string;
  category: 'مضادات حيوية' | 'مسكنات وطوارئ' | 'محاليل وإماهة' | 'مستلزمات جراحية';
  quantity: number;
  minThreshold: number;
  unit: string;
  location: string; // e.g. "مستودع الخوخة الرئيسي", "العيادة الميدانية بالمخا", "مستوصف عدن الطبي"
  lastUpdated: string;
}

export interface PharmacyLog {
  id: string;
  itemName: string;
  action: 'صرف' | 'توريد';
  quantity: number;
  recipient: string; // e.g. "الكتيبة الأولى", "الملازم أحمد اليافعي"
  date: string;
  operator: string;
}

