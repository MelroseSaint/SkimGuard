
import { AnalysisResult, InspectionChecklist, DeviceLog, ScanEnvironment, DetectionMethod } from "../types";

// Environment Risk Multipliers
const ENV_WEIGHTS: Record<ScanEnvironment, number> = {
    [ScanEnvironment.ATM]: 1.5,        // Strict: Any signal is suspicious
    [ScanEnvironment.FUEL_PUMP]: 1.3,  // Strict: Industrial area
    [ScanEnvironment.RETAIL_POS]: 0.8, // Lenient: Expect printers/scanners
    [ScanEnvironment.PUBLIC_SPACE]: 0.5 // Very Lenient: High noise
};

// Deterministic Risk Engine
// Calculates risk based purely on physical inspection data + Environment Context
export const calculateRisk = (
    checklist: InspectionChecklist, 
    detectedDevices: DeviceLog[] = [], 
    environment: ScanEnvironment = ScanEnvironment.ATM
): AnalysisResult => {
  let score = 0;
  
  // 1. Physical Inspection Weights
  if (checklist.looseParts) score += 30;
  if (checklist.mismatchedColors) score += 15;
  if (checklist.keypadObstruction) score += 20;
  if (checklist.hiddenCamera) score += 50;
  
  // 2. Wireless Threat Analysis
  let signalScore = 0;

  detectedDevices.forEach(device => {
      if (device.threatType) {
          let deviceWeight = 0;
          
          // Weight based on detection confidence
          switch (device.detectionMethod) {
              case DetectionMethod.REGEX: 
                  deviceWeight = 50; // High confidence known signature
                  break;
              case DetectionMethod.FUZZY:
                  deviceWeight = 35; // Medium confidence, likely variant
                  break;
              case DetectionMethod.HEURISTIC:
                  deviceWeight = 15; // Low confidence, generic name
                  break;
              default:
                  deviceWeight = 10;
          }

          // Adjust RSSI impact (Closer = Higher Risk)
          if (device.rssi > -50) deviceWeight *= 1.5; // Very close
          else if (device.rssi < -80) deviceWeight *= 0.5; // Far away

          signalScore = Math.max(signalScore, deviceWeight);
      }
  });

  // Apply Environment Multiplier to Signal Score
  // In an ATM, a heuristic match is scarier than in a Public Space
  signalScore *= ENV_WEIGHTS[environment];

  score += signalScore;

  // Manual Override
  if (checklist.bluetoothSignal) score += 20;

  // Cap at 100
  score = Math.min(score, 100);

  const isSuspicious = score > 25; // Base threshold

  return {
    isSuspicious,
    riskScore: Math.round(score),
    checklist,
    detectedDevices,
    environment
  };
};
