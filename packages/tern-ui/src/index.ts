import { TernSecure } from './instance/ternsecure';
import { mountComponentRenderer } from './ui/Renderer';

TernSecure.mountComponentRenderer = mountComponentRenderer;
export { TernSecure };

if (typeof module !== 'undefined' && (module as any).hot) {
  (module as any).hot.accept();
}