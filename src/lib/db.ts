/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LeaveRecord } from '../types';

const DB_NAME = 'MilitaryLeavesDB';
const STORE_NAME = 'leaves';
const DB_VERSION = 1;

// Seed data
export const SEED_RECORDS: LeaveRecord[] = [
  {
    id: 'rec_101',
    name: 'محمد أحمد علي اليافعي',
    rank: 'جندي',
    unit: 'اللواء 43 عمالقة - الكتيبة الأولى',
    type: 'مريض',
    diagnosis: 'التهاب رئوي حاد بحاجة للراحة الكاملة',
    issuer: 'مستشفى الجمهورية التعليمي - عدن',
    startDate: '2025-11-10',
    endDate: '2025-11-20',
    notes: 'تمت التوصية براحة سريرية لمدة 10 أيام وتناول المضادات الحيوية.',
    history: [
      {
        date: '2025-11-10 08:30:00',
        action: 'إنشاء',
        details: 'تم تسجيل الإجازة المرضية لأول مرة بناءً على التقرير الطبي المقدم.'
      }
    ]
  },
  {
    id: 'rec_102',
    name: 'خالد عمر صالح الضالعي',
    rank: 'رقيب أول',
    unit: 'اللواء 43 عمالقة - الكتيبة الثانية',
    type: 'مرافق',
    diagnosis: 'مرافق لوالده لإجراء عملية جراحية في القلب',
    issuer: 'مستشفى البريهي التخصصي - عدن',
    startDate: '2026-02-05',
    endDate: '2026-02-15',
    notes: 'يحتاج والده لمرافق دائم طوال فترة الترقيم والمتابعة بعد العملية.',
    history: [
      {
        date: '2026-02-05 10:15:00',
        action: 'إنشاء',
        details: 'تمت الموافقة على إجازة مرافق بقرار من قائد الكتيبة.'
      }
    ]
  },
  {
    id: 'rec_103',
    name: 'ياسر سعيد العولقي',
    rank: 'نقيب',
    unit: 'اللواء 43 عمالقة - قيادة اللواء',
    type: 'حادث',
    diagnosis: 'كسر مضاعف في الساق اليسرى إثر حادث مروري',
    issuer: 'مستشفى الوالي التخصصي - عدن',
    startDate: '2026-04-12',
    endDate: '2026-05-12',
    notes: 'تم عمل جبيرة وتثبيت داخلي، ويحتاج لمتابعة دورية وإجازة مرضية لمدة شهر قابل للتمديد.',
    history: [
      {
        date: '2026-04-12 14:00:00',
        action: 'إنشاء',
        details: 'تم إنشاء السجل بعد إرسال التقرير الطبي وصور الأشعة.'
      }
    ]
  },
  {
    id: 'rec_104',
    name: 'عبد الله ناصر محمد المرقشي',
    rank: 'عريف',
    unit: 'اللواء 43 عمالقة - الكتيبة الثالثة',
    type: 'مرض قريب',
    diagnosis: 'حمى شديدة ورعاية عاجلة لزوجته وأطفاله الثلاثة',
    issuer: 'المركز الصحي النموذجي - الخوخة',
    startDate: '2026-06-01',
    endDate: '2026-06-05',
    notes: 'طلب إجازة طارئة لعدم وجود معيل آخر للأسرة خلال فترة مرضهم بالحمى الموسمية.',
    history: [
      {
        date: '2026-06-01 09:00:00',
        action: 'إنشاء',
        details: 'تم تسجيل إجازة مرض قريب كحالة إنسانية عاجلة.'
      }
    ]
  },
  {
    id: 'rec_105',
    name: 'سالم حسن اليافعي',
    rank: 'جندي',
    unit: 'اللواء 43 عمالقة - السريّة الرابعة',
    type: 'مريض',
    diagnosis: 'حمى الضنك مع انخفاض في صفائح الدم',
    issuer: 'المستشفى الميداني - المخا',
    startDate: '2026-06-25',
    endDate: '2026-07-02',
    notes: 'يتلقى العلاج في المستشفى الميداني ويحتاج لراحة تامة حتى استقرار حالته وزوال الخطر.',
    history: [
      {
        date: '2026-06-25 11:45:00',
        action: 'إنشاء',
        details: 'تم تسجيل الحالة فور إدخال الجندي للمستشفى الميداني.'
      }
    ]
  }
];

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function getAllLeaves(): Promise<LeaveRecord[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = async () => {
      let records = request.result as LeaveRecord[];
      // If empty, pre-populate with seed data
      if (records.length === 0) {
        console.log('No records found in IndexedDB. Seeding default records...');
        await seedDatabase(db);
        records = [...SEED_RECORDS];
      }
      resolve(records);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function seedDatabase(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    SEED_RECORDS.forEach((record) => {
      store.put(record);
    });

    transaction.oncomplete = () => {
      console.log('Database seeded successfully.');
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

export async function saveLeave(record: LeaveRecord): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function deleteLeave(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function deleteMultipleLeaves(ids: string[]): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    ids.forEach((id) => {
      store.delete(id);
    });

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

export async function resetDatabase(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const clearRequest = store.clear();

    clearRequest.onsuccess = async () => {
      // Seed immediately
      await seedDatabase(db);
      resolve();
    };

    clearRequest.onerror = () => {
      reject(clearRequest.error);
    };
  });
}

export async function overwriteDatabase(records: LeaveRecord[]): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const clearRequest = store.clear();

    clearRequest.onsuccess = () => {
      records.forEach((record) => {
        store.put(record);
      });
    };

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}
