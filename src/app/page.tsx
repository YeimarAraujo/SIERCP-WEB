import React from 'react';
import Navbar from '@/components/page/Navbar';
import Hero from '@/components/page/Hero';
import CursosPreview from '@/components/page/CursosPreview';
import Servicios from '@/components/page/Servicios';
import PlanesSiercp from '@/components/page/PlanesSiercp';
import Metodologia from '@/components/page/Metodologia';
import Nosotros from '@/components/page/Nosotros';
import DownloadApp from '@/components/page/DownloadApp';
import FAQPreview from '@/components/page/FAQPreview';
import Contacto from '@/components/page/Contacto';
import Footer from '@/components/page/Footer';
import WhatsAppFab from '@/components/page/WhatsAppFab';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './landing.css';
import SoftwareSiercp from '@/components/page/SoftwareSiercp';
import Adopcion from '@/components/page/Adopcion';
import ProyectoIoT from '@/components/page/ProyectoIoT';

export default function LandingPage() {
    return (
        <div className="page-body">
            <Navbar />
            <main>
                <Hero />
                <CursosPreview />
                <Servicios />
                <ProyectoIoT />
                <PlanesSiercp />
                <Metodologia />
                <FAQPreview />
                <Contacto />
            </main>
            <Footer />
            <WhatsAppFab />
        </div>
    );
}