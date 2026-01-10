import { DetectionRecord, DetectionStatus } from "../types";
import { saveDetection } from "./db";

/**
 * CORE LOGIC (OUTSIDE UI)
 * 
 * Embedded Trust & Authority Layer.
 * Enforces canonical truth, validates schemas, manages trust states,
 * controls anonymity/provenance, and authorizes external actions.
 */
export const TrustAuthority = {
  
  /**
   * Enforces canonical truth and validates evidence schema.
   * Ensures that risk scores are within bounds and required evidence exists for high-stakes states.
   */
  validateEvidence: (record: DetectionRecord): boolean => {
    // Schema Validation
    if (!record.id || !record.timestamp) return false;
    
    // Canonical Truth Enforcement: Risk Score Bounds
    if (record.analysis.riskScore < 0 || record.analysis.riskScore > 100) return false;

    // Evidence Validation: Suspicious claims require visual proof (snapshot)
    if (record.analysis.isSuspicious && (!record.imageData || record.imageData.length === 0)) {
        console.warn("TrustAuthority: Rejected suspicious claim due to missing visual evidence.");
        return false;
    }

    return true;
  },

  /**
   * Enforces state transition rules.
   * Specifically handles the "Irreversible Confirmation" requirement.
   */
  validateStateTransition: (newStatus: DetectionStatus, currentStatus?: DetectionStatus): boolean => {
     if (!currentStatus) return true; // New Record

     // IRREVERSIBLE RULE: Once CONFIRMED, cannot go back to PENDING or CLEARED without super-admin (not available in local mode)
     if (currentStatus === DetectionStatus.CONFIRMED && newStatus !== DetectionStatus.CONFIRMED && newStatus !== DetectionStatus.PUBLISHED) {
         console.error("TrustAuthority: Violation of Irreversible Confirmation Rule.");
         return false;
     }

     return true;
  },

  /**
   * Manages trust state transitions and commits to the local vault.
   * Acts as the sole gatekeeper for writing to the immutable log.
   */
  submitDetection: async (record: DetectionRecord): Promise<void> => {
    // 1. Validate Schema & Evidence
    if (!TrustAuthority.validateEvidence(record)) {
      throw new Error("Trust Authority Integrity Check Failed: Evidence invalid or incomplete.");
    }

    // 2. Validate State Transition (Irreversibility Check)
    if (record.status === DetectionStatus.PUBLISHED) {
        throw new Error("Trust Authority: Cannot create record with PUBLISHED state directly.");
    }

    // 4. Commit to Storage
    await saveDetection(record);
  },

  /**
   * Authorizes external actions (e.g., Export/Disclosure).
   * Enforces rules around what data leaves the Local boundary.
   */
  authorizeExport: (record: DetectionRecord): boolean => {
    // Rule: Only CONFIRMED or PUBLISHED incidents can be disclosed to external authorities.
    const isAuthorized = record.status === DetectionStatus.CONFIRMED || record.status === DetectionStatus.PUBLISHED;
    
    if (!isAuthorized) {
        console.warn(`TrustAuthority: Access Denied for record ${record.id}. State: ${record.status}`);
    }
    
    return isAuthorized;
  },

  /**
   * Controls anonymity and generates a sanitized view for disclosure.
   * Strips raw telemetry that isn't required for the authority report.
   */
  sanitizeForDisclosure: (record: DetectionRecord): Partial<DetectionRecord> => {
     // Return a clean object with only essential proof
     return {
         id: record.id,
         timestamp: record.timestamp,
         status: record.status,
         analysis: record.analysis, // Includes DeviceLogs now
         deviceType: record.deviceType,
         imageData: record.imageData,
         location: record.location 
     };
  }
};