/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  Activity,
  User,
  HeartPulse,
  Menu,
  Moon,
  Sun
} from 'lucide-react';

import { LeaveRecord, ToastMessage } from './types';
import {
  getAllLeaves,
  saveLeave,
  deleteLeave,
  deleteMultipleLeaves,
  resetDatabase,
  overwriteDatabase
} from './lib/db';

import Sidebar from './components/Sidebar';
import Toasts from './components/Toasts';
import Dashboard from './components/Dashboard';
import Records from './components/Records';
import Analytics from './components/Analytics';
import Tools from './components/Tools';

export default function App() {
  // --- Navigation & Sidebar States ---
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'records' | 'analytics' | 'tools'>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // --- Core Records state ---
  const [records, setRecords] = useState<LeaveRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Dark/Light Mode state ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    // Default to light mode for pristine visual experience, as per guidelines
    return false;
  });

  // --- Toasts notification state ---
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toggle Dark Mode Classes
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Load records from IndexedDB
  const loadDatabaseRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAllLeaves();
      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch records:', err);
      // Fallback/Error toast
      triggerToast('فشل في تحميل قاعدة البيانات المحلية', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseRecords();
  }, [loadDatabaseRecords]);

  // --- Toast Handlers ---
  const triggerToast = useCallback((text: string, type: ToastMessage['type']) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);

    // Remove toast after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // --- CRUD Handlers ---

  // Add Record
  const handleAddRecord = async (record: LeaveRecord) => {
    try {
      await saveLeave(record);
      await loadDatabaseRecords();
    } catch (err) {
      triggerToast('فشل إضافة السجل لقاعدة البيانات', 'error');
      throw err;
    }
  };

  // Update Record (Edit or Extend)
  const handleUpdateRecord = async (record: LeaveRecord) => {
    try {
      await saveLeave(record);
      await loadDatabaseRecords();
    } catch (err) {
      triggerToast('فشل في حفظ التعديلات في قاعدة البيانات', 'error');
      throw err;
    }
  };

  // Delete Single Record
  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteLeave(id);
      await loadDatabaseRecords();
    } catch (err) {
      triggerToast('فشل حذف السجل من قاعدة البيانات', 'error');
      throw err;
    }
  };

  // Delete Multiple Records (Bulk Delete)
  const handleDeleteMultipleRecords = async (ids: string[]) => {
    try {
      await deleteMultipleLeaves(ids);
      await loadDatabaseRecords();
    } catch (err) {
      triggerToast('فشل حذف السجلات المحددة', 'error');
      throw err;
    }
  };

  // Reset database completely to seeds
  const handleResetDatabase = async () => {
    try {
      await resetDatabase();
      await loadDatabaseRecords();
    } catch (err) {
      triggerToast('فشل تصفير قاعدة البيانات', 'error');
      throw err;
    }
  };

  // Overwrite database (or Import records)
  const handleImportRecords = async (importedList: LeaveRecord[]) => {
    try {
      await overwriteDatabase(importedList);
      await loadDatabaseRecords();
    } catch (err) {
      triggerToast('فشل استيراد السجلات', 'error');
      throw err;
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200 antialiased font-sans"
    >
      {/* Toast notifications */}
      <Toasts toasts={toasts} removeToast={removeToast} />

      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        isOpen={isMobileSidebarOpen}
        setIsOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:mr-72 min-w-0 transition-all duration-350">
        {/* Desktop Header Top Bar (Hidden on print) */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 sticky top-0 z-10 no-print">
          <div>
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-sans">
              <span>قيادة اللواء 43 عمالقة</span>
              <span>/</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">الشؤون الطبية</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-tight">
              {currentPage === 'dashboard' && 'لوحة التحكم الإحصائية'}
              {currentPage === 'records' && 'سجل الإجازات المرضية العسكرية'}
              {currentPage === 'analytics' && 'تحليلات الحالات وتتبع التشخيصات'}
              {currentPage === 'tools' && 'أدوات صيانة قاعدة البيانات'}
            </h2>
          </div>

          {/* User info profile indicator */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-900 dark:text-white block">المسؤول الطبي المناوب</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">صلاحية إدارة كاملة</span>
            </div>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <User className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Dynamic Page Content Stage */}
        <main className="flex-1 p-3.5 md:p-8 pb-24 md:pb-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Print Header (Only visible on print) */}
          <div className="hidden print-header text-right">
            <div className="border-b-2 border-slate-800 pb-4 mb-6">
              <h1 className="text-2xl font-black">الجمهورية اليمنية</h1>
              <h2 className="text-xl font-bold mt-1">القوات المسلحة - ألوية العمالقة</h2>
              <h3 className="text-lg font-bold mt-1">قيادة اللواء 43 - الشؤون الطبية</h3>
              <p className="text-xs mt-3 font-mono">تاريخ التصدير والطباعة: {new Date().toLocaleDateString('ar-YE')}</p>
            </div>
            <h2 className="text-xl font-black text-center mb-6">تقرير الإجازات المرضية لمنتسبي اللواء</h2>
          </div>

          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3">
              <Activity className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                جاري الاتصال بقاعدة البيانات المحلية وتحديث السجلات...
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {currentPage === 'dashboard' && <Dashboard records={records} />}
              {currentPage === 'records' && (
                <Records
                  records={records}
                  onAdd={handleAddRecord}
                  onUpdate={handleUpdateRecord}
                  onDelete={handleDeleteRecord}
                  onDeleteMultiple={handleDeleteMultipleRecords}
                  triggerToast={triggerToast}
                />
              )}
              {currentPage === 'analytics' && <Analytics records={records} />}
              {currentPage === 'tools' && (
                <Tools
                  records={records}
                  onReset={handleResetDatabase}
                  onImport={handleImportRecords}
                  triggerToast={triggerToast}
                />
              )}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
