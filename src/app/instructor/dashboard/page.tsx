'use client';

import { DashboardHeader } from '@/components/layout/dashboard-header';
import { ActiveSessionCard } from '@/components/ui/active-session-card';
import { DeviceControlCard } from '@/components/ui/device-control-card';
import { IoTCard } from '@/components/ui/iot-card';
import { AhaPerformanceChart } from '@/components/ui/aha-performance-chart';
import { EvaluationList } from '@/components/ui/evaluation-list';

export default function InstructorDashboardPage() {
    return (
        <div className="bg-[var(--bg-page)]">
            <DashboardHeader />

            <div className="px-8 pb-8 grid grid-cols-3 gap-8">
                <div className="flex flex-col gap-8">
                    <ActiveSessionCard session={null} />
                    <DeviceControlCard device={null} />
                </div>

                <div className="flex flex-col gap-8">
                    <IoTCard device={null} />
                    {/* TODO: Fetch real evaluations from Firebase for instructor's students */}
                    <EvaluationList evaluations={[]} />
                </div>

                <div className="flex flex-col gap-8">
                    <AhaPerformanceChart data={null} fatiguePoint={null} />
                </div>
            </div>
        </div>
    );
}
