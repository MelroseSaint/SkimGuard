export enum DetectionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CLEARED = 'CLEARED',
  PUBLISHED = 'PUBLISHED',
}

export interface InspectionChecklist {
  looseParts: boolean;
  mismatchedColors: boolean;
  hiddenCamera: boolean;
  keypadObstruction: boolean;
  bluetoothSignal: boolean;
}

export interface AnalysisResult {
  isSuspicious: boolean;
  riskScore: number; // 0-100
  checklist: InspectionChecklist;
  detectedDevices?: string[]; // Bluetooth device names
}

export interface DetectionRecord {
  id: string;
  timestamp: number;
  imageData: string; // Base64 snapshot
  location?: {
    latitude: number;
    longitude: number;
  };
  analysis: AnalysisResult;
  status: DetectionStatus;
  notes?: string;
}

export interface Stats {
  totalScans: number;
  highRisk: number;
  confirmed: number;
}