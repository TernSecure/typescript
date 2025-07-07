const registerServiceWorker = async (firebaseConfig) => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported');
    return null;
  }

  try {
    const serializedConfig = encodeURIComponent(JSON.stringify(firebaseConfig));
    const serviceWorkerUrl = `/service-worker.js?firebaseConfig=${serializedConfig}`;
    
    const registration = await navigator.serviceWorker.register(serviceWorkerUrl);
    console.log('Service worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
};

export { registerServiceWorker };