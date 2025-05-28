import type { TernSecureInstanceTreeOptions } from "@tern-secure/types";
import { loadScript } from "./loadScript";


export type LoadTernUISCriptOptions = TernSecureInstanceTreeOptions & {
  apiKey?: string;
  customDomain?: string;
  proxyUrl?: string;
  version?: string;
  isLocalDev?: boolean;
  scriptHost?: string;
  localPort?: string;
  nonce?: string;
}

export const loadTernUIScript = async (options?: LoadTernUISCriptOptions) => {
  const existingScript =  document.querySelector<HTMLScriptElement>('script[src*="tern-ui"]');

  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('ternsecure:loaded', () => {
        resolve(existingScript);
      });
      existingScript.addEventListener('error', (error) => {
        reject(error);
      });
    });
    }
    
    const scriptAttributes = constructScriptAttributes(options)
    
    const beforeLoad = (script: HTMLScriptElement) => {
      Object.entries(scriptAttributes).forEach(([key, value]) => {
        if (value) script.setAttribute(key, value);
      });
    };
    

    return loadScript(ternUIgetScriptUrl(options), {
      async: true,
      //crossOrigin: undefined,
      beforeLoad
    }).catch((error) => {
      console.error('[TernSecure] Failed to load TernUI script:', error);
      throw new Error('Failed to load TernUI script');
    });
  }

export const ternUIgetScriptUrl = (options?: LoadTernUISCriptOptions) => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const version = options?.version || process.env.TERN_UI_VERSION || 'latest';

    if ( isDevelopment) {
        const localHost = process.env.TERN_UI_HOST || 'localhost';
        const localPort = options?.localPort || process.env.TERN_UI_PORT || '4000';
        //return `http://${localHost}:${localPort}/index.browser.js`;
        return `https://storage.googleapis.com/cdn.lifesprintcare.ca/dist/index.browser.js`
    }

    const ternsecureCDN = options?.customDomain || 
                          (options?.proxyUrl && new URL(options.proxyUrl).host) || 'cdn.tern-secure.com';

    //return `https://${ternsecureCDN}/npm/@ternsecure/tern-ui@${version}/dist/index.browser.js`;
}

const constructScriptAttributes = (options?: LoadTernUISCriptOptions) => {
  return {
    'data-domain': options?.customDomain || '',
    'data-api-key': options?.apiKey || '',
    'data-environment': process.env.NODE_ENV || 'development',
    'data-proxy-url': options?.proxyUrl || '',
    'data-version': options?.version || process.env.TERN_UI_VERSION || 'latest',
    ...(options?.nonce ? { nonce: options.nonce } : {})
  };
};


 
      
function getScriptHost(): { scriptHost: string; isLocalDev: boolean } {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const options = {
        proxyUrl: process.env.TERN_PROXY_URL,
        customDomain: process.env.TERN_CUSTOM_DOMAIN,
        frontendApi: process.env.TERN_FRONTEND_API,
        localPort: process.env.TERN_UI_PORT || '4000'
    };

    // Check for local development first
    if (isDevelopment) {
        // Default to localhost, but allow IP configuration through env
        const localHost = process.env.TERN_UI_HOST || 'localhost';
        return {
            scriptHost: `${localHost}:${options.localPort}`, // /dist
            isLocalDev: true
        };
    }

    // Existing production logic
    if (options.proxyUrl) {
        return {
            scriptHost: new URL(options.proxyUrl).host,
            isLocalDev: false
        };
    }

    if (options.customDomain) {
        return {
            scriptHost: options.customDomain,
            isLocalDev: false
        };
    }

    if (options.frontendApi) {
        return {
            scriptHost: `${options.frontendApi}.tern-secure.com`,
            isLocalDev: false
        };
    }

    return {
        scriptHost: 'cdn.tern-secure.com',
        isLocalDev: false
    };
}