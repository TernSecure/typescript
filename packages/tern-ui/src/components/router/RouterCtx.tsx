import React from 'react';

/**
 * Options for the navigate function.
 */
export interface NavigateOptions {
  /**
   * URLSearchParams to append to the navigation path.
   */
  searchParams?: URLSearchParams;
  /**
   * If true, the new URL will replace the current entry in the history stack.
   */
  replace?: boolean;
  /**
   * State to associate with the new history entry.
   */
  state?: any; // Consider using a more specific type if your application has a defined state structure
}

export interface RouteContextValue {
  basePath: string;
  startPath: string;
  flowStartPath: string;
  fullPath: string;
  indexPath: string;
  currentPath: string;
  matches: (path?: string, index?: boolean) => boolean;
  baseNavigate: (toURL: URL) => Promise<unknown>;
  navigate: (to: string, options?: NavigateOptions) => Promise<unknown>;
  resolve: (to: string) => URL;
  refresh: () => void;
  params: { [key: string]: string };
  queryString: string;
  queryParams: Record<string, string>;
  preservedParams?: string[];
  getMatchData: (path?: string, index?: boolean) => false | object;
  urlStateParam?: {
    startPath: string;
    path: string;
    componentName: string;
    clearUrlStateParam: () => void;
    socialProvider: string;
  };
}

export const RouteContext = React.createContext<RouteContextValue | null>(null);

RouteContext.displayName = 'RouteContext';

export const useRouter = (): RouteContextValue => {
  const ctx = React.useContext(RouteContext);
  if (!ctx) {
    throw new Error('useRouter called while Router is null');
  }
  return ctx;
};