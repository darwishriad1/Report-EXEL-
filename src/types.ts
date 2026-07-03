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
  diagnosis: string;
  count: number;
  avgDuration: number;
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}
