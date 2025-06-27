import { useRouter, RouteContext} from './RouterCtx'
import React, { JSX } from 'react';
import { match } from './pathToRegexp';

interface SecureRouteProps {
  path?: string;
  index?: boolean;
}

export const trimTrailingSlash = (path: string): string => {
  return (path || '').replace(/\/+$/, '');
};

export const newPaths = (oldIndexPath: string, oldFullPath: string, path?: string, index?: boolean) => {
  let indexPath = oldIndexPath;
  if (path) {
    indexPath = oldFullPath;
    if (!index) {
      indexPath += '/' + path;
    }
  }
  if (indexPath.startsWith('//')) {
    indexPath = indexPath.substr(1);
  }

  let fullPath = oldFullPath + (path ? '/' + path : '');
  if (fullPath.startsWith('//')) {
    fullPath = fullPath.substr(1);
  }
  return [indexPath, fullPath];
};

export type RouteProps = React.PropsWithChildren<SecureRouteProps>;

export function Route(props: RouteProps): JSX.Element | null {
  const router = useRouter();
  
  if (!props.children) {
    return null;
  }

  if (!props.index && !props.path) {
    return <>{props.children}</>;
  }

  // Create our own matching logic based on the current route context
  const [indexPath, fullPath] = newPaths(router.indexPath, router.fullPath, props.path, props.index);
  

  const currentPath = trimTrailingSlash(router.currentPath);
  let isMatch = false;
  
  if (props.index) {
    isMatch = currentPath === trimTrailingSlash(indexPath) || currentPath === trimTrailingSlash(fullPath);
  } else if (props.path) {
    const matchPath = trimTrailingSlash(fullPath);
    isMatch = currentPath === matchPath || currentPath.startsWith(matchPath + '/');
  }
  
  if (!isMatch) {
    return null;
  }

  const resolve = (to: string, { searchParams }: { searchParams?: URLSearchParams } = {}) => {
    const url = new URL(to, window.location.origin + fullPath + '/');
    if (searchParams) {
      url.search = searchParams.toString();
    }
    url.pathname = trimTrailingSlash(url.pathname);
    return url;
  };

  const navigate = (to: string, options?: { searchParams?: URLSearchParams; replace?: boolean; state?: any }) => {
    const toURL = resolve(to, {searchParams: options?.searchParams});
    return router.baseNavigate(toURL);
  };

  const newMatches = (path?: string, index?: boolean): boolean => {
    return !!newGetMatchData(path, index);
  };

  const newGetMatchData = (path?: string, index?: boolean) => {
    const [newIndexPath, newFullPath] = newPaths(indexPath, fullPath, path, index);
    const currentPath = trimTrailingSlash(router.currentPath);
    
    if (index) {
      if (currentPath === trimTrailingSlash(newIndexPath) || currentPath === trimTrailingSlash(newFullPath)) {
        return { isIndex: true, path: newIndexPath };
      }
    }
    
    if (path) {
      const matchPath = trimTrailingSlash(newFullPath);
      if (currentPath === matchPath || currentPath.startsWith(matchPath + '/')) {
        return { path: newFullPath, matchedPath: path };
      }
    }
    
    return false;
  };
  const rawParams = router.getMatchData(props.path, props.index) || {};
  const paramsDict: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawParams)) {
    paramsDict[key] = value;
  }

  const ctxValue = {
    basePath: router.basePath,
    startPath: router.startPath,
    flowStartPath: fullPath,
    fullPath: fullPath,
    indexPath: indexPath,
    currentPath: router.currentPath,
    matches: newMatches,
    baseNavigate: router.baseNavigate,
    navigate,
    resolve,
    refresh: router.refresh,
    params: paramsDict,
    queryString: router.queryString,
    queryParams: router.queryParams,
    getMatchData: newGetMatchData,
    urlStateParam: router.urlStateParam
  };
  
  return (
    <RouteContext.Provider value={ctxValue}>
      {props.children}
    </RouteContext.Provider>
  );
}



function assertRoute(v: any): v is React.ReactElement<RouteProps> {
  return !!v && React.isValidElement(v) && typeof v === 'object' && (v as React.ReactElement).type === Route;
}

export function Switch({ children }: { children: React.ReactNode })  {
  const router = useRouter();

  let node: React.ReactNode = null;
  React.Children.forEach(children, child => {
    if (node || !assertRoute(child)) {
      return;
    }

    const { index, path } = child.props;
    if ((!index && !path) || router.matches(path, index)) {
      node = child;
    }
  });

  return <>{node}</>;
}
