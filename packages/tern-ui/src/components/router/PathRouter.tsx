import React from 'react';
import { RouteContext, type RouteContextValue } from './RouterCtx';

interface PathRouterProps {
  basePath: string;
  startPath: string;
  getPath: () => string;
  getQueryString: () => string;
  refreshEvents?: Array<keyof WindowEventMap>;
  preservedParams?: string[];
  urlStateParam?: {
    startPath: string;
    path: string;
    componentName: string;
    clearUrlStateParam: () => void;
    socialProvider: string;
  };
  children: React.ReactNode;
}


const parseQueryParams = (search: string): Record<string, string> => {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};


export const PathRouter = ({ children }: { children: React.ReactNode }) => {
  const getPath = () => {
    return typeof window !== 'undefined' ? window.location.pathname : '';
  };

  const getQueryString = () => {
    return typeof window !== 'undefined' ? window.location.search : '';
  };

  const [routeParts, setRouteParts] = React.useState({
    path: getPath(),
    queryString: getQueryString(),
  });

  const basePath = '';
  const currentPath = routeParts.path;
  const currentQueryString = routeParts.queryString;
  const currentQueryParams = parseQueryParams(currentQueryString);

  // Listen for route changes
  React.useEffect(() => {
    const handleRouteChange = () => {
      const newPath = getPath();
      const newQueryString = getQueryString();
      
      setRouteParts({
        path: newPath,
        queryString: newQueryString,
      });
    };

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('tern-route-change', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('tern-route-change', handleRouteChange);
    };
  }, []);

  const resolve = React.useCallback((to: string): URL => {
    return new URL(to, window.location.origin);
  }, []);

  const refresh = React.useCallback((): void => {
    const newPath = getPath();
    const newQueryString = getQueryString();

    setRouteParts({
      path: newPath,
      queryString: newQueryString,
    });
  }, []);

  const getMatchData = React.useCallback((path?: string, index?: boolean) => {
    if (index && currentPath === '/') {
      return { isIndex: true, path: '/' };
    }
    if (path) {
      const fullMatchPath = `/${path}`;
      if (currentPath === fullMatchPath || currentPath.startsWith(fullMatchPath + '/')) {
        return { path: fullMatchPath, matchedPath: path };
      }
    }
    return false;
  }, [currentPath]);
  
  const matches = React.useCallback((path?: string, index?: boolean): boolean => {
    return !!getMatchData(path, index);
  }, [getMatchData]);

  const baseNavigate = React.useCallback(async (toURL: URL) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', toURL.toString());
      window.dispatchEvent(new CustomEvent('tern-route-change'));
    }
  }, []);

  const navigate = React.useCallback(async (to: string, options?: { searchParams?: URLSearchParams; replace?: boolean; state?: any }) => {
    const toURL = resolve(to);
    if (options?.searchParams) {
      toURL.search = options.searchParams.toString();
    }
    return baseNavigate(toURL);
  }, [resolve, baseNavigate]);

  const routerValue: RouteContextValue = {
    basePath,
    startPath: basePath,
    flowStartPath: basePath,
    fullPath: basePath,
    indexPath: basePath,
    currentPath,
    matches,
    baseNavigate,
    navigate: async () => {
    },
    resolve,
    refresh,
    params: {},
    queryString: currentQueryString,
    queryParams: currentQueryParams,
    preservedParams: [],
    getMatchData,
    urlStateParam: undefined,
  };

  return (
    <RouteContext.Provider value={routerValue}>
      {children}
    </RouteContext.Provider>
  );
};
