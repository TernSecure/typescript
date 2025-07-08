import type { TernSecureInstanceTreeOptions, TernSecureSDK } from "@tern-secure/types";
import { loadScript } from "./loadScript";
import { resolveVersion } from "./resolveVersion";


export type LoadTernUISCriptOptions = TernSecureInstanceTreeOptions & {
  apiKey?: string;
  customDomain?: string;
  proxyUrl?: string;
  ternUIVersion?: string;
  sdkMetadata?: TernSecureSDK;
  scriptHost?: string;
  localPort?: string;
  nonce?: string;
}


export const loadTernUIScript = async (options?: LoadTernUISCriptOptions) => {
  const existingScript =  document.querySelector<HTMLScriptElement>('script[data-ternui-script]');
  console.log('[TernSecure-shared] Existing script:', existingScript);

  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => {
        resolve(existingScript);
      });

      existingScript.addEventListener('error', (error) => {
        reject(error);
      });
    });
  }

  if (!options?.customDomain) {
    throw new Error('TernUI script requires a custom domain or proxy URL to be specified in options.');
  }
  
  return loadScript(ternUIgetScriptUrl(options), {
    async: true,
    //crossOrigin: undefined,
     beforeLoad: beforeLoadWithOptions(options)
    }).catch((error) => {
      console.error('[TernSecure] Failed to load TernUI script:', error);
      throw new Error('Failed to load TernUI script');
    });
  }

export const ternUIgetScriptUrl = (options: LoadTernUISCriptOptions) => {
  const { ternUIVersion, isTernSecureDev } = options
  const version = resolveVersion(ternUIVersion)
  
  if ( isTernSecureDev) {
    const localHost = process.env.TERN_UI_HOST || 'localhost';
    const localPort = options?.localPort || process.env.TERN_UI_PORT || '4000';
    return `http://${localHost}:${localPort}/ternsecure.browser.js`;
        //return `http://cdn.lifesprintcare.ca/dist/ternsecure.browser.js`
    }
    //return `https://cdn.lifesprintcare.ca/dist/ternsecure.browser.js`
    return `https://cdn.jsdelivr.net/npm/@tern-secure/ui@${version}/dist/ternsecure.browser.js`

    //const ternsecureCDN = options?.customDomain || 
                          //(options?.proxyUrl && new URL(options.proxyUrl).host) || 'cdn.tern-secure.com';
    //return `${ternsecureCDN}/ternsecure.browser.js`;
    //return `https://${ternsecureCDN}/npm/@ternsecure/tern-ui@${version}/dist/ternsecure.browser.js`;

}

    
const beforeLoadWithOptions = (options?: LoadTernUISCriptOptions) => (script: HTMLScriptElement) => {
  const attributes = constructScriptAttributes(options);
  Object.entries(attributes).forEach(([key, value]) => {
    if (value) script.setAttribute(key, String(value));
  });
  console.log('[TernSecure-shared] Script attributes set:', attributes);
};

export const constructScriptAttributes = (options?: LoadTernUISCriptOptions) => {
  return {
    'data-domain': options?.customDomain || '',
    'data-apikey': options?.apiKey || '',
    'data-proxyUrl': options?.proxyUrl || '',
    ...(options?.nonce ? { nonce: options.nonce } : {})
  };
};