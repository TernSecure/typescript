import type { TernSecureNextProps } from "../types";
import type { TernSecureProviderProps, IsomorphicTernSecureOptions } from "@tern-secure/react";

// Helper type for the return value, as children are handled by the consuming component
type NextProviderProcessedProps = Omit<TernSecureProviderProps, 'children'>;

export const allNextProviderPropsWithEnv = (
  nextProps: Omit<TernSecureNextProps, 'children'>
): NextProviderProcessedProps => {
  const {
    loginPath,
    signUpPath,
    apiKey: propsApiKey,
    projectId: propsProjectId,
    customDomain: propsCustomDomain,
    proxyUrl: propsProxyUrl,
    environment: propsEnvironment,
    requiresVerification: propsRequiresVerification,
    loadingComponent: propsLoadingComponent,
    ...baseProps 
  } = nextProps;

  const envConfig = {
    apiKey: process.env.NEXT_PUBLIC_TERN_API_KEY,
    projectId: process.env.NEXT_PUBLIC_TERN_PROJECT_ID,
    customDomain: process.env.NEXT_PUBLIC_TERN_CUSTOM_DOMAIN,
    proxyUrl: process.env.NEXT_PUBLIC_TERN_PROXY_URL,
    environment: process.env.NEXT_PUBLIC_TERN_ENVIRONMENT, // Added environment
  };

  // Merge config values: props take precedence over environment variables
  const finalApiKey = propsApiKey ?? envConfig.apiKey;
  const finalProjectId = propsProjectId ?? envConfig.projectId;
  const finalCustomDomain = propsCustomDomain ?? envConfig.customDomain;
  const finalProxyUrl = propsProxyUrl ?? envConfig.proxyUrl;
  const finalEnvironment = propsEnvironment ?? envConfig.environment;

  // Construct the result, ensuring it conforms to NextProviderProcessedProps
  // (Omit<TernSecureProviderProps, 'children'>)
  const result: NextProviderProcessedProps = {
    // Spread the base properties. These are fields from TernSecureProviderProps
    // (like initialState, bypassApiKey, onUserChanged, Instance, initialSession, etc.)
    // that were not explicitly destructured above.
    ...(baseProps as Omit<TernSecureProviderProps, 'children' | keyof IsomorphicTernSecureOptions | 'requiresVerification' | 'loadingComponent'>),
    
    // Set the merged/prioritized instance configuration properties
    apiKey: finalApiKey,
    projectId: finalProjectId,
    customDomain: finalCustomDomain,
    proxyUrl: finalProxyUrl,
    environment: finalEnvironment,
    
    // Set properties explicitly taken from TernSecureNextProps (props version)
    // These are part of the TernSecureProviderProps interface.
    requiresVerification: propsRequiresVerification,
    loadingComponent: propsLoadingComponent,

    // Ensure the underlying `requireverification` (lowercase 'v') from
    // TernSecureInstanceTreeOptions is also set if `propsRequiresVerification` is defined.
    // This is because TernSecureProviderProps ultimately extends TernSecureInstanceTreeOptions.
    ...(propsRequiresVerification !== undefined && { requireverification: propsRequiresVerification }),

    // Explicitly carry over other IsomorphicTernSecureOptions and TernSecureProviderProps fields
    // if they were part of `baseProps` and not overridden.
    // This ensures properties like `Instance`, `initialState`, `bypassApiKey`, `onUserChanged`,
    // `initialSession`, `defaultAppearance`, `platform`, `mode`, `onAuthStateChanged`, `onError` are included.
    // The previous spread `...baseProps` should cover these, but we need to be sure they are typed correctly.
    // The cast on `baseProps` helps, but let's ensure the important ones are considered.
    //TernSecure: baseProps.Instance,
    initialState: baseProps.initialState,
    bypassApiKey: baseProps.bypassApiKey,
    onUserChanged: baseProps.onUserChanged,
    initialSession: baseProps.initialSession,
    defaultAppearance: baseProps.defaultAppearance,
    platform: baseProps.platform,
    mode: baseProps.mode,
    onAuthStateChanged: baseProps.onAuthStateChanged,
    onError: baseProps.onError,
  };

  // Clean up undefined keys that might have resulted from spreading if not present in baseProps
  // and also not set by merged values (e.g. if env var is also undefined)
  Object.keys(result).forEach(key => {
    if (result[key as keyof NextProviderProcessedProps] === undefined) {
      delete result[key as keyof NextProviderProcessedProps];
    }
  });

  return result;
};