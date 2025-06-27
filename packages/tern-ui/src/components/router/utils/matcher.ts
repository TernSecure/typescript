/**
 * Path matching utilities for router functionality
 */

export const createPathMatcher = (currentPath: string) => {
  return (path?: string, index?: boolean): boolean => {
    if (index) {
      // For index routes, match when the current path equals the base path
      return currentPath === '' || currentPath === '/';
    }
    if (!path) return true;
    
    // Handle relative paths within the component
    const fullMatchPath = `/${path}`;
    return currentPath === fullMatchPath || currentPath.startsWith(fullMatchPath + '/');
  };
};

export const createMatchDataGetter = (currentPath: string) => {
  return (path?: string, index?: boolean) => {
    if (index && (currentPath === '' || currentPath === '/')) {
      return { isIndex: true, path: '' };
    }
    if (path) {
      const fullMatchPath = `/${path}`;
      if (currentPath === fullMatchPath || currentPath.startsWith(fullMatchPath + '/')) {
        return { path: fullMatchPath, matchedPath: path };
      }
    }
    return false;
  };
};
