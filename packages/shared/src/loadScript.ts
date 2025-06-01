  import { retry } from './retry'

  type LoadScriptOptions = {
    async?: boolean;
    defer?: boolean;
    crossOrigin?: 'anonymous' | 'use-credentials';
    nonce?: string;
    beforeLoad?: (script: HTMLScriptElement) => void;
  };

  export async function loadScript(src ='', options: LoadScriptOptions): Promise<HTMLScriptElement> {
    const { async, defer, crossOrigin, nonce, beforeLoad } = options;

    const load = () => {
      return new Promise<HTMLScriptElement>((resolve, reject) => {
        if (!src) {
          reject(new Error('Script src is required'));
        }

        if (!document || !document.body) {
          reject(new Error('Document body is not available'));
        }

        const script = document.createElement('script');

        if (crossOrigin) script.setAttribute('crossorigin', crossOrigin);
        script.async = async || false;
        script.defer = defer || false;

        let resolved = false;
        let timeoutId: NodeJS.Timeout | null = null;

        const cleanup = () => {
          script.removeEventListener('load', handleLoad);
          script.removeEventListener('error', handleError);
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        };
        
        const handleLoad = () => {
          if (resolved) return;
          console.log(`[loadScript] Script loaded successfully: ${src}`);

          resolved = true;
          cleanup();
          resolve(script);
        };
        
        const handleError = (error: ErrorEvent) => {
          if (resolved) return;
          resolved = true;
          cleanup();
          script.remove();
          console.error(`[loadScript] Failed to load script: ${src}`, error);
          reject(new Error(`Failed to load script: ${src}, Error: ${error.message || error}`));
        };
        
        script.addEventListener('load', handleLoad);
        script.addEventListener('error', handleError);

        script.src = src;
        script.nonce = nonce;
        beforeLoad?.(script);

        console.log(`[loadScript] Appending script to document body: ${src}`);
        document.body.appendChild(script)
      });
    };

    return load()

    //return retry(load, { shouldRetry: (_, iterations) => iterations <=5 });
  }