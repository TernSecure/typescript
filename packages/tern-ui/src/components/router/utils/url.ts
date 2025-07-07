/**
 * URL parsing and manipulation utilities
 */

export const parseQueryParams = (search: string): Record<string, string> => {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

export const resolveUrl = (to: string, origin?: string): URL => {
  const resolvedPath = to.startsWith('/') ? to : `/${to}`;
  const baseOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  return new URL(resolvedPath, baseOrigin);
};
