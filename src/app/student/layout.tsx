import { StudentShell } from '@/components/layout/student-shell';

export const dynamic = 'force-dynamic';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    return <StudentShell>{children}</StudentShell>;
}
