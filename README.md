# 🛡️ SkimGuard (Pro Tool)

**SkimGuard** is a professional manual inspection utility designed to help users identify ATM and Point-of-Sale (POS) skimmers. 

Unlike "magic" detector apps, SkimGuard provides a rigorous **Physical Inspection Protocol** supported by real-time hardware tools (Camera Zoom, Flashlight, Bluetooth Scanning) to assist in verified detection.

## ✨ Features

- **🔦 Hardware-Assisted Inspection**: 
  - **High-Intensity Flashlight**: Toggle device torch to inspect dark slots.
  - **Digital Zoom**: Magnify suspicious gaps or glue residue.
- **📡 Bluetooth Skimmer Scan**: 
  - Uses the **Web Bluetooth API** to scan for suspicious Low Energy (BLE) devices often used by cheap skimmer modules (e.g., HC-05).
- **📝 Structured Protocol**: 
  - Guides the user through a security checklist (Wiggle test, alignment check, hidden camera search).
- **📊 Deterministic Risk Engine**: 
  - Calculates risk scores based on verified physical evidence, not AI guesses.
- **🔒 Local-First**: 
  - All reports and images are encrypted and stored locally on your device.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Hardware Access**: MediaDevices API (Camera/Torch), Web Bluetooth API
- **Storage**: IndexedDB
- **UI**: Tailwind CSS

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- A device with a camera and flash.
- A browser that supports **Web Bluetooth** (Chrome on Android/Desktop, Edge, Bluefy on iOS) is required for the signal scanner feature.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MelroseSaint/SkimmerDetection.git
   cd SkimmerDetection
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Running the App**
   Start the development server:
   ```bash
   npm run dev
   ```

4. **Access the App**
   Open the URL provided in the terminal (typically `http://localhost:5173`).

## 📖 How to Use

1. **Start Inspection**: Open the scanner.
2. **Visual Check**: 
   - Use the **Flashlight** icon to illuminate the card slot.
   - Use the **Zoom Slider** to check for glue or misalignment.
3. **Signal Check**: 
   - Tap **SCAN BLE** to search for nearby unknown Bluetooth devices.
4. **Physical Check**: 
   - Follow the on-screen checklist. 
   - Wiggle the reader. Check the keypad.
   - Mark any issues found.
5. **Report**: Save the inspection. The app will calculate a risk score based on your findings.

## ⚠️ Disclaimer

This tool aids in detection but cannot guarantee safety. Sophisticated "deep insert" skimmers may not be visible or transmit Bluetooth signals. Always monitor your bank statements.

## 📄 License

MIT License.