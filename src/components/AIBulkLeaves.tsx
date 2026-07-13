import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trash2, X, AlertTriangle, CheckSquare, Square, RefreshCw, Send, ShieldCheck, UserPlus, FileText, Check, Edit2, Undo2 } from 'lucide-react';
import { LeaveRecord, HistoryEntry } from '../types';

interface AIBulkLeavesProps {
  onAddRecords: (records: LeaveRecord[]) => Promise<void>;
  onClose: () => void;
  triggerToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

interface ParsedLeaveItem {
  name: string;
  rank: string;
  unit: string;
  type: 'مريض' | 'مرافق' | 'مرض قريب' | 'حادث';
  diagnosis: string;
  issuer: string;
  startDate: string;
  endDate: string;
  notes: string;
}

export default function AIBulkLeaves({ onAddRecords, onClose, triggerToast }: AIBulkLeavesProps) {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedLeaveItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Edited state buffer for editing row
  const [editBuffer, setEditBuffer] = useState<ParsedLeaveItem | null>(null);

  const sampleTexts = [
    "الملازم أول صالح الحربي إجازة مرضية مرافق من تاريخ 15 يوليو إلى 25 يوليو 2026 مستشفى الجمهورية عدن ومعه تقرير طبي رسمي لولده المريض الكبد الوبائي بالكتيبة الثانية.\nالجندي مروان سعيد إجازة مريض كسر يد من 10-7-2026 إلى 18-7-2026 سرية الإشارة.",
    "الرقيب عادل المريسي في السرية الثالثة عنده حادث مروري مرخص إجازة مرضية حادث من 20 يوليو إلى 30 يوليو 2026 تقرير مستشفى أطباء بلا حدود.\nالمساعد علوي عمر إجازة مريض حمى الضنك ومصاحب فقر دم من 5 يوليو إلى 12 يوليو 2026 من العيادة الطبية."
  ];

  const handleParseText = async () => {
    if (!inputText.trim()) {
      triggerToast('يرجى إدخال نص أو تقارير قبل محاولة التحليل', 'info');
      return;
    }

    setIsLoading(true);
    setParsedItems([]);
    setSelectedIndices([]);
    setEditingIndex(null);

    try {
      const response = await fetch('/api/ai/parse-leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشلت عملية الاستخلاص الطبي');
      }

      const data = await response.json();
      const leaves = (data.leaves || []) as ParsedLeaveItem[];

      if (leaves.length === 0) {
        triggerToast('لم يتم العثور على أي بيانات إجازات صالحة في النص المرسل', 'info');
      } else {
        setParsedItems(leaves);
        // Select all by default
        setSelectedIndices(leaves.map((_, i) => i));
        triggerToast(`تم بنجاح تحليل واستخلاص ${leaves.length} سجل عسكري`, 'success');
      }
    } catch (error: any) {
      console.error(error);
      triggerToast(error.message || 'حدث خطأ أثناء الاتصال بمعالج الذكاء الاصطناعي', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectRow = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIndices.length === parsedItems.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(parsedItems.map((_, i) => i));
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditBuffer({ ...parsedItems[index] });
  };

  const handleSaveEdit = (index: number) => {
    if (!editBuffer) return;
    const updated = [...parsedItems];
    updated[index] = editBuffer;
    setParsedItems(updated);
    setEditingIndex(null);
    setEditBuffer(null);
    triggerToast('تم تعديل بيانات السجل بنجاح قبل المزامنة', 'success');
  };

  const handleDeleteRow = (index: number) => {
    setParsedItems(parsedItems.filter((_, i) => i !== index));
    setSelectedIndices(selectedIndices.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditBuffer(null);
    }
    triggerToast('تم إبعاد السجل من القائمة التمهيدية', 'info');
  };

  const handleConfirmImport = async () => {
    if (selectedIndices.length === 0) {
      triggerToast('يرجى اختيار سجل واحد على الأقل للمزامنة والحفظ', 'info');
      return;
    }

    const recordsToImport: LeaveRecord[] = selectedIndices.map(index => {
      const item = parsedItems[index];
      
      const historyEntry: HistoryEntry = {
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'إنشاء',
        details: 'تم استخلاص وتسجيل الإجازة تلقائياً بالذكاء الاصطناعي (Gemini)'
      };

      return {
        id: crypto.randomUUID(),
        name: item.name,
        rank: item.rank || 'جندي',
        unit: item.unit || 'اللواء 43 عمالقة',
        type: item.type,
        diagnosis: item.diagnosis || 'غير محدد',
        issuer: item.issuer || 'العيادة الطبية الميدانية',
        startDate: item.startDate,
        endDate: item.endDate,
        notes: item.notes || '',
        contactStatus: 'pending',
        contactLogs: [],
        history: [historyEntry]
      };
    });

    try {
      await onAddRecords(recordsToImport);
      triggerToast(`تم مزامنة وحفظ ${recordsToImport.length} سجل عسكري بنجاح في قاعدة البيانات`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      triggerToast('حدث خطأ أثناء حفظ السجلات العسكرية الجديدة', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Description / Info */}
      <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 p-5 rounded-2xl text-right relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 opacity-10">
          <Sparkles className="w-40 h-40 text-violet-500" />
        </div>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-violet-600/20 text-violet-600 dark:text-violet-400 rounded-xl shrink-0 mt-1">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white">بوابة السيطرة والربط الإداري الذكي بالذكاء الاصطناعي</h4>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
              تتيح لك هذه الأداة المتطورة نسخ ولصق كشوفات عسكرية غير منسقة، تقارير طبية، أو نصوص من إجازات متفرقة دفعة واحدة. يقوم الذكاء الاصطناعي بتحليل النص، استخراج أسماء المنتسبين ورتبهم ووحداتهم العسكرية، وتصنيف مرضهم وتواريخ بداية ونهاية إجازاتهم بدقة عسكرية فائقة، ثم مراجعتها وتعديلها يدوياً وتأكيد إضافتها كلياً بضغطة زر واحدة.
            </p>
          </div>
        </div>
      </div>

      {/* Main Parser Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Text Section (5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-mono">لوحة الإدخال غير المرتبة</span>
              <h5 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>الصق تقارير وإجازات القوة هنا</span>
                <FileText className="w-4 h-4 text-slate-400" />
              </h5>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              rows={10}
              placeholder="مثال عسكري للتحليل المزدوج:&#10;المجند عاصم عبده أحمد في الكتيبة الأولى إجازة مريض كسر في القدم بدءاً من تاريخ 13 يوليو 2026 إلى 28 يوليو صادرة عن مستشفى البريهي عدن.&#10;وأيضاً الملازم فهد العولقي سرية الإسناد مرافق مع عائلته المريضة من 14-7 إلى 24-7 تقرير العيادة الميدانية."
              className="w-full text-right p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400 leading-relaxed font-semibold"
            />

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold block">أمثلة تجريبية عسكرية جاهزة:</span>
              <div className="flex flex-wrap gap-2 justify-end">
                {sampleTexts.map((txt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputText(txt)}
                    disabled={isLoading}
                    className="text-[10.5px] bg-slate-100 hover:bg-violet-50 dark:bg-slate-800 dark:hover:bg-slate-800/80 hover:text-violet-600 dark:hover:text-violet-400 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    تجربة النموذج {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleParseText}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
                  isLoading
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border-transparent'
                    : 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/10 border-violet-600 hover:border-violet-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                    <span>جاري تفعيل معالج السيطرة والتحليل الطبي...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-violet-200" />
                    <span>استخلاص وترتيب القيود بالذكاء الاصطناعي</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Preview Section (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 min-h-[400px] flex flex-col justify-between relative">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-[10.5px] bg-violet-500/10 text-violet-500 px-2 py-1 rounded-full font-black">
                  {parsedItems.length} سجلات مستخلصة
                </span>
                <h5 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <span>جدول القيود الطبية التمهيدية المستخلصة</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </h5>
              </div>

              {parsedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 space-y-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-full text-slate-350">
                    <Sparkles className="w-10 h-10 stroke-[1.25] text-violet-400" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-600 dark:text-slate-300 block">بانتظار تحليل الكشوفات</span>
                    <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                      الصق النص العسكري الميداني أو التقارير الطبية غير المرتبة في لوحة الإدخال الجانبية، ثم اضغط على "استخلاص" لفلترتها آلياً هنا.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Select All controller */}
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                    <div className="text-[10.5px] text-slate-400 font-bold">
                      تم تحديد <span className="text-violet-500 font-black">{selectedIndices.length}</span> من أصل <span className="text-slate-700 dark:text-slate-300 font-black">{parsedItems.length}</span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 text-[11px] font-black text-violet-600 dark:text-violet-400 cursor-pointer hover:underline"
                    >
                      <span>{selectedIndices.length === parsedItems.length ? 'إلغاء تحديد الكل' : 'تحديد جميع السجلات'}</span>
                      {selectedIndices.length === parsedItems.length ? (
                        <CheckSquare className="w-4 h-4 fill-violet-600 text-white dark:fill-violet-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Editable / Viewable List */}
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {parsedItems.map((item, index) => {
                      const isSelected = selectedIndices.includes(index);
                      const isEditing = editingIndex === index;

                      return (
                        <div
                          key={index}
                          className={`border rounded-xl p-3.5 transition-all text-right ${
                            isSelected
                              ? 'bg-white dark:bg-slate-900 border-violet-500/30 shadow-sm'
                              : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-850 opacity-60'
                          }`}
                        >
                          {isEditing && editBuffer ? (
                            /* EDIT MODE GRID */
                            <div className="space-y-3.5">
                              <div className="grid grid-cols-2 gap-3 text-right text-xs">
                                <div className="space-y-1">
                                  <label className="text-[10px] text-slate-400 font-black">الاسم كاملاً:</label>
                                  <input
                                    type="text"
                                    value={editBuffer.name}
                                    onChange={(e) => setEditBuffer({ ...editBuffer, name: e.target.value })}
                                    className="w-full text-right p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-slate-400 font-black">الرتبة العسكرية:</label>
                                  <input
                                    type="text"
                                    value={editBuffer.rank}
                                    onChange={(e) => setEditBuffer({ ...editBuffer, rank: e.target.value })}
                                    className="w-full text-right p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2.5 text-right text-xs">
                                <div className="space-y-1">
                                  <label className="text-[10px] text-slate-400 font-black">الوحدة/الكتيبة:</label>
                                  <input
                                    type="text"
                                    value={editBuffer.unit}
                                    onChange={(e) => setEditBuffer({ ...editBuffer, unit: e.target.value })}
                                    className="w-full text-right p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-slate-400 font-black">نوع الإجازة:</label>
                                  <select
                                    value={editBuffer.type}
                                    onChange={(e) => setEditBuffer({ ...editBuffer, type: e.target.value as any })}
                                    className="w-full text-right p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-black text-indigo-500"
                                  >
                                    <option value="مريض">مريض</option>
                                    <option value="مرافق">مرافق</option>
                                    <option value="مرض قريب">مرض قريب</option>
                                    <option value="حادث">حادث</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-slate-400 font-black">الجهة المصدرة:</label>
                                  <input
                                    type="text"
                                    value={editBuffer.issuer}
                                    onChange={(e) => setEditBuffer({ ...editBuffer, issuer: e.target.value })}
                                    className="w-full text-right p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-right text-xs">
                                <div className="space-y-1">
                                  <label className="text-[10px] text-slate-400 font-black">تاريخ البدء:</label>
                                  <input
                                    type="date"
                                    value={editBuffer.startDate}
                                    onChange={(e) => setEditBuffer({ ...editBuffer, startDate: e.target.value })}
                                    className="w-full text-center p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-slate-400 font-black">تاريخ الانتهاء:</label>
                                  <input
                                    type="date"
                                    value={editBuffer.endDate}
                                    onChange={(e) => setEditBuffer({ ...editBuffer, endDate: e.target.value })}
                                    className="w-full text-center p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-2 text-right text-xs">
                                <div className="space-y-1">
                                  <label className="text-[10px] text-slate-400 font-black">التشخيص الطبي والحالة:</label>
                                  <input
                                    type="text"
                                    value={editBuffer.diagnosis}
                                    onChange={(e) => setEditBuffer({ ...editBuffer, diagnosis: e.target.value })}
                                    className="w-full text-right p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                                  />
                                </div>
                              </div>

                              {/* Row Controls */}
                              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingIndex(null);
                                    setEditBuffer(null);
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                >
                                  إلغاء
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(index)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>حفظ البيانات</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* VIEW MODE */
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(index)}
                                    title="تعديل يدوي"
                                    className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRow(index)}
                                    title="إزالة من القائمة"
                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                
                                <div className="flex items-center gap-2.5">
                                  <div className="text-right">
                                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 ml-1">[{item.rank}]</span>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">{item.name}</span>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{item.unit}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => toggleSelectRow(index)}
                                    className="p-1 text-slate-500 hover:text-violet-500 transition-colors cursor-pointer"
                                  >
                                    {isSelected ? (
                                      <CheckSquare className="w-4 h-4 fill-violet-600 text-white dark:fill-violet-400" />
                                    ) : (
                                      <Square className="w-4 h-4 text-slate-350" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-right bg-slate-50 dark:bg-slate-950 p-2 rounded-lg text-[10.5px] border border-slate-100 dark:border-slate-850">
                                <div>
                                  <span className="text-slate-400 font-bold ml-1">الجهة:</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">{item.issuer}</span>
                                </div>
                                <div className="flex justify-end gap-1 items-center">
                                  <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded text-[9px] font-black border border-indigo-500/10">
                                    إجازة {item.type}
                                  </span>
                                </div>
                                <div className="col-span-2 mt-1 pt-1 border-t border-slate-100 dark:border-slate-850 flex justify-between">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{item.startDate} إلى {item.endDate}</span>
                                  <span className="text-slate-400 font-bold">فترة الإجازة:</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-slate-400 font-bold ml-1">التشخيص:</span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.diagnosis}</span>
                                </div>
                                {item.notes && (
                                  <div className="col-span-2 text-slate-500 text-[10px] border-t border-slate-100 dark:border-slate-850 pt-1">
                                    <span className="font-bold">ملاحظة AI:</span> {item.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            {parsedItems.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50 dark:bg-slate-950/30 -mx-5 -mb-5 p-5 rounded-b-2xl">
                <span className="text-[11px] text-slate-500 font-semibold text-right leading-tight">
                  يرجى مراجعة وتأكيد دقة البيانات أعلاه. سيتم مكاملة ومزامنة السجلات المحددة في النظام المالي وعمليات الربط تلقائياً للواء 43.
                </span>

                <div className="flex gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedItems([]);
                      setSelectedIndices([]);
                      setEditingIndex(null);
                    }}
                    className="px-3.5 py-2.5 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    تفريغ القائمة
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={selectedIndices.length === 0}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border ${
                      selectedIndices.length > 0
                        ? 'bg-violet-600 hover:bg-violet-700 text-white border-violet-600 shadow-md shadow-violet-600/10'
                        : 'bg-slate-200 dark:bg-slate-850 text-slate-400 border-transparent cursor-not-allowed'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>تأكيد الإضافة ومزامنة {selectedIndices.length} أسماء</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
