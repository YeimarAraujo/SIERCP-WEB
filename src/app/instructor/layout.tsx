import { InvitationsBanner } from '@/components/privacy/invitations-banner';
import { ConsentGate } from '@/components/privacy/consent-gate';
import { InstructorShell } from '@/components/layout/instructor-shell';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
    return <InstructorShell><ConsentGate /><InvitationsBanner />{children}</InstructorShell>;
}
