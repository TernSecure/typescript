//v2: redict with taking priority from the sign-in page

import { isInternalRoute, isAuthRoute } from "../route-handler/internal-route"

/**
 * Constructs a full URL with the current origin
 * @param path - The path to construct the URL for
 * @returns The full URL with origin
 */
export const constructFullUrl = (path: string) => {
  if (typeof window === "undefined") return path
    const baseUrl = window.location.origin
    if (path.startsWith('http')) {
      return path
    }
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  }


/**
 * Checks if the current URL has a redirect loop
 * @param currentPath - The current pathname
 * @param redirectPath - The path we're trying to redirect to
 * @returns boolean indicating if there's a redirect loop
 */
export const hasRedirectLoop = (currentPath: string, redirectPath: string): boolean => {
  if (!currentPath || !redirectPath) return false

  // Remove any query parameters for comparison
  const cleanCurrentPath = currentPath.split("?")[0]
  const cleanRedirectPath = redirectPath.split("?")[0]

  return cleanCurrentPath === cleanRedirectPath
}
  
/**
 * Constructs a URL with redirect parameters while preventing loops
 * @param path - The base path (usually login path)
 * @param redirectUrl - The URL to redirect to after action completes
 * @param loginPath - The login path to check against
 * @param signUpPath - The sign up path to check against
 * @returns The full URL with redirect parameters
 */
export const constructUrlWithRedirect = (
  path: string,
  redirectUrl: string | undefined,
): string => {
  const url = new URL(path, typeof window !== "undefined" ? window.location.origin : undefined)
  
  if (redirectUrl && !isAuthRoute(redirectUrl) && !isInternalRoute(redirectUrl)) {
    url.searchParams.set("redirect", redirectUrl)
  }
  
  return url.toString()
}

/**
 * Stores the current path before signing out
 */
export const storePreviousPath = (path: string): void => {
  if (typeof window !== "undefined" && !isAuthRoute(path)) {
    sessionStorage.setItem("previousPath", path)
  }
}

/**
 * Gets the stored previous path
 */
export const getPreviousPath = (): string | null => {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("previousPath")
  }
  return null
}


  
/**
 * Gets a validated redirect URL ensuring it's from the same origin
 * @param redirectUrl - The URL to validate
 * @param searchParams - The search parameters to check for redirect
 * @returns A validated redirect URL
 */
export const getValidRedirectUrl = (
  searchParams: URLSearchParams,
  configuredRedirect?: string,
): string => {
  // Check URL search param first (highest priority)
  const urlRedirect = searchParams.get("redirect")
  if (urlRedirect) {
    return validateUrl(urlRedirect)
  }

  // Then check configured redirect (for first visits)
  if (configuredRedirect) {
    return validateUrl(configuredRedirect)
  }

  // Default fallback
  return "/"
}

/**
 * Validates and sanitizes URLs
 */
const validateUrl = (url: string): string => {
  try {
    // For absolute URLs
    if (url.startsWith("http")) {
      const urlObj = new URL(url)
      if (typeof window !== "undefined" && urlObj.origin !== window.location.origin) {
        return "/"
      }
      return !isAuthRoute(urlObj.pathname) && !isInternalRoute(urlObj.pathname) 
        ? urlObj.pathname 
        : "/"
    }
    
    // For relative URLs
    return !isAuthRoute(url) && !isInternalRoute(url) ? url : "/"
  } catch {
    return "/"
  }
}







