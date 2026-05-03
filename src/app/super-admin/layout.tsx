import { SuperAdminShell } from '@/components/layout/super-admin-shell';

export const dynamic = 'force-dynamic';

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <SuperAdminShell>{children}</SuperAdminShell>;
}
