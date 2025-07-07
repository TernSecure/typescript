# @tern-secure/nextjs

## 5.1.1

### Patch Changes

- f784994: fix: added backend package as dependency

## 5.1.0

### Minor Changes

- 5f29862: advanced Auth cookies and session management

### Patch Changes

- Updated dependencies [5f29862]
  - @tern-secure/react@1.1.0
  - @tern-secure/shared@1.1.1
  - @tern-secure/types@1.0.2

## 5.0.1

### Patch Changes

- 367a100: fix: Update ternUIgetScriptUrl to use TernSecureDev flag and switch CDN to HTTPS.
- Updated dependencies [367a100]
  - @tern-secure/shared@1.1.0
  - @tern-secure/react@1.0.1
  - @tern-secure/types@1.0.1

## 5.0.0

### Major Changes

- 2603f2b: Initial stable release of TernSecure Authentication SDK

  This marks the first major release of the TernSecure Authentication monorepo, introducing a complete TypeScript SDK built on Firebase Authentication. The release includes:

  - Core authentication utilities and types
  - React hooks and components for seamless integration
  - UI components library with form handling
  - Backend utilities for server-side operations
  - Comprehensive TypeScript support

  All packages are now stable and ready for production use in React applications, Next.js projects, and general JavaScript/TypeScript environments.

### Patch Changes

- Updated dependencies [2603f2b]
  - @tern-secure/shared@1.0.0
  - @tern-secure/react@1.0.0
  - @tern-secure/types@1.0.0

## 4.2.7

### Patch Changes

- a711aef: feat: Enhance authentication state management and middleware

  - Add auth state cookie for server-side authentication tracking
  - Update auth middleware to set secure auth state cookie
  - Modify server-side auth check to validate auth state
  - Remove unused import in sign-in component
  - Update Edge runtime configuration in middleware

## 4.2.6

### Patch Changes

- 1757b10: refactor: Improve TernSecure middleware type definitions and error handling

  - Update import types from 'next/server'
  - Modify function signatures to improve type safety
  - Enhance error handling with explicit redirect URL creation
  - Adjust return types for middleware and callback functions

## 4.2.5

### Patch Changes

- 6240f3a: refactor: Improve TernSecure middleware response handling

  - Update middleware to return Response or undefined
  - Modify authentication flow to use NextResponse.redirect
  - Simplify error handling and callback processing
  - Make callback parameter optional
  - Streamline middleware return logic

## 4.2.4

### Patch Changes

- 45aadf2: refactor: Simplify TernSecure middleware and error handling

  - Remove unused imports and error classes
  - Modify route matching regex pattern
  - Streamline authentication middleware logic
  - Add Edge runtime support
  - Improve error redirection and handling
  - Clean up response headers

## 4.2.3

### Patch Changes

- b0e8300: refactor: Enhance authentication and session management

  - Improve token verification and error handling in JWT modules
  - Update authentication methods to use centralized error handling
  - Modify session verification to support more flexible token checks
  - Refactor middleware to handle authentication redirects more robustly
  - Add caching to authentication methods for improved performance

## 4.2.2

### Patch Changes

- 496c2a9: refactor: Centralize types and improve JWT token verification

  - Create new `types.ts` file to centralize shared type definitions
  - Enhance JWT verification with more robust error handling and logging
  - Add caching for JWKS using React cache
  - Improve token decoding and validation logic
  - Update import paths across authentication modules

## 4.2.1

### Patch Changes

- 942b66f: refactor: Restructure server authentication and session management

  - Move server-side authentication files to a new `admin` directory
  - Update package.json exports to reflect new file structure
  - Simplify ESLint configuration by removing unused variable rules
  - Update import paths in sign-in and sign-out components
  - Minor configuration adjustments in tsup config

## 4.2.0

### Minor Changes

- 1496d6e: chore: Enhance authentication middleware and session management

  - Update auth mechanism to support edge runtime
  - Implement flexible route matching for public paths
  - Add robust session verification using multiple methods
  - Improve error handling and user information extraction
  - Update session cookie and token management

## 4.1.0

### Minor Changes

- 1f4f6f0: feat: Enhance error handling and authentication flow

  - Modify `getErrorAlertVariant` to handle undefined error cases and simplify error variant selection logic, removing redundant success checks.
  - Enhance error code extraction and mapping mechanisms with comprehensive error pattern matching for Firebase authentication errors, improving error response generation with default messages.
  - Rename `ErrorAlertVariant` to `getErrorAlertVariant` and update Turbo to version 2.4.0 in package.json and package-lock.json.
  - Minor code formatting improvements, including the removal of redundant semicolons and extra blank lines.
  - Add a password visibility toggle button and enhance error display with animation, refactoring input layout and error handling.
  - Error handling in authentication components, adding comprehensive Firebase authentication error mapping and improving error display and variant selection.
  - Update sign-in, sign-up, and sign-out components to use new error handling, enhancing URL redirect and validation utilities.
  - Add explicit 'type="button"' to prevent unintended form submission and ensure email verification button behaves as a standalone interactive element.
  - Add utility functions for route type checking and redirect prevention, enhancing sign-in and sign-out components with more robust redirect logic and improving URL construction and redirect parameter handling.
  - Implement redirect loop prevention mechanisms and add new authentication status and error types, improving authentication state tracking and redirect handling for login and verification flows.

- 527515c: Fix EsLint

## 4.0.0

### Major Changes

- 403fc4d: feat: Add email verification and sign-out button, enhance authentication flow

## 3.4.3

### Patch Changes

- 686fb5c: chore: improve password input styling and interaction

## 3.4.2

### Patch Changes

- f4ddaa3: chore: remove name field from sign-up form state

## 3.4.1

### Patch Changes

- 9ad43a8: chore: add build step to release workflow

## 3.4.0

### Minor Changes

- 8f40361: feat: add sign-up functionality and email verification

  - Implement createUser function for user registration
  - Add resendEmailVerification function
  - Update TernSecureClientProvider to handle email state
  - Export SignUp component in index files
  - Modify sign-in component to link to correct sign-up route

## 3.3.5

### Patch Changes

- b6942c4: chore: add verbose logging to npm publish in release workflow

## 3.3.4

### Patch Changes

- a2c2a6c: chore: configure npm authentication for private registry

## 3.3.3

### Patch Changes

- a1fa601: fix: remove auth token and update sign-in signup link

  - Remove hardcoded NPM registry authentication token from .npmrc
  - Delete unused TypeScript declaration file in dist/types
  - Update sign-in component to link to signup page with '/signup' href

## 3.3.1

### Patch Changes

- ba72742: chore: enhance release workflow with NPM authentication

  - Add NPM authentication step to the GitHub Actions workflow for secure publishing.
  - Update the publish command to use 'npm publish --access public' instead of 'npm run release'.
  - Improve clarity and organization of the release process.

## 3.3.0

### Minor Changes

- 7335e8f: chore: update package-lock.json and enhance release workflow

  - Update multiple package versions in package-lock.json, including @esbuild and @eslint dependencies.
  - Remove outdated dependencies from package-lock.json to streamline the project.
  - Modify GitHub Actions release workflow to use 'npm run release' for publishing instead of direct npm publish command.
  - Clean up NPM authentication steps in the workflow for improved clarity.

## 3.3.0

### Minor Changes

- cf2af23: New authentication providers have been added:

  - Integration with Google sign-in
  - Integration with Microsoft sign-in
