export enum DetectionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
}

export interface AnalysisResult {
  isSuspicious: boolean;
  riskScore: number; // 0-100
  details: string[];
  deviceType: 'ATM' | 'POS' | 'Other' | 'Unknown';
}

export interface DetectionRecord {
  id: string;
  timestamp: number;
  imageData: string; // Base64
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
