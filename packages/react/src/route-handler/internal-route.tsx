import { Verify } from "../components/verify"

// Internal route mapping
export const internalRoutes = {
  signUpVerify: {
    pattern: /^\/sign-up\/verify$/,
    component: Verify,
  },
  signInVerify: {
    pattern: /^\/sign-in\/verify$/,
    component: Verify,
  },
}

// Check if path is an internal route
export function isInternalRoute(pathname: string): boolean {
  return Object.values(internalRoutes).some((route) => route.pattern.test(pathname))
}

// Check if path is within auth routes
export function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")
}

// Check if path is exactly the base auth route
export function isBaseAuthRoute(pathname: string): boolean {
  return pathname === "/sign-in" || pathname === "/sign-up"
}

// Internal route handler
export function handleInternalRoute(pathname: string) {
  for (const [key, route] of Object.entries(internalRoutes)) {
    if (route.pattern.test(pathname)) {
      return route.component
    }
  }
  return null
}