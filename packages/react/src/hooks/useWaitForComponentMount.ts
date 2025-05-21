'use client'

import { useEffect, useRef, useState } from 'react';

interface WaitForElementOptions {
  selector?: string;
  root?: HTMLElement | null;
  timeout?: number;
}

/**
 * Waits for an element to have children in the DOM.
 * Used to detect when a TernSecure component has been fully mounted.
 */
function waitForElementChildren(options: WaitForElementOptions): Promise<void> {
  const { root = document?.body, selector, timeout = 0 } = options;

  return new Promise<void>((resolve, reject) => {
    if (!root) {
      reject(new Error('No root element provided'));
      return;
    }

    let elementToWatch: HTMLElement | null = root;
    if (selector) {
      elementToWatch = root?.querySelector(selector);
    }

    // Check if element already has children
    if (elementToWatch?.childElementCount && elementToWatch.childElementCount > 0) {
      resolve();
      return;
    }

    // Set up MutationObserver to watch for children
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          if (!elementToWatch && selector) {
            elementToWatch = root?.querySelector(selector);
          }

          if (elementToWatch?.childElementCount && elementToWatch.childElementCount > 0) {
            observer.disconnect();
            resolve();
            return;
          }
        }
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    // Optional timeout
    if (timeout > 0) {
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for element children after ${timeout}ms`));
      }, timeout);
    }
  });
}

type MountingStatus = 'rendering' | 'rendered' | 'error';

/**
 * Detect when a TernSecure component has mounted by watching DOM updates
 * to an element with a `data-tern-secure-component="${component}"` property.
 */
export const useWaitForComponentMount = (component?: string): MountingStatus => {
  const watcherRef = useRef<Promise<void>>();
  const [status, setStatus] = useState<MountingStatus>('rendering');

  useEffect(() => {
    if (!component) {
      console.error('TernSecure: no component name provided, unable to detect mount.');
      setStatus('error');
      return;
    }

    if (typeof window !== 'undefined' && !watcherRef.current) {
      watcherRef.current = waitForElementChildren({ 
        selector: `[data-tern-secure-component="${component}"]`,
        timeout: 10000 // 10 second timeout
      })
        .then(() => {
          setStatus('rendered');
        })
        .catch((error) => {
          console.error('TernSecure: Error detecting component mount:', error);
          setStatus('error');
        });
    }
  }, [component]);

  return status;
};
