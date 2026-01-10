export enum DetectionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CLEARED = 'CLEARED',
  PUBLISHED = 'PUBLISHED',
}

export enum SyncStatus {
  SYNCED = 'SYNCED',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
}

export interface InspectionChecklist {
  looseParts: boolean;
  mismatchedColors: boolean;
  hiddenCamera: boolean;
  keypadObstruction: boolean;
  bluetoothSignal: boolean;
}

export interface DeviceLog {
    id: string;
    name: string;
    rssi: number;
    threatType?: string;
    timestamp: number;
}

export interface AnalysisResult {
  isSuspicious: boolean;
  riskScore: number; // 0-100
  checklist: InspectionChecklist;
  detectedDevices?: DeviceLog[]; // Detailed logs
}

export interface DetectionRecord {
  id: string;
  timestamp: number;
  imageData: string; // Base64 snapshot
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  analysis: AnalysisResult;
  status: DetectionStatus;
  syncStatus: SyncStatus;
  notes?: string;
  deviceType?: string;
}

export interface Stats {
  totalScans: number;
  highRisk: number;
  confirmed: number;
  pendingSync: number;
}