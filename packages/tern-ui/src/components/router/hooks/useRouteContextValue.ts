import { useMemo } from 'react';
import type { RouteContextValue } from '../RouterCtx';
import { parseQueryParams } from '../utils/url';
import { createPathMatcher, createMatchDataGetter } from '../utils/matcher';
import { createBaseNavigate, createNavigate, createRefresh, createResolve } from '../utils/navigation';

interface CreateRouteContextValueProps {
  basePath: string;
  currentPath: string;
  queryString: string;
}

/**
 * Factory function to create RouteContextValue with proper separation of concerns
 */
export const useRouteContextValue = ({ 
  basePath, 
  currentPath, 
  queryString 
}: CreateRouteContextValueProps): RouteContextValue => {
  return useMemo(() => {
    const baseNavigate = createBaseNavigate();
    const navigate = createNavigate(baseNavigate);
    const refresh = createRefresh();
    const resolve = createResolve();
    const matches = createPathMatcher(currentPath);
    const getMatchData = createMatchDataGetter(currentPath);
    const queryParams = parseQueryParams(queryString);

    return {
      basePath,
      startPath: '', // TODO: Implement based on requirements
      flowStartPath: '', // TODO: Implement based on requirements  
      fullPath: '', // TODO: Implement based on requirements
      indexPath: '', // TODO: Implement based on requirements
      currentPath,
      matches,
      baseNavigate,
      navigate,
      resolve,
      refresh,
      params: {}, // TODO: Extract from path parameters
      queryString,
      queryParams,
      preservedParams: [], // TODO: Implement based on requirements
      getMatchData,
      urlStateParam: undefined, // TODO: Implement based on requirements
    };
  }, [basePath, currentPath, queryString]);
};
