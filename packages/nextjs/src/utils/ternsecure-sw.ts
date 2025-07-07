'use client';

import { useEffect } from 'react';
import type { TernSecureConfig } from '@tern-secure/types';
import { reg } from '@tern-secure/shared/serviceWorker';

interface TernUIServiceWorkerProps {
    ternSecureConfig?: TernSecureConfig;
    baseUrl?: string;
}

export const TernUIServiceWorker: React.FC<TernUIServiceWorkerProps> = ({ 
    ternSecureConfig,
    baseUrl = window.location.origin 
}) => {
  useEffect(() => {
    const registerServiceWorker = async () => {
      if (!ternSecureConfig) {
        console.warn('[TernSecure] Service worker registration skipped: config not provided');
        return;
      }

      try {
        await reg({
          firebaseConfig: ternSecureConfig,
          domain: baseUrl
        });
      } catch (error) {
        console.error('[TernSecure] Service worker registration failed:', error);
      }
    };

    registerServiceWorker();
  }, [ternSecureConfig, baseUrl]);

  return null;
};