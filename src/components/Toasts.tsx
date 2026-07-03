/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastsProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export default function Toasts({ toasts, removeToast }: ToastsProps) {
  return (
    <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: -50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              layout
              className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border text-sm font-sans ${
                isSuccess
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/90 dark:border-emerald-800/50 dark:text-emerald-200'
                  : isError
                  ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/90 dark:border-rose-800/50 dark:text-rose-200'
                  : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/90 dark:border-blue-800/50 dark:text-blue-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {isSuccess && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />}
                {!isSuccess && !isError && <Info className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400" />}
                <p className="font-medium leading-relaxed text-right select-none">{toast.text}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="mr-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                aria-label="إغلاق الإشعار"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
