import { InstructorShell } from '@/components/layout/instructor-shell';

export const dynamic = 'force-dynamic';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
    return <InstructorShell>{children}</InstructorShell>;
}
