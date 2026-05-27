import React from 'react';
import Navbar from '@/components/page/Navbar';
import Servicios from '@/components/page/Servicios';
import SoftwareSiercp from '@/components/page/SoftwareSiercp';
import ProyectoIoT from '@/components/page/ProyectoIoT';
import Footer from '@/components/page/Footer';
import WhatsAppFab from '@/components/page/WhatsAppFab';

export default function FeaturesPage() {
    return (
        <div className="page-body">
            <Navbar forceScrolled={true} />
            <main>
                <Servicios />
                <SoftwareSiercp />
                <ProyectoIoT />
            </main>
            <Footer />
            <WhatsAppFab />
        </div>
    );
}
