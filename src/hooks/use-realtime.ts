'use client';

import { useEffect } from 'react';
import { useDeviceStore } from '@/stores/device-store';
import type { DeviceInfo } from '@/models/device';

/** Subscribe to a single device's telemetry. Auto-cleans on unmount. */
export function useDeviceTelemetry(mac: string | null): DeviceInfo | undefined {
    const { subscribeToDevice, getDevice } = useDeviceStore();

    useEffect(() => {
        if (!mac) return;
        const unsub = subscribeToDevice(mac);
        return unsub;
    }, [mac, subscribeToDevice]);

    return mac ? getDevice(mac) : undefined;
}

/** Subscribe to ALL devices. Useful for admin/device status pages. */
export function useAllDevices(): Record<string, DeviceInfo> {
    const { subscribeToAll, devices } = useDeviceStore();

    useEffect(() => {
        const unsub = subscribeToAll();
        return unsub;
    }, [subscribeToAll]);

    return devices;
}