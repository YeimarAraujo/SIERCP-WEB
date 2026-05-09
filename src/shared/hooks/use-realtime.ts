'use client';

import { useEffect } from 'react';
import { useDeviceStore } from '@/features/devices/store/device-store';
import type { DeviceInfo } from '@/shared/types/device';

export function useDeviceTelemetry(mac: string | null): DeviceInfo | undefined {
    const { subscribeToDevice, getDevice } = useDeviceStore();

    useEffect(() => {
        if (!mac) return;
        const unsub = subscribeToDevice(mac);
        return unsub;
    }, [mac, subscribeToDevice]);

    return mac ? getDevice(mac) : undefined;
}

export function useAllDevices(): Record<string, DeviceInfo> {
    const { subscribeToAll, devices } = useDeviceStore();

    useEffect(() => {
        const unsub = subscribeToAll();
        return unsub;
    }, [subscribeToAll]);

    return devices;
}