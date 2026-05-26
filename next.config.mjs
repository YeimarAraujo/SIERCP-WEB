/** @type {import('next').NextConfig} */

/**
 * Content Security Policy.
 * Se define aquí para que sea legible y mantenible.
 * Regla: mínimo privilegio — solo se permiten orígenes explícitamente necesarios.
 */
const CSP = [
  /* Solo documentos del mismo origen */
  `default-src 'self'`,

  /* Scripts: mismo origen + Firebase SDK + Wompi widget + reCAPTCHA Enterprise */
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'
     https://www.gstatic.com
     https://www.googleapis.com
     https://cdn.wompi.co
     https://js.wompi.co
     https://www.recaptcha.net
     https://recaptcha.google.com`,

  /* Estilos: mismo origen + Google Fonts + Bootstrap CDN */
  `style-src 'self' 'unsafe-inline'
     https://fonts.googleapis.com
     https://cdn.jsdelivr.net`,

  /* Fuentes tipográficas */
  `font-src 'self'
     https://fonts.gstatic.com
     https://cdn.jsdelivr.net`,

  /* Imágenes: mismo origen + Firebase Storage + data URIs + miniaturas YouTube */
  `img-src 'self' data: blob:
     https://firebasestorage.googleapis.com
     https://lh3.googleusercontent.com
     https://img.youtube.com`,

  /* Conexiones a APIs externas */
  `connect-src 'self'
     https://*.googleapis.com
     https://*.firebaseio.com
     https://firestore.googleapis.com
     https://identitytoolkit.googleapis.com
     https://securetoken.googleapis.com
     https://us-central1-siercp.cloudfunctions.net
     https://*.cloudfunctions.net
     https://www.recaptcha.net
     https://recaptcha.google.com
     https://sandbox.wompi.co
     https://production.wompi.co
     wss://*.firebaseio.com`,

  /* Media: videos locales (RCP_Hero.mp4) */
  `media-src 'self' blob:`,

  /* Frames: Wompi (widget de pago PSE) + YouTube embeds sin cookies + reCAPTCHA */
  `frame-src https://checkout.wompi.co https://www.youtube-nocookie.com https://www.recaptcha.net https://recaptcha.google.com`,

  /* Workers (Service Worker de PWA) */
  `worker-src 'self' blob:`,

  /* Formularios solo al mismo origen */
  `form-action 'self'`,

  /* Impide que este sitio sea embebido en frames externos */
  `frame-ancestors 'none'`,

  /* HTTPS obligatorio en producción (upgrade antes de bloquear) */
  `upgrade-insecure-requests`,
].join('; ');

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          /* Previene MIME-type sniffing */
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          /* Impide clickjacking (también cubierto por CSP frame-ancestors) */
          { key: 'X-Frame-Options', value: 'DENY' },

          /* Activa el filtro XSS en navegadores legacy */
          { key: 'X-XSS-Protection', value: '1; mode=block' },

          /* Controla la información enviada en el Referer */
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          /* Deshabilita features sensibles que la app no necesita */
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },

          /* HSTS: fuerza HTTPS por 1 año, incluyendo subdominios */
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },

          /* Content Security Policy */
          { key: 'Content-Security-Policy', value: CSP.replace(/\n\s+/g, ' ') },

          /* Evita que el navegador detecte automáticamente el tipo de archivo */
          { key: 'X-Download-Options', value: 'noopen' },

          /* Controla cómo se comparte información con sitios cruzados */
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
      /* Cabeceras de caché para assets estáticos */
      {
        source: '/assets/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  /* Optimización de imágenes — dominio de Firebase Storage */
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
