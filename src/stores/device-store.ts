'use client';

import { create } from 'zustand';
import { ref, onValue, off } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { parseDeviceSnapshot, type DeviceInfo } from '@/models/device';

interface DeviceStore {
    devices: Record<string, DeviceInfo>;
    activeDeviceMac: string | null;

    setDevice: (mac: string, data: DeviceInfo) => void;
    setActiveDevice: (mac: string | null) => void;
    getDevice: (mac: string) => DeviceInfo | undefined;
    subscribeToDevice: (mac: string) => () => void;
    subscribeToAll: () => () => void;
}

export const useDeviceStore = create<DeviceStore>((set, get) => ({
    devices: {},
    activeDeviceMac: null,

    setDevice: (mac, data) =>
        set((state) => ({ devices: { ...state.devices, [mac]: data } })),

    setActiveDevice: (mac) => set({ activeDeviceMac: mac }),

    getDevice: (mac) => get().devices[mac],

    subscribeToDevice: (mac) => {
        const deviceRef = ref(rtdb, `telemetria/${mac}`);
        onValue(deviceRef, (snap) => {
            if (snap.exists()) {
                const info = parseDeviceSnapshot(mac, snap.val() as Record<string, unknown>);
                get().setDevice(mac, info);
            }
        });
        return () => off(deviceRef);
    },

    subscribeToAll: () => {
        const rootRef = ref(rtdb, 'telemetria');
        onValue(rootRef, (snap) => {
            if (!snap.exists()) return;
            const raw = snap.val() as Record<string, Record<string, unknown>>;
            Object.entries(raw).forEach(([mac, data]) => {
                if (data && typeof data === 'object') {
                    get().setDevice(mac, parseDeviceSnapshot(mac, data));
                }
            });
        });
        return () => off(rootRef);
    },
}));