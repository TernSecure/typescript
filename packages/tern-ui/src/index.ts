export { TernSecure } from './instance/ternsecure';
export type { FunctionalTernSecureInstance } from './instance/ternsecure'; // Exporting this helper interface
export { createComponentRenderer } from './ui/Renderer';
export type { TernComponentControls, ComponentProps } from './ui/Renderer';
export * from './lazyLoading/components'; // Export lazy components and names

// HMR (Hot Module Replacement) setup - keep if it's part of your dev environment
// Using a type assertion for module.hot to bypass TS error for the tool
if (typeof module !== 'undefined' && (module as any).hot) {
  (module as any).hot.accept();
}