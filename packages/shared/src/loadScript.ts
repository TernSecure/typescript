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

        script.addEventListener('ternsecure:loaded', () => {
          script.remove();
          resolve(script);
        });

        script.addEventListener('error', (error) => {
          script.remove();
          reject(new Error(`Failed to load script: ${src}, Error: ${error}`));
        });

        script.src = src;
        script.nonce = nonce;
        beforeLoad?.(script);
        document.body.appendChild(script)
      });
    };

    return retry(load, { shouldRetry: (_, iterations) => iterations <=5 });
  }