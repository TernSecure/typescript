import { TernSecure } from './instance/ternsecure';
import { mountComponentRenderer } from './ui/Renderer';

console.log('[Tern-UI index.browser.ts] Script loaded and executing.');

TernSecure.mountComponentRenderer = mountComponentRenderer;


const apiKey = document.querySelector('[data-api-key]')?.getAttribute('data-api-key') || window.apiKey || '';
const domain = document.querySelector('script[data-domain]')?.getAttribute('data-domain') || window.customDomain || '';
const proxyUrl = document.querySelector('[data-proxy-url]')?.getAttribute('data-proxy-url') || window.proxyUrl || '';


if (!window.TernSecure) {
  window.TernSecure = new TernSecure(domain);
}

if (module.hot) {
  module.hot.accept();
}