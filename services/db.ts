import { DetectionRecord, DetectionStatus, Stats } from "../types";

const DB_NAME = "SkimGuardDB";
const STORE_NAME = "detections";
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("status", "status", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const saveDetection = async (record: DetectionRecord): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const updateDetectionStatus = async (id: string, status: DetectionStatus, notes?: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const record = getRequest.result as DetectionRecord;
      if (record) {
        record.status = status;
        if (notes) record.notes = notes;
        store.put(record).onsuccess = () => resolve();
      } else {
        reject("Record not found");
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const getDetections = async (): Promise<DetectionRecord[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("timestamp");
    // Get all, sorted by timestamp desc (requires manual reverse or cursor)
    const request = index.getAll();

    request.onsuccess = () => {
      resolve((request.result as DetectionRecord[]).reverse());
    };
    request.onerror = () => reject(request.error);
  });
};

export const getStats = async (): Promise<Stats> => {
  const detections = await getDetections();
  return {
    totalScans: detections.length,
    highRisk: detections.filter(d => d.analysis.riskScore > 70).length,
    confirmed: detections.filter(d => d.status === DetectionStatus.CONFIRMED || d.status === DetectionStatus.PUBLISHED).length,
  };
};
