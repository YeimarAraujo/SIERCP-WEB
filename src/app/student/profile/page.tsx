'use client';

import { Header } from '@/components/layout/header';
import { ProfileContent } from '@/components/profile/profile-content';

export default function StudentProfilePage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Mi Perfil" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <ProfileContent />
            </div>
        </div>
    );
}
