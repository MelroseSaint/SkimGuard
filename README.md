# 🛡️ SkimGuard (Pro Tool)

**SkimGuard** is a professional-grade, real-time inspection utility designed for field agents to identify ATM and Point-of-Sale (POS) skimmers. 

It combines **computer vision**, **RF spectral analysis**, and **physical inspection protocols** into a single, offline-capable progressive web application (PWA).

## ✨ Key Capabilities

### 📡 Real-Time Telemetry
- **Live Dashboard**: Optimized polling (6s intervals) monitors system health, detection volume trends, and hardware status (Battery, GPS, Network) efficiently.
- **Hardware Integration**: Direct access to device sensors including Magnetometer (simulated via API hooks), Bluetooth Radio, and Camera Torch.
- **Simulated Trends**: Real-time signal noise simulation in the dashboard for demonstration purposes when hardware is idle.

### 🔍 Advanced Detection Engine
- **Bluetooth Smart Filter**: Automatically suppresses known benign devices (Headphones, Smartwatches) to focus on potential threats using `THREAT_SIGNATURES`.
- **Raw Signal Mode**: Toggle filters off to visualize raw RSSI volatility and detect faint signals from deeply embedded skimmers.
- **Visual Analysis**: Real-time luminance detection to identify glossy overlays or tape residue on card readers using HTML5 Canvas pixel analysis (throttled for performance).

### 🏢 Enterprise MDM & Security
- **Device Management**: Automatic asset tagging and compliance monitoring (Battery levels, Geolocation permission).
- **Quarantine Protocol**: Locks the interface if security policies (e.g., offline for >24h) are violated.
- **Remote Wipe Simulation**: Field agents can execute a "Remote Wipe" to instantly purge the local encrypted vault and reset encryption keys.
- **AES-256 Encryption**: All evidence logs are encrypted at rest using the Web Crypto API (`AES-GCM`).

### 📝 Forensic Evidence
- **Chain of Custody**: Generates cryptographically hashed PDF reports for law enforcement handover.
- **Local Vault**: Stores evidence fully offline in IndexedDB.

## 🛠️ Tech Stack

- **Core**: React 19, TypeScript, Vite
- **UI/UX**: Tailwind CSS, Lucide Icons, Recharts (Real-time graphing)
- **Hardware Access**: 
  - `navigator.bluetooth` (Web Bluetooth API)
  - `navigator.mediaDevices` (Camera/Flash)
  - `navigator.geolocation` (GPS)
  - `navigator.getBattery` (Power Management)
- **Security**: Web Crypto API (AES-GCM), IndexedDB

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A modern browser with hardware API support (Chrome/Edge on Android/Desktop). 
- *Note: iOS Web Bluetooth support requires specific browsers like Bluefy.*

### Installation & Build

1. **Clone the repository**
   ```bash
   git clone https://github.com/MelroseSaint/SkimmerDetection.git
   cd SkimmerDetection
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Development Mode**
   Start the hot-reloading development server:
   ```bash
   npm run dev
   ```

4. **Production Build**
   Compile TypeScript and optimize assets:
   ```bash
   npm run build
   ```
   The output will be in the `dist/` directory.

## 📖 Operational Guide

1. **Dashboard**: Check system status. Ensure "Live Monitoring" is active.
2. **Scanner**: 
   - **Visual**: Use the HUD to check Surface Reflection Index (SRI). High SRI (>85%) suggests tape or plastic overlays.
   - **RF Scan**: Activate the Bluetooth scanner. Use **Settings** to toggle "Smart Filter" if you suspect a non-standard device.
3. **Physical Check**: Complete the interactive checklist (Wiggle Test, Alignment).
4. **Evidence**: Capture a snapshot. The app calculates a risk score (0-100%).
5. **Review**: Analyze the log in the encrypted vault. Export PDF reports for verified threats.

## ⚠️ Disclaimer

This tool aids in detection but cannot guarantee safety. Sophisticated "deep insert" skimmers may not be visible or transmit Bluetooth signals. Always monitor your bank statements.

## 📄 License

MIT License.