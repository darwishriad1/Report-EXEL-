import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Calendar, AlertTriangle, CheckCircle2, User, Phone, Check, ShieldAlert, X } from 'lucide-react';
import { LeaveRecord } from '../types';

interface NotificationsDropdownProps {
  records: LeaveRecord[];
  onNavigateToRecords?: () => void;
}

export default function NotificationsDropdown({ records, onNavigateToRecords }: NotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Filter recruits whose leave ends within 48 hours (ends in 0, 1, or 2 days)
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

  const unreadCount = urgentExpirations.length;

  // Handle click outside to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-right" ref={dropdownRef} id="notifications-wrapper">
      {/* Notifications trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        aria-label="تنبيهات الإجازات"
        id="notifications-bell-btn"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
        
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-950"
            style={{ backgroundColor: '#ef4444' }}
            id="notifications-badge-count"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown menu list */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop layer for mobile to block actions and allow tap outside */}
            <div className="fixed inset-0 z-40 md:hidden bg-slate-900/10 dark:bg-slate-950/20 backdrop-blur-[1px]" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="fixed md:absolute left-4 right-4 md:left-0 md:right-auto mt-2 w-auto md:w-96 max-h-[85vh] md:max-h-[550px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col no-print"
              id="notifications-dropdown-panel"
            >
              {/* Header */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-lg">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-white">إشعارات الشؤون الطبية العاجلة</h4>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5">متابعة انتهاء الإجازات (48 ساعة)</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 md:hidden"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* List body */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {urgentExpirations.length > 0 ? (
                  urgentExpirations.map((r, index) => {
                    const isToday = r.daysRemaining === 0;
                    const isTomorrow = r.daysRemaining === 1;

                    let remainingLabel = '';
                    let dotColor = '';
                    let cardBg = '';

                    if (isToday) {
                      remainingLabel = 'ينتهي اليوم 🚨';
                      dotColor = 'bg-rose-500';
                      cardBg = 'bg-rose-50/20 dark:bg-rose-950/10';
                    } else if (isTomorrow) {
                      remainingLabel = 'ينتهي غداً ⏳';
                      dotColor = 'bg-amber-500';
                      cardBg = 'bg-amber-50/10 dark:bg-amber-950/5';
                    } else {
                      remainingLabel = 'ينتهي بعد غد 📅';
                      dotColor = 'bg-indigo-500';
                      cardBg = '';
                    }

                    return (
                      <div
                        key={r.id}
                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-colors flex flex-col space-y-2 text-right ${cardBg}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`} />
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              {remainingLabel}
                            </span>
                          </span>
                          <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {r.endDate}
                          </span>
                        </div>

                        <div>
                          <h5 className="text-xs font-black text-slate-900 dark:text-white">
                            {r.rank} / {r.name}
                          </h5>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            الوحدة: <span className="font-bold text-slate-700 dark:text-slate-300">{r.unit || 'اللواء 43 عمالقة'}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            التشخيص: <span className="font-bold text-slate-700 dark:text-slate-300">{r.diagnosis}</span>
                          </p>
                        </div>

                        <div className="pt-1.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-[9px]">
                          <span className="text-slate-400">حالة التواصل:</span>
                          <span className="font-semibold text-slate-500 dark:text-slate-400">
                            {r.contactStatus === 'confirmed' ? '✅ تم تأكيد العودة' : r.contactStatus === 'evading' ? '⚠️ متهرب عسكرياً' : '📞 لم يتم الاتصال'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 px-6 text-center flex flex-col items-center justify-center gap-3">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-full">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      الجاهزية العسكرية مكتملة
                    </p>
                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-[240px]">
                      لا توجد أي إجازات تنتهي خلال الـ 48 ساعة القادمة. جميع أفراد اللواء في وضعية امتثال وجاهزية قتالية.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    if (onNavigateToRecords) onNavigateToRecords();
                  }}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-black text-slate-700 dark:text-slate-300 rounded-xl transition-all"
                >
                  استعراض وإدارة جميع الإجازات المرضية
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
