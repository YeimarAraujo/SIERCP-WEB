import { ref, onValue, off, set as rtdbSet, type Database } from 'firebase/database';
import { rtdb as _rtdb } from '@/lib/firebase';
import { parseDeviceSnapshot, type DeviceInfo } from '@/models/device';

export const DeviceService = {
    streamDevice(mac: string, cb: (info: DeviceInfo) => void): () => void {
        if (!_rtdb) return () => {};
        const r = ref(_rtdb as Database, `telemetria/${mac}`);
        onValue(r, (snap) => {
            if (snap.exists()) cb(parseDeviceSnapshot(mac, snap.val() as Record<string, unknown>));
        });
        return () => off(r);
    },

    streamAll(cb: (devices: Record<string, DeviceInfo>) => void): () => void {
        if (!_rtdb) return () => {};
        const r = ref(_rtdb as Database, 'telemetria');
        onValue(r, (snap) => {
            if (!snap.exists()) return;
            const raw = snap.val() as Record<string, Record<string, unknown>>;
            const result: Record<string, DeviceInfo> = {};
            Object.entries(raw).forEach(([mac, data]) => {
                if (data) result[mac] = parseDeviceSnapshot(mac, data);
            });
            cb(result);
        });
        return () => off(r);
    },

    isActive(info: DeviceInfo): boolean {
        return info.timestamp > 0 && Date.now() - info.timestamp < 30_000;
    },

    async clearDevice(mac: string): Promise<void> {
        if (!_rtdb) return;
        await rtdbSet(ref(_rtdb as Database, `telemetria/${mac}`), null);
    },
};