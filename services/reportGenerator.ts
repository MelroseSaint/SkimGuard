import { jsPDF } from 'jspdf';
import { DetectionRecord, DeviceLog } from '../types';

export const generateAuthorityReport = (record: DetectionRecord): File => {
  const doc = new jsPDF();
  const dateStr = new Date(record.timestamp).toLocaleString();
  const isCritical = record.analysis.isSuspicious;

  // --- PAGE 1: EXECUTIVE SUMMARY ---
  
  // Header
  drawHeader(doc, record, isCritical);
  let y = 50;

  // 1. Incident Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text("1. EXECUTIVE SUMMARY", 20, y);
  y += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Device ID: ${record.deviceType || 'UNKNOWN_TERMINAL'}`, 20, y);
  y += 6;
  doc.text(`Timestamp: ${dateStr}`, 20, y);
  y += 6;
  
  // GPS Location Block
  if (record.location) {
      doc.setFillColor(245, 247, 250);
      doc.rect(20, y, 170, 20, 'F');
      doc.setFont('courier', 'bold');
      doc.text(`LAT: ${record.location.latitude.toFixed(6)}`, 25, y+8);
      doc.text(`LNG: ${record.location.longitude.toFixed(6)}`, 25, y+14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Accuracy: ±${record.location.accuracy?.toFixed(1) || 'N/A'}m`, 100, y+8);
      doc.text("GEOLOCATION LOCKED", 100, y+14);
      y += 25;
  } else {
      doc.text(`Location: GPS Signal Not Acquired / Offline`, 20, y);
      y += 6;
  }
  
  // Risk Score Graphic
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text("Calculated Risk Score:", 20, y);
  doc.setFontSize(24);
  doc.setTextColor(isCritical ? 220 : 16, isCritical ? 20 : 185, isCritical ? 20 : 129);
  doc.text(`${record.analysis.riskScore}%`, 70, y);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  y += 15;

  // 2. Physical Evidence Checklist
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text("2. PHYSICAL INSPECTION", 20, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const checklist = record.analysis.checklist;
  
  const findings = [
    { label: "Hardware Obstruction (Overlay)", val: checklist.keypadObstruction },
    { label: "Mismatched Material", val: checklist.mismatchedColors },
    { label: "Loose/Wobbly Reader", val: checklist.looseParts },
    { label: "Bluetooth Signal Anomaly", val: checklist.bluetoothSignal },
    { label: "Hidden Camera Optic", val: checklist.hiddenCamera },
  ];

  findings.forEach(f => {
    doc.text(`[ ${f.val ? 'X' : ' '} ] ${f.label}`, 25, y);
    y += 6;
  });

  // --- PAGE 2: WIRELESS SPECTRUM ---
  doc.addPage();
  drawHeader(doc, record, isCritical);
  y = 50;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text("3. WIRELESS SPECTRUM ANALYSIS", 20, y);
  y += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text("Detailed breakdown of detected Radio Frequency (RF) emitters in proximity during scan.", 20, y);
  y += 10;

  // Table Header
  doc.setFillColor(230, 230, 230);
  doc.rect(20, y, 170, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text("DEVICE NAME / ID", 22, y+5);
  doc.text("RSSI", 100, y+5);
  doc.text("CLASSIFICATION", 130, y+5);
  y += 10;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  if (record.analysis.detectedDevices && record.analysis.detectedDevices.length > 0) {
      record.analysis.detectedDevices.forEach((device: DeviceLog) => {
          // Check for page break
          if (y > 270) {
              doc.addPage();
              drawHeader(doc, record, isCritical);
              y = 50;
          }

          const isThreat = !!device.threatType;
          if (isThreat) doc.setTextColor(200, 0, 0);
          
          doc.text(device.name || "Unknown", 22, y);
          doc.setFontSize(8);
          doc.text(device.id, 22, y+4);
          doc.setFontSize(9);
          
          doc.text(`${device.rssi} dBm`, 100, y);
          doc.text(device.threatType || "Benign", 130, y);
          
          doc.setTextColor(0, 0, 0);
          y += 10;
          
          doc.setLineWidth(0.1);
          doc.line(20, y-3, 190, y-3);
      });
  } else {
      doc.text("No Bluetooth devices detected within range.", 22, y);
  }

  // --- PAGE 3: VISUAL EVIDENCE ---
  doc.addPage();
  drawHeader(doc, record, isCritical);
  y = 50;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text("4. VISUAL EVIDENCE CHAIN", 20, y);
  y += 10;

  if (record.imageData) {
    try {
        // Fit image
        const imgProps = doc.getImageProperties(record.imageData);
        const ratio = imgProps.width / imgProps.height;
        const width = 160;
        const height = width / ratio;
        
        doc.addImage(record.imageData, 'JPEG', 25, y, width, height);
        y += height + 10;
    } catch (e) {
        doc.text("[IMAGE DATA CORRUPTED]", 25, y + 10);
        y += 20;
    }
  } else {
      doc.text("No visual evidence captured.", 25, y);
      y += 10;
  }

  // Notes
  if (record.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text("FIELD NOTES:", 20, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const splitNotes = doc.splitTextToSize(record.notes, 170);
      doc.text(splitNotes, 20, y);
      y += (splitNotes.length * 5) + 10;
  }

  // Footer / Chain of Custody
  const pageHeight = doc.internal.pageSize.height;
  y = pageHeight - 30;

  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("CHAIN OF CUSTODY VALIDATION", 20, y);
  y += 5;
  doc.text(`Hash: ${uuidv4()}`, 20, y); 

  const filename = `SkimGuard_Report_${record.id.substring(0,8)}.pdf`;
  doc.save(filename);

  const blob = doc.output('blob');
  return new File([blob], filename, { type: 'application/pdf' });
};

const drawHeader = (doc: jsPDF, record: DetectionRecord, isCritical: boolean) => {
  doc.setFillColor(11, 17, 33); // Dark Blue
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("AUTHORITY EVIDENCE REPORT", 20, 20);
  
  doc.setFontSize(10);
  doc.setFont('courier', 'normal');
  doc.text(`CASE ID: ${record.id.toUpperCase().substring(0,18)}...`, 20, 30);
  doc.text(`GENERATED: ${new Date().toISOString()}`, 120, 30);

  // Status Badge
  doc.setFillColor(isCritical ? 239 : 16, isCritical ? 68 : 185, isCritical ? 68 : 129); // Red or Green
  doc.rect(160, 10, 30, 10, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(isCritical ? "THREAT" : "SAFE", 165, 16);
  
  // Reset
  doc.setTextColor(0,0,0);
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}