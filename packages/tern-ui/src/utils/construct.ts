//v2: redict with taking priority from the sign-in page


export type constructUrlWithRedirectProps = {
  signInUrl: string;
  signInPathParam?: string;
  currentPath: string;
  signUpUrl?: string;
  signUpPathParam?: string;
}

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
  

export const urlWithRedirect = (options: constructUrlWithRedirectProps): string => {
  const { 
    signInUrl, 
    signInPathParam = '/sign-in', 
    currentPath, 
    signUpUrl, 
    signUpPathParam = '/sign-up' 
  } = options

  const baseUrl = window.location.origin

  if (typeof window === "undefined") {
    return signInUrl
  }

  const url = new URL(signInUrl, baseUrl)
  
  if (!currentPath.includes(signInPathParam) && !currentPath.includes(signUpPathParam)) {
    url.searchParams.set("redirect", currentPath)
  }
  
  return url.toString()
}

/**
 * Stores the current path before signing out
 */
export const storePreviousPath = (path: string): void => {
  if (typeof window !== "undefined") {
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
    }
    
    // For relative URLs
    return "/"
  } catch {
    return "/"
  }
}

export function toURL(url: string | URL): URL {
  return new URL(url.toString(), window.location.origin);
}





