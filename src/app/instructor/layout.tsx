import { InstructorShell } from '@/components/layout/instructor-shell';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
    return <InstructorShell>{children}</InstructorShell>;
}
