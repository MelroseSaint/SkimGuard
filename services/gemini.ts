import { AnalysisResult, InspectionChecklist, DeviceLog } from "../types";

// Deterministic Risk Engine
// Calculates risk based purely on physical inspection data
export const calculateRisk = (checklist: InspectionChecklist, detectedDevices: DeviceLog[] = []): AnalysisResult => {
  let score = 0;
  
  // Weighting logic based on security research
  if (checklist.looseParts) score += 30;
  if (checklist.mismatchedColors) score += 15;
  if (checklist.keypadObstruction) score += 20;
  if (checklist.hiddenCamera) score += 50;
  
  // Risk if Bluetooth signal is checked manually OR if we found threats in the list
  const hasThreats = detectedDevices.some(d => d.threatType && d.threatType !== 'Unknown');
  if (checklist.bluetoothSignal || hasThreats) score += 40;

  // Cap at 100
  score = Math.min(score, 100);

  const isSuspicious = score > 20;

  return {
    isSuspicious,
    riskScore: score,
    checklist,
    detectedDevices
  };
};