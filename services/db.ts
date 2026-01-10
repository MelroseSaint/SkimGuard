import { DetectionRecord, DetectionStatus, Stats, SyncStatus } from "../types";
import { SecurityService } from "./security";

const DB_NAME = "SkimGuardDB";
const STORE_NAME = "detections";
const DB_VERSION = 2;

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
  
  if (!navigator.onLine) {
    record.syncStatus = SyncStatus.PENDING;
  } else {
    record.syncStatus = SyncStatus.SYNCED;
  }

  // Encrypt sensitive payload
  const sensitiveData = JSON.stringify({
      analysis: record.analysis,
      imageData: record.imageData,
      location: record.location,
      notes: record.notes,
      deviceType: record.deviceType
  });

  const { iv, content } = await SecurityService.encrypt(sensitiveData);

  // Storage Record (Hybrid: Indexable fields plaintext, Data fields encrypted)
  const secureRecord = {
      id: record.id,
      timestamp: record.timestamp,
      status: record.status,
      syncStatus: record.syncStatus,
      _secure: true,
      iv,
      encryptedData: content,
      integrityHash: await SecurityService.computeIntegrityHash(record.id, record.timestamp, record.status)
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(secureRecord); // Use put to allow overwrite/update

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const updateDetectionStatus = async (id: string, status: DetectionStatus, notes?: string): Promise<void> => {
  // To update status, we must load, decrypt, update, encrypt, save.
  const records = await getDetections();
  const record = records.find(r => r.id === id);
  
  if (!record) throw new Error("Record not found");

  record.status = status;
  if (notes) record.notes = notes;
  
  return saveDetection(record);
};

export const getDetections = async (): Promise<DetectionRecord[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("timestamp");
    const request = index.getAll();

    request.onsuccess = async () => {
      const rawRecords = request.result;
      const decryptedRecords: DetectionRecord[] = [];

      for (const r of rawRecords) {
          if (r._secure) {
              try {
                  const jsonString = await SecurityService.decrypt(r.iv, r.encryptedData);
                  const payload = JSON.parse(jsonString);
                  decryptedRecords.push({
                      id: r.id,
                      timestamp: r.timestamp,
                      status: r.status,
                      syncStatus: r.syncStatus,
                      ...payload
                  });
              } catch (e) {
                  console.error(`Failed to decrypt record ${r.id}`, e);
                  // We skip corrupted records or push a placeholder
                  decryptedRecords.push({
                      id: r.id,
                      timestamp: r.timestamp,
                      status: r.status,
                      syncStatus: r.syncStatus,
                      analysis: { isSuspicious: false, riskScore: 0, checklist: {} as any },
                      imageData: '',
                      deviceType: 'DATA_CORRUPTED'
                  });
              }
          } else {
              // Backward compatibility for unencrypted records
              decryptedRecords.push(r);
          }
      }
      // Reverse to show newest first
      resolve(decryptedRecords.reverse());
    };
    request.onerror = () => reject(request.error);
  });
};

export const getStats = async (): Promise<Stats> => {
  // We need to fetch all to count correctly because 'highRisk' depends on decrypted analysis
  const detections = await getDetections();
  return {
    totalScans: detections.length,
    highRisk: detections.filter(d => d.analysis.riskScore > 70).length,
    confirmed: detections.filter(d => d.status === DetectionStatus.CONFIRMED || d.status === DetectionStatus.PUBLISHED).length,
    pendingSync: detections.filter(d => d.syncStatus === SyncStatus.PENDING).length
  };
};

export const syncPendingRecords = async (): Promise<number> => {
    if (!navigator.onLine) return 0;
    // For sync, we would typically upload the encrypted blob or decrypt then upload.
    // For this simulation, we just mark them as synced.
    // However, since we encrypt on save, we can just update the syncStatus.
    
    // Efficient way: get keys of pending, load, update status, save.
    const all = await getDetections();
    const pending = all.filter(d => d.syncStatus === SyncStatus.PENDING);
    
    for (const record of pending) {
        record.syncStatus = SyncStatus.SYNCED;
        await saveDetection(record);
    }
    
    return pending.length;
};
    