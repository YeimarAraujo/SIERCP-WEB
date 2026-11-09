import { InvitationsBanner } from '@/components/privacy/invitations-banner';
import { ConsentGate } from '@/components/privacy/consent-gate';
import { StudentShell } from '@/components/layout/student-shell';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    return <StudentShell><ConsentGate /><InvitationsBanner />{children}</StudentShell>;
}
