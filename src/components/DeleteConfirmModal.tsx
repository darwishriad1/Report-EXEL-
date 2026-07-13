import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Trash2, X, AlertTriangle, CheckSquare, Square } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  recordName?: string;
  recordUnit?: string;
  recordType?: string;
  isBulk?: boolean;
  bulkCount?: number;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأكيد الحذف النهائي للسجل العسكري',
  recordName = '',
  recordUnit = '',
  recordType = '',
  isBulk = false,
  bulkCount = 0
}: DeleteConfirmModalProps) {
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setIsAcknowledged(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!isAcknowledged) return;
    onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-sm">
          {/* Overlay background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.35 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-rose-500/30 dark:border-rose-500/20 rounded-2xl shadow-2xl overflow-hidden text-right z-10"
          >
            {/* Warning Header */}
            <div className="bg-rose-500/10 dark:bg-rose-500/5 px-6 py-4 border-b border-rose-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
                  <p className="text-[10px] text-rose-500 font-bold">إجراء عسكري حاسم وغير قابل للتراجع</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Alert text */}
              <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-black text-amber-800 dark:text-amber-400 block">تنبيه أمني وإداري من شعبة السيطرة:</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                    إن حذف القيود والإجازات الطبية يؤثر بشكل مباشر على السجل المالي، مستحقات الإعاشة، والرقابة الميدانية لمنتسبي اللواء. يرجى التأكد التام من صحة الإجراء قبل المضي قدماً.
                  </p>
                </div>
              </div>

              {/* Record Metadata Display */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850 space-y-2.5">
                <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">تفاصيل السجل المستهدف بالحذف:</span>
                
                {isBulk ? (
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>عدد السجلات المحددة للحذف النهائي:</span>
                    <span className="font-mono text-rose-500 text-sm font-black">{bulkCount} سجلات إجازة</span>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-1.5">
                      <span className="text-slate-400 font-semibold text-[10.5px]">رتبة واسم المنتسب:</span>
                      <span className="text-slate-900 dark:text-white font-black">{recordName}</span>
                    </div>
                    {recordUnit && (
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-1.5">
                        <span className="text-slate-400 font-semibold text-[10.5px]">الوحدة / السرية:</span>
                        <span>{recordUnit}</span>
                      </div>
                    )}
                    {recordType && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold text-[10.5px]">نوع وتصنيف الإجازة:</span>
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded border border-indigo-500/10 text-[10px]">
                          {recordType}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Explicit Acknowledge Checkbox */}
              <button
                type="button"
                onClick={() => setIsAcknowledged(!isAcknowledged)}
                className="w-full flex items-start gap-2.5 p-3 rounded-xl border border-dashed border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-colors text-right cursor-pointer"
              >
                <div className="text-rose-500 shrink-0 mt-0.5">
                  {isAcknowledged ? (
                    <CheckSquare className="w-4 h-4 fill-rose-500 text-white" />
                  ) : (
                    <div className="w-4 h-4 border border-rose-500 rounded" />
                  )}
                </div>
                <span className="text-[11px] font-black text-rose-800 dark:text-rose-400 leading-normal select-none">
                  أقرّ بتحمل المسؤولية الكاملة عن إلغاء وحذف القيود العسكرية المحددة أعلاه نهائياً من قاعدة بيانات السيطرة والاتصال باللواء 43 عمالقة.
                </span>
              </button>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 dark:bg-slate-950/50 px-6 py-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                إلغاء الأمر
              </button>
              
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!isAcknowledged}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border ${
                  isAcknowledged
                    ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-sm shadow-rose-600/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تأكيد الحذف النهائي</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
