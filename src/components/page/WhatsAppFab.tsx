'use client';

import React from "react";

export default function WhatsAppFab() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '573000000000';

  return (
    <a
      href={`https://wa.me/${phone}`}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-fab"
      aria-label="Hablar con un asesor por WhatsApp"
    >
      <i className="bi bi-whatsapp" />
      <span className="fab-tooltip">Hablar con un asesor</span>
    </a>
  );
}
