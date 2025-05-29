import { TernSecure } from './instance/ternsecure';

console.log('[Tern-UI index.browser.ts] Script loaded and executing.');

// Lazy load the renderer only when needed
const initializeRenderer = async () => {
  try {
    console.log('[Tern-UI index.browser.ts] Initializing renderer...');
    const { mountComponentRenderer } = await import('./ui/Renderer');
    TernSecure.mountComponentRenderer = mountComponentRenderer;

    console.log('[Tern-UI index.browser.ts] Renderer assigned successfully:', {
      mountComponentRenderer,
      isFunction: typeof mountComponentRenderer === 'function',
      staticProperty: TernSecure.mountComponentRenderer,
      staticPropertyMatches: TernSecure.mountComponentRenderer === mountComponentRenderer
    });

    console.log('[Tern-UI index.browser.ts] DOM state after renderer assignment:', {
      body: document.body,
      bodyChildren: document.body.children.length,
      existingTernSecureElements: document.querySelectorAll('[data-ternsecure-component]').length,
      rootElement: document.getElementById('data-ternsecure-component')
    });

    return true;
  } catch (error) {
    console.error('[Tern-UI index.browser.ts] Failed to initialize renderer:', error);
    return false;
  }
};

// Only initialize renderer when DOM is ready
const initializeTernSecure = async () => {
  try {
    const apiKey = document.querySelector('[data-api-key]')?.getAttribute('data-api-key') || window.apiKey || '';
    const domain = document.querySelector('script[data-domain]')?.getAttribute('data-domain') || window.customDomain || '';
    const proxyUrl = document.querySelector('[data-proxy-url]')?.getAttribute('data-proxy-url') || window.proxyUrl || '';

    console.log('[Tern-UI index.browser.ts] Extracted configuration:', {
      apiKey: apiKey ? '***' : 'not found',
      domain,
      proxyUrl: proxyUrl ? '***' : 'not found'
    });

    if (!window.TernSecure) {
      console.log('[Tern-UI index.browser.ts] Creating TernSecure instance...');
      window.TernSecure = new TernSecure(domain);

      console.log('[Tern-UI index.browser.ts] TernSecure instance created:', {
        instance: window.TernSecure,
        isReady: window.TernSecure.isReady,
        status: window.TernSecure.status,
        hasStaticRenderer: !!TernSecure.mountComponentRenderer
      });
      
      // Initialize renderer after instance is created
      const rendererInitialized = await initializeRenderer();
      //await initializeRenderer();

      if (rendererInitialized) {
        console.log('[Tern-UI index.browser.ts] Loading TernSecure instance...');
        await window.TernSecure.load();
        console.log('[Tern-UI index.browser.ts] TernSecure instance loaded successfully');
      }

      console.log('[Tern-UI index.browser.ts] Final initialization state:', {
        rendererInitialized,
        instanceReady: {
          isReady: window.TernSecure.isReady,
          status: window.TernSecure.status,
          instance: window.TernSecure
        },
        staticRendererAssigned: !!TernSecure.mountComponentRenderer,
        windowTernSecure: !!window.TernSecure,
        domElementsCount: document.querySelectorAll('[data-ternsecure-component]').length
      });
    }
  } catch (error) {
    console.error('[Tern-UI index.browser.ts] Error during TernSecure initialization:', error);
  }
};

console.log('[Tern-UI index.browser.ts] DOM ready state:', {
  readyState: document.readyState,
  bodyExists: !!document.body
});

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  console.log('[Tern-UI index.browser.ts] Waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', initializeTernSecure);
  console.log('[Tern-UI index.browser.ts] DOMContentLoaded event listener added.');
} else {
  console.log('[Tern-UI index.browser.ts] DOM already ready, initializing immediately...');
  initializeTernSecure();
}

if (module.hot) {
  module.hot.accept();
}