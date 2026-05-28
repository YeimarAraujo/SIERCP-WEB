import React from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/page/Navbar';
import Hero from '@/components/page/Hero';
import WhatsAppFab from '@/components/page/WhatsAppFab';

const CursosPreview  = dynamic(() => import('@/components/page/CursosPreview'));
const Servicios      = dynamic(() => import('@/components/page/Servicios'));
const DownloadApp    = dynamic(() => import('@/components/page/DownloadApp'));
const PlanesSiercp   = dynamic(() => import('@/components/page/PlanesSiercp'));
const Metodologia    = dynamic(() => import('@/components/page/Metodologia'));
const Adopcion       = dynamic(() => import('@/components/page/Adopcion'));
const VideoTutorial  = dynamic(() => import('@/components/page/VideoTutorial'));
const FAQPreview     = dynamic(() => import('@/components/page/FAQPreview'));
const Contacto       = dynamic(() => import('@/components/page/Contacto'));
const Footer         = dynamic(() => import('@/components/page/Footer'));

export default function LandingPage() {
    return (
        <div className="page-body">
            <Navbar />
            <main>
                <Hero />
                <CursosPreview />
                <Servicios />
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