import 'regenerator-runtime/runtime';

import { TernSecure } from './instance/ternsecure';
import { mountComponentRenderer } from './ui/Renderer';
import type { TernSecureInstanceTree } from '@tern-secure/types';

TernSecure.mountComponentRenderer = mountComponentRenderer;
export { TernSecure };


declare global {
  interface Window {
    TernSecure?: TernSecure;
    initTernSecureWithFunctionalCore?: (functionalCore: Omit<TernSecureInstanceTree, 'ui'>) => TernSecure | undefined;
    ternSecureFunctionalCore?: Omit<TernSecureInstanceTree, 'ui'>; // Optional: for pre-configuration
  }
}

console.log('[TernSecure Browser] Global window types declared.');
console.log('[TernSecure Browser] Checking current window state:', {
  hasWindowTernSecure: !!window.TernSecure,
  hasInitFunction: !!window.initTernSecureWithFunctionalCore,
  hasFunctionalCoreProvider: !!window.ternSecureFunctionalCore,
  typeOfFunctionalCoreProvider: typeof window.ternSecureFunctionalCore,
});

if (!window.TernSecure) {
  console.warn(
    '[TernSecure Browser] window.TernSecure (instance) is not yet initialized. Setting up initialization logic.'
  );

  if (!window.initTernSecureWithFunctionalCore) {
    window.initTernSecureWithFunctionalCore = (functionalCore: Omit<TernSecureInstanceTree, 'ui'>): TernSecure | undefined => {
        if (!window.TernSecure) {
            window.TernSecure = new TernSecure(functionalCore);
        }
        return window.TernSecure;
    }
  }

  if (window.ternSecureFunctionalCore && typeof window.ternSecureFunctionalCore === 'function') {
    window.initTernSecureWithFunctionalCore(window.ternSecureFunctionalCore);

  }
} else {
    console.log('[TernSecure] UI components script loaded. `window.TernSecure` was already present.');
}

if (module.hot) {
  module.hot.accept();
}