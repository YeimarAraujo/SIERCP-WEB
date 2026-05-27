import React from 'react';
import Navbar from '@/components/page/Navbar';
import Hero from '@/components/page/Hero';
import CursosPreview from '@/components/page/CursosPreview';
import Servicios from '@/components/page/Servicios';
import ProyectoIoT from '@/components/page/ProyectoIoT';
import SoftwareSiercp from '@/components/page/SoftwareSiercp';
import PlanesSiercp from '@/components/page/PlanesSiercp';
import Metodologia from '@/components/page/Metodologia';
import Adopcion from '@/components/page/Adopcion';
import VideoTutorial from '@/components/page/VideoTutorial';
import FAQPreview from '@/components/page/FAQPreview';
import DownloadApp from '@/components/page/DownloadApp';
import Contacto from '@/components/page/Contacto';
import Footer from '@/components/page/Footer';
import WhatsAppFab from '@/components/page/WhatsAppFab';

export default function LandingPage() {
    return (
        <div className="page-body">
            <Navbar />
            <main>
                <Hero />
                <CursosPreview />
                <Servicios />
                {/* <ProyectoIoT /> */}
                {/* <SoftwareSiercp /> */}
                <DownloadApp />
                <PlanesSiercp />
                <Metodologia />
                <Adopcion />
                <VideoTutorial />
                <Contacto />
                <FAQPreview />
            </main>
            <Footer />
            <WhatsAppFab />
        </div>
    );
}