export type ServiceWorkerOptions = {
  firebaseConfig: Record<string, any>;
  scope?: string;
  updateViaCache?: 'imports' | 'all' | 'none';
  domain?: string;
  isTernSecureDev?: boolean;
  localPort?: string;
};

const getUrlEndpoint = (): string => {
    const isLocalhost = window.location.hostname === 'localhost';
    return isLocalhost ? 'http://localhost:3000' : `${window.location.origin}`;
  }

const getServiceWorkerUrl = (options: ServiceWorkerOptions): string => {
  const { firebaseConfig, domain, isTernSecureDev, localPort } = options;
  const serializedConfig = encodeURIComponent(JSON.stringify(firebaseConfig));
  
  let baseUrl: string;
  
  if (isTernSecureDev) {
    const localHost = process.env.TERN_UI_HOST || 'localhost';
    const port = localPort || process.env.TERN_UI_PORT || '3000';
    baseUrl = `http://${localHost}:${port}`;
  } else {
    baseUrl = domain || getUrlEndpoint();
  }
  
  return `${baseUrl}/service-worker.js?firebaseConfig=${serializedConfig}`;
};

export const reg = (opt: ServiceWorkerOptions) => {
    const { firebaseConfig } = opt;
    if ("serviceWorker" in navigator) {
        const serializedFirebaseConfig = encodeURIComponent(JSON.stringify(firebaseConfig));
        const serviceWorkerUrl = getServiceWorkerUrl(opt);
        
        navigator.serviceWorker
          .register(serviceWorkerUrl)
          .then((registration) => console.log("scope is: ", registration.scope));
        }
}

export const registerServiceWorker = async (options: ServiceWorkerOptions): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('[ServiceWorker] Service workers are not supported');
    return null;
  }

  const { scope = '/', updateViaCache = 'imports' } = options;

  try {
    const serviceWorkerUrl = getServiceWorkerUrl(options);
    
    const registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
      scope,
      updateViaCache,
    });

    console.log('[ServiceWorker] Registration successful:', registration);
    return registration;
  } catch (error) {
    console.error('[ServiceWorker] Registration failed:', error);
    throw new Error(`Failed to register service worker: ${error}`);
  }
};

export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const unregisterPromises = registrations.map(registration => registration.unregister());
    
    await Promise.all(unregisterPromises);
    console.log('[ServiceWorker] All service workers unregistered');
    return true;
  } catch (error) {
    console.error('[ServiceWorker] Failed to unregister service workers:', error);
    return false;
  }
};