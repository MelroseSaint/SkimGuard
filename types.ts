
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

export enum ScanEnvironment {
  ATM = 'ATM', // High sensitivity, strict isolation
  FUEL_PUMP = 'FUEL_PUMP', // High sensitivity, industrial interference
  RETAIL_POS = 'RETAIL_POS', // Medium sensitivity, expects peripherals
  PUBLIC_SPACE = 'PUBLIC_SPACE', // Low sensitivity, high noise
}

export enum DetectionMethod {
  REGEX = 'REGEX', // Exact pattern match
  FUZZY = 'FUZZY', // Levenshtein approximation
  HEURISTIC = 'HEURISTIC', // Behavioral/Generic
  MANUAL = 'MANUAL' // User flagged
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
    detectionMethod?: DetectionMethod;
    matchedKeyword?: string; // For fuzzy hits (Intelligence gathering)
}

export interface AnalysisResult {
  isSuspicious: boolean;
  riskScore: number; // 0-100
  checklist: InspectionChecklist;
  detectedDevices?: DeviceLog[]; // Detailed logs
  environment?: ScanEnvironment;
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

// --- MDM Types ---

export interface DeviceIdentity {
  assetTag: string; // UUID v4
  userAgent: string;
  platform: string;
  screenRes: string;
  lastCheckIn: number;
  registeredAt: number;
}

export interface SecurityPolicy {
  requireOnline: boolean;
  minBatteryLevel: number;
  requireGeolocation: boolean;
  allowCamera: boolean;
  maxOfflineDuration: number; // in minutes
}

export interface ComplianceStatus {
  isCompliant: boolean;
  violations: string[];
  batteryLevel: number | 'unknown';
  isCharging: boolean | 'unknown';
  networkStatus: 'online' | 'offline';
  locationPermission: 'granted' | 'denied' | 'prompt' | 'unknown';
}
