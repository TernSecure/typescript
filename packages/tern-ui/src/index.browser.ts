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

if (!window.TernSecure) {
  console.warn(
    '[TernSecure] UI components script loaded. `window.TernSecure` is not yet initialized. ' +
    'Call `window.initTernSecureWithFunctionalCore(functionalCore)` or ensure `window.TernSecure` ' +
    'is set up by another script (e.g., by providing `window.ternSecureFunctionalCore` before this script runs).'
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