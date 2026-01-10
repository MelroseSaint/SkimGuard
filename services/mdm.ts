import { v4 as uuidv4 } from 'uuid';
import { ComplianceStatus, DeviceIdentity, SecurityPolicy } from '../types';

// Default Enterprise Policy
const DEFAULT_POLICY: SecurityPolicy = {
    requireOnline: false, // Strict mode off by default for UX, can be toggled
    minBatteryLevel: 0.10, // 10%
    requireGeolocation: true,
    allowCamera: true,
    maxOfflineDuration: 60 * 24 // 24 hours
};

// Polyfill for Battery API type
interface BatteryManager extends EventTarget {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
}

export const MDMService = {

    getIdentity(): DeviceIdentity {
        let identity = localStorage.getItem('sg_mdm_identity');
        if (!identity) {
            const newIdentity: DeviceIdentity = {
                assetTag: `ASSET-${uuidv4().substring(0, 8).toUpperCase()}`,
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                screenRes: `${window.screen.width}x${window.screen.height}`,
                registeredAt: Date.now(),
                lastCheckIn: Date.now()
            };
            localStorage.setItem('sg_mdm_identity', JSON.stringify(newIdentity));
            return newIdentity;
        }
        
        const parsed = JSON.parse(identity);
        // Update dynamic fields
        parsed.lastCheckIn = Date.now();
        localStorage.setItem('sg_mdm_identity', JSON.stringify(parsed));
        return parsed;
    },

    async checkCompliance(): Promise<ComplianceStatus> {
        const violations: string[] = [];
        
        // 1. Network Check
        const isOnline = navigator.onLine;
        if (DEFAULT_POLICY.requireOnline && !isOnline) {
            violations.push("NO_NETWORK_CONNECTION");
        }

        // 2. Battery Check (Real Hardware API)
        let batLevel: number | 'unknown' = 'unknown';
        let isCharging: boolean | 'unknown' = 'unknown';
        
        try {
            // @ts-ignore - Navigator.getBattery is experimental but works in Chrome/Edge/Android
            if (navigator.getBattery) {
                // @ts-ignore
                const battery: BatteryManager = await navigator.getBattery();
                batLevel = battery.level;
                isCharging = battery.charging;

                if (!isCharging && batLevel < DEFAULT_POLICY.minBatteryLevel) {
                    violations.push(`BATTERY_CRITICAL_${(batLevel * 100).toFixed(0)}%`);
                }
            }
        } catch (e) {
            // Battery API not supported
        }

        // 3. Geolocation Permission Check
        let locStatus: 'granted' | 'denied' | 'prompt' | 'unknown' = 'unknown';
        try {
            if (navigator.permissions) {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                locStatus = result.state;
                
                if (DEFAULT_POLICY.requireGeolocation && result.state === 'denied') {
                    violations.push("GEOLOCATION_DENIED");
                }
            }
        } catch (e) {
             // Permission API partial support
        }

        // 4. Integrity / Root Detection (Heuristic)
        // Detecting if userAgent spoofing or devtools is tricky, but we can check screen props
        if (window.screen.width < 300) {
             violations.push("DISPLAY_BELOW_MINIMUM_SPEC");
        }

        return {
            isCompliant: violations.length === 0,
            violations,
            batteryLevel: batLevel,
            isCharging,
            networkStatus: isOnline ? 'online' : 'offline',
            locationPermission: locStatus
        };
    },

    async remoteWipe(): Promise<void> {
        console.warn("MDM: EXECUTING REMOTE WIPE PROTOCOL");
        // 1. Clear IndexedDB
        const dbs = await window.indexedDB.databases();
        dbs.forEach(db => {
             if (db.name) window.indexedDB.deleteDatabase(db.name);
        });

        // 2. Clear LocalStorage
        localStorage.clear();

        // 3. Reload to force reset
        window.location.reload();
    }
};