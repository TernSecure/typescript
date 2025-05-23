import { TernSecure } from './instance/ternsecure';
import { mountComponentRenderer } from './ui/Renderer';

TernSecure.mountComponentRenderer = mountComponentRenderer;
export { TernSecure };


if (module.hot) {
  module.hot.accept();
}