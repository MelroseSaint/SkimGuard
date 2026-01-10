import { DetectionRecord, DetectionStatus, Stats, SyncStatus } from "../types";

const DB_NAME = "SkimGuardDB";
const STORE_NAME = "detections";
const DB_VERSION = 2; // Bumped version for new index

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("syncStatus", "syncStatus", { unique: false });
      } else {
        // Upgrade existing store
        const store = (event.target as IDBOpenDBRequest).transaction?.objectStore(STORE_NAME);
        if (store && !store.indexNames.contains("syncStatus")) {
           store.createIndex("syncStatus", "syncStatus", { unique: false });
        }
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
  
  // Logic: If online, we might simulate an immediate sync, otherwise mark pending
  if (!navigator.onLine) {
    record.syncStatus = SyncStatus.PENDING;
  } else {
    // In a real app, we would await API call here. 
    // For this demo, we assume instant sync if online.
    record.syncStatus = SyncStatus.SYNCED;
  }

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
        // If we update the record, we need to sync it again
        record.syncStatus = navigator.onLine ? SyncStatus.SYNCED : SyncStatus.PENDING;
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
    pendingSync: detections.filter(d => d.syncStatus === SyncStatus.PENDING).length
  };
};

// Simulation of a Background Sync Task
export const syncPendingRecords = async (): Promise<number> => {
    if (!navigator.onLine) return 0;

    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index("syncStatus");
        const request = index.getAll(SyncStatus.PENDING);

        request.onsuccess = () => {
            const pending = request.result as DetectionRecord[];
            let count = 0;
            
            pending.forEach(record => {
                // Mock API Upload
                record.syncStatus = SyncStatus.SYNCED;
                store.put(record);
                count++;
            });
            resolve(count);
        };
        request.onerror = () => reject(request.error);
    });
};