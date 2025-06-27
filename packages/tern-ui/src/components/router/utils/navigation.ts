import { isBrowser, triggerRouteChange } from './browser';
import { resolveUrl } from './url';
import type { NavigateOptions } from '../RouterCtx';

/**
 * Navigation utilities for router functionality
 */

export const createBaseNavigate = () => {
  return async (toURL: URL) => {
    if (isBrowser()) {
      window.history.pushState({}, '', toURL.toString());
      triggerRouteChange();
    }
  };
};

export const createNavigate = (baseNavigate: (toURL: URL) => Promise<unknown>) => {
  return async (to: string, options?: NavigateOptions) => {
    const url = resolveUrl(to);
    
    if (options?.searchParams) {
      // Append or merge search params
      const currentParams = new URLSearchParams(url.search);
      options.searchParams.forEach((value, key) => {
        currentParams.set(key, value);
      });
      url.search = currentParams.toString();
    }

    if (isBrowser()) {
      if (options?.replace) {
        window.history.replaceState(options?.state || {}, '', url.toString());
      } else {
        window.history.pushState(options?.state || {}, '', url.toString());
      }
      triggerRouteChange();
    }
  };
};

export const createRefresh = () => {
  return () => {
    if (isBrowser()) {
      window.location.reload();
    }
  };
};

export const createResolve = () => {
  return (to: string) => resolveUrl(to);
};
