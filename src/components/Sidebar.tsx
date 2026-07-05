/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  BarChart3,
  Wrench,
  Sun,
  Moon,
  Info,
  X,
  ShieldAlert,
  FileText,
  Award,
  Store
} from 'lucide-react';
import { LeaveRecord } from '../types';
import NotificationsDropdown from './NotificationsDropdown';

interface SidebarProps {
  currentPage: 'dashboard' | 'records' | 'analytics' | 'tools' | 'reports' | 'board' | 'pharmacy';
  setCurrentPage: (page: 'dashboard' | 'records' | 'analytics' | 'tools' | 'reports' | 'board' | 'pharmacy') => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  records: LeaveRecord[];
  currentTime?: string;
  currentDate?: string;
}

export default function Sidebar({
  currentPage,
  setCurrentPage,
  isDarkMode,
  setIsDarkMode,
  isOpen,
  setIsOpen,
  records,
  currentTime,
  currentDate
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'records', label: 'سجل الإجازات', icon: FileSpreadsheet },
    { id: 'analytics', label: 'التحليلات والمؤشرات', icon: BarChart3 },
    { id: 'reports', label: 'التقارير المتنوعة', icon: FileText },
    { id: 'board', label: 'اللجنة الطبية والخدمة', icon: Award },
    { id: 'pharmacy', label: 'صيدلية اللواء والمخزون', icon: Store },
    { id: 'tools', label: 'أدوات النظام', icon: Wrench },
  ] as const;

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <>
      {/* Real Android Style: Material 3 Top App Bar (Sticky on mobile only) */}
      <div className="md:hidden flex items-center justify-between px-5 py-3.5 bg-white dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-900 sticky top-0 z-40 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 text-right">
          <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
            <ShieldAlert className="w-5 h-5 shrink-0" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wide text-slate-900 dark:text-white leading-tight">اللواء 43 عمالقة</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium font-sans mt-0.5">
              {currentPage === 'dashboard' && 'لوحة التحكم الإحصائية'}
              {currentPage === 'records' && 'سجل الإجازات المرضية'}
              {currentPage === 'analytics' && 'التحليلات والمؤشرات'}
              {currentPage === 'reports' && 'التقارير المتنوعة'}
              {currentPage === 'board' && 'اللجنة الطبية والخدمة'}
              {currentPage === 'pharmacy' && 'الصيدلية والمخزون الطبي'}
              {currentPage === 'tools' && 'أدوات النظام والصيانة'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Real-time Clock & Date inside Mobile Top Bar next to Notification Bell */}
          {(currentTime || currentDate) && (
            <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 font-mono select-none shrink-0 text-center">
              {currentTime && <span className="font-extrabold text-amber-500 tracking-wide text-[11px] sm:text-xs leading-none">{currentTime}</span>}
              {currentDate && <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap mt-1 leading-none">{currentDate}</span>}
            </div>
          )}

          {/* Urgent Leaves Notification Bell */}
          <NotificationsDropdown records={records} onNavigateToRecords={() => setCurrentPage('records')} />

          {/* Quick theme switcher on top bar */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-all"
            aria-label="تغيير المظهر"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
          </button>

          {/* Quick Info Drawer button */}
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-all"
            aria-label="معلومات النظام"
          >
            <Info className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Backdrop for mobile info sheet */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden z-50 transition-opacity"
        />
      )}

      {/* Mobile Info Sheet (Sliding side panel for military info) */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col border-l border-slate-200 dark:border-slate-900 z-55 transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-150 dark:border-slate-900 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <ShieldAlert className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="font-bold text-md leading-tight text-slate-900 dark:text-white">اللواء 43 عمالقة</h1>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">الشؤون الطبية العسكرية</span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">حول النظام</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              نظام محلي آمن ومشفر لإدارة وتتبع الإجازات المرضية والتقارير الطبية العسكرية لمنتسبي اللواء 43 عمالقة.
            </p>
          </div>

          <div className="space-y-3 border-t border-slate-100 dark:border-slate-900 pt-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">السرية والأمان</h3>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
              <p className="text-[11px] text-emerald-800 dark:text-emerald-400 leading-relaxed font-medium">
                جميع البيانات تحفظ محلياً بالكامل داخل متصفحك بشكل آمن ومشفر. لا يتم استخدام أي اتصال سحابي خارجي لضمان السرية العسكرية المطلقة.
              </p>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-100 dark:border-slate-900 pt-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">إحصائيات الجلسة الحالية</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                <span className="text-slate-400">حالة النظام:</span>
                <span className="text-emerald-500 font-bold">نشط ومتصل</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                <span className="text-slate-400">الترخيص عسكري:</span>
                <span className="text-slate-600 dark:text-slate-300">مصدق ومؤمن</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-150 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/30 text-center text-[10px] text-slate-400">
          <p>الجمهورية اليمنية</p>
          <p className="mt-0.5">القوات المسلحة - ألوية العمالقة</p>
          <p className="text-slate-500 dark:text-slate-600 font-mono mt-1.5">v1.2.0 - محلي آمن</p>
        </div>
      </aside>

      {/* --- DESKTOP SIDEBAR CONTAINER (Hidden on Mobile) --- */}
      <aside
        className="fixed top-0 right-0 h-full w-72 bg-slate-900 dark:bg-slate-950 text-slate-100 flex flex-col border-l border-slate-800 dark:border-slate-900 z-40 hidden md:flex"
      >
        {/* Header / Logo */}
        <div className="p-6 border-b border-slate-800 dark:border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/30">
              <ShieldAlert className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white">اللواء 43 عمالقة</h1>
              <span className="text-[11px] text-slate-400 font-sans mt-0.5 block">نظام إدارة الإجازات المرضية</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-right transition-all font-medium duration-150 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Settings & Theme Toggle */}
        <div className="p-4 border-t border-slate-800 dark:border-slate-900 space-y-4">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 dark:bg-slate-900/50 hover:bg-slate-800 dark:hover:bg-slate-900 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-800/30 font-sans text-sm"
          >
            <span className="flex items-center gap-2">
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-sky-400" />}
              <span>{isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>
            </span>
            <span className="text-[11px] bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full">
              نشط
            </span>
          </button>

          <div className="px-2 py-1 text-center">
            <p className="text-[10px] text-slate-500 leading-normal">
              الجمهورية اليمنية <br />
              القوات المسلحة - ألوية العمالقة
            </p>
            <p className="text-[9px] text-slate-600 mt-2 font-mono">v2.0.0 - الإصدار الثاني المطور</p>
          </div>
        </div>
      </aside>

      {/* --- Real Android Style: Material 3 Bottom Navigation Bar for Mobile --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-900/80 px-2 py-2.5 flex items-center justify-around z-45 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] pb-safe no-print">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className="flex flex-col items-center gap-1 px-1.5 relative min-w-[68px] cursor-pointer"
            >
              {/* Active Indicator Capsule (Material 3 style) */}
              <div className="relative flex items-center justify-center w-14 h-8 rounded-full transition-all duration-200">
                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    className="absolute inset-0 bg-amber-500/15 dark:bg-amber-500/20 text-amber-500 rounded-full"
                  />
                )}
                <Icon className={`w-5.5 h-5.5 z-10 transition-colors duration-200 ${isActive ? 'text-amber-600 dark:text-amber-500 stroke-[2.5px]' : 'text-slate-500 dark:text-slate-400'}`} />
              </div>
              <span className={`text-[10px] font-bold tracking-tight transition-colors duration-200 mt-0.5 ${isActive ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-slate-500 dark:text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
