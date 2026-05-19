import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tijori 🔐',
    short_name: 'Tijori',
    description: 'A secure, offline-first Tijori app',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0d',
    theme_color: '#0a0a0d',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/mobile.jpg',
        sizes: '1080x1920',
        type: 'image/jpeg',
        form_factor: 'narrow',
      },
      {
        src: '/screenshots/desktop.jpg',
        sizes: '1920x1080',
        type: 'image/jpeg',
        form_factor: 'wide',
      },
    ],
  };
}
