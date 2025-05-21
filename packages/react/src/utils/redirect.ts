import { headers } from "next/headers"

/**
 * Validates and sanitizes redirect URLs
 */
export async function validateRedirectUrl(url: string | null): Promise<string> {
  if (!url) return "/"

  try {
    // Check if it's a relative path
    if (url.startsWith("/")) {
      // Basic validation to ensure the path exists in your app
      // Add more paths as needed
      const validPaths = ["/"]
      return validPaths.includes(url) ? url : "/"
    }

    // If it's an absolute URL, ensure it's from your domain
     const headersList = await headers()
    const currentHost = headersList.get("host")
    const urlObj = new URL(url)
    if (urlObj.host === currentHost) {
      return urlObj.pathname
    }
  } catch {
    // Invalid URL format
  }

  return "/"
}

/**
 * Gets the current path for redirect purposes
 */
export async function getCurrentPath(): Promise<string> {
  try {
    const headersList = await headers()
    const pathname = headersList.get("x-pathname") || "/"
    return pathname
  } catch {
    return "/"
  }
}

