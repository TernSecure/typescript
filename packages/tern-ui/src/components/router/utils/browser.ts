/**
 * Browser utilities for router functionality
 */

export const isBrowser = (): boolean => typeof window !== 'undefined';

export const getCurrentLocation = () => ({
  pathname: isBrowser() ? window.location.pathname : '',
  search: isBrowser() ? window.location.search : ''
});

export const addLocationListener = (callback: () => void) => {
  if (!isBrowser()) return () => {};

  const handleLocationChange = () => callback();

  // Listen for both native popstate and our custom route change events
  window.addEventListener('popstate', handleLocationChange);
  window.addEventListener('tern-route-change', handleLocationChange);

  return () => {
    window.removeEventListener('popstate', handleLocationChange);
    window.removeEventListener('tern-route-change', handleLocationChange);
  };
};

export const triggerRouteChange = () => {
  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent('tern-route-change'));
  }
};
