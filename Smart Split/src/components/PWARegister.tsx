'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });

      // Handle install prompt for Android/Chrome
      let deferredPrompt: any;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install button or banner
        const installBanner = document.createElement('div');
        installBanner.id = 'install-banner';
        installBanner.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-4';
        installBanner.innerHTML = `
          <span>Install Smart Split app</span>
          <button id="install-button" class="bg-white text-blue-600 px-4 py-2 rounded font-semibold hover:bg-gray-100">
            Install
          </button>
          <button id="dismiss-install" class="text-white hover:text-gray-200">×</button>
        `;
        document.body.appendChild(installBanner);

        const installButton = document.getElementById('install-button');
        const dismissButton = document.getElementById('dismiss-install');

        installButton?.addEventListener('click', async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);
            deferredPrompt = null;
            installBanner.remove();
          }
        });

        dismissButton?.addEventListener('click', () => {
          installBanner.remove();
        });
      });

      // Handle app installed event
      window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        const banner = document.getElementById('install-banner');
        if (banner) {
          banner.remove();
        }
      });
    }
  }, []);

  return null;
}
